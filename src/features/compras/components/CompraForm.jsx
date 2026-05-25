import React, { useState, useEffect } from 'react';
import comprasService from '../services/comprasService';
import insumosService from '../../insumos/services/insumosService';
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

const CompraForm = ({ onSubmit, onCancel }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const proveedores  = comprasService.getProveedores().filter(p => p.estado);
  const todosInsumos = insumosService.getAll().filter(i => i.estado !== false);

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

  const total = comprasService.calcTotal(form.items);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      ...form,
      items: form.items.map(it => ({
        ...it,
        cantidad:       parseInt(it.cantidad, 10),
        precioUnitario: Number(it.precioUnitario)
      }))
    });
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
            <div style={{ padding: '10px 14px', background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 8, fontSize: 13, color: '#E65100' }}>
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
          <div style={{ padding: '12px 16px', background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 8, fontSize: 13, color: '#E65100', marginBottom: 10 }}>
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
                style={{ background: '#f5f5f5', color: '#aaa' }}
              />
            )}
            <input
              type="text"
              value={item.unidad}
              readOnly
              placeholder="—"
              style={{ background: '#f5f5f5', color: '#888' }}
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
                  style={!cantidadValida ? { background: '#f5f5f5', color: '#aaa', cursor: 'not-allowed' } : {}}
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

      <div className="form-footer">
        <button type="button" className="btn-form-cancel" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Cancelar
        </button>
        <button type="submit" className="btn-form-submit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar compra
        </button>
      </div>
    </form>
  );
};

export default CompraForm;
