import React, { useState, useEffect } from 'react';
import insumosService from '../services/insumosService';
import proveedoresService from '../../proveedores/services/proveedoresService';
import './InsumoForm.css';

const EMPTY_FORM = {
  nombre: '',
  categoria: '',
  unidadMedida: '',
  stockActual: '',
  stockMinimo: '',
  proveedor: '',
  proveedorId: '',
  descripcion: '',
  estado: 'Activo'
};

// ── Vasos de cartón y plástico ─────────────────────────────────────────────
// Tamaños estándar disponibles por categoría de vaso.
const TAMANOS_VASO = {
  'Vasos de plástico': [9, 12, 14, 16],
  'Vasos de cartón':   [4, 7, 9],
};
const esCategoriaVaso = (categoria) => Object.prototype.hasOwnProperty.call(TAMANOS_VASO, categoria);

const tieneComprasActivas = (insumoNombre) => {
  try {
    const compras = JSON.parse(localStorage.getItem('sicaber_compras') || '[]');
    const nombre = (insumoNombre || '').toLowerCase().trim();
    return compras
      .filter(c => c.estado !== 'anulada')
      .some(c => (c.items || []).some(it =>
        (it.insumo || '').toLowerCase().trim() === nombre
      ));
  } catch { return false; }
};

const InsumoForm = ({ initialData, onSubmit, onCancel, isEditing, serverError }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [hasActiveCompras, setHasActiveCompras] = useState(false);
  const [tamanoVaso, setTamanoVaso] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre:       initialData.nombre       || '',
        categoria:    initialData.categoria    || '',
        unidadMedida: initialData.unidadMedida || '',
        stockActual:  initialData.stockActual  ?? '',
        stockMinimo:  initialData.stockMinimo  ?? '',
        proveedor:    initialData.proveedor    || '',
        proveedorId:  initialData.proveedorId  || '',
        descripcion:  initialData.descripcion  || '',
        estado:       initialData.estado !== undefined ? initialData.estado : 'Activo'
      });
      if (isEditing && initialData.nombre) {
        setHasActiveCompras(tieneComprasActivas(initialData.nombre));
      }
      if (esCategoriaVaso(initialData.categoria)) {
        const match = (initialData.nombre || '').match(/(\d+)\s*oz/i);
        setTamanoVaso(match ? match[1] : '');
      } else {
        setTamanoVaso('');
      }
    }
  }, [initialData, isEditing]);

  const categorias  = ['Lácteos', 'Cafés y granos', 'Frutas', 'Verduras', 'Azúcares', 'Aceites', 'Especias', 'Bebidas', 'Harinas', 'Vasos de plástico', 'Vasos de cartón', 'Otros'];
  const unidades    = ['kg', 'g', 'lb', 'oz', 'L', 'mL', 'unidad', 'caja', 'bolsa', 'paquete', 'docena'];
  const [proveedores, setProveedores] = useState([]);
  useEffect(() => {
    proveedoresService.getAll()
      .then(d => setProveedores(Array.isArray(d) ? d.filter(p => p.estado === 'Activo') : []))
      .catch(() => setProveedores([]));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim())      errs.nombre       = 'El nombre es obligatorio';
    if (!form.categoria)          errs.categoria    = 'Selecciona una categoría';
    if (esCategoriaVaso(form.categoria) && !tamanoVaso) errs.categoria = 'Selecciona el tamaño del vaso';
    if (!form.unidadMedida)       errs.unidadMedida = 'Selecciona una unidad de medida';
    if (form.stockActual === '' || isNaN(form.stockActual) || Number(form.stockActual) < 0) errs.stockActual = 'El stock actual debe ser 0 o mayor';
    if (form.stockMinimo === '' || isNaN(form.stockMinimo) || Number(form.stockMinimo) < 1) errs.stockMinimo = 'El stock mínimo debe ser 1 o mayor';
    if (proveedores.length > 0 && !form.proveedor.trim()) errs.proveedor = 'Selecciona un proveedor';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'estado') {
      setForm(prev => ({ ...prev, estado: checked ? 'Activo' : 'Inactivo' }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCategoriaChange = (e) => {
    const categoria = e.target.value;
    setForm(prev => ({ ...prev, categoria, ...(esCategoriaVaso(categoria) ? { unidadMedida: 'unidad' } : {}) }));
    if (errors.categoria) setErrors(prev => ({ ...prev, categoria: '' }));
    if (!esCategoriaVaso(categoria)) setTamanoVaso('');
  };

  const handleTamanoVasoChange = (e) => {
    const tam = e.target.value;
    setTamanoVaso(tam);
    const tipo = form.categoria === 'Vasos de plástico' ? 'plástico' : 'cartón';
    setForm(prev => ({ ...prev, nombre: tam ? `Vaso de ${tipo} ${tam} oz` : prev.nombre, unidadMedida: 'unidad' }));
    if (errors.nombre) setErrors(prev => ({ ...prev, nombre: '' }));
  };

  const handleProveedorChange = (e) => {
    const selectedId = e.target.value;
    const prov = proveedores.find(p => String(p.id) === selectedId);
    setForm(prev => ({
      ...prev,
      proveedorId: selectedId,
      proveedor: prov ? prov.nombre : ''
    }));
    if (errors.proveedor) setErrors(prev => ({ ...prev, proveedor: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      ...form,
      stockActual: parseInt(form.stockActual, 10) || 0,
      stockMinimo: Math.max(1, parseInt(form.stockMinimo, 10) || 1),
    });
  };

  const noHayProveedores = proveedores.length === 0;

  return (
    <form className="insumo-form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="form-server-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {serverError}
        </div>
      )}

      <div className="form-grid">
        <div className={`fg ${errors.nombre ? 'fg-error' : ''}`}>
          <label>Nombre del insumo <span className="req">*</span></label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Café tostado fino" />
          {errors.nombre && <span className="err-msg">{errors.nombre}</span>}
        </div>

        <div className={`fg ${errors.categoria ? 'fg-error' : ''}`}>
          <label>Categoría <span className="req">*</span></label>
          <select name="categoria" value={form.categoria} onChange={handleCategoriaChange}>
            <option value="">-- Seleccionar --</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.categoria && <span className="err-msg">{errors.categoria}</span>}
        </div>

        {esCategoriaVaso(form.categoria) && (
          <div className="fg">
            <label>Tamaño (oz) <span className="req">*</span></label>
            <select value={tamanoVaso} onChange={handleTamanoVasoChange}>
              <option value="">-- Seleccionar tamaño --</option>
              {TAMANOS_VASO[form.categoria].map(oz => <option key={oz} value={oz}>{oz} oz</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              El nombre del insumo se completa automáticamente al elegir el tamaño.
            </span>
          </div>
        )}

        <div className={`fg ${errors.unidadMedida ? 'fg-error' : ''}`}>
          <label>Unidad de medida <span className="req">*</span></label>
          <select name="unidadMedida" value={form.unidadMedida} onChange={handleChange}>
            <option value="">-- Seleccionar --</option>
            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.unidadMedida && <span className="err-msg">{errors.unidadMedida}</span>}
        </div>

        <div className={`fg ${errors.proveedor ? 'fg-error' : ''}`}>
          <label>Proveedor <span className="req">*</span></label>
          {noHayProveedores ? (
            <div style={{ padding: '10px 14px', background: 'rgba(245,176,0,0.12)', border: '1px solid rgba(245,176,0,0.3)', borderRadius: 8, fontSize: 13, color: '#E65100' }}>
              ⚠ No hay proveedores registrados. Ve a Gestión de Proveedores primero.
            </div>
          ) : (
            <select
              value={form.proveedorId}
              onChange={handleProveedorChange}
            >
              <option value="">-- Seleccionar proveedor --</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          )}
          {errors.proveedor && <span className="err-msg">{errors.proveedor}</span>}
        </div>

        <div className={`fg ${errors.stockActual ? 'fg-error' : ''}`}>
          <label>Stock actual <span className="req">*</span></label>
          {isEditing && hasActiveCompras ? (
            <div style={{ padding: '10px 14px', background: 'rgba(229,57,53,.1)', border: '1px solid rgba(239,83,80,.3)', borderRadius: 8, fontSize: 13, color: '#EF9A9A', lineHeight: 1.5 }}>
              🔒 <strong style={{color:'#EF5350'}}>Stock bloqueado:</strong> Este insumo tiene compras activas. Para ajustar el stock, primero anula las compras correspondientes.
              <div style={{ marginTop:6, fontWeight:700, color:'var(--text-primary)' }}>Stock actual: {form.stockActual}</div>
            </div>
          ) : (
            <>
              <input
                type="number" name="stockActual" value={form.stockActual}
                onChange={e => {
                  const val = e.target.value;
                  if (val !== '' && Number(val) < 0) return;
                  handleChange(e);
                }}
                placeholder="0" min="0" step="1"
              />
              {isEditing && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Puedes corregir el stock manualmente. No puede ser menor a 0.
                </span>
              )}
            </>
          )}
          {errors.stockActual && <span className="err-msg">{errors.stockActual}</span>}
        </div>

        <div className={`fg ${errors.stockMinimo ? 'fg-error' : ''}`}>
          <label>Stock mínimo <span className="req">*</span></label>
          <input
            type="number" name="stockMinimo" value={form.stockMinimo}
            onChange={e => {
              const val = e.target.value;
              if (val !== '' && Number(val) < 1) return;
              handleChange(e);
            }}
            placeholder="1" min="1" step="1"
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
            Se mostrará alerta cuando el stock caiga por debajo de este valor
          </span>
          {errors.stockMinimo && <span className="err-msg">{errors.stockMinimo}</span>}
        </div>

        <div className="fg fg-estado">
          <label>Estado</label>
          <div className="estado-toggle-wrap">
            <label className="switch">
              <input type="checkbox" name="estado" checked={form.estado === 'Activo'} onChange={handleChange} />
              <span className="sw-slider"></span>
            </label>
            <span className={`estado-label ${form.estado === 'Activo' ? 'label-active' : 'label-inactive'}`}>
              {form.estado === 'Activo' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="fg fg-full">
          <label>Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción opcional del insumo..." rows={3} />
        </div>
      </div>

      <div className="form-footer">
        <button type="button" className="btn-form-cancel" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Cancelar
        </button>
        <button type="submit" className="btn-form-submit" disabled={noHayProveedores}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isEditing
              ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
              : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
            }
          </svg>
          {isEditing ? 'Guardar cambios' : 'Registrar insumo'}
        </button>
      </div>
    </form>
  );
};

export default InsumoForm;