import React, { useState, useRef } from 'react';
import useInsumos from '../hooks/useInsumos';
import insumosService from '../services/insumosService';
import InsumoForm from '../components/InsumoForm';
import './InsumosPage.css';
import Layout from '../../../shared/components/Layout';

const formatCOP = v =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);
const formatDate = iso =>
  iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso)) : '—';

// ── Modal: Ver insumo ─────────────────────────────────────────────────────────
function ModalVerInsumo({ insumo, onClose, onEditar, onEliminar, onToggle }) {
  const stockOk = insumo.stockActual >= insumo.stockMinimo;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white', borderRadius:18, width:'100%', maxWidth:640,
        maxHeight:'88vh', overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,.22)', animation:'popIn .22s ease',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:'linear-gradient(135deg,#4CAF50,#388E3C)',display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a' }}>{insumo.nombre}</div>
              <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                <span className="badge-cat">{insumo.categoria}</span>
                <span style={{ padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:insumo.estado?'#E8F5E9':'#F5F5F5',color:insumo.estado?'#2E7D32':'#888',border:`1px solid ${insumo.estado?'#A5D6A7':'#ccc'}` }}>{insumo.estado?'Activo':'Inactivo'}</span>
                {!stockOk && <span style={{ padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:'#FFF3E0',color:'#E65100',border:'1px solid #FFCC80' }}>⚠ Stock bajo</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:'50%',border:'none',background:'#f5f5f5',color:'#666',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div style={{ background:'#fafafa',borderRadius:12,padding:'16px 18px',border:'1px solid #f0f0f0' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:12 }}>Información General</div>
              {[
                ['Categoría', <span className="badge-cat">{insumo.categoria}</span>],
                ['Unidad medida', insumo.unidadMedida],
                ['Proveedor', insumo.proveedor || '—'],
                ['Estado',
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <button className={`toggle-btn ${insumo.estado?'toggle-on':'toggle-off'}`} onClick={onToggle} style={{ cursor:'pointer' }}><span className="toggle-thumb"/></button>
                    <span style={{ fontSize:13,fontWeight:600,color:insumo.estado?'#388E3C':'#888' }}>{insumo.estado?'Activo':'Inactivo'}</span>
                  </div>
                ],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #f5f5f5',fontSize:13 }}>
                  <span style={{ color:'#888',fontWeight:600 }}>{label}</span>
                  <span style={{ color:'#1a1a1a',fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'#fafafa',borderRadius:12,padding:'16px 18px',border:'1px solid #f0f0f0' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:12 }}>Inventario & Precio</div>
              {[
                ['Stock actual', <span style={{ fontWeight:800,fontSize:15,color:stockOk?'#388E3C':'#E53935' }}>{insumo.stockActual} {insumo.unidadMedida}</span>],
                ['Stock mínimo', `${insumo.stockMinimo} ${insumo.unidadMedida}`],
                ['Último precio pagado', insumo.precioUnitario ? <span style={{ fontWeight:700,color:'#6D4C41' }}>{formatCOP(insumo.precioUnitario)}</span> : <span style={{ color:'#aaa' }}>Sin compras aún</span>],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #f5f5f5',fontSize:13 }}>
                  <span style={{ color:'#888',fontWeight:600 }}>{label}</span>
                  <span style={{ color:'#1a1a1a',fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:'#fafafa',borderRadius:12,padding:'14px 18px',border:'1px solid #f0f0f0',marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Descripción</div>
            <p style={{ fontSize:13,color:'#555',lineHeight:1.6,margin:0 }}>{insumo.descripcion || 'Sin descripción registrada.'}</p>
            <div style={{ marginTop:10,fontSize:12,color:'#aaa' }}>Registrado: {formatDate(insumo.fechaCreacion)}</div>
          </div>
          {!stockOk && (
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'#FFF3E0',border:'1px solid #FFCC80',borderRadius:10,marginBottom:14,fontSize:13,color:'#E65100' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span><strong>Alerta de stock:</strong> El stock actual está por debajo del mínimo requerido.</span>
            </div>
          )}
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
            <button className="btn-cancel" onClick={onClose}>Cerrar</button>
            <button onClick={onEliminar} style={{ padding:'10px 18px',background:'linear-gradient(135deg,#E53935,#B71C1C)',border:'none',borderRadius:10,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
              ✕ Eliminar
            </button>
            <button className="btn-confirm-primary" onClick={onEditar}>✏️ Editar insumo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Agregar / Editar insumo ────────────────────────────────────────────
function ModalFormInsumo({ insumo, onCreate, onUpdate, onClose }) {
  const isEdit = !!insumo;
  const [serverError, setServerError] = useState('');

  const handleSubmit = data => {
    const r = isEdit ? onUpdate(insumo.id, data) : onCreate(data);
    if (r?.error) { setServerError(r.error); return; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white',borderRadius:18,width:'100%',maxWidth:680,
        maxHeight:'90vh',overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,.22)',animation:'popIn .22s ease',
      }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:42,height:42,borderRadius:10,flexShrink:0,background:isEdit?'linear-gradient(135deg,#6D4C41,#4E342E)':'linear-gradient(135deg,#4CAF50,#388E3C)',display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>
              {isEdit
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:15,color:'#1a1a1a' }}>{isEdit?'Editar insumo':'Agregar insumo'}</div>
              <div style={{ fontSize:12,color:'#aaa' }}>{isEdit?`Modificando: ${insumo.nombre}`:'Completa los campos para registrar un nuevo insumo'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:'50%',border:'none',background:'#f5f5f5',color:'#666',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <InsumoForm
            initialData={insumo || undefined}
            isEditing={isEdit}
            serverError={serverError}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const InsumosPage = () => {
  const { insumos, create, update, remove, toggleEstado, refresh } = useInsumos();
  const [query, setQuery]           = useState('');
  const [filtered, setFiltered]     = useState(null);
  const [tabFiltro, setTabFiltro]   = useState('todos'); // todos | activos | inactivos
  const [modal, setModal]           = useState(null);
  const [targetInsumo, setTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const searchRef = useRef();

  const base     = filtered !== null ? filtered : insumos;
  const searched = query.trim() !== '';

  // Aplicar filtro de pestaña
  const displayedBase = tabFiltro === 'activos'
    ? base.filter(i => i.estado)
    : tabFiltro === 'inactivos'
      ? base.filter(i => !i.estado)
      : base;
  const displayed = [...displayedBase].sort((a, b) => Number(b.id) - Number(a.id));

  const totalActivos   = insumos.filter(i => i.estado).length;
  const totalInactivos = insumos.filter(i => !i.estado).length;

  // Insumos con stock bajo
  const stockBajoList = insumos.filter(i => i.estado && i.stockActual < i.stockMinimo);

  const showOk  = msg => { setSuccessMsg(msg); setErrorMsg('');  setTimeout(() => setSuccessMsg(''), 3500); };
  const showErr = msg => { setErrorMsg(msg);  setSuccessMsg(''); setTimeout(() => setErrorMsg(''), 4500); };
  const closeModal = () => { setModal(null); setTarget(null); };

  const handleSearch = e => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) setFiltered(null);
    else setFiltered(insumosService.search(val));
  };
  const clearSearch = () => { setQuery(''); setFiltered(null); searchRef.current?.focus(); };

  const handleCreate = data => {
    const r = create(data);
    if (r?.error) return r;
    showOk('Insumo registrado correctamente.');
    closeModal();
    return r;
  };

  const handleUpdate = (id, data) => {
    const r = update(id, data);
    if (r?.error) return r;
    showOk('Insumo actualizado correctamente.');
    closeModal();
    if (query.trim()) setFiltered(insumosService.search(query));
    return r;
  };

  const handleDelete = () => {
    const result = remove(deleteTarget.id);
    if (result?.error) {
      showErr(result.error);
      setDeleteTarget(null);
      return;
    }
    if (query.trim()) setFiltered(insumosService.search(query));
    else setFiltered(null);
    showOk(`Insumo "${deleteTarget.nombre}" eliminado correctamente.`);
    setDeleteTarget(null);
    if (modal === 'ver') closeModal();
  };

  const handleToggle = id => {
    toggleEstado(id);
    if (query.trim()) setFiltered(insumosService.search(query));
    if (modal === 'ver' && targetInsumo?.id === id) {
      setTarget(prev => ({ ...prev, estado: !prev.estado }));
    }
  };

  const tabStyle = (key) => ({
    padding: '7px 18px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    background: tabFiltro === key ? '#388E3C' : '#f0f0f0',
    color: tabFiltro === key ? 'white' : '#555',
    transition: 'all .2s',
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

        {/* Modales */}
        {modal === 'ver' && targetInsumo && (
          <ModalVerInsumo
            insumo={targetInsumo}
            onClose={closeModal}
            onEditar={() => setModal('editar')}
            onEliminar={() => setDeleteTarget(targetInsumo)}
            onToggle={() => handleToggle(targetInsumo.id)}
          />
        )}
        {(modal === 'nuevo' || modal === 'editar') && (
          <ModalFormInsumo
            insumo={modal === 'editar' ? targetInsumo : null}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onClose={closeModal}
          />
        )}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              <h3>¿Eliminar insumo?</h3>
              <p>Esta acción es <strong>permanente</strong> y no se puede deshacer.</p>
              <div className="modal-detail">"{deleteTarget.nombre}"</div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleDelete}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Gestión de Insumos</h1>
          <p className="page-subtitle">Administra los insumos del sistema</p>
        </div>

        {/* Banner stock bajo */}
        {stockBajoList.length > 0 && (
          <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 20px',background:'#FFF3E0',border:'1px solid #FFCC80',borderRadius:12,marginBottom:16,fontSize:13,color:'#E65100' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>
              <strong>{stockBajoList.length} insumo{stockBajoList.length !== 1 ? 's' : ''} con stock bajo:</strong>{' '}
              {stockBajoList.map(i => i.nombre).join(', ')}
            </span>
          </div>
        )}

        {/* Filtro pestañas */}
        <div style={{ display:'flex',gap:8,marginBottom:16 }}>
          <button style={tabStyle('todos')} onClick={() => setTabFiltro('todos')}>
            Todos ({insumos.length})
          </button>
          <button style={tabStyle('activos')} onClick={() => setTabFiltro('activos')}>
            Activos ({totalActivos})
          </button>
          <button style={tabStyle('inactivos')} onClick={() => setTabFiltro('inactivos')}>
            Inactivos ({totalInactivos})
          </button>
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
              placeholder="Buscar por ID, nombre o categoría..."
              value={query} onChange={handleSearch}
              className="search-input"
            />
            {query && (
              <button className="search-clear" onClick={clearSearch} title="Limpiar búsqueda">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button className="btn-add" onClick={() => { setTarget(null); setModal('nuevo'); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar insumo
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
                  <p>No hay insumos que coincidan con "<strong>{query}</strong>"</p>
                  <button className="btn-outline-green" onClick={clearSearch}>Ver todos los insumos</button>
                </>
              ) : (
                <>
                  <div className="empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>
                  <h3>No hay insumos{tabFiltro !== 'todos' ? ` ${tabFiltro}` : ''} registrados</h3>
                  <p>
                    {tabFiltro !== 'todos'
                      ? `Cambia el filtro para ver otros insumos`
                      : 'Comienza agregando el primer insumo al sistema'}
                  </p>
                  {tabFiltro === 'todos' && (
                    <button className="btn-add-first" onClick={() => { setTarget(null); setModal('nuevo'); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agregar primer insumo
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
                    <th>ID</th><th>Nombre</th><th>Categoría</th>
                    <th>Unidad/Medida</th><th>Stock</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(ins => {
                    const stockBajo = ins.stockActual < ins.stockMinimo;
                    return (
                      <tr key={ins.id}>
                        <td className="td-id" style={{ fontFamily:'monospace', fontSize:11 }}>{ins.id}</td>
                        <td className="td-nombre">{ins.nombre}</td>
                        <td><span className="badge-cat">{ins.categoria}</span></td>
                        <td>{ins.unidadMedida}</td>
                        <td className="td-stock">
                          {ins.stockActual} {ins.unidadMedida}
                          {stockBajo && (
                            <span title="Stock bajo el mínimo" style={{ marginLeft:6,color:'#E65100',fontSize:12 }}>⚠</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`toggle-btn ${ins.estado ? 'toggle-on' : 'toggle-off'}`}
                            onClick={() => handleToggle(ins.id)}
                            title={ins.estado ? 'Activo - click para desactivar' : 'Inactivo - click para activar'}
                          ><span className="toggle-thumb"/></button>
                        </td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-ver" title="Ver detalle"
                              onClick={() => { setTarget(ins); setModal('ver'); }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="btn-editar" title="Editar"
                              onClick={() => { setTarget(ins); setModal('editar'); }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="btn-anular" title="Eliminar"
                              onClick={() => setDeleteTarget(ins)}>
                              ✕ Eliminar
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
      </div>
    </Layout>
  );
};

export default InsumosPage;
