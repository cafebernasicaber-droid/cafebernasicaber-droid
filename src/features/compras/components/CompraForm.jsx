import React, { useState, useEffect, useRef } from 'react';
import comprasService from '../services/comprasService';
import proveedoresService from '../../proveedores/services/proveedoresService';
import insumosService from '../../insumos/services/insumosService';
import { uploadToCloudinary } from '../../../shared/services/cloudinaryService';
import { validarArchivoComprobante, procesarComprobante } from '../../../shared/services/ocrService';
import ImageLightbox from '../../../shared/components/ImageLightbox';
import '../../../shared/components/ImageLightbox.css';
import './CompraForm.css';

const EMPTY_ITEM = { insumo: '', cantidad: '', precioUnitario: '', unidad: '' };

const getTodayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const EMPTY_FORM = {
  proveedorId: '',
  proveedorNombre: '',
  fecha: getTodayStr(),
  observaciones: '',
  items: [{ ...EMPTY_ITEM }]
};

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(val) || 0);

const CompraForm = ({ onSubmit, onCancel, serverError }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // ── Comprobante de compra + validación OCR ──────────────────────────────
  const [comprobanteFile, setComprobanteFile]   = useState(null);
  const [comprobanteError, setComprobanteError] = useState('');
  const [procesandoOCR, setProcesandoOCR]       = useState(false);
  const [progresoOCR, setProgresoOCR]           = useState(0);
  const [comprobanteOk, setComprobanteOk]       = useState(false); // true solo si el total coincidió
  const [totalDetectadoOCR, setTotalDetectadoOCR] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState('');
  const [zoomComprobante, setZoomComprobante] = useState(false);
  const comprobanteInputRef = useRef();
  const [arrastrandoComprobante, setArrastrandoComprobante] = useState(false);

  const [proveedores, setProveedores] = useState([]);
  useEffect(() => {
    proveedoresService.getAll()
      .then(d => setProveedores(Array.isArray(d) ? d.filter(p => p.estado === 'Activo') : []))
      .catch(() => setProveedores([]));
  }, []);
  const [todosInsumos, setTodosInsumos] = useState([]);
  useEffect(() => {
    insumosService.getAll()
      .then(d => setTodosInsumos(Array.isArray(d) ? d.filter(i => i.estado !== false) : []))
      .catch(() => setTodosInsumos([]));
  }, []);

  const insumosFiltrados = form.proveedorId
    ? todosInsumos.filter(i =>
        String(i.proveedorId) === String(form.proveedorId) ||
        i.proveedor === form.proveedorNombre
      )
    : [];

  const validate = () => {
    const errs = {};
    if (!form.proveedorNombre.trim()) errs.proveedorNombre = 'Selecciona un proveedor';
    if (!form.fecha) errs.fecha = 'La fecha es obligatoria';
    else if (form.fecha > getTodayStr()) errs.fecha = 'La fecha no puede ser futura — una compra es un hecho ya ocurrido';
    const itemInvalido = form.items.some(
      it => !it.insumo.trim() ||
        it.cantidad === '' || isNaN(it.cantidad) || Number(it.cantidad) <= 0 ||
        it.precioUnitario === '' || isNaN(it.precioUnitario) || Number(it.precioUnitario) < 1000
    );
    if (itemInvalido) errs.items = 'Todos los insumos requieren nombre, cantidad (>0) y precio mínimo $1.000';
    if (!comprobanteFile) errs.comprobante = 'El comprobante de compra es obligatorio.';
    else if (!comprobanteOk) errs.comprobante = comprobanteError || 'El comprobante todavía no ha sido validado correctamente.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'proveedorId') {
      const prov = proveedores.find(p => String(p.id) === value);
      setForm(prev => ({
        ...prev,
        proveedorId:     value,
        proveedorNombre: prov ? prov.nombre : '',
        items:           [{ ...EMPTY_ITEM }]
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      if (field === 'cantidad') {
        // Solo enteros: eliminar decimales y caracteres no numéricos
        const soloEntero = value.replace(/[^0-9]/g, '');
        items[idx] = { ...items[idx], cantidad: soloEntero };
        // Si la cantidad queda inválida, limpiar precio
        if (!soloEntero || Number(soloEntero) <= 0) {
          items[idx].precioUnitario = '';
        }
      } else {
        items[idx] = { ...items[idx], [field]: value };
      }
      return { ...prev, items };
    });
    if (errors.items) setErrors(prev => ({ ...prev, items: '' }));
  };

  const handleInsumoSelect = (idx, nombreInsumo) => {
    const insumo = todosInsumos.find(i => i.nombre === nombreInsumo);
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        insumo:         nombreInsumo,
        unidad:         insumo ? (insumo.unidadMedida || '') : items[idx].unidad,
        cantidad:       '',         // usuario ingresa cantidad
        precioUnitario: '',         // usuario ingresa precio del día
      };
      return { ...prev, items };
    });
    if (errors.items) setErrors(prev => ({ ...prev, items: '' }));
  };

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  };

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const total = (form.items || []).reduce((sum, it) => sum + (Number(it.cantidad||0) * Number(it.precioUnitario||0)), 0);

  const handleComprobanteFile = async (file) => {
    setComprobanteError('');
    setComprobanteOk(false);
    setTotalDetectadoOCR(null);
    setComprobantePreview('');
    if (!file) { setComprobanteFile(null); return; }

    const check = validarArchivoComprobante(file);
    if (!check.valid) { setComprobanteError(check.error); setComprobanteFile(null); return; }
    setComprobanteFile(file);
    if (file.type.startsWith('image/')) setComprobantePreview(URL.createObjectURL(file));

    if (check.requiereConversion) {
      // PDF: esta versión no convierte PDF a imagen para el análisis OCR,
      // así que no se puede verificar automáticamente el total. Se pide
      // una foto o captura para poder continuar.
      setComprobanteError('El análisis automático de esta versión no procesa archivos PDF. Sube una foto o captura del comprobante en JPG o PNG para poder verificarlo.');
      return;
    }

    if (total <= 0) {
      setComprobanteError('Agrega los insumos de la compra (con cantidad y precio) antes de subir el comprobante, para poder comparar el total.');
      return;
    }

    setProcesandoOCR(true);
    setProgresoOCR(0);
    try {
      const resultado = await procesarComprobante(file, setProgresoOCR);
      if (!resultado.ok) {
        setComprobanteError(resultado.error);
        return;
      }
      setTotalDetectadoOCR(resultado.total);
      if (resultado.total !== total) {
        setComprobanteError('El total encontrado en el comprobante no coincide con el total registrado en la compra. Verifique la información antes de continuar.');
        return;
      }
      setComprobanteOk(true);
    } catch (err) {
      setComprobanteError('No se pudo procesar el comprobante. Intenta con otra foto.');
    } finally {
      setProcesandoOCR(false);
    }
  };

  const [subiendoComprobante, setSubiendoComprobante] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubiendoComprobante(true);
    try {
      const comprobanteUrl = await uploadToCloudinary(comprobanteFile);
      onSubmit({
        ...form,
        items: form.items.map(it => ({
          ...it,
          cantidad:       parseInt(it.cantidad, 10),
          precioUnitario: Number(it.precioUnitario)
        })),
        total,
        comprobante_url: comprobanteUrl,
        comprobante_verificado: true,
        comprobante_total_ocr: totalDetectadoOCR,
      });
    } catch (err) {
      setErrors(prev => ({ ...prev, comprobante: 'No se pudo subir el comprobante. Intenta de nuevo.' }));
    } finally {
      setSubiendoComprobante(false);
    }
  };

  return (
    <form className="insumo-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">

        <div className={`fg ${errors.proveedorNombre ? 'fg-error' : ''}`}>
          <label>Proveedor <span className="req">*</span></label>
          {proveedores.length > 0 ? (
            <select name="proveedorId" value={form.proveedorId} onChange={handleChange}>
              <option value="">-- Seleccionar proveedor --</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          ) : (
            <div style={{ padding: '10px 14px', background: 'rgba(245,176,0,0.12)', border: '1px solid rgba(245,176,0,0.3)', borderRadius: 8, fontSize: 13, color: '#E65100' }}>
              ⚠ No hay proveedores activos registrados.
            </div>
          )}
          {errors.proveedorNombre && <span className="err-msg">{errors.proveedorNombre}</span>}
        </div>

        <div className={`fg ${errors.fecha ? 'fg-error' : ''}`}>
          <label>Fecha de compra <span className="req">*</span></label>
          <input
            type="date" name="fecha" value={form.fecha}
            onChange={handleChange} max={getTodayStr()}
          />
          {errors.fecha && <span className="err-msg">{errors.fecha}</span>}
        </div>

        <div className="fg fg-full">
          <label>Observaciones</label>
          <textarea
            name="observaciones" value={form.observaciones}
            onChange={handleChange} placeholder="Notas sobre esta compra..." rows={2}
          />
        </div>
      </div>

      <div className="compra-items-wrap">
        <div className="compra-items-header">
          <span className="compra-items-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Insumos de la compra
          </span>
          <button type="button" className="btn-add-item" onClick={addItem} disabled={!form.proveedorId}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar insumo
          </button>
        </div>

        {form.proveedorId && insumosFiltrados.length === 0 && (
          <div style={{ padding: '12px 16px', background: 'rgba(245,176,0,0.12)', border: '1px solid rgba(245,176,0,0.3)', borderRadius: 8, fontSize: 13, color: '#E65100', marginBottom: 10 }}>
            ⚠ El proveedor seleccionado no tiene insumos asociados. Registra insumos para este proveedor en Gestión de Insumos.
          </div>
        )}

        {errors.items && <div className="items-error-msg">{errors.items}</div>}

        <div className="items-table-head">
          <span>Insumo</span>
          <span>Unidad</span>
          <span>Cantidad</span>
          <span>Precio unit. (pagado hoy)</span>
          <span>Subtotal</span>
          <span></span>
        </div>

        {form.items.map((item, idx) => (
          <div key={idx} className="item-row">
            {form.proveedorId && insumosFiltrados.length > 0 ? (
              <select value={item.insumo} onChange={e => handleInsumoSelect(idx, e.target.value)}>
                <option value="">-- Seleccionar insumo --</option>
                {insumosFiltrados.map(i => (
                  <option key={i.id} value={i.nombre}>{i.nombre}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={form.proveedorId ? 'Sin insumos para este proveedor' : 'Selecciona un proveedor primero'}
                value={item.insumo}
                readOnly
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
              />
            )}
            <input
              type="text"
              value={item.unidad}
              readOnly
              placeholder="—"
              style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
            />
            <input
              type="number" placeholder="0" min="1" step="1"
              value={item.cantidad}
              onChange={e => handleItemChange(idx, 'cantidad', e.target.value)}
              onKeyDown={e => {
                // Bloquear punto, coma y e (notación científica)
                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
              }}
            />
            {(() => {
              const cantidadValida = item.cantidad !== '' && !isNaN(item.cantidad) && Number(item.cantidad) >= 1 && Number.isInteger(Number(item.cantidad));
              return (
                <input
                  type="number" placeholder={cantidadValida ? 'Mín. $1.000' : 'Ingresa cantidad primero'} min="1000" step="1"
                  value={item.precioUnitario}
                  disabled={!cantidadValida}
                  onChange={e => handleItemChange(idx, 'precioUnitario', e.target.value)}
                  style={!cantidadValida ? { background: 'var(--bg-surface-2)', color: 'var(--text-muted)', cursor: 'not-allowed' } : {}}
                />
              );
            })()}
            <span className="item-subtotal">
              {formatCOP(Number(item.cantidad || 0) * Number(item.precioUnitario || 0))}
            </span>
            <button
              type="button" className="btn-remove-item"
              onClick={() => removeItem(idx)}
              disabled={form.items.length === 1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}

        <div className="compra-total-row">
          <span>Total de la compra</span>
          <span className="compra-total-value">{formatCOP(total)}</span>
        </div>
      </div>

      {/* ── Comprobante de compra + validación OCR ── */}
      <div className={`fg fg-full ${errors.comprobante ? 'fg-error' : ''}`} style={{ marginTop: 4 }}>
        <label>Comprobante de compra <span className="req">*</span></label>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '2px 0 8px' }}>
          Sube una foto o captura clara del comprobante (JPG, JPEG o PNG). El sistema lee el total automáticamente y lo compara con el total de esta compra ({formatCOP(total)}).
        </p>

        <div
          onClick={() => comprobanteInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setArrastrandoComprobante(true); }}
          onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setArrastrandoComprobante(false); }}
          onDrop={e => {
            e.preventDefault(); e.stopPropagation(); setArrastrandoComprobante(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleComprobanteFile(f);
          }}
          style={{
            border: `1.5px dashed ${arrastrandoComprobante ? 'var(--color-green,#4CAF50)' : 'var(--border-input)'}`,
            borderRadius: 10, padding: comprobantePreview ? 12 : '22px 16px', textAlign: 'center', cursor: 'pointer',
            background: arrastrandoComprobante ? 'rgba(76,175,80,0.06)' : 'transparent', transition: 'all .15s',
          }}
        >
          {comprobantePreview ? (
            <div style={{ position: 'relative', width: '100%', height: 220 }}>
              <img src={comprobantePreview} alt="Comprobante" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
              <button type="button" className="ilb-zoom-trigger" title="Ver completo / Zoom"
                onClick={e => { e.stopPropagation(); setZoomComprobante(true); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Arrastra el comprobante aquí, o haz clic para subir</span>
              <span style={{ fontSize: 11 }}>JPG, PNG o PDF</span>
            </div>
          )}
        </div>
        <input
          ref={comprobanteInputRef} type="file" style={{ display: 'none' }}
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={e => handleComprobanteFile(e.target.files?.[0] || null)}
        />
        {comprobantePreview && (
          <button type="button" onClick={() => setZoomComprobante(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 8, padding: '7px 0', borderRadius: 8, border: '1.5px solid var(--border-input)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Ver comprobante completo
          </button>
        )}
        {zoomComprobante && comprobantePreview && (
          <ImageLightbox src={comprobantePreview} alt="Comprobante de compra" onClose={() => setZoomComprobante(false)} />
        )}

        {procesandoOCR && (
          <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-surface-2, #F5F5F5)', border: '1px solid rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600 }}>
              <span className="spinner-sm" style={{ width: 14, height: 14, border: '2px solid rgba(76,175,80,.25)', borderTopColor: '#4CAF50', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              Analizando comprobante... {progresoOCR}%
            </div>
            <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: 'rgba(0,0,0,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progresoOCR}%`, background: '#4CAF50', transition: 'width .2s' }} />
            </div>
          </div>
        )}

        {!procesandoOCR && comprobanteError && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(229,57,53,0.12)', color: '#EF5350', borderRadius: 8, fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {comprobanteError}
          </div>
        )}

        {!procesandoOCR && comprobanteOk && (
          <div style={{ marginTop: 10, padding: '14px 16px', borderRadius: 10, background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4CAF50', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              El total coincide correctamente
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Comprobante</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{formatCOP(totalDetectadoOCR)}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700 }}>VS</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Sistema</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{formatCOP(total)}</div>
              </div>
            </div>
          </div>
        )}

        {errors.comprobante && !comprobanteError && <span className="err-msg">{errors.comprobante}</span>}
      </div>

      {serverError && (
        <div className="form-server-error" style={{ marginTop: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {serverError}
        </div>
      )}

      <div className="form-footer">
        <button type="button" className="btn-form-cancel" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Cancelar
        </button>
        <button type="submit" className="btn-form-submit" disabled={procesandoOCR || subiendoComprobante || !comprobanteOk}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {subiendoComprobante ? 'Guardando...' : 'Registrar compra'}
        </button>
      </div>
    </form>
  );
};

export default CompraForm;