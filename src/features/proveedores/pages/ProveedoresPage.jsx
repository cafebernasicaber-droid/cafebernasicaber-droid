import React, { useState, useRef } from 'react';
import useProveedores from '../hooks/useProveedores';
import proveedoresService from '../services/proveedoresService';
import ProveedorForm from '../components/ProveedorForm';
import './ProveedoresPage.css';
import Layout from '../../../shared/components/Layout';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
};

// ── Modal Ver Proveedor ───────────────────────────────────────────────────────
function ModalVerProveedor({ proveedor, onClose, onEditar, onEliminar, onToggle }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white', borderRadius:18, width:'100%', maxWidth:660,
        maxHeight:'88vh', overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,.22)', animation:'popIn .22s ease',
      }}>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:'linear-gradient(135deg,#4CAF50,#388E3C)',display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:16,color:'#1a1a1a' }}>{proveedor.nombre}</div>
              <div style={{ display:'flex',gap:6,marginTop:4,flexWrap:'wrap' }}>
                <span className="badge-cat">{proveedor.categoria}</span>
                <span style={{ padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,
                  background:proveedor.estado?'#E8F5E9':'#F5F5F5',
                  color:proveedor.estado?'#2E7D32':'#888',
                  border:`1px solid ${proveedor.estado?'#A5D6A7':'#ccc'}` }}>
                  {proveedor.estado?'Activo':'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:'50%',border:'none',background:'#f5f5f5',color:'#666',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px' }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
            {/* Contacto */}
            <div style={{ background:'#fafafa',borderRadius:12,padding:'16px 18px',border:'1px solid #f0f0f0' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:12 }}>Información de Contacto</div>
              {[
                ['NIT / RUT', proveedor.nit],
                ['Teléfono',  proveedor.telefono],
                ['Correo',    proveedor.correo],
                ['Estado',
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <button className={`toggle-btn ${proveedor.estado?'toggle-on':'toggle-off'}`} onClick={onToggle} style={{ cursor:'pointer' }}>
                      <span className="toggle-thumb"/>
                    </button>
                    <span style={{ fontSize:13,fontWeight:600,color:proveedor.estado?'#388E3C':'#888' }}>
                      {proveedor.estado?'Activo':'Inactivo'}
                    </span>
                  </div>
                ],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #f5f5f5',fontSize:13 }}>
                  <span style={{ color:'#888',fontWeight:600 }}>{label}</span>
                  <span style={{ color:'#1a1a1a',fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </div>
            {/* Ubicación */}
            <div style={{ background:'#fafafa',borderRadius:12,padding:'16px 18px',border:'1px solid #f0f0f0' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:12 }}>Ubicación y Categoría</div>
              {[
                ['Ciudad',    proveedor.ciudad || '—'],
                ['Dirección', proveedor.direccion || '—'],
                ['Categoría', <span className="badge-cat">{proveedor.categoria}</span>],
                ['ID',        <span style={{ fontFamily:'monospace',fontSize:11,color:'#aaa' }}>{proveedor.id}</span>],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #f5f5f5',fontSize:13 }}>
                  <span style={{ color:'#888',fontWeight:600 }}>{label}</span>
                  <span style={{ color:'#1a1a1a',fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div style={{ background:'#fafafa',borderRadius:12,padding:'14px 18px',border:'1px solid #f0f0f0',marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Observaciones</div>
            <p style={{ fontSize:13,color:'#555',lineHeight:1.6,margin:0 }}>{proveedor.observaciones || 'Sin observaciones registradas.'}</p>
            <div style={{ marginTop:10,fontSize:12,color:'#aaa' }}>Registrado: {formatDate(proveedor.fechaCreacion)}</div>
          </div>

          {/* Acciones */}
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
            <button className="btn-cancel" onClick={onClose}>Cerrar</button>
            <button onClick={onEliminar} style={{ padding:'10px 18px',background:'linear-gradient(135deg,#E53935,#B71C1C)',border:'none',borderRadius:10,color:'white',fontSize:13,fontWeight:700,cursor:'pointer' }}>
              ✕ Eliminar
            </button>
            <button className="btn-confirm-primary" onClick={onEditar}>✏️ Editar proveedor</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const ProveedoresPage = () => {
  const { proveedores, remove, toggleEstado, refresh } = useProveedores();
  const [query, setQuery]             = useState('');
  const [filtered, setFiltered]       = useState(null);
  const [tabFiltro, setTabFiltro]     = useState('todos');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInfo, setDeleteInfo]   = useState(null);
  const [successMsg, setSuccessMsg]   = useState('');
  const [errorMsg, setErrorMsg]       = useState('');
  const [modal, setModal]             = useState(null); // 'nuevo' | proveedor-obj (editar) | { ver: proveedor-obj }
  const [serverError, setServerError] = useState('');
  const searchRef = useRef();

  const base = filtered !== null ? filtered : proveedores;
  const searched = query.trim() !== '';
  const displayedBase = tabFiltro === 'activos'
    ? base.filter(p => p.estado)
    : tabFiltro === 'inactivos'
      ? base.filter(p => !p.estado)
      : base;
  const displayed = [...displayedBase].sort((a, b) => Number(b.id) - Number(a.id));

  const totalActivos   = proveedores.filter(p => p.estado).length;
  const totalInactivos = proveedores.filter(p => !p.estado).length;

  const showSuccess = (msg) => { setSuccessMsg(msg); setErrorMsg('');  setTimeout(() => setSuccessMsg(''), 3500); };
  const showError   = (msg) => { setErrorMsg(msg);  setSuccessMsg(''); setTimeout(() => setErrorMsg(''), 4500); };

  // Búsqueda en tiempo real
  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim() === '') { setFiltered(null); }
    else { setFiltered(proveedoresService.search(val)); }
  };
  const clearSearch = () => { setQuery(''); setFiltered(null); searchRef.current?.focus(); };

  const openDeleteTarget = (p) => {
    const insumos     = proveedoresService.getInsumosDelProveedor(p.id, p.nombre);
    const tieneCompras = proveedoresService.tieneComprasActivas(p.id, p.nombre);
    setDeleteInfo({ insumos, tieneCompras });
    setDeleteTarget(p);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const result = remove(deleteTarget.id);
    if (result?.error) {
      showError(result.error);
      setDeleteTarget(null); setDeleteInfo(null);
      return;
    }
    setFiltered(query.trim() ? proveedoresService.search(query) : null);
    let msg = `Proveedor "${deleteTarget.nombre}" eliminado correctamente`;
    if (result?.insumosEliminados > 0) {
      msg += `. También se eliminaron ${result.insumosEliminados} insumo(s): ${result.nombresInsumos.join(', ')}`;
    }
    showSuccess(msg);
    setDeleteTarget(null); setDeleteInfo(null);
    // Cerrar modal ver si estaba abierto
    if (modal?.ver) setModal(null);
  };

  const handleToggle = (id) => {
    toggleEstado(id);
    if (query.trim()) setFiltered(proveedoresService.search(query));
    // Actualizar modal ver si está abierto con este proveedor
    if (modal?.ver?.id === id) {
      setModal(prev => ({ ver: { ...prev.ver, estado: !prev.ver.estado } }));
    }
  };

  const openVer     = (p) => setModal({ ver: p });
  const openNuevo   = () => { setServerError(''); setModal('nuevo'); };
  const openEditar  = (p) => { setServerError(''); setModal(p); };
  const closeModal  = () => { setModal(null); setServerError(''); };

  const handleFormSubmit = (data) => {
    setServerError('');
    let result;
    const esEdicion = modal && modal !== 'nuevo' && !modal.ver;
    if (modal === 'nuevo') {
      result = proveedoresService.create(data);
    } else {
      result = proveedoresService.update(modal.id, data);
    }
    if (result.error) { setServerError(result.error); return; }
    refresh();
    if (query.trim()) setFiltered(proveedoresService.search(query));
    closeModal();
    showSuccess(esEdicion ? `Proveedor "${data.nombre}" actualizado correctamente` : 'Proveedor registrado correctamente');
  };

  const esEdicion = modal && modal !== 'nuevo' && !modal?.ver;
  const esVer     = modal?.ver;

  const tabStyle = (key) => ({
    padding:'7px 18px', borderRadius:20, border:'none', cursor:'pointer',
    fontWeight:600, fontSize:13,
    background: tabFiltro === key ? '#388E3C' : '#f0f0f0',
    color:       tabFiltro === key ? 'white'   : '#555',
    transition:'all .2s',
  });

  return (
    <Layout>
      <div className="insumos-root">
        {successMsg && (
          <div className="toast toast-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="toast toast-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {errorMsg}
          </div>
        )}

        {/* Modal Ver */}
        {esVer && (
          <ModalVerProveedor
            proveedor={esVer}
            onClose={closeModal}
            onEditar={() => openEditar(esVer)}
            onEliminar={() => openDeleteTarget(esVer)}
            onToggle={() => handleToggle(esVer.id)}
          />
        )}

        {/* Modal Agregar / Editar */}
        {(modal === 'nuevo' || esEdicion) && (
          <div className="modal-overlay" onClick={closeModal}>
            <div onClick={e => e.stopPropagation()} style={{
              background:'white',borderRadius:16,width:'90%',maxWidth:680,
              maxHeight:'90vh',overflowY:'auto',padding:'28px 32px',
              boxShadow:'0 24px 64px rgba(0,0,0,0.22)',animation:'slideUp .2s ease',
            }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:40,height:40,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'white',
                    background: esEdicion ? 'linear-gradient(135deg,#6D4C41,#4E342E)' : 'linear-gradient(135deg,#4CAF50,#388E3C)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {esEdicion
                        ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                        : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                      }
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin:0,fontSize:18,fontWeight:800,color:'#1a1a1a' }}>{esEdicion?'Editar Proveedor':'Nuevo Proveedor'}</h3>
                    <p style={{ margin:0,fontSize:12,color:'#888' }}>{esEdicion?`Modificando: ${modal.nombre}`:'Completa los campos para registrar un proveedor'}</p>
                  </div>
                </div>
                <button onClick={closeModal} style={{ background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:22,lineHeight:1,padding:4 }}>×</button>
              </div>
              {serverError && (
                <div style={{ background:'#FFEBEE',color:'#B71C1C',padding:'10px 14px',borderRadius:8,marginBottom:16,fontSize:13,fontWeight:600 }}>
                  ⚠ {serverError}
                </div>
              )}
              <ProveedorForm
                isEditing={esEdicion}
                initialData={esEdicion ? modal : null}
                onSubmit={handleFormSubmit}
                onCancel={closeModal}
              />
            </div>
          </div>
        )}

        {/* Modal Eliminar */}
        {deleteTarget && deleteInfo && (
          <div className="modal-overlay" onClick={() => { setDeleteTarget(null); setDeleteInfo(null); }}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              <h3>¿Eliminar proveedor?</h3>
              {deleteInfo.tieneCompras ? (
                <>
                  <p style={{ color:'#B71C1C',fontWeight:600 }}>
                    ⛔ No se puede eliminar: "{deleteTarget.nombre}" tiene compras activas. Inactívalo en su lugar.
                  </p>
                  <div className="modal-actions">
                    <button className="btn-cancel" onClick={() => { setDeleteTarget(null); setDeleteInfo(null); }}>Entendido</button>
                  </div>
                </>
              ) : (
                <>
                  {deleteInfo.insumos.length > 0 && (
                    <div style={{ background:'#FFF3E0',border:'1px solid #FFCC80',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#E65100' }}>
                      ⚠ También se eliminarán los siguientes insumos asociados:
                      <ul style={{ margin:'6px 0 0 16px',padding:0 }}>
                        {deleteInfo.insumos.map(i => <li key={i.id}>{i.nombre}</li>)}
                      </ul>
                    </div>
                  )}
                  <p>Esta acción es <strong>permanente</strong> y no se puede deshacer.</p>
                  <div className="modal-detail">"{deleteTarget.nombre}"</div>
                  <div className="modal-actions">
                    <button className="btn-cancel" onClick={() => { setDeleteTarget(null); setDeleteInfo(null); }}>Cancelar</button>
                    <button className="btn-confirm-danger" onClick={handleDelete}>Sí, eliminar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="page-header">
          <h1 className="page-title">Gestión de Proveedores</h1>
          <p className="page-subtitle">Administra los proveedores del sistema</p>
        </div>

        {/* Pestañas */}
        <div style={{ display:'flex',gap:8,marginBottom:16 }}>
          <button style={tabStyle('todos')}     onClick={() => setTabFiltro('todos')}>Todos ({proveedores.length})</button>
          <button style={tabStyle('activos')}   onClick={() => setTabFiltro('activos')}>Activos ({totalActivos})</button>
          <button style={tabStyle('inactivos')} onClick={() => setTabFiltro('inactivos')}>Inactivos ({totalInactivos})</button>
        </div>

        {/* Toolbar */}
        <div className="insumos-toolbar">
          <div className="search-wrap" style={{ flex:1,maxWidth:480 }}>
            <span className="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              ref={searchRef} type="text"
              placeholder="Buscar por ID, nombre, NIT, ciudad o categoría..."
              value={query} onChange={handleSearch}
              className="search-input"
            />
            {query && (
              <button className="search-clear" onClick={clearSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button className="btn-add" onClick={openNuevo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar proveedor
          </button>
        </div>

        {/* Tabla */}
        <div className="insumos-card">
          {displayed.length === 0 ? (
            <div className="empty-state">
              {searched ? (
                <>
                  <div className="empty-icon empty-icon-search">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </div>
                  <h3>No se encontraron coincidencias</h3>
                  <p>No hay proveedores que coincidan con "<strong>{query}</strong>"</p>
                  <button className="btn-outline-green" onClick={clearSearch}>Ver todos los proveedores</button>
                </>
              ) : (
                <>
                  <div className="empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h3>No hay proveedores{tabFiltro !== 'todos' ? ` ${tabFiltro}` : ''} registrados</h3>
                  {tabFiltro === 'todos' && (
                    <button className="btn-add-first" onClick={openNuevo}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agregar primer proveedor
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              {searched && (
                <div className="search-results-info">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  {displayed.length} resultado{displayed.length !== 1 ? 's' : ''} para "{query}"
                </div>
              )}
              <table className="insumos-table">
                <thead>
                  <tr>
                    <th>Nombre</th><th>NIT / RUT</th>
                    <th>Teléfono</th><th>Ciudad</th><th>Categoría</th>
                    <th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(p => (
                    <tr key={p.id}>
                      <td className="td-nombre">{p.nombre}</td>
                      <td>{p.nit}</td>
                      <td>{p.telefono}</td>
                      <td>{p.ciudad}</td>
                      <td><span className="badge-cat">{p.categoria}</span></td>
                      <td>
                        <button className={`toggle-btn ${p.estado ? 'toggle-on' : 'toggle-off'}`}
                          onClick={() => handleToggle(p.id)}>
                          <span className="toggle-thumb"/>
                        </button>
                      </td>
                      <td>
                        <div className="actions-group">
                          <button className="btn-accion btn-accion-ver" onClick={() => openVer(p)} title="Ver detalle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Ver
                          </button>
                          <button className="btn-accion btn-accion-editar" onClick={() => openEditar(p)} title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar
                          </button>
                          <button className="btn-accion btn-accion-eliminar" onClick={() => openDeleteTarget(p)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProveedoresPage;
