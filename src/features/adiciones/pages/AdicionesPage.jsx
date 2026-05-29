// ─────────────────────────────────────────────────────────────
//  src/features/adiciones/pages/AdicionesPage.jsx
//  Módulo exclusivo de Adiciones.
//  Combos fue movido a src/features/combos/pages/CombosPage.jsx
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import Layout from '../../../shared/components/Layout';
import adicionesService from '../services/adicionesService';
import '../../insumos/pages/InsumosPage.css';
import '../../productos/pages/Modulos.css';

const fmt = n =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

// ── ImageUploader ────────────────────────────────────────────
function ImageUploader({ value, onChange }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const processFile = file => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => processFile(e.target.files[0])} />
      {value ? (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <img src={value} alt="preview"
            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #E0E0E0', display: 'block' }} />
          <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>
      ) : (
        <div onClick={() => inputRef.current.click()}
          onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{ border: `2px dashed ${dragging ? '#4CAF50' : '#CCCCCC'}`, borderRadius: 10, background: dragging ? '#F1F8F1' : '#FAFAFA', padding: '24px 16px', textAlign: 'center', cursor: 'pointer' }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#555' }}>Arrastra tu imagen aquí</p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#999' }}>o haz clic para seleccionarla</p>
          <button type="button" onClick={() => inputRef.current.click()}
            style={{ background: 'linear-gradient(135deg,#4CAF50,#388E3C)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Seleccionar imagen
          </button>
        </div>
      )}
    </div>
  );
}

// ── Modal Adición ────────────────────────────────────────────
function AdicionModal({ inicial, onClose, onSave }) {
  const [form, setForm] = useState(
    inicial || { nombre: '', precio: '', descripcion: '', imagen: '', estado: 'Activo' }
  );
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault(); setError('');
    const r = inicial ? adicionesService.update(inicial.id, form) : adicionesService.create(form);
    if (r.error) { setError(r.error); return; }
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box"
        style={{ maxWidth: 520, textAlign: 'left', padding: '32px 36px' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 4 }}>{inicial ? 'Editar adición' : 'Nueva adición'}</h3>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
          {inicial ? `Modificando: ${inicial.nombre}` : 'Agrega una adición al menú'}
        </p>
        {error && (
          <div style={{ background: '#FFEBEE', color: '#B71C1C', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="mod-form-group">
              <label>Nombre <span className="required">*</span></label>
              <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Leche de coco" required />
            </div>
            <div className="mod-form-group">
              <label>Precio COP <span className="required">*</span></label>
              <input type="number" value={form.precio} onChange={set('precio')} placeholder="1500" required min="0" />
            </div>
          </div>
          <div className="mod-form-group">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción opcional..." rows={2} />
          </div>
          <div className="mod-form-group">
            <label>Imagen de la adición</label>
            <ImageUploader value={form.imagen} onChange={val => setForm(f => ({ ...f, imagen: val }))} />
          </div>
          <div className="switch-wrap">
            <button type="button" className={`toggle-btn ${form.estado === 'Activo' ? 'toggle-on' : 'toggle-off'}`}
              onClick={() => setForm(f => ({ ...f, estado: f.estado === 'Activo' ? 'Inactivo' : 'Activo' }))}>
              <span className="toggle-thumb" />
            </button>
            <span className={`toggle-label-text ${form.estado === 'Activo' ? 'on' : 'off'}`}>{form.estado}</span>
          </div>
          <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-confirm-primary">
              {inicial ? '💾 Guardar' : '+ Crear adición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Paginación ────────────────────────────────────────────────
const PER_PAGE = 5;

function Pagination({ page, total, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 13, color: '#888' }}>Mostrando {from}–{to} de {total}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ddd', background: page === 1 ? '#f5f5f5' : 'white', color: page === 1 ? '#bbb' : '#333', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>← Ant.</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onPage(n)}
            style={{ padding: '6px 11px', borderRadius: 8, border: `1.5px solid ${n === page ? '#4CAF50' : '#ddd'}`, background: n === page ? '#4CAF50' : 'white', color: n === page ? 'white' : '#333', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            {n}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ddd', background: page === totalPages ? '#f5f5f5' : 'white', color: page === totalPages ? '#bbb' : '#333', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>Sig. →</button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function AdicionesPage() {
  const [adiciones, setAdiciones] = useState(() => adicionesService.getAll());
  const [query,     setQuery]     = useState('');
  const [modal,     setModal]     = useState(null);
  const [delAdic,   setDelAdic]   = useState(null);
  const [page,      setPage]      = useState(1);
  const [success,   setSuccess]   = useState('');

  const showOk  = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const refresh = () => setAdiciones(adicionesService.getAll());

  const shown     = query.trim()
    ? adiciones.filter(a => a.nombre.toLowerCase().includes(query.toLowerCase()))
    : adiciones;
  const paginated = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Layout>
      <div className="insumos-root">
        {success && <div className="toast toast-success">✓ {success}</div>}

        {/* ── Header ── */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Adiciones</h1>
            <p className="page-subtitle">Complementos y extras disponibles para los productos del menú</p>
          </div>
          <button className="btn-add" onClick={() => setModal('new')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva adición
          </button>
        </div>

        {/* ── Modal ── */}
        {modal && (
          <AdicionModal
            inicial={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={() => {
              refresh();
              setModal(null);
              showOk(modal === 'new' ? 'Adición creada' : 'Adición actualizada');
            }}
          />
        )}

        {/* ── Toolbar ── */}
        <div className="insumos-toolbar">
          <div className="search-group">
            <div className="search-wrap">
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </span>
              <input className="search-input" placeholder="Buscar adición..." value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }} />
              {query && <button className="search-clear" onClick={() => { setQuery(''); setPage(1); }}>✕</button>}
            </div>
          </div>
          <span style={{ fontSize: 13, color: '#888', marginLeft: 'auto' }}>
            {shown.length} adición{shown.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* ── Tabla ── */}
        <div className="insumos-card">
          {shown.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              </div>
              <h3>{query ? 'Sin coincidencias' : 'No hay adiciones'}</h3>
              <p>{query ? `Sin resultados para "${query}"` : 'Crea la primera adición del menú'}</p>
              {!query && <button className="btn-add-first" onClick={() => setModal('new')}>Nueva adición</button>}
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="insumos-table">
                  <thead>
                    <tr><th>Nombre</th><th>Precio</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {paginated.map(a => (
                      <tr key={a.id}>
                        <td className="td-nombre">{a.nombre}</td>
                        <td style={{ fontWeight: 700, color: '#4CAF50' }}>{fmt(a.precio)}</td>
                        <td style={{ fontSize: 13, color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.descripcion || '—'}
                        </td>
                        <td>
                          <button className={`toggle-btn ${a.estado === 'Activo' ? 'toggle-on' : 'toggle-off'}`}
                            onClick={() => { adicionesService.toggleEstado(a.id); refresh(); }}>
                            <span className="toggle-thumb" />
                          </button>
                        </td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-editar" onClick={() => setModal(a)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button className="btn-anular" onClick={() => setDelAdic(a)}>✕ Anular</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={shown.length} perPage={PER_PAGE} onPage={setPage} />
            </>
          )}
        </div>

        {/* ── Modal eliminar ── */}
        {delAdic && (
          <div className="modal-overlay" onClick={() => setDelAdic(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
              </div>
              <h3>¿Anular adición?</h3>
              <p>Esta acción es <strong>permanente</strong>.</p>
              <div className="modal-detail">"{delAdic.nombre}"</div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDelAdic(null)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={() => {
                  adicionesService.remove(delAdic.id);
                  refresh();
                  showOk(`Adición "${delAdic.nombre}" anulada`);
                  setDelAdic(null);
                }}>Sí, anular</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
