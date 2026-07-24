import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../../shared/components/Layout';
import toppingsService from '../services/toppingsService';
import productosService from '../../productos/services/productosService';
import '../../insumos/pages/InsumosPage.css';

function ToppingModal({ inicial, productos, onClose, onSave }) {
  const [form, setForm] = useState(inicial || { nombre:'', productos_ids:[], estado:'Activo' });
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const toggleProducto = (id) => {
    setForm(f => {
      const ids = Array.isArray(f.productos_ids) ? f.productos_ids : [];
      return { ...f, productos_ids: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] };
    });
  };

  const aplicaATodos = !Array.isArray(form.productos_ids) || form.productos_ids.length === 0;

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    try {
      if (inicial) {
        await toppingsService.update(inicial.id, form);
      } else {
        await toppingsService.create(form);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'Error al guardar el topping');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:500,textAlign:'left',padding:'32px 36px'}} onClick={e=>e.stopPropagation()}>
        <h3 style={{marginBottom:4}}>{inicial ? 'Editar topping' : 'Nuevo topping'}</h3>
        <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:20}}>{inicial ? `Modificando: ${inicial.nombre}` : 'Agrega un topping al menú (siempre gratuito)'}</p>
        {error && <div style={{background:'rgba(229,57,53,0.12)',color:'var(--color-red)',padding:'10px 14px',borderRadius:8,marginBottom:16,fontSize:13}}>⚠ {error}</div>}
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>Nombre *</label>
            <input type="text" required value={form.nombre} onChange={set('nombre')} placeholder="Ej: Crema batida" style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:14,outline:'none'}}/>
          </div>

          <div>
            <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>Productos en los que aplica</label>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>
              Si no seleccionas ninguno, el topping aplica a <strong>todos</strong> los productos.
            </p>
            {productos.length === 0 ? (
              <div style={{padding:'10px 14px',background:'rgba(245,176,0,0.12)',border:'1px solid rgba(245,176,0,0.3)',borderRadius:8,fontSize:13,color:'#E65100'}}>
                ⚠ No hay productos registrados todavía.
              </div>
            ) : (
              <div style={{display:'flex',flexWrap:'wrap',gap:8,maxHeight:180,overflowY:'auto',padding:'2px 2px'}}>
                {productos.map(p => {
                  const sel = Array.isArray(form.productos_ids) && form.productos_ids.includes(p.id);
                  return (
                    <button type="button" key={p.id} onClick={() => toggleProducto(p.id)}
                      style={{padding:'6px 12px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',border:`1.5px solid ${sel?'var(--color-green,#2E7D32)':'var(--border)'}`,background:sel?'rgba(46,125,50,0.12)':'transparent',color:sel?'#2E7D32':'var(--text-secondary)'}}>
                      {p.nombre}{sel && ' ✓'}
                    </button>
                  );
                })}
              </div>
            )}
            {aplicaATodos && (
              <p style={{fontSize:12,color:'#2E7D32',fontWeight:600,marginTop:8}}>✓ Aplica a todos los productos</p>
            )}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button type="button" className={`toggle-btn ${form.estado==='Activo'?'toggle-on':'toggle-off'}`}
              onClick={() => setForm(f => ({...f, estado: f.estado==='Activo'?'Inactivo':'Activo'}))}>
              <span className="toggle-thumb"/>
            </button>
            <span style={{fontSize:13,fontWeight:600,color:form.estado==='Activo'?'#2E7D32':'#888'}}>{form.estado}</span>
          </div>
          <div className="modal-actions" style={{justifyContent:'flex-end',marginTop:4}}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-confirm-primary">{inicial ? '💾 Guardar cambios' : '✅ Crear topping'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ToppingsPage() {
  const [toppings, setToppings] = useState([]);
  const [productos, setProductos] = useState([]);
  useEffect(() => {
    toppingsService.getAll()
      .then(d => setToppings(Array.isArray(d) ? d : []))
      .catch(() => setToppings([]));
    productosService.getAll()
      .then(d => setProductos(Array.isArray(d) ? d : []))
      .catch(() => setProductos([]));
  }, []);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | topping
  const [deleteTarget, setDel] = useState(null);
  const [success, setSuccess] = useState('');
  const searchRef = useRef();

  const refresh = () => {
    toppingsService.getAll()
      .then(d => setToppings(Array.isArray(d) ? d : []))
      .catch(() => setToppings([]));
  };
  const showOk = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const displayed = query.trim()
    ? toppings.filter(t => t.nombre.toLowerCase().includes(query.toLowerCase()))
    : toppings;

  const handleDelete = async () => {
    await toppingsService.remove(deleteTarget.id);
    refresh(); showOk(`Topping "${deleteTarget.nombre}" eliminado`); setDel(null);
  };

  const handleToggle = async id => { await toppingsService.toggleEstado(id); refresh(); };

  const nombreProducto = (id) => productos.find(p => p.id === id)?.nombre || `#${id}`;

  return (
    <Layout>
      <div className="insumos-root">
        {success && <div className="toast toast-success"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{success}</div>}

        <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <h1 className="page-title">Toppings</h1>
            <p className="page-subtitle">Personaliza las bebidas con toppings gratuitos, asignados por producto</p>
          </div>
          <button className="btn-add" onClick={() => setModal('new')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo topping
          </button>
        </div>

        <div className="insumos-toolbar">
          <div className="search-group">
            <div className="search-wrap">
              <span className="search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input ref={searchRef} type="text" className="search-input" placeholder="Buscar topping..." value={query} onChange={e => setQuery(e.target.value)}/>
              {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
            </div>
          </div>
          <span style={{fontSize:13,color:'var(--text-muted)',marginLeft:'auto'}}>{displayed.length} topping{displayed.length!==1?'s':''}</span>
        </div>

        <div className="insumos-card">
          {displayed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧋</div>
              <h3>{query ? 'Sin coincidencias' : 'No hay toppings'}</h3>
              <p>Agrega toppings para personalizar las bebidas</p>
              {!query && <button className="btn-add-first" onClick={() => setModal('new')}>Nuevo topping</button>}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="insumos-table">
                <thead><tr><th>ID</th><th>Nombre</th><th>Aplica en</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {displayed.map(t => {
                    const ids = Array.isArray(t.productos_ids) ? t.productos_ids : [];
                    const aplicaATodos = ids.length === 0;
                    return (
                      <tr key={t.id}>
                        <td className="td-id">{t.id}</td>
                        <td className="td-nombre">{t.nombre}</td>
                        <td style={{fontSize:13,color:'var(--text-muted)'}}>
                          {aplicaATodos ? (
                            <span style={{background:'#E8F5E9',color:'#2E7D32',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>Todos los productos</span>
                          ) : (
                            ids.map(nombreProducto).join(', ')
                          )}
                        </td>
                        <td>
                          <button className={`toggle-btn ${t.estado==='Activo'?'toggle-on':'toggle-off'}`} onClick={() => handleToggle(t.id)} title={t.estado}>
                            <span className="toggle-thumb"/>
                          </button>
                        </td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-editar" title="Editar" onClick={() => setModal(t)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="btn-anular" title="Stop" onClick={() => setDel(t)}>
                              ✕ Stop
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(modal === 'new' || (modal && modal.id)) && (
          <ToppingModal
            inicial={modal === 'new' ? null : modal}
            productos={productos}
            onClose={() => setModal(null)}
            onSave={() => { refresh(); showOk(modal === 'new' ? 'Topping creado correctamente' : 'Topping actualizado'); setModal(null); }}
          />
        )}

        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDel(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></div>
              <h3>¿Detener topping?</h3>
              <p>Esta acción es <strong>permanente</strong>.</p>
              <div className="modal-detail">"{deleteTarget.nombre}"</div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDel(null)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleDelete}>Sí, anular</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
