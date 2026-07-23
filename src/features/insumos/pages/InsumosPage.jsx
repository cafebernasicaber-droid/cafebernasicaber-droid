import React, { useState, useRef } from 'react';
import useInsumos from '../hooks/useInsumos';
import insumosService from '../services/insumosService';
import InsumoForm from '../components/InsumoForm';
import './InsumosPage.css';
import Layout from '../../../shared/components/Layout';

// ── Vasos de cartón y plástico: catálogo de tamaños estándar ─────────────────
const VASOS_CATALOGO = [
  { nombre: 'Vaso de plástico 9 oz',  categoria: 'Vasos de plástico' },
  { nombre: 'Vaso de plástico 12 oz', categoria: 'Vasos de plástico' },
  { nombre: 'Vaso de plástico 14 oz', categoria: 'Vasos de plástico' },
  { nombre: 'Vaso de plástico 16 oz', categoria: 'Vasos de plástico' },
  { nombre: 'Vaso de cartón 4 oz',    categoria: 'Vasos de cartón' },
  { nombre: 'Vaso de cartón 7 oz',    categoria: 'Vasos de cartón' },
  { nombre: 'Vaso de cartón 9 oz',    categoria: 'Vasos de cartón' },
];

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
        background:'var(--bg-surface)', borderRadius:18, width:'100%', maxWidth:640,
        maxHeight:'88vh', overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,.5)', animation:'popIn .22s ease',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:'linear-gradient(135deg,#4CAF50,#388E3C)',display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:'var(--text-primary)' }}>{insumo.nombre}</div>
              <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                <span className="badge-cat">{insumo.categoria}</span>
                <span style={{ padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:insumo.estado==='Activo'?'#E8F5E9':'#F5F5F5',color:insumo.estado==='Activo'?'#2E7D32':'#888',border:`1px solid ${insumo.estado==='Activo'?'#A5D6A7':'#ccc'}` }}>{insumo.estado==='Activo'?'Activo':'Inactivo'}</span>
                {!stockOk && <span style={{ padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:'rgba(230,115,0,0.15)',color:'#FF8A65',border:'1px solid #FFCC80' }}>⚠ Stock bajo</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:'50%',border:'none',background:'var(--bg-hover)',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div style={{ background:'var(--bg-surface-3)',borderRadius:12,padding:'16px 18px',border:'1px solid rgba(255,255,255,.07)' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:12 }}>Información General</div>
              {[
                ['ID', <span style={{ fontFamily:'monospace',fontSize:12,color:'#81C784',background:'rgba(76,175,80,.12)',padding:'2px 8px',borderRadius:6 }}>{insumo.id}</span>],
                ['Categoría', <span className="badge-cat">{insumo.categoria}</span>],
                ['Unidad medida', insumo.unidadMedida],
                ['Proveedor', insumo.proveedor || '—'],
                ['Estado',
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <button className={`toggle-btn ${insumo.estado==='Activo'?'toggle-on':'toggle-off'}`} onClick={onToggle} style={{ cursor:'pointer' }}><span className="toggle-thumb"/></button>
                    <span style={{ fontSize:13,fontWeight:600,color:insumo.estado==='Activo'?'#81C784':'#888' }}>{insumo.estado==='Activo'?'Activo':'Inactivo'}</span>
                  </div>
                ],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.05)',fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)',fontWeight:600 }}>{label}</span>
                  <span style={{ color:'var(--text-primary)',fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--bg-surface-3)',borderRadius:12,padding:'16px 18px',border:'1px solid rgba(255,255,255,.07)' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:12 }}>Stock & Precio</div>
              {[
                ['Stock actual', <span style={{ fontWeight:800,fontSize:15,color:stockOk?'#81C784':'#EF5350' }}>{insumo.stockActual} {insumo.unidadMedida}</span>],
                ['Stock mínimo', `${insumo.stockMinimo} ${insumo.unidadMedida}`],
                ['Último precio pagado', insumo.precioUnitario ? <span style={{ fontWeight:700,color:'#FFCC80' }}>{formatCOP(insumo.precioUnitario)}</span> : <span style={{ color:'var(--text-secondary)' }}>Sin compras aún</span>],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,.05)',fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)',fontWeight:600 }}>{label}</span>
                  <span style={{ color:'var(--text-primary)',fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:'var(--bg-surface-3)',borderRadius:12,padding:'14px 18px',border:'1px solid rgba(255,255,255,.07)',marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Descripción</div>
            <p style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,margin:0 }}>{insumo.descripcion || 'Sin descripción registrada.'}</p>
            <div style={{ marginTop:10,fontSize:12,color:'var(--text-secondary)' }}>Registrado: {formatDate(insumo.fechaCreacion)}</div>
          </div>
          {!stockOk && (
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'rgba(230,115,0,0.10)',border:'1px solid rgba(230,115,0,0.28)',borderRadius:10,marginBottom:14,fontSize:13,color:'#E65100' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span><strong>Alerta de stock:</strong> El stock actual está por debajo del mínimo requerido.</span>
            </div>
          )}
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
            <button className="btn-cancel" onClick={onClose}>Cerrar</button>
            <button onClick={onEliminar} style={{ padding:'10px 18px',background:'linear-gradient(135deg,#E53935,#B71C1C)',border:'none',borderRadius:10,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>Anular
            </button>
            <button className="btn-confirm-primary" onClick={onEditar}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg> Editar insumo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Agregar / Editar insumo ────────────────────────────────────────────
function ModalFormInsumo({ insumo, prefill, onCreate, onUpdate, onClose }) {
  const isEdit = !!insumo;
  const [serverError, setServerError] = useState('');

  const handleSubmit = data => {
    const r = isEdit ? onUpdate(insumo.id, data) : onCreate(data);
    if (r?.error) { setServerError(r.error); return; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)',borderRadius:18,width:'100%',maxWidth:680,
        maxHeight:'90vh',overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,.5)',animation:'popIn .22s ease',
      }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:42,height:42,borderRadius:10,flexShrink:0,background:isEdit?'linear-gradient(135deg,#6D4C41,#4E342E)':'linear-gradient(135deg,#4CAF50,#388E3C)',display:'flex',alignItems:'center',justifyContent:'center',color:'white' }}>
              {isEdit
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:15,color:'var(--text-primary)' }}>{isEdit?'Editar insumo':'Agregar insumo'}</div>
              <div style={{ fontSize:12,color:'var(--text-secondary)' }}>{isEdit?`Modificando: ${insumo.nombre}`:'Completa los campos para registrar un nuevo insumo'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:'50%',border:'none',background:'var(--bg-hover)',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          <InsumoForm
            initialData={insumo || prefill || undefined}
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
  const [prefillVaso, setPrefillVaso] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const searchRef = useRef();

  const base     = filtered !== null ? filtered : insumos;
  const searched = query.trim() !== '';

  // Aplicar filtro de pestaña
  const displayedBase = tabFiltro === 'activos'
    ? base.filter(i => i.estado === 'Activo')
    : tabFiltro === 'inactivos'
      ? base.filter(i => i.estado !== 'Activo')
      : base;
  const displayed = [...displayedBase].sort((a, b) => Number(b.id) - Number(a.id));

  const totalActivos   = insumos.filter(i => i.estado === 'Activo').length;
  const totalInactivos = insumos.filter(i => i.estado !== 'Activo').length;

  // Insumos con stock bajo
  const stockBajoList = insumos.filter(i => i.estado === 'Activo' && i.stockActual < i.stockMinimo);

  const showOk  = msg => { setSuccessMsg(msg); setErrorMsg('');  setTimeout(() => setSuccessMsg(''), 3500); };
  const showErr = msg => { setErrorMsg(msg);  setSuccessMsg(''); setTimeout(() => setErrorMsg(''), 4500); };
  const closeModal = () => { setModal(null); setTarget(null); setPrefillVaso(null); };
  const openVaso = (v) => { setTarget(null); setPrefillVaso({ nombre: v.nombre, categoria: v.categoria, unidadMedida: 'unidad' }); setModal('nuevo'); };

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
    showOk(`Insumo "${deleteTarget.nombre}" anulado correctamente.`);
    setDeleteTarget(null);
    if (modal === 'ver') closeModal();
  };

  const handleToggle = id => {
    toggleEstado(id);
    if (query.trim()) setFiltered(insumosService.search(query));
    if (modal === 'ver' && targetInsumo?.id === id) {
      setTarget(prev => ({ ...prev, estado: prev.estado === 'Activo' ? 'Inactivo' : 'Activo' }));
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
            prefill={modal === 'nuevo' ? prefillVaso : null}
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
              <h3>¿Detener insumo?</h3>
              <p>Esta acción es <strong>permanente</strong> y no se puede deshacer.</p>
              <div className="modal-detail">"{deleteTarget.nombre}"</div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleDelete}>Sí, anular</button>
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
          <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 20px',background:'rgba(230,115,0,0.10)',border:'1px solid rgba(230,115,0,0.28)',borderRadius:12,marginBottom:16,fontSize:13,color:'#E65100' }}>
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
              placeholder="Buscar por nombre o categoría..."
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

        {/* Vasos de cartón y plástico */}
        <div className="insumos-card" style={{ padding: '18px 20px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>🥤</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Vasos de cartón y plástico</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plantillas rápidas para registrar los tamaños estándar. Elige un tamaño, completa proveedor y stock, y guarda.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {VASOS_CATALOGO.map(v => {
              const yaRegistrado = insumos.some(i => i.nombre.trim().toLowerCase() === v.nombre.toLowerCase());
              return (
                <button
                  key={v.nombre}
                  onClick={() => openVaso(v)}
                  disabled={yaRegistrado}
                  title={yaRegistrado ? 'Ya está registrado' : `Agregar ${v.nombre}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                    border: yaRegistrado ? '1.5px solid var(--border)' : '1.5px solid rgba(58,158,66,0.4)',
                    background: yaRegistrado ? 'var(--bg-surface-2)' : 'rgba(58,158,66,0.08)',
                    color: yaRegistrado ? 'var(--text-muted)' : 'var(--color-green)',
                    cursor: yaRegistrado ? 'default' : 'pointer',
                  }}
                >
                  {yaRegistrado ? '✓' : '+'} {v.nombre}
                </button>
              );
            })}
          </div>
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
                    <th>Nombre</th><th>Categoría</th>
                    <th>Unidad/Medida</th><th>Stock</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(ins => {
                    const stockReal = Math.max(0, ins.stockActual);
                    const sinStock  = stockReal === 0;
                    const stockBajo = !sinStock && stockReal < ins.stockMinimo;
                    return (
                      <tr key={ins.id}>
                        <td className="td-nombre">{ins.nombre}</td>
                        <td><span className="badge-cat">{ins.categoria}</span></td>
                        <td>{ins.unidadMedida}</td>
                        <td className="td-stock">
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                            <span>{stockReal} {ins.unidadMedida}</span>
                            {sinStock && (
                              <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,background:'rgba(229,57,53,0.12)',color:'#EF5350',border:'1px solid #EF9A9A' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                Sin stock
                              </span>
                            )}
                            {stockBajo && (
                              <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,background:'rgba(230,115,0,0.15)',color:'#FF8A65',border:'1px solid #FFCC80' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Stock bajo
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className={`toggle-btn ${ins.estado === 'Activo' ? 'toggle-on' : 'toggle-off'}`}
                            onClick={() => handleToggle(ins.id)}
                            title={ins.estado === 'Activo' ? 'Activo - click para desactivar' : 'Inactivo - click para activar'}
                          ><span className="toggle-thumb"/></button>
                        </td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-accion btn-accion-ver" title="Ver detalle"
                              onClick={() => { setTarget(ins); setModal('ver'); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              Ver
                            </button>
                            <button className="btn-accion btn-accion-editar" title="Editar"
                              onClick={() => { setTarget(ins); setModal('editar'); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Editar
                            </button>
                            <button className="btn-accion btn-accion-eliminar" title="Anular"
                              onClick={() => setDeleteTarget(ins)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              Anular
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