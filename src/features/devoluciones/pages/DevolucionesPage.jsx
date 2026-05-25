import React, { useState, useEffect } from 'react';
import Layout from '../../../shared/components/Layout';
import devolucionesService from '../services/devolucionesService';
import ventasService from '../../ventas/services/ventasService';
import '../../insumos/pages/InsumosPage.css';
import './DevolucionesPage.css';

const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n||0);
const fmtFecha = iso => iso ? new Intl.DateTimeFormat('es-CO',{dateStyle:'medium'}).format(new Date(iso)) : '—';
const fmtHora  = iso => iso ? new Intl.DateTimeFormat('es-CO',{timeStyle:'short'}).format(new Date(iso)) : '—';

const EST_CFG = {
  pendiente:  { bg:'#FFF8E1', color:'#F57F17', label:'Pendiente',  ico:'⏳' },
  aprobada:   { bg:'#E8F5E9', color:'#2E7D32', label:'Aprobada',   ico:'✅' },
  rechazada:  { bg:'#FFEBEE', color:'#C62828', label:'Rechazada',  ico:'❌' },
};

function ModalRegistrar({ ventaPrefill, onClose, onSave }) {
  const ventas = ventasService.getAll().filter(v => v.estado === 'vendido');
  const [form, setForm] = useState({ id_venta: ventaPrefill?.id_venta || '', motivo: '' });
  const [productosSelec, setProductosSelec] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ventaSel = ventas.find(v => v.id_venta === Number(form.id_venta));
  const productos = Array.isArray(ventaSel?.productos) ? ventaSel.productos : [];
  const tieneVariosProductos = productos.length >= 2;

  // Al cambiar de venta, resetear selección de productos
  const handleVentaChange = e => {
    setForm(f => ({ ...f, id_venta: e.target.value }));
    setProductosSelec([]);
  };

  const toggleProducto = prod => {
    setProductosSelec(prev =>
      prev.find(p => p.id === prod.id)
        ? prev.filter(p => p.id !== prod.id)
        : [...prev, prod]
    );
  };

  const seleccionarTodos = () => setProductosSelec(productos);
  const deseleccionarTodos = () => setProductosSelec([]);

  // Calcular monto a devolver
  const montoDevolucion = tieneVariosProductos
    ? productosSelec.reduce((s, p) => s + (p.precio || 0) * (p.cantidad || 1), 0)
    : ventaSel?.total || 0;

  const esParcial = tieneVariosProductos && productosSelec.length > 0 && productosSelec.length < productos.length;
  const tipoDevolucion = !tieneVariosProductos ? 'total' : esParcial ? 'parcial' : 'total';

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (!form.id_venta) { setError('Selecciona una venta'); return; }
    if (tieneVariosProductos && productosSelec.length === 0) { setError('Selecciona al menos un producto a devolver'); return; }
    if (!form.motivo.trim() || form.motivo.trim().length < 10) { setError('El motivo debe tener al menos 10 caracteres'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const r = devolucionesService.create({
      id_venta: Number(form.id_venta),
      motivo: form.motivo.trim(),
      tipo: tipoDevolucion,
      productos_devueltos: tieneVariosProductos ? productosSelec : productos,
      monto_devolucion: montoDevolucion,
    });
    if (r.error) { setError(r.error); setLoading(false); return; }
    setLoading(false); onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:540,textAlign:'left',padding:'32px 36px',maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <h3 style={{marginBottom:4}}>Registrar devolución</h3>
        <p style={{fontSize:13,color:'#888',marginBottom:20}}>Solo se pueden devolver ventas con estado "Vendido"</p>
        {error && <div style={{background:'#FFEBEE',color:'#B71C1C',padding:'10px 14px',borderRadius:8,marginBottom:16,fontSize:13}}>⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* Selector de venta */}
            <div>
              <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Venta *</label>
              <select value={form.id_venta} onChange={handleVentaChange}
                style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,outline:'none',background:'white'}}>
                <option value="">— Seleccionar —</option>
                {ventas.length === 0
                  ? <option disabled>Sin ventas disponibles</option>
                  : ventas.map(v => <option key={v.id_venta} value={v.id_venta}>#{v.id_venta} · {v.cliente} · {fmt(v.total)}</option>)}
              </select>
            </div>

            {/* Selección de productos (solo si hay 2+) */}
            {ventaSel && tieneVariosProductos && (
              <div style={{background:'#F8F9FA',borderRadius:10,padding:'14px 16px',border:'1.5px solid #E0E0E0'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <label style={{fontSize:12,fontWeight:700,color:'#555',textTransform:'uppercase',letterSpacing:0.5}}>
                    Productos a devolver *
                  </label>
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" onClick={seleccionarTodos}
                      style={{fontSize:11,fontWeight:700,color:'#2E7D32',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>
                      Todos
                    </button>
                    <button type="button" onClick={deseleccionarTodos}
                      style={{fontSize:11,fontWeight:700,color:'#888',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>
                      Ninguno
                    </button>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {productos.map((p, i) => {
                    const sel = !!productosSelec.find(x => x.id === p.id);
                    const subtotal = (p.precio || 0) * (p.cantidad || 1);
                    return (
                      <label key={p.id || i} style={{
                        display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                        borderRadius:8, cursor:'pointer', transition:'background .12s',
                        background: sel ? '#E8F5E9' : 'white',
                        border: `1.5px solid ${sel ? '#4CAF50' : '#E0E0E0'}`,
                      }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleProducto(p)}
                          style={{width:15,height:15,accentColor:'#4CAF50',cursor:'pointer',flexShrink:0}}/>
                        <span style={{flex:1,fontSize:13,fontWeight:600,color:'#1a1a1a'}}>
                          {p.nombre || p}
                          {p.cantidad > 1 && (
                            <span style={{marginLeft:6,background:'#2E7D32',color:'white',padding:'1px 5px',borderRadius:4,fontSize:10,fontWeight:700}}>
                              x{p.cantidad}
                            </span>
                          )}
                        </span>
                        {subtotal > 0 && (
                          <span style={{fontSize:12,fontWeight:700,color: sel ? '#2E7D32' : '#888'}}>
                            {fmt(subtotal)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {productosSelec.length > 0 && (
                  <div style={{marginTop:10,padding:'8px 12px',background:'white',borderRadius:8,border:'1px solid #C8E6C9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,color:'#555'}}>
                      {productosSelec.length} de {productos.length} producto{productos.length!==1?'s':''} · <strong>{esParcial ? 'Parcial' : 'Total'}</strong>
                    </span>
                    <span style={{fontSize:13,fontWeight:800,color:'#2E7D32'}}>{fmt(montoDevolucion)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Info venta (cuando solo tiene 1 producto) */}
            {ventaSel && !tieneVariosProductos && (
              <div style={{background:'#FFF3E0',borderRadius:8,padding:'12px 16px',fontSize:13,border:'1px solid #FFE082'}}>
                ⚡ Al registrar, la venta de <strong>{ventaSel.cliente}</strong> ({fmt(ventaSel.total)}) cambiará automáticamente a <strong>"Devuelta"</strong>.
              </div>
            )}

            {/* Motivo */}
            <div>
              <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Motivo *</label>
              <textarea value={form.motivo} onChange={e => setForm(f => ({...f, motivo: e.target.value}))}
                placeholder="Describe el motivo de la devolución (mínimo 10 caracteres)..." rows={4}
                style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}}/>
            </div>
          </div>

          <div className="modal-actions" style={{justifyContent:'flex-end',marginTop:20}}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-confirm-primary" disabled={loading}>
              {loading ? '⏳ Registrando...' : '↩ Registrar devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalConfirm({ dev, accion, onClose, onConfirm }) {
  const venta = ventasService.getById(dev.id_venta);
  const esAprobar = accion === 'aprobar';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className={`modal-icon ${esAprobar ? '' : 'modal-icon-danger'}`} style={{background:esAprobar?'#E8F5E9':'#FFCDD2',color:esAprobar?'#2E7D32':'#B71C1C'}}>
          {esAprobar ? '✅' : '❌'}
        </div>
        <h3>{esAprobar ? 'Aprobar devolución' : 'Rechazar devolución'}</h3>
        <p>{esAprobar
          ? <>Al aprobar, la venta <strong>#{dev.id_venta} de {venta?.cliente}</strong> quedará como <strong>"Devuelta"</strong>.</>
          : <>Al rechazar, la venta <strong>#{dev.id_venta} de {venta?.cliente}</strong> recuperará el estado <strong>"Vendida"</strong>.</>
        }</p>
        <div className="modal-detail">Devolución #{dev.id_dev}</div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          {esAprobar
            ? <button className="btn-confirm-primary" onClick={onConfirm}>✅ Sí, aprobar</button>
            : <button className="btn-confirm-danger" onClick={onConfirm}>❌ Sí, rechazar</button>
          }
        </div>
      </div>
    </div>
  );
}

export default function DevolucionesPage() {
  const [devs, setDevs]         = useState(() => devolucionesService.getAll());
  const [query, setQuery]       = useState('');
  const [filtro, setFiltro]     = useState('todos');
  const [modal, setModal]       = useState(null); // null | 'new'
  const [confirm, setConfirm]   = useState(null); // { dev, accion }
  const [prefill, setPrefill]   = useState(null);
  const [success, setSuccess]   = useState('');
  const [pagina, setPagina]     = useState(1);
  const POR_PAG = 8;

  // Check for prefill from Ventas page
  useEffect(() => {
    const raw = localStorage.getItem('sicaber_dev_prefill');
    if (raw) {
      try { const p = JSON.parse(raw); setPrefill(p); setModal('new'); } catch {}
      localStorage.removeItem('sicaber_dev_prefill');
    }
  }, []);

  const refresh = () => setDevs(devolucionesService.getAll());
  const showOk = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const stats = devolucionesService.getStats();

  const lq = query.toLowerCase().trim();
  const filtradas = devs.filter(d => {
    const v = ventasService.getById(d.id_venta);
    const mq = !lq || String(d.id_dev).includes(lq) || String(d.id_venta).includes(lq) || (v?.cliente||'').toLowerCase().includes(lq) || d.motivo.toLowerCase().includes(lq);
    const me = filtro === 'todos' || d.estado === filtro;
    return mq && me;
  });
  const ordenadas = [...filtradas].sort((a,b) => b.id_dev - a.id_dev);
  const totalPags = Math.ceil(ordenadas.length / POR_PAG);
  const paginadas = ordenadas.slice((pagina-1)*POR_PAG, pagina*POR_PAG);

  const handleCambiarEstado = (dev, accion) => {
    const nuevoEstado = accion === 'aprobar' ? 'aprobada' : 'rechazada';
    devolucionesService.cambiarEstado(dev.id_dev, nuevoEstado);
    refresh();
    showOk(accion === 'aprobar' ? 'Devolución aprobada. Venta marcada como devuelta.' : 'Devolución rechazada. Venta recuperó estado "Vendida".');
    setConfirm(null);
  };

  const statCards = [
    { label:'Total',     value: stats.total,     color:'#1565C0', bg:'#E3F2FD' },
    { label:'Pendientes',value: stats.pendiente, color:'#F57F17', bg:'#FFF8E1' },
    { label:'Aprobadas', value: stats.aprobada,  color:'#2E7D32', bg:'#E8F5E9' },
    { label:'Rechazadas',value: stats.rechazada, color:'#C62828', bg:'#FFEBEE' },
  ];

  return (
    <Layout>
      <div className="insumos-root">
        {success && <div className="toast toast-success">✓ {success}</div>}
        {confirm && (
          <ModalConfirm dev={confirm.dev} accion={confirm.accion}
            onClose={() => setConfirm(null)}
            onConfirm={() => handleCambiarEstado(confirm.dev, confirm.accion)}/>
        )}
        {modal === 'new' && (
          <ModalRegistrar ventaPrefill={prefill} onClose={() => { setModal(null); setPrefill(null); }}
            onSave={() => { refresh(); showOk('Devolución registrada correctamente'); setModal(null); setPrefill(null); }}/>
        )}

        <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <h1 className="page-title">Devoluciones</h1>
            <p className="page-subtitle">Las devoluciones aprobadas actualizan automáticamente el estado de la venta</p>
          </div>
          <button className="btn-add" onClick={() => setModal('new')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrar devolución
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {statCards.map((s,i) => (
            <div key={i} style={{background:'white',borderRadius:12,padding:'16px 18px',borderTop:`3px solid ${s.color}`,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:12,color:'#888',marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="insumos-card">
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderBottom:'1px solid #eee',flexWrap:'wrap'}}>
            <div className="search-group" style={{flex:1,maxWidth:400}}>
              <div className="search-wrap">
                <span className="search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input className="search-input" placeholder="Buscar por cliente, motivo, ID..." value={query} onChange={e => { setQuery(e.target.value); setPagina(1); }}/>
                {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
              </div>
            </div>
            <select value={filtro} onChange={e => { setFiltro(e.target.value); setPagina(1); }}
              style={{padding:'10px 14px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,outline:'none',background:'white'}}>
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
            <span style={{fontSize:13,color:'#888',marginLeft:'auto'}}>{filtradas.length} devolución{filtradas.length!==1?'es':''}</span>
          </div>

          {paginadas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">↩️</div>
              <h3>{query||filtro!=='todos' ? 'Sin coincidencias' : 'No hay devoluciones'}</h3>
              <p>Las devoluciones registradas aparecerán aquí</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="insumos-table">
                <thead><tr><th>#</th><th>Venta</th><th>Cliente</th><th>Fecha</th><th>Tipo</th><th>Motivo</th><th>Estado dev.</th><th>Estado venta</th><th>Acciones</th></tr></thead>
                <tbody>
                  {paginadas.map(d => {
                    const v = ventasService.getById(d.id_venta);
                    const eCfg = EST_CFG[d.estado] || {};
                    const vCfg = v ? (v.estado === 'vendido' ? {bg:'#E8F5E9',color:'#2E7D32',label:'Vendida'} : {bg:'#FFEBEE',color:'#C62828',label:'Devuelta'}) : null;
                    const canAprobar  = d.estado === 'pendiente';
                    const canRechazar = d.estado === 'pendiente';
                    return (
                      <tr key={d.id_dev}>
                        <td className="td-id">{d.id_dev}</td>
                        <td><span style={{fontSize:12,fontWeight:600,color:'#888'}}>#{d.id_venta}</span></td>
                        <td>
                          <div className="td-nombre">{v?.cliente||'—'}</div>
                          {v && <div style={{fontSize:11,color:'#888'}}>{fmt(v.total)}</div>}
                        </td>
                        <td style={{fontSize:13,color:'#555'}}>
                          <div>{fmtFecha(d.fecha)}</div>
                          <div style={{fontSize:11,color:'#aaa'}}>{fmtHora(d.fecha)}</div>
                        </td>
                        <td><span className="badge-cat">{d.tipo === 'total' ? 'Total' : 'Parcial'}</span></td>
                        <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12,color:'#555'}} title={d.motivo}>{d.motivo}</td>
                        <td><span style={{background:eCfg.bg,color:eCfg.color,padding:'4px 10px',borderRadius:100,fontSize:12,fontWeight:700}}>{eCfg.ico} {eCfg.label}</span></td>
                        <td>{vCfg ? <span style={{background:vCfg.bg,color:vCfg.color,padding:'4px 10px',borderRadius:100,fontSize:12,fontWeight:700}}>{vCfg.label}</span> : '—'}</td>
                        <td>
                          <div className="actions-group">
                            {canAprobar && (
                              <button title="Aprobar" onClick={() => setConfirm({dev:d, accion:'aprobar'})}
                                style={{padding:4,background:'transparent',border:'none',cursor:'pointer',color:'#2E7D32'}}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              </button>
                            )}
                            {canRechazar && (
                              <button title="Rechazar" onClick={() => setConfirm({dev:d, accion:'rechazar'})}
                                style={{padding:4,background:'transparent',border:'none',cursor:'pointer',color:'#E53935'}}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            )}
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
}