// ─────────────────────────────────────────────────────────────
//  src/features/cajero/pages/CajeroPage.jsx
//  REEMPLAZA el archivo existente.
//
//  Cambios:
//  ✅ Módulo de CREAR PEDIDOS desde la vista del cajero
//  ✅ Los pedidos creados aparecen en admin y bartender
//  ✅ Gestión de pedidos existentes (estado + cobro)
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import pedidosService   from '../../pedidos/services/pedidosService';
import productosService from '../../productos/services/productosService';
import adicionesService from '../../adiciones/services/adicionesService';
import './CajeroPage.css';

const fmt = n =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

const STATUS_CFG = {
  pendiente:      { label: 'Pendiente',      color: '#FFB300', bg: '#FFF8E1' },
  en_preparacion: { label: 'En preparación', color: '#42A5F5', bg: '#E3F2FD' },
  en_proceso:     { label: 'En proceso',     color: '#42A5F5', bg: '#E3F2FD' },
  listo:          { label: 'Listo ✓',        color: '#4CAF50', bg: '#E8F5E9' },
  entregado:      { label: 'Entregado',      color: '#7E57C2', bg: '#EDE7F6' },
  pagado:         { label: 'Pagado',         color: '#7E57C2', bg: '#EDE7F6' },
  cancelado:      { label: 'Cancelado',      color: '#EF5350', bg: '#FFEBEE' },
};

const FILTERS    = ['all', 'pendiente', 'en_preparacion', 'listo', 'pagado'];
const METODOS    = ['Efectivo', 'Tarjeta', 'Nequi / Daviplata', 'Transferencia'];
const PAGE_SIZE  = 6;
const TABS       = ['pedidos', 'nuevo'];

// ════════════════════════════════════════════════════════════
//  TARJETA DE PEDIDO
// ════════════════════════════════════════════════════════════
function OrderCard({ order, onStatus, onPay }) {
  const cfg    = STATUS_CFG[order.estado] || STATUS_CFG.pendiente;
  const canPay = order.estado === 'listo' || order.estado === 'entregado';
  const prods  = order.productos || order.items || [];

  return (
    <div className="cj-card">
      <div className="cj-card__accent" style={{ background: cfg.color }}/>
      <div className="cj-card__head">
        <div>
          <div className="cj-card__num">Pedido #{order.id}</div>
          <div className="cj-card__client">{order.cliente || '—'}</div>
        </div>
        <span className="cj-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
      </div>
      <div className="cj-card__items">
        {prods.slice(0, 4).map((it, i) => (
          <div key={i} className="cj-card__item">
            <span className="cj-card__qty">{it.cantidad || it.qty || 1}×</span>
            <span className="cj-card__name">{it.nombre || it.name}</span>
            <span className="cj-card__price">{fmt((it.precio || 0) * (it.cantidad || 1))}</span>
          </div>
        ))}
        {prods.length > 4 && <div className="cj-card__more">+{prods.length - 4} más</div>}
      </div>
      <div className="cj-card__foot">
        <span className="cj-card__meta">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {order.hora || (order.fechaCreacion ? new Date(order.fechaCreacion).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}) : '—')}
        </span>
        <span className="cj-card__total">{fmt(order.total)}</span>
      </div>
      <div className="cj-card__actions">
        <button className="cj-btn cj-btn--ghost" onClick={() => onStatus(order)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Estado
        </button>
        <button
          className={`cj-btn ${canPay ? 'cj-btn--primary' : 'cj-btn--disabled'}`}
          onClick={() => canPay && onPay(order)}
          disabled={!canPay}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
          </svg>
          {canPay ? 'Cobrar' : 'Pago'}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MODAL DE ESTADO
// ════════════════════════════════════════════════════════════
function StatusModal({ order, onClose, onSave }) {
  const [sel, setSel] = useState(order?.estado || 'pendiente');
  useEffect(() => { if (order) setSel(order.estado); }, [order]);
  if (!order) return null;
  const opts = ['pendiente','en_preparacion','listo','entregado','cancelado'];
  return (
    <div className="cj-modal-mask" onClick={onClose}>
      <div className="cj-modal" onClick={e => e.stopPropagation()}>
        <div className="cj-modal__head">
          <div><h3>Actualizar Estado</h3><p>Pedido #{order.id} · {order.cliente}</p></div>
          <button className="cj-modal__x" onClick={onClose}>✕</button>
        </div>
        <div className="cj-modal__body">
          <div className="cj-status-options">
            {opts.map(s => {
              const cfg = STATUS_CFG[s];
              return (
                <div key={s} className={`cj-status-opt ${sel===s?'selected':''}`}
                  onClick={() => setSel(s)}
                  style={sel===s?{borderColor:cfg.color,background:cfg.bg}:{}}>
                  <span className="cj-status-dot" style={{background:cfg.color}}/>
                  {cfg.label}
                  {sel===s && <span className="cj-status-check">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="cj-modal__foot">
          <button className="cj-btn cj-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="cj-btn cj-btn--primary" onClick={() => { onSave(sel); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MODAL DE PAGO
// ════════════════════════════════════════════════════════════
function PayModal({ order, onClose, onConfirm }) {
  const [method, setMethod] = useState(null);
  useEffect(() => { setMethod(null); }, [order]);
  if (!order) return null;
  return (
    <div className="cj-modal-mask" onClick={onClose}>
      <div className="cj-modal" onClick={e => e.stopPropagation()}>
        <div className="cj-modal__head">
          <div><h3>Confirmar Pago</h3><p>Pedido #{order.id} · {order.cliente}</p></div>
          <button className="cj-modal__x" onClick={onClose}>✕</button>
        </div>
        <div className="cj-modal__body">
          <div className="cj-pay-total">
            <span>Total a cobrar</span><strong>{fmt(order.total)}</strong>
          </div>
          <p className="cj-pay-label">Método de pago</p>
          <div className="cj-pay-methods">
            {METODOS.map(m => (
              <div key={m} className={`cj-pay-method ${method===m?'selected':''}`} onClick={() => setMethod(m)}>
                {m}{method===m && <span className="cj-status-check">✓</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="cj-modal__foot">
          <button className="cj-btn cj-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="cj-btn cj-btn--primary" disabled={!method} onClick={() => method && onConfirm(method)}>
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MÓDULO: NUEVO PEDIDO
// ════════════════════════════════════════════════════════════
function NuevoPedido({ onCreated, showToast }) {
  const productos    = useMemo(() => productosService.getActivos(), []);
  const categorias   = useMemo(() => ['Todas', ...new Set(productos.map(p => p.categoria))], [productos]);

  const [catSel, setCatSel]     = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito]   = useState([]);  // [{ producto, cantidad, adiciones }]
  const [cliente, setCliente]   = useState('');
  const [notas, setNotas]       = useState('');
  const [saving, setSaving]     = useState(false);

  // Panel de adiciones
  const [prodSel, setProdSel]       = useState(null);
  const [adicsSelec, setAdicsSelec] = useState([]);
  const [cantSel, setCantSel]       = useState(1);

  // Adiciones disponibles para el producto seleccionado (filtradas por categoría)
  const adicsParaProd = useMemo(
    () => prodSel ? adicionesService.getByCategoria(prodSel.categoria) : [],
    [prodSel]
  );

  const filtrados = useMemo(() => {
    let p = catSel === 'Todas' ? productos : productos.filter(x => x.categoria === catSel);
    if (busqueda.trim()) p = p.filter(x => x.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    return p;
  }, [productos, catSel, busqueda]);

  const itemPrecio = item => item.producto.precio + (item.adiciones || []).reduce((s, a) => s + a.precio, 0);
  const total = carrito.reduce((s, i) => s + itemPrecio(i) * i.cantidad, 0);

  const seleccionarProd = prod => {
    const enCart = carrito.find(i => i.producto.id === prod.id);
    setProdSel(prod);
    setAdicsSelec(enCart?.adiciones || []);
    setCantSel(enCart?.cantidad || 1);
  };

  const toggleAdic = a => {
    setAdicsSelec(prev => prev.find(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a]);
  };

  const confirmarAgregar = () => {
    const cartKey = `${prodSel.id}-${Date.now()}`;
    const item = { producto: prodSel, adiciones: adicsSelec, cantidad: cantSel, _cartKey: cartKey };
    // Each item is independent — always add as new entry
    setCarrito(prev => [...prev, item]);
    setProdSel(null);
    setAdicsSelec([]);
    setCantSel(1);
  };

  const cerrarPanel = () => { setProdSel(null); setAdicsSelec([]); setCantSel(1); };

  const removeFromCart = cartKey => setCarrito(prev => prev.filter(i => i._cartKey !== cartKey));

  const changeQty = (id, delta) => {
    setCarrito(prev =>
      prev.map(i => i._cartKey===id ? {...i, cantidad: Math.max(1, i.cantidad+delta)} : i)
    );
  };

  const handleCrear = () => {
    if (carrito.length === 0) { showToast('Agrega al menos un producto'); return; }
    setSaving(true);
    const nuevoPedido = {
      cliente:   cliente.trim() || 'Cliente mostrador',
      productos: carrito.map(i => ({
        id:         i.producto.id,
        nombre:     i.producto.nombre,
        precio:     i.producto.precio,
        adiciones:  i.adiciones || [],
        precioTotal: itemPrecio(i),
        cantidad:   i.cantidad,
      })),
      total,
      notas:  notas.trim() || null,
      estado: 'pendiente',
      origen: 'cajero',
      hora:   new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }),
      tipo:   'mostrador',
    };
    setTimeout(() => {
      pedidosService.create(nuevoPedido);
      showToast(`✓ Pedido creado — ${fmt(total)}`);
      setCarrito([]);
      setCliente('');
      setNotas('');
      setSaving(false);
      onCreated();
    }, 400);
  };

  return (
    <div className="cj-nuevo">

      {/* ── Panel izquierdo: catálogo ── */}
      <div className="cj-nuevo__catalog">
        <div className="cj-nuevo__search-row">
          <div className="cj-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="cj-search-input"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && <button className="cj-search-clear" onClick={() => setBusqueda('')}>✕</button>}
          </div>
        </div>

        {/* Chips de categoría */}
        <div className="cj-cat-chips">
          {categorias.map(c => (
            <button
              key={c}
              className={`cj-cat-chip ${catSel===c?'cj-cat-chip--on':''}`}
              onClick={() => setCatSel(c)}
            >{c}</button>
          ))}
        </div>

        {/* Grid de productos */}
        <div className="cj-prod-grid">
          {filtrados.length === 0 ? (
            <div className="cj-prod-empty">Sin productos</div>
          ) : filtrados.map(prod => {
            const enCart = carrito.find(i => i.producto.id === prod.id);
            const activo = prodSel?.id === prod.id;
            return (
              <div key={prod.id}
                className={`cj-prod-card ${enCart?'cj-prod-card--in-cart':''} ${activo?'cj-prod-card--active':''}`}
                onClick={() => seleccionarProd(prod)}>
                <div className="cj-prod-card__img">
                  {prod.imagen && !prod.imagen.startsWith('PEGAR') ? (
                    <img src={prod.imagen} alt={prod.nombre} onError={e => e.target.style.display='none'}/>
                  ) : (
                    <span>☕</span>
                  )}
                  {enCart && (
                    <div className="cj-prod-card__qty-badge">{enCart.cantidad}</div>
                  )}
                </div>
                <div className="cj-prod-card__body">
                  <div className="cj-prod-card__cat">{prod.categoria}</div>
                  <div className="cj-prod-card__name">{prod.nombre}</div>
                  <div className="cj-prod-card__price">{fmt(prod.precio)}</div>
                </div>
                <button className="cj-prod-card__add">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Panel de adiciones — aparece al seleccionar un producto */}
        {prodSel && (
          <div className="cj-add-panel">
            <div className="cj-add-panel__head">
              <div>
                <div className="cj-add-panel__prod-name">{prodSel.nombre}</div>
                <div className="cj-add-panel__prod-price">Base: {fmt(prodSel.precio)}</div>
              </div>
              <button className="cj-add-panel__close" onClick={cerrarPanel}>✕</button>
            </div>

            {adicsParaProd.length > 0 ? (
              <div className="cj-add-panel__section">
                <div className="cj-add-panel__label">Adiciones disponibles</div>
                <div className="cj-add-chips">
                  {adicsParaProd.map(a => {
                    const sel = adicsSelec.find(x => x.id === a.id);
                    return (
                      <button key={a.id} onClick={() => toggleAdic(a)}
                        className={`cj-add-chip${sel ? ' cj-add-chip--sel' : ''}`}>
                        {a.nombre}
                        <span className="cj-add-chip__price"> +{fmt(a.precio)}</span>
                        {sel && <span> ✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="cj-add-panel__empty">Sin adiciones para esta categoría.</p>
            )}

            <div className="cj-add-panel__footer">
              <div className="cj-add-panel__qty">
                <span className="cj-add-panel__label">Cantidad</span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button className="cj-qty-btn" onClick={() => setCantSel(c => Math.max(1, c - 1))}>−</button>
                  <span className="cj-qty-val">{cantSel}</span>
                  <button className="cj-qty-btn" onClick={() => setCantSel(c => c + 1)}>+</button>
                </div>
              </div>
              <div className="cj-add-panel__total">
                Total: <strong>{fmt((prodSel.precio + adicsSelec.reduce((s, a) => s + a.precio, 0)) * cantSel)}</strong>
              </div>
              <div className="cj-add-panel__actions">
                <button className="cj-btn cj-btn--ghost" onClick={cerrarPanel}>Cancelar</button>
                <button className="cj-btn cj-btn--primary" onClick={confirmarAgregar}>
                  Agregar al pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel derecho: carrito ── */}
      <div className="cj-nuevo__cart">
        <div className="cj-cart__head">
          <h3>Carrito</h3>
          <span className="cj-cart__count">{carrito.reduce((s,i) => s+i.cantidad, 0)} ítem{carrito.length!==1?'s':''}</span>
        </div>

        {/* Info del cliente */}
        <div className="cj-cart__field">
          <label>Nombre del cliente <span style={{color:'#aaa',fontWeight:400}}>(opcional)</span></label>
          <input
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            placeholder="Ej: Juan / Mesa 3 / Domicilio"
          />
        </div>

        {/* Items del carrito */}
        <div className="cj-cart__items">
          {carrito.length === 0 ? (
            <div className="cj-cart__empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
              <p>Selecciona productos del catálogo</p>
            </div>
          ) : carrito.map(item => (
            <div key={item._cartKey || item.producto.id} className="cj-cart__item">
              <div className="cj-cart__item-info">
                <div className="cj-cart__item-name">{item.producto.nombre}</div>
                {item.adiciones && item.adiciones.length > 0 && (
                  <div style={{fontSize:10,color:'#888',marginTop:1}}>{item.adiciones.map(a=>a.nombre).join(', ')}</div>
                )}
                <div className="cj-cart__item-price">{fmt(itemPrecio(item))} c/u</div>
                {item.adiciones?.length > 0 && (
                  <div className="cj-cart__item-adics">
                    + {item.adiciones.map(a => a.nombre).join(', ')}
                  </div>
                )}
              </div>
              <div className="cj-cart__item-ctrl">
                <button className="cj-qty-btn" onClick={() => changeQty(item._cartKey || item.producto.id, -1)}>−</button>
                <span className="cj-qty-val">{item.cantidad}</span>
                <button className="cj-qty-btn" onClick={() => changeQty(item._cartKey || item.producto.id, +1)}>+</button>
              </div>
              <div className="cj-cart__item-sub">{fmt(itemPrecio(item) * item.cantidad)}</div>
              <button className="cj-cart__item-del" onClick={() => removeFromCart(item._cartKey || item.producto.id)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Notas */}
        {carrito.length > 0 && (
          <div className="cj-cart__field">
            <label>Nota para el bartender <span style={{color:'#aaa',fontWeight:400}}>(opcional)</span></label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Sin azúcar, extra caliente..."
              rows={2}
            />
          </div>
        )}

        {/* Total y botón */}
        <div className="cj-cart__foot">
          {carrito.length > 0 && (
            <div className="cj-cart__total-row">
              <span>Total</span>
              <strong>{fmt(total)}</strong>
            </div>
          )}
          <button
            className="cj-btn cj-btn--primary cj-btn--full"
            onClick={handleCrear}
            disabled={carrito.length === 0 || saving}
          >
            {saving ? 'Creando pedido...' : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Crear pedido · {fmt(total)}
              </>
            )}
          </button>
          {carrito.length > 0 && (
            <button className="cj-btn cj-btn--ghost cj-btn--full" onClick={() => setCarrito([])}>
              Limpiar carrito
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function CajeroPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [tab, setTab]           = useState('pedidos');
  const [orders, setOrders]     = useState(() => pedidosService.getAll());
  const [filter, setFilter]     = useState('all');
  const [page, setPage]         = useState(1);
  const [statusOrder, setStatus]= useState(null);
  const [payOrder, setPay]      = useState(null);
  const [toast, setToast]       = useState('');
  const [showLogout, setLogout] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2800); };
  const refresh   = () => setOrders(pedidosService.getAll());

  useEffect(() => {
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, []);

  const filtered   = filter === 'all' ? orders : orders.filter(o =>
    o.estado === filter || (filter === 'en_preparacion' && o.estado === 'en_proceso')
  );
  const sorted     = [...filtered].sort((a, b) => Number(b.id) - Number(a.id));
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageItems  = sorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const counts = {
    pendiente:      orders.filter(o => o.estado==='pendiente').length,
    en_preparacion: orders.filter(o => o.estado==='en_preparacion'||o.estado==='en_proceso').length,
    listo:          orders.filter(o => o.estado==='listo').length,
    pagado:         orders.filter(o => o.estado==='pagado').length,
  };

  const handleStatusSave = useCallback((newStatus) => {
    if (!statusOrder) return;
    pedidosService.cambiarEstado(statusOrder.id, newStatus);
    refresh();
    showToast(`Estado → "${STATUS_CFG[newStatus]?.label}"`);
  }, [statusOrder]);

  const handlePayConfirm = useCallback((method) => {
    if (!payOrder) return;
    pedidosService.cambiarEstado(payOrder.id, 'pagado');
    refresh();
    showToast(`✓ Pago confirmado — ${method}`);
    setPay(null);
  }, [payOrder]);

  const now     = new Date();
  const dateStr = now.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' });

  return (
    <div className="cj-root">
      {toast && <div className="cj-toast">{toast}</div>}

      {/* ── Sidebar ── */}
      <aside className="cj-sidebar">
        <div className="cj-sidebar__logo">
          <div className="cj-sidebar__logo-ring">
            <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="2.5"/>
              <path d="M25 30 Q25 28 27 28 L53 28 Q55 28 55 30 L52 52 Q52 54 50 54 L30 54 Q28 54 28 52 Z" fill="none" stroke="white" strokeWidth="2"/>
              <path d="M55 34 Q62 34 62 40 Q62 46 55 46" stroke="white" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <span className="cj-sidebar__brand">SICABER</span>
          <span className="cj-sidebar__sub">Módulo Cajero</span>
        </div>

        <nav className="cj-sidebar__nav">
          <div className="cj-sidebar__section">Principal</div>

          <button
            className={`cj-sidebar__item ${tab==='nuevo'?'cj-sidebar__item--active':''}`}
            onClick={() => setTab('nuevo')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo pedido
          </button>

          <button
            className={`cj-sidebar__item ${tab==='pedidos'?'cj-sidebar__item--active':''}`}
            onClick={() => setTab('pedidos')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            Pedidos activos
            {counts.pendiente > 0 && <span className="cj-sidebar__badge">{counts.pendiente}</span>}
          </button>

          <div className="cj-sidebar__section">Resumen</div>
          <div className="cj-sidebar__stats">
            {[
              { dot:'#FFB300', label:'Pendientes',  val: counts.pendiente },
              { dot:'#42A5F5', label:'En prep.',     val: counts.en_preparacion },
              { dot:'#4CAF50', label:'Listos',       val: counts.listo },
              { dot:'#7E57C2', label:'Pagados',      val: counts.pagado },
            ].map(s => (
              <div key={s.label} className="cj-sidebar__stat">
                <span className="cj-sidebar__stat-dot" style={{background:s.dot}}/>
                <span>{s.label}</span>
                <strong>{s.val}</strong>
              </div>
            ))}
          </div>
        </nav>

        <div className="cj-sidebar__bottom">
          <div className="cj-sidebar__user">
            <div className="cj-sidebar__avatar">
              {(user?.nombre||user?.username||'C').charAt(0).toUpperCase()}
            </div>
            <div className="cj-sidebar__user-info">
              <span className="cj-sidebar__username">{user?.nombre||user?.username}</span>
              <span className="cj-sidebar__role">{user?.role||'Cajero'}</span>
            </div>
          </div>
          <button className="cj-sidebar__logout" onClick={() => setLogout(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="cj-main">
        <div className="cj-topbar">
          <div className="cj-topbar__title">
            {tab === 'nuevo' ? 'Nuevo Pedido' : 'Pedidos Activos'}
          </div>
          {tab === 'pedidos' && <span className="cj-topbar__date">{dateStr}</span>}
          <div style={{flex:1}}/>
          <div className="cj-online-pill"><span className="cj-pulse"/>En línea</div>
          {tab === 'pedidos' && (
            <button className="cj-icon-btn" onClick={refresh} title="Actualizar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          )}
        </div>

        <div className="cj-content">
          {/* ── TAB: Nuevo pedido ── */}
          {tab === 'nuevo' && (
            <NuevoPedido
              showToast={showToast}
              onCreated={() => { refresh(); setTab('pedidos'); }}
            />
          )}

          {/* ── TAB: Pedidos activos ── */}
          {tab === 'pedidos' && (
            <>
              <div className="cj-filters">
                {FILTERS.map(f => {
                  const cfg = STATUS_CFG[f];
                  return (
                    <button
                      key={f}
                      className={`cj-chip ${filter===f?'cj-chip--on':''}`}
                      onClick={() => { setFilter(f); setPage(1); }}
                    >
                      {cfg && <span className="cj-chip__dot" style={{background:cfg.color}}/>}
                      {f==='all' ? 'Todos' : cfg?.label || f}
                      {f!=='all' && counts[f]>0 && <span className="cj-chip__count">{counts[f]}</span>}
                    </button>
                  );
                })}
                <div style={{flex:1}}/>
                <span className="cj-count-label">{filtered.length} pedido{filtered.length!==1?'s':''}</span>
              </div>

              {filtered.length === 0 ? (
                <div className="cj-empty">
                  <div className="cj-empty__icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
                  <h3>Sin pedidos</h3>
                  <p>
                    {filter==='all'
                      ? <span>No hay pedidos aún. <button className="cj-link" onClick={() => setTab('nuevo')}>Crear uno →</button></span>
                      : `No hay pedidos con estado "${STATUS_CFG[filter]?.label}".`
                    }
                  </p>
                </div>
              ) : (
                <div className="cj-grid">
                  {pageItems.map(order => (
                    <OrderCard key={order.id} order={order} onStatus={setStatus} onPay={setPay}/>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="cj-pagination">
                  <button className="cj-page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Ant.</button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                    <button key={n} className={`cj-page-btn ${n===page?'cj-page-btn--on':''}`} onClick={() => setPage(n)}>{n}</button>
                  ))}
                  <button className="cj-page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Sig. →</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modales */}
      {statusOrder && (
        <StatusModal order={statusOrder} onClose={() => setStatus(null)} onSave={handleStatusSave}/>
      )}
      {payOrder && (
        <PayModal order={payOrder} onClose={() => setPay(null)} onConfirm={handlePayConfirm}/>
      )}
      {showLogout && (
        <div className="cj-modal-mask" onClick={() => setLogout(false)}>
          <div className="cj-modal cj-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="cj-modal__head">
              <h3>¿Cerrar sesión?</h3>
              <button className="cj-modal__x" onClick={() => setLogout(false)}>✕</button>
            </div>
            <div className="cj-modal__body">
              <p style={{color:'#666',fontSize:14}}>¿Estás seguro de que deseas salir?</p>
            </div>
            <div className="cj-modal__foot">
              <button className="cj-btn cj-btn--ghost" onClick={() => setLogout(false)}>Cancelar</button>
              <button className="cj-btn cj-btn--danger" onClick={() => { logout(); navigate('/'); }}>Sí, salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
