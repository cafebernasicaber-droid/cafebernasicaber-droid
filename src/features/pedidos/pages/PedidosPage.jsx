import React, { useState } from 'react';
import Layout from '../../../shared/components/Layout';
import pedidosService from '../services/pedidosService';
import empleadosService from '../../empleados/services/empleadosService';
import clientesService from '../../clientes/services/clientesService';
import productosService from '../../productos/services/productosService';
import toppingsService from '../../toppings/services/toppingsService';
import adicionesService from '../../adiciones/services/adicionesService';
import ventasService from '../../ventas/services/ventasService';
import { ESTADO_CONFIG } from '../data/datos';
import './PedidosPage.css';

const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
const POR_PAGINA = 8;

/* ── MODAL DETALLE ── */
function ModalDetalle({ pedido, onClose }) {
  const cfg = ESTADO_CONFIG[pedido.estado] || {};
  return (
    <div className="pd-overlay" onClick={onClose}>
      <div className="pd-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="pd-modal-head">
          <div>
            <div className="pd-modal-eyebrow">Pedido</div>
            <div className="pd-modal-id">#{pedido.id}</div>
          </div>
          <span className="pd-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label || pedido.estado}</span>
        </div>
        <div className="pd-modal-grid">
          {[
            ['Cliente',        pedido.cliente      || '—', true],
            ['Tipo',           pedido.tipo === 'domicilio' ? 'A domicilio' : 'En local'],
            ['Método de pago', pedido.pago          || '—'],
            ['Hora',           pedido.hora          || '—'],
            ['Atendido por',   pedido.barista       || '—'],
            ['Domiciliario',   pedido.tipo === 'domicilio' ? (pedido.domiciliario || '—') : 'N/A'],
          ].map(([label, val, bold], i) => (
            <div className="pd-info-card" key={i}>
              <div className="pd-info-label">{label}</div>
              <div className="pd-info-val" style={bold ? { fontWeight: 700 } : {}}>{val}</div>
            </div>
          ))}
        </div>
        <div className="pd-total-card">
          <span className="pd-info-label">Total</span>
          <span className="pd-total-amt">{fmt(pedido.total)}</span>
        </div>
        <div className="pd-productos-section">
          <div className="pd-info-label" style={{ marginBottom: 10 }}>Productos</div>
          {Array.isArray(pedido.productos) && pedido.productos.length > 0
            ? pedido.productos.map((x, i) => {
                const nombre = x.nombre || (typeof x === 'string' ? x : 'Producto');
                const cant = x.cantidad || 1;
                const sub = x.precio ? x.precio * cant : null;
                return (
                  <div key={i} className={`pd-prod-row ${i % 2 === 0 ? 'pd-prod-row-alt' : ''}`}>
                    <span className="pd-prod-name">
                      {nombre}
                      {cant > 1 && <span className="pd-prod-qty-badge">x{cant}</span>}
                      {x.adiciones && x.adiciones.length > 0 && (
                        <div style={{fontSize:10,color:'#888',marginTop:2}}>{x.adiciones.map(a=>a.nombre||a).join(', ')}</div>
                      )}
                    </span>
                    {sub && <span className="pd-prod-sub">{fmt(sub)}</span>}
                  </div>
                );
              })
            : <p className="pd-no-prods">Sin productos registrados</p>
          }
          {Array.isArray(pedido.toppings) && pedido.toppings.length > 0 && (
            <>
              <div className="pd-info-label" style={{ marginTop: 12, marginBottom: 6 }}>Toppings</div>
              {pedido.toppings.map((t, i) => (
                <div key={i} className="pd-prod-row" style={{ fontSize: 12 }}>
                  <span>{t.nombre}</span>
                  <span style={{ color: t.precio > 0 ? '#F57F17' : '#2E7D32', fontWeight: 600 }}>
                    {t.precio > 0 ? `+${fmt(t.precio)}` : 'Gratis'}
                  </span>
                </div>
              ))}
            </>
          )}
          {Array.isArray(pedido.adiciones) && pedido.adiciones.length > 0 && (
            <>
              <div className="pd-info-label" style={{ marginTop: 12, marginBottom: 6 }}>Adiciones</div>
              {pedido.adiciones.map((a, i) => (
                <div key={i} className="pd-prod-row" style={{ fontSize: 12 }}>
                  <span>{a.nombre}</span>
                  <span style={{ color: '#F57F17', fontWeight: 600 }}>+{fmt(a.precio)}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="pd-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ── MODAL PERSONALIZAR ── */
function ModalPersonalizar({ producto, toppingsDisp, adicsParaProd, onAdd, onClose }) {
  const GRATIS_MAX = 2;
  const [topsSelec, setTops] = useState([]);
  const [adicsSelec, setAdics] = useState([]);

  const topsGratis = topsSelec.filter(t => t.gratuito || t.precio === 0);
  const topsPago   = topsSelec.filter(t => !t.gratuito && t.precio > 0);
  const extraToppings = topsGratis.length >= GRATIS_MAX ? topsGratis.slice(GRATIS_MAX).reduce((s,t) => s+t.precio, 0) : 0;
  const extraTotal = topsPago.reduce((s,t) => s+t.precio, 0) + adicsSelec.reduce((s,a) => s+a.precio, 0) + extraToppings;

  const toggleTop  = t => setTops(p  => p.find(x=>x.id===t.id) ? p.filter(x=>x.id!==t.id) : [...p,t]);
  const toggleAdic = a => setAdics(p => p.find(x=>x.id===a.id) ? p.filter(x=>x.id!==a.id) : [...p,a]);

  return (
    <div className="pd-overlay" onClick={onClose}>
      <div className="pd-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="pd-modal-head">
          <div>
            <div className="pd-modal-eyebrow">Personalizar</div>
            <div className="pd-modal-id" style={{ fontSize: 17 }}>{producto.nombre}</div>
          </div>
          <span style={{ fontWeight: 700, color: '#2E7D32', fontSize: 15 }}>{fmt(producto.precio + extraTotal)}</span>
        </div>
        {toppingsDisp.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="pd-info-label" style={{ marginBottom: 8 }}>
              Toppings <span style={{ fontWeight: 400, color: '#888', fontSize: 11 }}>({GRATIS_MAX} gratis, resto con costo)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {toppingsDisp.map(t => {
                const sel = topsSelec.find(x => x.id === t.id);
                const esGratis = t.gratuito || t.precio === 0;
                return (
                  <button key={t.id} onClick={() => toggleTop(t)}
                    style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${sel ? '#4CAF50' : '#ddd'}`, background: sel ? '#E8F5E9' : 'white',
                      color: sel ? '#2E7D32' : '#555', transition: 'all 0.15s' }}>
                    {t.nombre}{' '}
                    {esGratis
                      ? <span style={{ color: '#2E7D32' }}>· Gratis</span>
                      : <span style={{ color: '#F57F17' }}>· +{fmt(t.precio)}</span>}
                    {sel && <span style={{ marginLeft: 4 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {adicsParaProd.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="pd-info-label" style={{ marginBottom: 8 }}>Adiciones</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {adicsParaProd.map(a => {
                const sel = adicsSelec.find(x => x.id === a.id);
                return (
                  <button key={a.id} onClick={() => toggleAdic(a)}
                    style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${sel ? '#FF9800' : '#ddd'}`, background: sel ? '#FFF3E0' : 'white',
                      color: sel ? '#E65100' : '#555', transition: 'all 0.15s' }}>
                    {a.nombre} · <span style={{ color: '#E65100' }}>+{fmt(a.precio)}</span>
                    {sel && <span style={{ marginLeft: 4 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {extraTotal > 0 && (
          <div style={{ background: '#FFF8E1', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#E65100', marginBottom: 12 }}>
            Extras: <strong>+{fmt(extraTotal)}</strong>
          </div>
        )}
        <div className="pd-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-confirm-primary" onClick={() => { onAdd({ ...producto, toppings: topsSelec, adiciones: adicsSelec, extraTotal }); onClose(); }}>
            Agregar · {fmt(producto.precio + extraTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MODAL NUEVO PEDIDO ── */
function ModalPedido({ onClose, onSave }) {
  const empleados      = empleadosService.getAll().filter(e => e.activo);
  const atienden       = empleados.filter(e => e.cargo !== 'Domiciliario');
  const domis          = empleados.filter(e => e.cargo === 'Domiciliario');
  const clientesLista  = clientesService.getAll().filter(c => c.estado !== false);
  const PRODUCTOS_MENU = productosService.getActivos();
  const cats = ['Todos', ...new Set(PRODUCTOS_MENU.map(p => p.categoria))];

  const [f, setF]               = useState({ cliente: '', tipo: 'local', pago: 'efectivo', productos: [], barista: '', domiciliario: '' });
  const [cat, setCat]            = useState('Todos');
  const [busquedaProd, setBusquedaProd] = useState('');
  const [prodSel, setProdSel]    = useState(null);
  const [adicsSelec, setAdicsSelec] = useState([]);
  const [cantSel, setCantSel]    = useState(1);

  // Adiciones filtradas por la categoría del producto seleccionado
  const adicsParaProd = prodSel ? adicionesService.getByCategoria(prodSel.categoria) : [];

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const getCant = id => (f.productos.find(x => x.id === id) || {}).cantidad || 0;

  const seleccionarProd = (prod) => {
    const enCart = null; // Each product added independently
    setProdSel(prod);
    setAdicsSelec(enCart?.adiciones || []);
    setCantSel(enCart?.cantidad || 1);
  };

  const toggleAdic = (a) => {
    setAdicsSelec(prev => prev.find(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a]);
  };

  const confirmarAgregar = () => {
    const extraTotal = adicsSelec.reduce((s, a) => s + a.precio, 0);
    const precioTotal = prodSel.precio + extraTotal;
    const cartKey = `${prodSel.id}-${Date.now()}`;
    const item = { ...prodSel, adiciones: adicsSelec, precioTotal, cantidad: cantSel, _cartKey: cartKey };
    const existe = f.productos.find(x => x.id === prodSel.id);
    if (existe) {
      set('productos', f.productos.map(x => x.id === prodSel.id ? item : x));
    } else {
      set('productos', [...f.productos, item]);
    }
    setProdSel(null);
    setAdicsSelec([]);
    setCantSel(1);
  };

  const removeProd = id => set('productos', f.productos.filter(x => x.id !== id));
  const cambiarCant = (id, delta) => {
    const nueva = (getCant(id) || 0) + delta;
    if (nueva <= 0) removeProd(id);
    else set('productos', f.productos.map(x => x.id === id ? { ...x, cantidad: nueva } : x));
  };

  const prods = (() => {
    let list = cat === 'Todos' ? PRODUCTOS_MENU : PRODUCTOS_MENU.filter(p => p.categoria === cat);
    if (busquedaProd.trim()) list = list.filter(p => p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()));
    return list;
  })();

  const total = f.productos.reduce((s, p) => s + (p.precioTotal || p.precio) * (p.cantidad || 1), 0);

  const crear = () => {
    if (!f.cliente)              { alert('Selecciona un cliente'); return; }
    if (!f.productos.length)     { alert('Selecciona al menos un producto'); return; }
    if (!f.barista)              { alert('Selecciona quién atiende el pedido'); return; }
    if (f.tipo === 'domicilio' && !f.domiciliario) { alert('Selecciona un domiciliario'); return; }
    if (f.tipo === 'domicilio') {
      const confirmado = window.confirm('⚠️ Recuerda que por el momento nuestro servicio a domicilio solo cubre la comuna 8 y 9 de Medellín.\n\n¿Deseas continuar con el pedido?');
      if (!confirmado) return;
    }
    onSave({
      ...f, total,
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      estado: 'pendiente',
    });
  };

  return (
    <>
      <div className="pd-overlay" onClick={onClose}>
        <div className="pd-modal pd-modal-wide" onClick={e => e.stopPropagation()}>
          <div className="pd-modal-head">
            <div>
              <div className="pd-modal-eyebrow">Nuevo pedido</div>
              <div className="pd-modal-id" style={{ fontSize: 18 }}>Completa los datos</div>
            </div>
          </div>

          <div className="pd-form-row">
            <div className="pd-form-group">
              <label>Cliente *</label>
              {clientesLista.length === 0 ? (
                <p className="pd-hint" style={{color:'#E65100',fontSize:12}}>No hay clientes registrados.</p>
              ) : (
                <select value={f.cliente} onChange={e => set('cliente', e.target.value)}>
                  <option value="">Seleccionar cliente...</option>
                  {clientesLista.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre} — {c.correo}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="pd-form-group">
              <label>Método de pago</label>
              <select value={f.pago} onChange={e => set('pago', e.target.value)}>
                {['efectivo','tarjeta','nequi','daviplata','transferencia'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="pd-form-group">
            <label>Tipo de entrega</label>
            <div className="pd-tipo-selector">
              {[{ val:'local', lbl:'En el Local', ic:'🏠' }, { val:'domicilio', lbl:'A Domicilio', ic:'🛵' }].map(t => (
                <div key={t.val} className={`pd-tipo-option ${f.tipo === t.val ? 'pd-tipo-selected' : ''}`} onClick={() => set('tipo', t.val)}>
                  <span>{t.ic}</span><span>{t.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pd-personal-section">
            <div className="pd-personal-title">Personal asignado</div>
            <div className="pd-personal-cols">
              <div className="pd-personal-col">
                <label>Atendido por *</label>
                {atienden.length === 0 ? <p className="pd-hint">Sin trabajadores activos</p> : (
                  <div className="pd-worker-grid">
                    {atienden.map(e => (
                      <div key={e.id} className={`pd-worker-card ${f.barista === e.nombre ? 'pd-worker-sel' : ''}`} onClick={() => set('barista', e.nombre)}>
                        <div className="pd-worker-av">{e.nombre.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                        <div className="pd-worker-name">{e.nombre.split(' ')[0]}</div>
                        <div className="pd-worker-cargo">{e.cargo}</div>
                        {f.barista === e.nombre && <div className="pd-worker-check">✓</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {f.tipo === 'domicilio' && (
                <div className="pd-personal-col">
                  <label>Domiciliario *</label>
                  {domis.length === 0 ? (
                    <div className="pd-domi-empty"><span>🛵</span><span>Sin domiciliarios activos.</span></div>
                  ) : (
                    <div className="pd-worker-grid">
                      {domis.map(e => (
                        <div key={e.id} className={`pd-worker-card pd-domi-card ${f.domiciliario === e.nombre ? 'pd-worker-sel' : ''}`} onClick={() => set('domiciliario', e.nombre)}>
                          <div className="pd-worker-av pd-domi-av">{e.nombre.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                          <div className="pd-worker-name">{e.nombre.split(' ')[0]}</div>
                          <div className="pd-worker-cargo">🛵</div>
                          {f.domiciliario === e.nombre && <div className="pd-worker-check">✓</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pd-form-group">
            <label>Productos del menú</label>
            <div className="pd-prod-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="pd-prod-search-input"
                placeholder="Buscar producto..."
                value={busquedaProd}
                onChange={e => setBusquedaProd(e.target.value)}
              />
              {busquedaProd && <button className="pd-prod-search-clear" onClick={() => setBusquedaProd('')}>✕</button>}
            </div>
            <div className="pd-cats">
              {cats.map(c => <button key={c} className={`pd-cat-btn ${cat === c ? 'pd-cat-on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
            </div>
            <div className="pd-prod-grid-v2">
              {prods.length === 0 ? (
                <div className="pd-prod-grid-v2__empty">
                  Sin productos{busquedaProd ? ` para "${busquedaProd}"` : ''}
                </div>
              ) : prods.map(p => {
                const cant = getCant(p.id);
                const activo = prodSel?.id === p.id;
                return (
                  <div key={p.id}
                    className={`pd-prod-card-v2${cant > 0 ? ' pd-prod-card-v2--sel' : ''}${activo ? ' pd-prod-card-v2--active' : ''}`}
                    onClick={() => seleccionarProd(p)}>
                    {cant > 0 && <div className="pd-prod-card-v2__badge">{cant}</div>}
                    <div className="pd-prod-card-v2__body">
                      <div className="pd-prod-card-v2__cat">{p.categoria}</div>
                      <div className="pd-prod-card-v2__name">{p.nombre}</div>
                      <div className="pd-prod-card-v2__price">{fmt(p.precio)}</div>
                    </div>
                    <div className="pd-prod-card-v2__add-btn">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {prodSel && (
              <div className="pd-add-panel">
                <div className="pd-add-panel__head">
                  <div>
                    <div className="pd-add-panel__prod-name">{prodSel.nombre}</div>
                    <div className="pd-add-panel__prod-price">Precio base: {fmt(prodSel.precio)}</div>
                  </div>
                  <button className="pd-add-panel__close" onClick={() => { setProdSel(null); setAdicsSelec([]); setCantSel(1); }}>✕</button>
                </div>

                {adicsParaProd.length > 0 ? (
                  <div className="pd-add-panel__section">
                    <div className="pd-add-panel__label">Adiciones disponibles</div>
                    <div className="pd-add-chips">
                      {adicsParaProd.map(a => {
                        const sel = adicsSelec.find(x => x.id === a.id);
                        return (
                          <button key={a.id} onClick={() => toggleAdic(a)}
                            className={`pd-add-chip${sel ? ' pd-add-chip--sel' : ''}`}>
                            {a.nombre}
                            <span className="pd-add-chip__price"> +{fmt(a.precio)}</span>
                            {sel && <span className="pd-add-chip__check"> ✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="pd-add-panel__empty">No hay adiciones disponibles.</p>
                )}

                <div className="pd-add-panel__footer">
                  <div className="pd-add-panel__qty">
                    <span className="pd-add-panel__label">Cantidad</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <button className="pd-sel-qty-btn" onClick={() => setCantSel(c => Math.max(1, c - 1))}>−</button>
                      <span style={{ fontWeight:700, minWidth:20, textAlign:'center', fontSize:14 }}>{cantSel}</span>
                      <button className="pd-sel-qty-btn" onClick={() => setCantSel(c => c + 1)}>+</button>
                    </div>
                  </div>
                  <div className="pd-add-panel__total">
                    Total: <strong>{fmt((prodSel.precio + adicsSelec.reduce((s, a) => s + a.precio, 0)) * cantSel)}</strong>
                  </div>
                  <div className="pd-add-panel__actions">
                    <button className="btn-cancel" onClick={() => { setProdSel(null); setAdicsSelec([]); setCantSel(1); }}>Cancelar</button>
                    <button className="btn-confirm-primary" onClick={confirmarAgregar}>Agregar al pedido</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {f.productos.length > 0 && (
            <div className="pd-form-group">
              <label>Seleccionados ({f.productos.length})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {f.productos.map(p => (
                  <div key={p.id} className="pd-sel-item">
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{p.nombre}</div>
                      {p.adiciones?.length > 0 && (
                        <div className="pd-sel-item__adics">
                          + {p.adiciones.map(a => a.nombre).join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <button onClick={() => cambiarCant(p.id, -1)} className="pd-sel-qty-btn">−</button>
                        <span style={{ fontWeight:700, minWidth:18, textAlign:'center', fontSize:13 }}>{p.cantidad}</span>
                        <button onClick={() => cambiarCant(p.id, +1)} className="pd-sel-qty-btn">+</button>
                      </div>
                      <span style={{ fontWeight:700, color:'#2E7D32', minWidth:64, textAlign:'right', fontSize:13 }}>{fmt((p.precioTotal || p.precio) * p.cantidad)}</span>
                      <button onClick={() => removeProd(p.id)} style={{ background:'none', border:'none', color:'#E53935', cursor:'pointer', fontSize:18, lineHeight:1, padding:0 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {f.productos.length > 0 && (
            <div className="pd-resumen">
              <span>{f.productos.length} producto{f.productos.length !== 1 ? 's' : ''}</span>
              <strong>Total: {fmt(total)}</strong>
            </div>
          )}

          <div className="pd-modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button className="btn-confirm-primary" onClick={crear}>Crear pedido</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── MAIN PAGE ── */
export default function PedidosPage() {
  const [pedidos, setPedidos]   = useState(() => pedidosService.getAll());
  const [modal, setModal]       = useState(false);
  const [detalle, setDetalle]   = useState(null);
  const [deleteTarget, setDel]  = useState(null);
  const [buscar, setBuscar]     = useState('');
  const [pagina, setPagina]     = useState(1);
  const [success, setSuccess]   = useState('');

  const refresh = () => setPedidos(pedidosService.getAll());
  const showOk  = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const guardar = f => { pedidosService.create(f); refresh(); setModal(false); setPagina(1); showOk('Pedido creado correctamente'); };
  const cambiarEstado = (id, nuevoEstado) => {
    const pedidoActual = pedidosService.getById(id);
    // Pedidos listo/entregado solo pueden pasar entre esos dos estados
    if (pedidoActual && (pedidoActual.estado === 'listo' || pedidoActual.estado === 'entregado')) {
      if (nuevoEstado !== 'listo' && nuevoEstado !== 'entregado') return;
    }
    pedidosService.cambiarEstado(id, nuevoEstado);
    // Auto-crear venta cuando el pedido pasa a "listo" (primera vez)
    if (nuevoEstado === 'listo') {
      const pedido = pedidosService.getById(id);
      const ventasExistentes = ventasService.getAll().map(v => v.id_pedido);
      if (pedido && !ventasExistentes.includes(pedido.id)) {
        ventasService.crearDesde(pedido);
      }
    }
    refresh();
  };
  const handleDelete = () => { pedidosService.remove(deleteTarget.id); refresh(); showOk(`Pedido #${deleteTarget.id} eliminado`); setDel(null); };

  const stats     = pedidosService.getStats();
  const filtrados = buscar.trim() ? pedidosService.search(buscar) : pedidosService.getAll();
  const ordenados = [...filtrados].sort((a,b) => Number(b.id) - Number(a.id));
  const totalPags = Math.ceil(ordenados.length / POR_PAGINA);
  const paginados = ordenados.slice((pagina-1)*POR_PAGINA, pagina*POR_PAGINA);

  const statCards = [
    { label:'Total pedidos',  value:stats.total,     color:'#6D4C41', bg:'#EFEBE9' },
    { label:'Pendientes',     value:stats.pendiente, color:'#F57F17', bg:'#FFF8E1' },
    { label:'En proceso',     value:stats.proceso,   color:'#1565C0', bg:'#E3F2FD' },
    { label:'Ventas del día', value:fmt(stats.ventas), color:'#2E7D32', bg:'#E8F5E9', big:true },
  ];

  return (
    <Layout>
      <div className="pd-root">
        {success && <div className="toast toast-success">✓ {success}</div>}
        {modal   && <ModalPedido   onClose={() => setModal(false)} onSave={guardar} />}
        {detalle && <ModalDetalle  onClose={() => setDetalle(null)} pedido={detalle} />}

        <div className="page-header">
          <div>
            <h1 className="page-title">Gestión de Pedidos</h1>
            <p className="page-subtitle">Control de pedidos en tiempo real</p>
          </div>
          <button className="btn-add" onClick={() => setModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo pedido
          </button>
        </div>

        <div className="pd-stats">
          {statCards.map((s,i) => (
            <div className="pd-stat" key={i} style={{ borderTop:`3px solid ${s.color}` }}>
              <div className="pd-stat-label">{s.label}</div>
              <div className="pd-stat-value" style={{ color:s.color, fontSize:s.big?'18px':'28px' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="insumos-card">
          <div className="pd-toolbar">
            <div className="search-group">
              <div className="search-wrap">
                <span className="search-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input className="search-input" placeholder="Buscar cliente o producto..." value={buscar} onChange={e => { setBuscar(e.target.value); setPagina(1); }} />
                {buscar && <button className="search-clear" onClick={() => setBuscar('')}>✕</button>}
              </div>
            </div>
            <span style={{ fontSize:13, color:'#888', marginLeft:'auto' }}>{filtrados.length} pedido{filtrados.length!==1?'s':''}</span>
          </div>

          {paginados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              </div>
              <h3>{buscar ? 'Sin coincidencias' : 'No hay pedidos'}</h3>
              <p>{buscar ? `Sin resultados para "${buscar}"` : 'Crea el primer pedido del día'}</p>
              {!buscar && <button className="btn-add" onClick={() => setModal(true)}>Nuevo pedido</button>}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="insumos-table">
                <thead>
                  <tr><th>#</th><th>Cliente</th><th>Tipo</th><th>Atendido por</th><th>Domiciliario</th><th>Productos</th><th>Total</th><th>Hora</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {paginados.map(p => {
                    const prods = Array.isArray(p.productos) ? p.productos : [];
                    const vis   = prods.slice(0,2).map(x=>`${x.nombre||x}${x.cantidad>1?` x${x.cantidad}`:''}`).join(', ');
                    const extra = prods.length - 2;
                    const cfg   = ESTADO_CONFIG[p.estado] || {};
                    return (
                      <tr key={p.id}>
                        <td className="td-id">#{p.id}</td>
                        <td className="td-nombre">{p.cliente}</td>
                        <td>
                          <span className={`badge-cat ${p.tipo==='domicilio'?'pd-badge-domi':'pd-badge-local'}`}>
                            {p.tipo==='domicilio'?'🛵 Domicilio':'🏠 Local'}
                          </span>
                        </td>
                        <td>{p.barista ? <span className="pd-pill-barista">{p.barista}</span> : <span style={{color:'#aaa'}}>—</span>}</td>
                        <td>{p.tipo==='domicilio' ? (p.domiciliario ? <span className="pd-pill-domi">🛵 {p.domiciliario}</span> : <span style={{color:'#aaa'}}>—</span>) : <span style={{color:'#ccc'}}>N/A</span>}</td>
                        <td style={{ fontSize:12, color:'#666', maxWidth:180 }}>
                          {vis}
                          <button className="btn-ver-mas" onClick={() => setDetalle(p)} style={{ marginLeft:4 }}>
                            {extra > 0 ? `+${extra} más` : 'ver'}
                          </button>
                        </td>
                        <td style={{ fontWeight:700, color:'#2E7D32', fontSize:13 }}>{fmt(p.total)}</td>
                        <td style={{ fontSize:12, color:'#888' }}>{p.hora}</td>
                        <td>
                          {(p.estado === 'listo' || p.estado === 'entregado') ? (
                            <select className="pd-estado-select" value={p.estado}
                              style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.color+'55' }}
                              onChange={e => cambiarEstado(p.id, e.target.value)}>
                              <option value="listo">{ESTADO_CONFIG.listo.label}</option>
                              <option value="entregado">{ESTADO_CONFIG.entregado.label}</option>
                            </select>
                          ) : (
                            <select className="pd-estado-select" value={p.estado}
                              style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.color+'55' }}
                              onChange={e => cambiarEstado(p.id, e.target.value)}>
                              {Object.entries(ESTADO_CONFIG).filter(([k]) => k !== 'entregado').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          )}
                        </td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-ver" title="Ver detalle" onClick={() => setDetalle(p)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            {p.estado !== 'listo' && p.estado !== 'entregado' && (
                              <button className="btn-anular" title="Anular" onClick={() => setDel(p)}>
                                ✕ Anular
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

          {totalPags > 1 && (
            <div className="pd-paginacion">
              <button className="btn-cancel" disabled={pagina===1} onClick={() => setPagina(p=>Math.max(1,p-1))}>Anterior</button>
              {Array.from({length:totalPags},(_,i)=>i+1).map(n => (
                <button key={n} className={n===pagina?'btn-confirm-primary':'btn-cancel'} style={{padding:'6px 14px'}} onClick={() => setPagina(n)}>{n}</button>
              ))}
              <button className="btn-cancel" disabled={pagina===totalPags} onClick={() => setPagina(p=>Math.min(totalPags,p+1))}>Siguiente</button>
              <span style={{fontSize:12,color:'#888',marginLeft:8}}>{ordenados.length} registros · Pág {pagina}/{totalPags}</span>
            </div>
          )}
        </div>

        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDel(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </div>
              <h3>¿Anular pedido?</h3>
              <p>Esta acción es <strong>permanente</strong>.</p>
              <div className="modal-detail">Pedido #{deleteTarget.id} — {deleteTarget.cliente}</div>
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