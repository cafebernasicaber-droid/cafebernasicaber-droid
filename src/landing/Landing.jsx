import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/contexts/AuthContext';
import clientesService from '../features/clientes/services/clientesService';
import productosService, { descuentoVigente, calcPrecioFinal } from '../features/productos/services/productosService';
import toppingsService from '../features/toppings/services/toppingsService';
import adicionesService from '../features/adiciones/services/adicionesService';
import pedidosService from '../features/pedidos/services/pedidosService';
import categoriasService from '../features/categorias/services/categoriasService';
import resenasService from '../features/resenas/services/resenasService';
import combosService from '../features/adiciones/services/combosService';
import './Landing.css';

const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n||0);

function CartThumb({ src, alt }) {
  const [err, setErr] = React.useState(false);
  const noImg = !src || err;
  return noImg
    ? <div style={{width:58,height:58,borderRadius:10,flexShrink:0,background:'#E8F5E9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:'#4CAF50'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>
    : <img src={src} alt={alt} onError={()=>setErr(true)} style={{width:58,height:58,objectFit:'cover',borderRadius:10,flexShrink:0,display:'block'}}/>;
}

function LxPersonalizar({ producto, toppings, adiciones, onAdd, onClose }) {
  const GRATIS_MAX = 2;
  const [topsSelec, setTops]   = useState([]);
  const [adicsSelec, setAdics] = useState([]);
  const topsGratis  = topsSelec.filter(t => t.gratuito || t.precio === 0);
  const topsPago    = topsSelec.filter(t => !t.gratuito && t.precio > 0);
  const gratisExtra = topsGratis.length > GRATIS_MAX ? topsGratis.slice(GRATIS_MAX).reduce((s,t)=>s+(t.precio||0),0) : 0;
  const extraTotal  = topsPago.reduce((s,t)=>s+t.precio,0) + adicsSelec.reduce((s,a)=>s+a.precio,0) + gratisExtra;
  const toggleTop  = t => setTops(p  => p.find(x=>x.id===t.id) ? p.filter(x=>x.id!==t.id) : [...p,t]);
  const toggleAdic = a => setAdics(p => p.find(x=>x.id===a.id) ? p.filter(x=>x.id!==a.id) : [...p,a]);
  return (
    <>
      <div className="lx-modal__brand" style={{marginBottom:8}}>
        <span style={{fontSize:17,fontWeight:700,color:'#f0ece4'}}>{producto.nombre}</span>
      </div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:20}}>{fmt(producto.precio)} · personaliza tu bebida</div>
      {toppings.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:10}}>
            Toppings <span style={{fontWeight:400}}>({GRATIS_MAX} gratis · los demás tienen costo)</span>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {toppings.map(t => {
              const sel = topsSelec.find(x=>x.id===t.id);
              const esGratis = t.gratuito || t.precio === 0;
              const gratuitos = topsSelec.filter(x=>x.gratuito||x.precio===0).length;
              const cobrarEste = esGratis && !sel && gratuitos >= GRATIS_MAX;
              return (
                <button key={t.id} onClick={() => toggleTop(t)} style={{padding:'8px 16px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',border:`1.5px solid ${sel?'var(--gold)':'rgba(14,12,7,.14)'}`,background:sel?'rgba(76,175,80,0.15)':'rgba(255,255,255,0.05)',color:sel?'#f0ece4':'rgba(255,255,255,0.5)',transition:'all .2s'}}>
                  {t.nombre}
                  {esGratis && !cobrarEste ? <span style={{color:'#27ae60',marginLeft:4}}>Gratis</span> : <span style={{color:'var(--gold)',marginLeft:4}}>+{fmt(t.precio)}</span>}
                  {sel && <span style={{marginLeft:5,color:'var(--gold)'}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {adiciones.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:10}}>Adiciones</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {adiciones.map(a => {
              const sel = adicsSelec.find(x=>x.id===a.id);
              return (
                <button key={a.id} onClick={() => toggleAdic(a)} style={{padding:'8px 16px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',border:`1.5px solid ${sel?'#b8924a':'rgba(14,12,7,.14)'}`,background:sel?'rgba(255,179,0,0.15)':'rgba(255,255,255,0.05)',color:sel?'#f0ece4':'rgba(255,255,255,0.5)',transition:'all .2s'}}>
                  {a.nombre} <span style={{color:'var(--gold)',marginLeft:4}}>+{fmt(a.precio)}</span>
                  {sel && <span style={{marginLeft:5,color:'var(--gold)'}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {extraTotal > 0 && (
        <div style={{background:'rgba(255,255,255,0.06)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#f0ece4',marginBottom:16,display:'flex',justifyContent:'space-between'}}>
          <span>Extras</span><span style={{fontWeight:700,color:'var(--gold)'}}>+{fmt(extraTotal)}</span>
        </div>
      )}
      <button className="lx-btn lx-btn--full" onClick={() => onAdd(producto, topsSelec, adicsSelec)}>
        Agregar al carrito · {fmt(producto.precio + extraTotal)}
      </button>
    </>
  );
}

function PasarelaPago({ cart, total, cliente, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [tipoEntrega, setTipoEntrega] = useState('');
  const [direccionAlternativa, setDireccionAlternativa] = useState('');
  const [metodo, setMetodo] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const METODOS = [
    { id:'nequi', label:'Nequi', num:'300 000 0000', icon:'NQ' },
    { id:'daviplata', label:'Daviplata', num:'300 000 0000', icon:'DP' },
    { id:'transferencia', label:'Transferencia Bancaria', num:'Cta: 123-456789-01', icon:'TB' },
    { id:'efectivo', label:'Efectivo en caja', num:'Pagar al retirar', icon:'EF' },
  ];
  const handleFile = e => { const f = e.target.files[0]; if (!f) return; setArchivo(f); setPreview({ url: URL.createObjectURL(f), type: f.type }); };
  const confirmar = () => {
    if (!metodo) return;
    if (metodo !== 'efectivo' && !archivo) return;
    setLoading(true);
    setTimeout(() => {
      const productos = cart.map(i => ({ id:i.id, nombre:i.nombre||i.name, precio:i.precio||i.price, cantidad:i.qty }));
      pedidosService.create({ cliente: cliente.nombre, clienteId: cliente.id, tipo: tipoEntrega, pago: metodo, productos, total, hora: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}), estado: 'pendiente', comprobante: archivo ? archivo.name : null, origen: 'landing', direccionAlternativa: tipoEntrega === 'domicilio' ? (direccionAlternativa || null) : null });
      setLoading(false); setStep(5); onSuccess(false);
    }, 1800);
  };
  return (
    <div className="lx-modal-mask" onClick={onClose}>
      <div className="pay-modal" onClick={e => e.stopPropagation()}>
        <button className="pay-close" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        {step === 5 ? (
          <div className="pay-success">
            <div className="pay-success__icon">✓</div>
            <h2>¡Pedido recibido!</h2>
            <p>{tipoEntrega === 'domicilio' ? 'Tu pedido fue registrado. Nos pondremos en contacto pronto para coordinar tu domicilio.' : 'Tu pedido fue registrado. Pasa por el local a recogerlo cuando esté listo.'}</p>
            <div className="pay-success__total">Total: {fmt(total)}</div>
            <button className="lx-btn lx-btn--full" onClick={onSuccess} style={{marginTop:24}}>Cerrar</button>
          </div>
        ) : (
          <>
            <div className="pay-header">
              <div className="pay-logo"><span style={{fontFamily:"Jost,sans-serif",fontWeight:800,fontSize:14,letterSpacing:2,color:"#4CAF50"}}>☕ CAFÉ DON BERNA</span></div>
              <div className="pay-total-badge">{fmt(total)}</div>
            </div>
            <div className="pay-steps">
              <div className={`pay-step ${step>=1?"pay-step--on":""}`}>1</div>
              <div className="pay-step-line"/>
              <div className={`pay-step ${step>=2?"pay-step--on":""}`}>2</div>
              <div className="pay-step-line"/>
              <div className={`pay-step ${step>=3?"pay-step--on":""}`}>3</div>
              <div className="pay-step-line"/>
              <div className={`pay-step ${step>=4?"pay-step--on":""}`}>4</div>
            </div>
            <div className="pay-steps-labels"><span>Entrega</span><span>Dirección</span><span>Pago</span><span>Comprobante</span></div>
            {step === 1 && (
              <div className="pay-body">
                <h3>¿Cómo quieres recibir tu pedido?</h3>
                <div className="pay-methods">
                  <button className={`pay-method ${tipoEntrega==='domicilio'?'pay-method--sel':''}`} onClick={() => setTipoEntrega('domicilio')}>
                    <span className="pay-method__icon">🛵</span>
                    <div><div className="pay-method__label">Domicilio</div><div className="pay-method__num">Te lo llevamos a tu dirección</div></div>
                    {tipoEntrega==='domicilio' && <span className="pay-method__check">✓</span>}
                  </button>
                  <button className={`pay-method ${tipoEntrega==='local'?'pay-method--sel':''}`} onClick={() => setTipoEntrega('local')}>
                    <span className="pay-method__icon">🏠</span>
                    <div><div className="pay-method__label">Recoger en el local</div><div className="pay-method__num">Recoge tu pedido en tienda</div></div>
                    {tipoEntrega==='local' && <span className="pay-method__check">✓</span>}
                  </button>
                </div>
                <button className="lx-btn lx-btn--full" disabled={!tipoEntrega} onClick={() => tipoEntrega === 'domicilio' ? setStep(2) : setStep(3)}>Continuar →</button>
              </div>
            )}
            {step === 2 && (
              <div className="pay-body">
                <div className="pay-coverage-alert">
                  <span className="pay-coverage-alert__icon">📍</span>
                  <p>Recuerda que por el momento nuestro servicio de domicilios <strong>solo cubre la comuna 8 y 9 de Medellín</strong>.</p>
                </div>
                <div className="pay-alt-address">
                  <label className="pay-alt-address__label">¿Deseas recibir el pedido en otra dirección? <span style={{fontWeight:400,color:'var(--lx-muted)'}}>(Opcional)</span></label>
                  <p className="pay-alt-address__hint">Si tu pedido debe entregarse en una dirección diferente a la que tienes registrada, puedes escribirla aquí.</p>
                  <input type="text" className="pay-alt-address__input" placeholder="Ej: Calle 45 #23-10, apto 301" value={direccionAlternativa} onChange={e => setDireccionAlternativa(e.target.value)}/>
                </div>
                <div style={{display:"flex",gap:12,marginTop:8}}>
                  <button className="btn-cancel" onClick={() => setStep(1)}>← Atrás</button>
                  <button className="lx-btn" style={{flex:1,justifyContent:"center"}} onClick={() => setStep(3)}>Continuar →</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="pay-body">
                <h3>Elige tu método de pago</h3>
                <div className="pay-methods">
                  {METODOS.map(m => (
                    <button key={m.id} className={`pay-method ${metodo===m.id?"pay-method--sel":""}`} onClick={() => setMetodo(m.id)}>
                      <span className="pay-method__icon" style={{background:"rgba(76,175,80,0.15)",color:"#4CAF50",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:800}}>{m.icon}</span>
                      <div><div className="pay-method__label">{m.label}</div><div className="pay-method__num">{m.num}</div></div>
                      {metodo===m.id && <span className="pay-method__check">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="pay-cart-summary">
                  <div className="pay-cart-title">Resumen del pedido</div>
                  {cart.map(i => <div className="pay-cart-row" key={i.id}><span>{i.nombre||i.name} x{i.qty}</span><span>{fmt((i.precio||i.price)*i.qty)}</span></div>)}
                  <div className="pay-cart-total"><span>Total</span><strong>{fmt(total)}</strong></div>
                </div>
                <div style={{display:"flex",gap:12,marginTop:8}}>
                  <button className="btn-cancel" onClick={() => tipoEntrega === 'domicilio' ? setStep(2) : setStep(1)}>← Atrás</button>
                  <button className="lx-btn" style={{flex:1,justifyContent:"center"}} disabled={!metodo||loading} onClick={() => metodo==="efectivo" ? confirmar() : setStep(4)}>{loading ? <span className="pay-spinner"/> : metodo==="efectivo" ? "Confirmar pedido →" : "Continuar →"}</button>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="pay-body">
                <h3>Sube tu comprobante</h3>
                <p style={{fontSize:13,color:"#888",marginBottom:20}}>Adjunta la foto o PDF del comprobante de pago a {METODOS.find(m=>m.id===metodo)?.label}.</p>
                <div className="pay-upload" onClick={() => fileRef.current?.click()}>
                  {preview ? (
                    preview.type==="application/pdf"
                      ? <div className="pay-upload__pdf"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>{archivo.name}</span></div>
                      : <img src={preview.url} alt="comprobante" className="pay-upload__img"/>
                  ) : (
                    <div className="pay-upload__placeholder">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span>Haz clic para subir foto o PDF</span>
                      <small>JPG, PNG o PDF</small>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={handleFile}/>
                <div style={{display:"flex",gap:12,marginTop:20}}>
                  <button className="btn-cancel" onClick={() => setStep(3)}>← Atrás</button>
                  <button className="lx-btn" style={{flex:1,justifyContent:"center"}} disabled={!archivo||loading} onClick={confirmar}>{loading ? <span className="pay-spinner"/> : "Confirmar pedido →"}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { login: adminLogin } = useAuth();
  const [clienteSession, setClienteSession] = useState(() => {
    try { const s = localStorage.getItem("sicaber_cliente_session"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [authTab, setAuthTab] = useState("login");
  const [loginData, setLoginData] = useState({ correo:"", password:"" });
  const [regData, setRegData] = useState({ nombre:"", correo:"", telefono:"", tipoDoc:"Cédula de Ciudadanía", numeroDoc:"", departamento:"Antioquia", municipio:"Medellín", comuna:"", direccion:"", password:"", confirm:"" });
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeCat, setActiveCat] = useState("Todos");
  const catScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [toast, setToast] = useState("");
  const [showPasarela, setShowPasarela] = useState(false);
  const [modalPersonalizar, setModalPersonalizar] = useState(null);
  const [modalDuplicar, setModalDuplicar] = useState(null); // producto que ya está en carrito
  const [perfilTab, setPerfilTab] = useState("info");
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [resenas, setResenas] = useState(() => resenasService.getAprobadas());
  const [reviewForm, setReviewForm] = useState({ texto: '', estrellas: 0 });
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 3;

  const PRODUCTS       = productosService.getActivos();
  const PRODUCTOS_CON_DESCUENTO = productosService.getConDescuentoVigente();
  const COMBOS_ACTIVOS = combosService.getActivos();
  const CATEGORIAS_DATA = categoriasService.getAll().filter(c => c.estado === 'Activo');
  const TOPPINGS_DISP  = toppingsService.getActivos();
  const TODAS_ADICIONES = adicionesService.getAll().filter(a => a.estado === 'Activo');
  const ADICIONES_DISP = TODAS_ADICIONES;
  const getAdicionesPorProducto = (prod) => prod ? TODAS_ADICIONES.filter(a => a.categoria === prod.categoria || a.categoria === 'Especiales') : TODAS_ADICIONES;
  const cats  = ["Todos", ...new Set(PRODUCTS.map(p => p.categoria))];
  const shown = activeCat === "Todos" ? PRODUCTS : PRODUCTS.filter(p => p.categoria === activeCat);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const updateCatScroll = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollCats = dir => {
    const el = catScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 180, behavior: 'smooth' });
    setTimeout(updateCatScroll, 350);
  };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const openPersonalizar = p => {
    if (!clienteSession) { setModal("auth"); setAuthTab("login"); showToast("Inicia sesión para agregar al carrito"); return; }
    setModalPersonalizar(p);
  };

  const addToCartWithExtras = (prod, toppings, adiciones) => {
    if (!clienteSession) { setModalPersonalizar(null); setModal("auth"); setAuthTab("login"); showToast("Inicia sesión para agregar al carrito"); return; }
    const extraTotal  = toppings.reduce((s,t) => s+(t.precio||0), 0) + adiciones.reduce((s,a) => s+(a.precio||0), 0);
    const precioFinal = (prod.precio||prod.price) + extraTotal;
    const prodOriginal = productosService.getById(prod.id);
    const precioOriginal = prodOriginal && descuentoVigente(prodOriginal) ? prodOriginal.precio : null;
    const cartKey = `${prod.id}-${Date.now()}`;
    setCart(prev => [...prev, {...prod, qty:1, toppings, adiciones, precioFinal, extraTotal, _precioOriginal: precioOriginal, _cartKey: cartKey}]);
    showToast(prod.nombre + " agregado al carrito");
    setModalPersonalizar(null);
  };

  const addToCart = p => {
    if (!clienteSession) { setModal("auth"); setAuthTab("login"); showToast("Inicia sesión para agregar al carrito"); return; }
    // Si ya hay uno igual en el carrito, preguntar si quiere uno nuevo o sumar
    const existe = cart.find(i => i.id === p.id);
    if (existe) { setModalDuplicar(p); return; }
    const prodOriginal = productosService.getById(p.id);
    const precioOriginal = prodOriginal && descuentoVigente(prodOriginal) ? prodOriginal.precio : null;
    const cartKey = `${p.id}-${Date.now()}`;
    setCart(prev => [...prev, {...p, qty:1, toppings:[], adiciones:[], precioFinal:p.precio||p.price, _precioOriginal: precioOriginal, _cartKey: cartKey}]);
    showToast(p.nombre + " agregado");
  };

  const updateQty  = (cartKey,d) => setCart(prev => prev.map(i => i._cartKey===cartKey?{...i,qty:Math.max(0,i.qty+d)}:i).filter(i=>i.qty>0));
  const cartTotal  = cart.reduce((s,i) => s+(i.precioFinal||i.precio||i.price)*i.qty, 0);
  const cartCount  = cart.reduce((s,i) => s+i.qty, 0);

  const abrirPerfil = () => {
    const c = clientesService.getById(clienteSession.id);
    if (c) setEditData({ nombre: c.nombre, telefono: c.telefono||"", direccion: c.direccion||"", departamento: c.departamento||"", municipio: c.municipio||"" });
    setPerfilTab("info"); setEditError(""); setEditSuccess(""); setModal("perfil");
  };

  const handleEditPerfil = e => {
    e.preventDefault(); setEditError(""); setEditSuccess("");
    if (!editData.nombre?.trim()) { setEditError("El nombre es obligatorio."); return; }
    setEditLoading(true);
    setTimeout(() => {
      const r = clientesService.update(clienteSession.id, { ...clientesService.getById(clienteSession.id), ...editData });
      if (r.error) { setEditError(r.error); setEditLoading(false); return; }
      const updated = { ...clienteSession, nombre: r.data.nombre };
      setClienteSession(updated);
      localStorage.setItem("sicaber_cliente_session", JSON.stringify(updated));
      setEditSuccess("¡Datos actualizados correctamente!"); setEditLoading(false);
    }, 500);
  };

  const handleLogin = e => {
    e.preventDefault(); setAuthError(""); setAuthLoading(true);
    setTimeout(() => {
      const adminResult = adminLogin(loginData.correo, loginData.password);
      if (adminResult.success) {
        setAuthSuccess("¡Bienvenido al panel de administración!"); setAuthLoading(false);
        setTimeout(() => { setModal(null); navigate(adminResult.redirectTo || '/admin/dashboard'); }, 1000);
        return;
      }
      const r = clientesService.loginCliente(loginData.correo, loginData.password);
      if (r.error) { setAuthError(r.error); setAuthLoading(false); return; }
      const session = { id:r.data.id, nombre:r.data.nombre, correo:r.data.correo };
      setClienteSession(session);
      localStorage.setItem("sicaber_cliente_session", JSON.stringify(session));
      setAuthSuccess("¡Bienvenido/a, " + r.data.nombre + "!"); setAuthLoading(false);
      setTimeout(() => setModal(null), 1400);
    }, 600);
  };

  const handleRegister = e => {
    e.preventDefault(); setAuthError("");
    if (regData.password !== regData.confirm) { setAuthError("Las contraseñas no coinciden."); return; }
    if (regData.municipio === 'Medellín' && regData.comuna && regData.comuna !== 'Comuna 8 - Villa Hermosa' && regData.comuna !== 'Comuna 9 - Buenos Aires') {
      setAuthError('Lo sentimos, el servicio de domicilios solo está disponible para las comunas 8 y 9 de Medellín. Si tu dirección es de otra zona, puedes visitarnos en nuestro punto físico.');
      return;
    }
    setAuthLoading(true);
    setTimeout(() => {
      const r = clientesService.register({ nombre:regData.nombre, correo:regData.correo, telefono:regData.telefono, tipoDoc:regData.tipoDoc, numeroDoc:regData.numeroDoc, departamento:regData.departamento, municipio:regData.municipio, comuna:regData.comuna, direccion:regData.direccion, password:regData.password });
      if (r.error) { setAuthError(r.error); setAuthLoading(false); return; }
      setAuthSuccess("¡Cuenta creada! Inicia sesión."); setAuthLoading(false);
      setTimeout(() => { setAuthTab("login"); setAuthSuccess(""); setRegData({nombre:"",correo:"",telefono:"",tipoDoc:"Cédula de Ciudadanía",numeroDoc:"",departamento:"Antioquia",municipio:"Medellín",comuna:"",direccion:"",password:"",confirm:""}); }, 1800);
    }, 700);
  };

  const handleLogout = () => { setClienteSession(null); localStorage.removeItem("sicaber_cliente_session"); setModal(null); showToast("Sesión cerrada"); };
  const finalizarPedido = () => { if (!clienteSession) { setCartOpen(false); setModal("auth"); setAuthTab("login"); showToast("Inicia sesión para continuar"); return; } setCartOpen(false); setShowPasarela(true); };
  const onPedidoSuccess = (cerrar = true) => { if (cerrar) setShowPasarela(false); setCart([]); showToast("¡Pedido creado! Pronto nos comunicamos."); };

  const handleSubmitReview = e => {
    e.preventDefault(); setReviewError(''); setReviewSuccess('');
    if (!clienteSession) { setModal('auth'); setAuthTab('login'); return; }
    setReviewLoading(true);
    setTimeout(() => {
      const r = resenasService.create({ clienteId: clienteSession.id, nombre: clienteSession.nombre, rol: 'Cliente verificado', texto: reviewForm.texto, estrellas: reviewForm.estrellas });
      setReviewLoading(false);
      if (r.error) { setReviewError(r.error); return; }
      setResenas(resenasService.getAprobadas());
      setReviewSuccess('¡Gracias por tu reseña!');
      setReviewForm({ texto: '', estrellas: 0 });
      setTimeout(() => { setShowReviewForm(false); setReviewSuccess(''); }, 2000);
    }, 600);
  };

  return (
    <div className="lx">
      {toast && <div className="lx-toast">{toast}</div>}
      {showPasarela && clienteSession && (
        <PasarelaPago cart={cart} total={cartTotal} cliente={clienteSession} onClose={() => setShowPasarela(false)} onSuccess={onPedidoSuccess}/>
      )}

      {/* ── Navbar ── */}
      <nav className={`lx-nav ${scrollY>60?"lx-nav--solid":""}`}>
        <div className="lx-nav__in">
          <div className="lx-logo" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>
            <span className="lx-logo__s"><img src="/img/Logotipo_blanco.png" alt="Café Don Berna" style={{width:32,height:32,objectFit:'contain',filter:'none',display:'block'}}/></span><span className="lx-logo__rest" style={{fontSize:11,letterSpacing:2}}>CAFÉ DON BERNA</span>
          </div>
          <div className="lx-nav__links">
            <a href="#menu">Menú</a><a href="#nosotros">Nosotros</a><a href="#contacto">Contacto</a>
          </div>
          <div className="lx-nav__right">
            {clienteSession ? (
              <div className="lx-user-info">
                <button className="lx-user-avatar lx-user-avatar--btn" onClick={abrirPerfil}>{clienteSession.nombre.charAt(0).toUpperCase()}</button>
                <div className="lx-user-text" style={{cursor:"pointer"}} onClick={abrirPerfil}>
                  <span className="lx-user-welcome">Hola,</span>
                  <span className="lx-user-name">{clienteSession.nombre.split(" ")[0]}</span>
                </div>
                <button className="lx-logout-btn" onClick={() => setModal("logout")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Salir
                </button>
              </div>
            ) : (
              <>
                <button className="lx-nav__ghost" onClick={() => { setModal("auth"); setAuthTab("login"); }}>Ingresar</button>
                <button className="lx-nav__cta" onClick={() => { setModal("auth"); setAuthTab("register"); }}>Registrarse</button>
              </>
            )}
            <button className="lx-cart-icon" onClick={() => { if (!clienteSession) { setModal("auth"); setAuthTab("login"); showToast("Inicia sesión para ver el carrito"); return; } setCartOpen(true); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {cartCount > 0 && <span className="lx-cart-icon__n">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero: dinámico si hay descuento vigente, normal si no ── */}
      {PRODUCTOS_CON_DESCUENTO.length > 0 ? (() => {
        const pd = PRODUCTOS_CON_DESCUENTO[0];
        const precioDesc = calcPrecioFinal(pd);
        const bgImg = pd.imagen && !pd.imagen.startsWith('PEGAR')
          ? pd.imagen
          : 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=85';
        return (
          <section className="lx-hero">
            <div className="lx-hero__parallax"><img src={bgImg} alt={pd.nombre}/></div>
            <div className="lx-hero__grain"/>
            <div className="lx-hero__fade"/>
            <div className="lx-hero__content">
              <div className="lx-hero__pill" style={{background:'rgba(229,57,53,0.2)',borderColor:'rgba(229,57,53,0.5)',color:'#FF8A80'}}>
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                Oferta especial · Solo por tiempo limitado
              </div>
              <h1 className="lx-hero__h1">{pd.nombre}</h1>
              {pd.descripcion && <p className="lx-hero__p">{pd.descripcion}</p>}
              <div style={{display:'flex',alignItems:'baseline',gap:14,marginBottom:28,flexWrap:'wrap'}}>
                <span style={{fontSize:'clamp(32px,5vw,52px)',fontWeight:900,color:'#69F0AE',lineHeight:1}}>{fmt(precioDesc)}</span>
                <span style={{fontSize:22,color:'rgba(255,255,255,0.4)',textDecoration:'line-through',fontWeight:400}}>{fmt(pd.precio)}</span>
                <span style={{background:'#E53935',color:'white',fontSize:16,fontWeight:900,padding:'5px 14px',borderRadius:30}}>-{pd.descuento}%</span>
              </div>
              <div className="lx-hero__btns">
                <button className="lx-btn" onClick={() => addToCart({...pd, precio: precioDesc})}>Agregar al carrito</button>
                <a href="#menu" className="lx-btn lx-btn--outline">Ver el menú</a>
              </div>
            </div>
          </section>
        );
      })() : (
      <section className="lx-hero">
        <div className="lx-hero__parallax"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=85" alt="café"/></div>
        <div className="lx-hero__grain"/>
        <div className="lx-hero__fade"/>
        <div className="lx-hero__content">
          <div className="lx-hero__pill"><svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>Cafetería Cafe Don Berna - Medellin</div>
          <h1 className="lx-hero__h1">Café Don<br/><em>Berna</em></h1>
          <p className="lx-hero__p">Cada taza, una historia · Cada sorbo, una experiencia</p>
          <div className="lx-hero__btns">
            <a href="#menu" className="lx-btn">Ver el menú</a>
            <button className="lx-btn lx-btn--outline" onClick={() => { setModal("auth"); setAuthTab("register"); }}>Crear cuenta</button>
          </div>
        </div>
      </section>
      )}

      {/* ── Marquee ── */}
      <div className="lx-marquee">
        <div className="lx-marquee__track">
          {["Cafe don berna","Capuchino","Carajillo","Cafe Con Leche","Perico","Tinto","Cafe Berna","Frappe","Capuchino Helado","Preentrenos","Amaretto","Granizado de Cafe","Cafe Helado"].map((t,i) => (
            <span key={i} className="lx-marquee__item">{t}<span className="lx-marquee__dot"> · </span></span>
          ))}
        </div>
      </div>

      <section className="lx-stats">
        {[{n:"3+",l:"Años de experiencia"},{n:"Variedad de",l:"Recetas únicas"},{n:"Todos Nuestros",l:"Clientes felices"},{n:"100%",l:"Ingredientes naturales"}].map((s,i) => (
          <div className="lx-stat" key={i}><div className="lx-stat__n">{s.n}</div><div className="lx-stat__l">{s.l}</div></div>
        ))}
      </section>

      {/* ── Combos especiales ── */}
      {COMBOS_ACTIVOS.length > 0 && (
        <section className="lx-section" style={{background:'#1a1a1a',paddingTop:60,paddingBottom:60}}>
          <div className="lx-section__in">
            <div className="lx-section__tag" style={{color:'#69F0AE'}}>Ofertas especiales</div>
            <h2 className="lx-section__h2" style={{color:'white'}}>Combos<br/><em style={{color:'#69F0AE'}}>del día</em></h2>
            <p className="lx-section__p" style={{color:'rgba(255,255,255,0.55)'}}>Combinaciones especiales con precio exclusivo para ti.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20,marginTop:32}}>
              {COMBOS_ACTIVOS.map(combo => {
                const totalOrig = [...(combo.productos||[]),...(combo.adiciones||[])].reduce((s,x)=>s+(x.precioOriginal||0),0);
                const ahorro = totalOrig > combo.precio ? totalOrig - combo.precio : 0;
                return (
                  <div key={combo.id} style={{background:'rgba(255,255,255,0.06)',borderRadius:16,border:'1px solid rgba(105,240,174,0.2)',overflow:'hidden',transition:'transform 0.2s,box-shadow 0.2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.4)'}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                    {/* Imagen o placeholder */}
                    <div style={{height:140,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                      {combo.imagen
                        ? <img src={combo.imagen} alt={combo.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <span style={{fontSize:48}}>🎁</span>
                      }
                      {ahorro > 0 && (
                        <div style={{position:'absolute',top:12,left:12,background:'#E53935',color:'white',fontSize:12,fontWeight:800,padding:'4px 10px',borderRadius:20}}>
                          Ahorras {fmt(ahorro)}
                        </div>
                      )}
                    </div>
                    <div style={{padding:'16px 18px'}}>
                      <div style={{fontSize:16,fontWeight:800,color:'white',marginBottom:6}}>{combo.nombre}</div>
                      {combo.descripcion && <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:10}}>{combo.descripcion}</div>}
                      {/* Fecha de vencimiento visible en landing */}
                      {combo.fechaFin && (() => {
                        const [y,m,d] = combo.fechaFin.split('-');
                        const today = new Date().toISOString().slice(0,10);
                        const diff = Math.ceil((new Date(combo.fechaFin) - new Date(today)) / 86400000);
                        const urgente = diff >= 0 && diff <= 3;
                        return (
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={urgente?'#FF8A80':'rgba(255,255,255,0.4)'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span style={{fontSize:12,color:urgente?'#FF8A80':'rgba(255,255,255,0.4)',fontWeight:urgente?700:400}}>
                              {urgente && diff === 0 ? '⚡ Último día' : urgente ? `⚡ Vence en ${diff} día${diff!==1?'s':''}` : `Válido hasta ${d}/${m}/${y}`}
                            </span>
                          </div>
                        );
                      })()}
                      {/* Productos incluidos */}
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:12}}>
                        {[...(combo.productos||[]),...(combo.adiciones||[])].map((x,i)=>(
                          <span key={i}>{i>0&&<span style={{color:'rgba(255,255,255,0.2)'}}> + </span>}{x.nombre}</span>
                        ))}
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                          <span style={{fontSize:22,fontWeight:900,color:'#69F0AE'}}>{fmt(combo.precio)}</span>
                          {totalOrig > 0 && <span style={{fontSize:13,color:'rgba(255,255,255,0.25)',textDecoration:'line-through'}}>{fmt(totalOrig)}</span>}
                        </div>
                        <button
                          className="lx-card__add"
                          onClick={() => {
                            if(!clienteSession){setModal('auth');setAuthTab('login');showToast('Inicia sesión para agregar al carrito');return;}
                            const prod = {id:`combo-${combo.id}`,nombre:combo.nombre,precio:combo.precio,imagen:combo.imagen||'',categoria:'Combo'};
                            addToCart(prod);
                          }}
                          style={{background:'linear-gradient(135deg,#4CAF50,#2E7D32)'}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Menú ── */}
      <section id="menu" className="lx-section lx-menu">
        <div className="lx-section__in">
          <div className="lx-section__tag">Nuestro menú</div>
          <h2 className="lx-section__h2">Lo mejor<br/><em>de la casa</em></h2>
          <p className="lx-section__p">Seleccionamos los mejores ingredientes para crear cada bebida con dedicación.</p>
          {clienteSession ? (
            <div className="lx-catcards-wrap">
              <button className={`lx-catcards-arrow lx-catcards-arrow--left ${canScrollLeft ? 'lx-catcards-arrow--vis' : ''}`} onClick={() => scrollCats(-1)} aria-label="Anteriores">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="lx-catcards-track" ref={catScrollRef} onScroll={updateCatScroll}>
                <button className={`lx-catcard lx-catcard--all ${activeCat === 'Todos' ? 'lx-catcard--on' : ''}`} onClick={() => setActiveCat('Todos')}>
                  <div className="lx-catcard__all-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div>
                  <span className="lx-catcard__name">Todos</span>
                  <span className="lx-catcard__count">{PRODUCTS.length} productos</span>
                  <span className="lx-catcard__cta">Ver menú →</span>
                </button>
                {CATEGORIAS_DATA.map(cat => {
                  const count = PRODUCTS.filter(p => p.categoria === cat.nombre).length;
                  return (
                    <button key={cat.id} className={`lx-catcard ${activeCat === cat.nombre ? 'lx-catcard--on' : ''}`} onClick={() => setActiveCat(cat.nombre)}>
                      <div className="lx-catcard__img-wrap"><img src={cat.imagen} alt={cat.nombre} className="lx-catcard__img" onError={e => { e.target.style.display='none'; }}/><div className="lx-catcard__overlay"/></div>
                      <div className="lx-catcard__body">
                        <span className="lx-catcard__name">{cat.nombre}</span>
                        {cat.descripcion && <span className="lx-catcard__desc">{cat.descripcion}</span>}
                        <span className="lx-catcard__count">{count} producto{count!==1?'s':''}</span>
                        <span className="lx-catcard__cta">Ver {cat.nombre} →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button className={`lx-catcards-arrow lx-catcards-arrow--right ${canScrollRight ? 'lx-catcards-arrow--vis' : ''}`} onClick={() => scrollCats(1)} aria-label="Más categorías">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          ) : (
            <div className="lx-cats">{cats.map(c => <button key={c} className={`lx-cat ${activeCat===c?"lx-cat--on":""}`} onClick={() => setActiveCat(c)}>{c}</button>)}</div>
          )}
          <div className="lx-grid">
            {shown.map(p => {
              const pd = p.descuento > 0 ? Math.round(p.precio * (1 - p.descuento / 100)) : null;
              const precioCarrito = pd || p.precio;
              return (
              <div className="lx-card" key={p.id}>
                <div className="lx-card__img-wrap">
                  <img src={p.imagen||p.img||""} alt={p.nombre} className="lx-card__img" onError={e=>{e.target.src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80"}}/>
                  {p.descuento > 0 && (
                    <span style={{position:'absolute',top:10,left:10,background:'#E53935',color:'white',fontSize:11,fontWeight:800,padding:'3px 9px',borderRadius:20,zIndex:2}}>
                      -{p.descuento}%
                    </span>
                  )}
                </div>
                <div className="lx-card__body">
                  <div className="lx-card__cat">{p.categoria}</div>
                  <h3 className="lx-card__name">{p.nombre}</h3>
                  {p.descripcion && <p className="lx-card__desc">{p.descripcion}</p>}
                  <div className="lx-card__foot">
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {pd ? (
                        <>
                          <span className="lx-card__price" style={{color:'#E53935'}}>{fmt(pd)}</span>
                          <span style={{fontSize:11,color:'#bbb',textDecoration:'line-through',lineHeight:1}}>{fmt(p.precio)}</span>
                        </>
                      ) : (
                        <span className="lx-card__price">{fmt(p.precio)}</span>
                      )}
                    </div>
                    <button className="lx-card__add" onClick={() => (TOPPINGS_DISP.length > 0 || ADICIONES_DISP.length > 0) ? openPersonalizar({...p,precio:precioCarrito}) : addToCart({...p,precio:precioCarrito})}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Nosotros ── */}
      <section id="nosotros" className="lx-section lx-about">
        <div className="lx-section__in lx-about__in">
          <div className="lx-about__img-wrap">
            <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80" alt="barista" className="lx-about__img"/>
            <div className="lx-about__badge"><div className="lx-about__badge-n">3+</div><div className="lx-about__badge-l">años de pasión</div></div>
          </div>
          <div className="lx-about__text">
            <div className="lx-section__tag">Nuestra historia</div>
            <h2 className="lx-section__h2">Más que<br/><em>un café</em></h2>
            <p>Café Don Berna nació de la pasión por el café de especialidad y el deseo de crear un espacio donde cada persona encontrara su bebida perfecta. Comenzamos en 2023 con una pequeña barra y un sueño grande.</p>
            <p style={{marginTop:16}}>Hoy somos el referente de cafetería artesanal en Medellín, con un menú que mezcla lo clásico y lo innovador.</p>
            <div className="lx-about__chips">{["Ingredientes naturales","Baristas certificados","Recetas propias","Comercio justo"].map(c => <span className="lx-about__chip" key={c}>✓ {c}</span>)}</div>
          </div>
        </div>
      </section>

      {/* ── Reseñas ── */}
      <section className="lx-section lx-reviews">
        <div className="lx-section__in">
          <div className="lx-reviews-header">
            <div>
              <div className="lx-section__tag">Testimonios</div>
              <h2 className="lx-section__h2">Lo que dicen<br/><em>nuestros clientes</em></h2>
            </div>
            {clienteSession && !resenasService.yaReseño(clienteSession.id) && (
              <button className="lx-review-add-btn" onClick={() => setShowReviewForm(v => !v)}>{showReviewForm ? '✕ Cancelar' : '✏️ Dejar mi reseña'}</button>
            )}
            {clienteSession && resenasService.yaReseño(clienteSession.id) && (
              <div className="lx-review-done-badge">✓ Ya dejaste tu reseña</div>
            )}
          </div>
          {showReviewForm && clienteSession && (
            <form className="lx-review-form" onSubmit={handleSubmitReview}>
              <div className="lx-review-form__top">
                <div className="lx-review__av" style={{width:44,height:44,fontSize:18}}>{clienteSession.nombre.charAt(0).toUpperCase()}</div>
                <div><div style={{fontWeight:700,fontSize:14,color:'var(--ink)'}}>{clienteSession.nombre}</div><div style={{fontSize:12,color:'var(--muted)'}}>Cliente verificado</div></div>
              </div>
              <div className="lx-review-stars-pick">
                <span style={{fontSize:13,color:'var(--muted)',fontWeight:600}}>Tu calificación:</span>
                <div className="lx-stars-row">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" className={`lx-star-btn ${n <= (reviewHover || reviewForm.estrellas) ? 'lx-star-btn--on' : ''}`}
                      onMouseEnter={() => setReviewHover(n)} onMouseLeave={() => setReviewHover(0)}
                      onClick={() => setReviewForm(f => ({...f, estrellas: n}))}>★</button>
                  ))}
                </div>
              </div>
              <textarea className="lx-review-textarea" placeholder="Cuéntanos tu experiencia..." value={reviewForm.texto} onChange={e => setReviewForm(f => ({...f, texto: e.target.value}))} rows={4} maxLength={400}/>
              <div style={{fontSize:11,color:'var(--muted)',textAlign:'right',marginTop:4}}>{reviewForm.texto.length}/400</div>
              {reviewError   && <div className="lx-modal__err" style={{marginTop:8}}>{reviewError}</div>}
              {reviewSuccess && <div className="lx-modal__ok"  style={{marginTop:8}}>{reviewSuccess}</div>}
              <button type="submit" className="lx-btn" disabled={reviewLoading} style={{marginTop:12,alignSelf:'flex-end'}}>{reviewLoading ? 'Enviando...' : 'Publicar reseña →'}</button>
            </form>
          )}
          {(() => {
            const totalResenas = resenas.length;
            const promedio     = totalResenas ? (resenas.reduce((s,r) => s+(r.estrellas??5),0)/totalResenas) : 0;
            const totalPages   = Math.ceil(totalResenas / REVIEWS_PER_PAGE);
            const paginadas    = resenas.slice((reviewPage-1)*REVIEWS_PER_PAGE, reviewPage*REVIEWS_PER_PAGE);
            return (
              <>
                {totalResenas > 0 && (
                  <div className="lx-rating-summary">
                    <span className="lx-rating-summary__num">{promedio.toFixed(1)}</span>
                    <div className="lx-rating-summary__stars">{[1,2,3,4,5].map(n => <span key={n} style={{color: n<=Math.round(promedio)?"#4CAF50":"rgba(255,255,255,0.1)"}}>★</span>)}</div>
                    <span className="lx-rating-summary__total">({totalResenas} reseña{totalResenas!==1?"s":""})</span>
                  </div>
                )}
                <div className="lx-reviews-grid">
                  {paginadas.map((r, i) => (
                    <div className="lx-review" key={r.id ?? i}>
                      <div className="lx-review__stars">{'★'.repeat(r.estrellas ?? 5)}{'☆'.repeat(5-(r.estrellas??5))}</div>
                      <p className="lx-review__txt">"{r.texto ?? r.txt}"</p>
                      <div className="lx-review__author">
                        <div className="lx-review__av">{(r.nombre ?? r.name).charAt(0)}</div>
                        <div><div className="lx-review__name">{r.nombre ?? r.name}</div><div className="lx-review__role">{r.rol ?? r.role}</div></div>
                        {r.clienteId && <div className="lx-review__verified" title="Cliente verificado">✓</div>}
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="lx-review-pagination">
                    <button className="lx-review-page-btn" disabled={reviewPage===1} onClick={() => setReviewPage(p=>p-1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                    {Array.from({length:totalPages},(_,i)=>i+1).map(p => <button key={p} className={`lx-review-page-btn ${reviewPage===p?'lx-review-page-btn--on':''}`} onClick={() => setReviewPage(p)}>{p}</button>)}
                    <button className="lx-review-page-btn" disabled={reviewPage===totalPages} onClick={() => setReviewPage(p=>p+1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* ── Contacto ── */}
      <section id="contacto" className="lx-section lx-contact">
        <div className="lx-section__in lx-contact__in">
          <div>
            <div className="lx-section__tag">Encuéntranos</div>
            <h2 className="lx-section__h2">Visítanos</h2>
            <div className="lx-contact__items">
              {[
  {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,t:"Dirección",v:"Calle 10A #52-44, en frente del D1"},
  {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,t:"Horario",v:"Lun–Sáb 7am–8pm · Dom 8am–6pm"},
  {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.24 2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,t:"Teléfono",v:"324 644 4774"},
  {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,t:"Correo",v:"sebastiancastano9704@gmail.com"},
  {icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,t:"Propietario",v:"Sebastian Castaño Palacio"}
].map((item,i) => (
                <div className="lx-contact__item" key={i}><span className="lx-contact__icon">{item.icon}</span><div><div className="lx-contact__label">{item.t}</div><div className="lx-contact__val">{item.v}</div></div></div>
              ))}
            </div>
          </div>
          <div className="lx-contact__cta-box">
            <h3>¿Listo para ordenar?</h3>
            <p>Crea tu cuenta y pide tu bebida favorita a domicilio.</p>
            {clienteSession
              ? <button className="lx-btn" onClick={() => document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}>Ver el menú →</button>
              : <button className="lx-btn" onClick={() => { setModal("auth"); setAuthTab("register"); }}>Crear cuenta gratis →</button>
            }
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lx-footer">
        <div className="lx-footer__in">
          <div>
            <div className="lx-logo" style={{marginBottom:12}}><span className="lx-logo__s"><img src="/img/Logotipo_blanco.png" alt="Café Don Berna" style={{width:32,height:32,objectFit:'contain',filter:'none',display:'block'}}/></span><span className="lx-logo__rest" style={{fontSize:11,letterSpacing:2}}>CAFÉ DON BERNA</span></div>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",maxWidth:260}}>Cafetería artesanal · Cafe Don Berna, en el corazón de Medellín.</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.28)",maxWidth:260,marginTop:5}}>Calle 10A #52-44, en frente del D1</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.28)",maxWidth:260,marginTop:2}}>Propietario: Sebastian Castaño Palacio</p>
          </div>
          <div className="lx-footer__links"><a href="#menu">Menú</a><a href="#nosotros">Nosotros</a><a href="#contacto">Contacto</a></div>
        </div>
        <div className="lx-footer__bar">© 2025 Café Don Berna · Todos los derechos reservados.</div>
      </footer>

      {/* ── Carrito drawer ── */}
      <div className={`lx-mask ${cartOpen?"lx-mask--on":""}`} onClick={() => setCartOpen(false)}/>
      <div className={`lx-drawer ${cartOpen?"lx-drawer--open":""}`}>
        <div className="lx-drawer__top">
          <div><h3>Carrito</h3>{cartCount>0&&<span className="lx-drawer__cnt">{cartCount} {cartCount===1?"producto":"productos"}</span>}</div>
          <button className="lx-drawer__x" onClick={() => setCartOpen(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="lx-drawer__body">
          {cart.length === 0 ? (
            <div className="lx-drawer__nil">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              <p>Tu carrito está vacío</p>
              <button className="lx-btn lx-btn--sm" onClick={() => { setCartOpen(false); document.getElementById("menu")?.scrollIntoView({behavior:"smooth"}); }}>Ver menú</button>
            </div>
          ) : (
            <div className="lx-drawer__list">
              {cart.map(item => {
                const imgSrc = item.imagen || item.img || null;
                const nombre = item.nombre || item.name || 'Producto';
                const precio = (item.precioFinal || item.precio || item.price || 0);
                const precioOriginal = item._precioOriginal || null;
                const ahorro = precioOriginal ? (precioOriginal - precio) * item.qty : null;
                return (
                  <div className="lx-drawer__row" key={item._cartKey || item.id}>
                    <CartThumb src={imgSrc} alt={nombre}/>
                    <div className="lx-drawer__meta">
                      <strong>{nombre}</strong>
                      {Array.isArray(item.toppings) && item.toppings.length > 0 && <span className="lx-drawer__extras">{item.toppings.map(t=>t.nombre).join(", ")}</span>}
                      {Array.isArray(item.adiciones) && item.adiciones.length > 0 && <span className="lx-drawer__addons">{item.adiciones.map(a=>a.nombre).join(", ")}</span>}
                      <span className="lx-drawer__price">{fmt(precio * item.qty)}</span>
                      {ahorro > 0 && (
                        <span style={{fontSize:11,fontWeight:700,color:'#2E7D32',background:'#E8F5E9',padding:'2px 7px',borderRadius:10,marginTop:2,display:'inline-block'}}>
                          Ahorras {fmt(ahorro)}
                        </span>
                      )}
                    </div>
                    <div className="lx-drawer__ctrl">
                      <button onClick={() => updateQty(item._cartKey || item.id,-1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item._cartKey || item.id,+1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="lx-drawer__bot">
            <div className="lx-drawer__total"><span>Total</span><strong>{fmt(cartTotal)}</strong></div>
            {!clienteSession && <p className="lx-drawer__login-hint">Inicia sesión para finalizar tu pedido</p>}
            <button className="lx-btn lx-btn--full" onClick={finalizarPedido}>{clienteSession?"Proceder al pago →":"Iniciar sesión y pagar →"}</button>
            <button className="lx-drawer__clr" onClick={() => setCart([])}>Vaciar carrito</button>
          </div>
        )}
      </div>

      {/* ── Modal Auth ── */}
      {modal === "auth" && (
        <div className="lx-modal-mask" onClick={() => setModal(null)}>
          <div className="lx-modal" onClick={e => e.stopPropagation()}>
            <button className="lx-modal__x" onClick={() => setModal(null)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <div className="lx-modal__brand"><span className="lx-logo__s"><img src="/img/Logotipo_blanco.png" alt="Café Don Berna" style={{width:28,height:28,objectFit:'contain',filter:'none',display:'block'}}/></span><span className="lx-modal__bname" style={{fontSize:13,letterSpacing:2}}>CAFÉ DON BERNA</span></div>
            <div className="lx-modal__tabs">
              <button className={authTab==="login"?"on":""} onClick={() => { setAuthTab("login"); setAuthError(""); setAuthSuccess(""); }}>Ingresar</button>
              <button className={authTab==="register"?"on":""} onClick={() => { setAuthTab("register"); setAuthError(""); setAuthSuccess(""); }}>Registrarse</button>
            </div>
            {authError && <div className="lx-modal__err">{authError}</div>}
            {authSuccess && <div className="lx-modal__ok">{authSuccess}</div>}
            {authTab==="login" && (
              <form className="lx-form" onSubmit={handleLogin}>
                <div className="lx-field"><label>Correo / Usuario</label><input type="text" placeholder="tu@correo.com o usuario admin" required value={loginData.correo} onChange={e=>setLoginData({...loginData,correo:e.target.value})}/></div>
                <div className="lx-field"><label>Contraseña</label><input type="password" placeholder="••••••••" required value={loginData.password} onChange={e=>setLoginData({...loginData,password:e.target.value})}/></div>
                <button type="submit" className="lx-btn lx-btn--full" disabled={authLoading}>{authLoading?"Ingresando...":"Ingresar"}</button>
              </form>
            )}
            {authTab==="register" && (
              <form className="lx-form" onSubmit={handleRegister}>
                <div className="lx-form__2">
                  <div className="lx-field"><label>Nombre *</label><input type="text" required value={regData.nombre} onChange={e=>setRegData({...regData,nombre:e.target.value})}/></div>
                  <div className="lx-field"><label>Teléfono</label><input type="tel" value={regData.telefono} onChange={e=>setRegData({...regData,telefono:e.target.value})}/></div>
                </div>
                <div className="lx-field"><label>Correo *</label><input type="email" required value={regData.correo} onChange={e=>setRegData({...regData,correo:e.target.value})}/></div>
                <div className="lx-form__2">
                  <div className="lx-field"><label>Tipo de documento</label>
                    <select value={regData.tipoDoc} onChange={e=>setRegData({...regData,tipoDoc:e.target.value})}>
                      <option>Cédula de Ciudadanía</option><option>Tarjeta de Identidad</option><option>Cédula de Extranjería</option>
                    </select>
                  </div>
                  <div className="lx-field"><label>Número de documento *</label><input type="text" required value={regData.numeroDoc} placeholder="Ej: 1234567890" onChange={e=>setRegData({...regData,numeroDoc:e.target.value})}/></div>
                </div>
                <div className="lx-form__2">
                  <div className="lx-field"><label>Departamento</label>
                    <select value={regData.departamento} disabled style={{opacity:1,cursor:'default'}}>
                      <option>Antioquia</option>
                    </select>
                  </div>
                  <div className="lx-field"><label>Municipio</label>
                    <select value={regData.municipio} disabled style={{opacity:1,cursor:'default'}}>
                      <option>Medellín</option>
                    </select>
                  </div>
                </div>
                {/* Comuna — solo comunas 8 y 9 */}
                {regData.municipio === 'Medellín' && (
                  <div className="lx-field">
                    <label>Comuna <span style={{fontSize:11,color:'#a09880',fontWeight:400}}>(servicio disponible solo en comunas 8 y 9)</span></label>
                    <select value={regData.comuna} onChange={e=>setRegData({...regData,comuna:e.target.value})}>
                      <option value="">Seleccionar comuna...</option>
                      <option value="Comuna 8 - Villa Hermosa">Comuna 8 - Villa Hermosa</option>
                      <option value="Comuna 9 - Buenos Aires">Comuna 9 - Buenos Aires</option>
                    </select>
                    {(regData.comuna === 'Comuna 8 - Villa Hermosa' || regData.comuna === 'Comuna 9 - Buenos Aires') && (
                      <p style={{fontSize:12,color:'#81C784',marginTop:4,fontWeight:600}}>
                        ✓ ¡Perfecto! Hacemos domicilios a tu zona.
                      </p>
                    )}
                  </div>
                )}
                <div className="lx-field"><label>Dirección</label><input type="text" value={regData.direccion} placeholder="Ej: Calle 10 # 43-20" onChange={e=>setRegData({...regData,direccion:e.target.value})}/></div>
                <div className="lx-form__2">
                  <div className="lx-field"><label>Contraseña *</label><input type="password" required value={regData.password} onChange={e=>setRegData({...regData,password:e.target.value})}/></div>
                  <div className="lx-field"><label>Confirmar *</label><input type="password" required value={regData.confirm} onChange={e=>setRegData({...regData,confirm:e.target.value})}/></div>
                </div>
                <button type="submit" className="lx-btn lx-btn--full" disabled={authLoading}>{authLoading?"Creando...":"Crear cuenta"}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {modal === "logout" && (
        <div className="lx-modal-mask" onClick={() => setModal(null)}>
          <div className="lx-modal" style={{maxWidth:360}} onClick={e => e.stopPropagation()}>
            <div className="lx-logout-modal-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
            <h3 className="lx-logout-modal-title">¿Cerrar sesión?</h3>
            <p className="lx-logout-modal-sub">¿Estás seguro de que deseas salir?</p>
            <div className="lx-logout-modal-actions">
              <button className="lx-btn lx-btn--outline-dark" onClick={() => setModal(null)}>Cancelar</button>
              <button className="lx-btn lx-btn--danger" onClick={handleLogout}>Sí, salir</button>
            </div>
          </div>
        </div>
      )}

      {modal === "perfil" && clienteSession && (() => {
        const fmt2 = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n||0);
        const cliente = clientesService.getById(clienteSession.id);
        const pedidosCliente = pedidosService.getAll().filter(p => p.clienteId === clienteSession.id || p.cliente === clienteSession.nombre).sort((a,b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        const estadoColor = { pendiente:'#f59e0b', en_proceso:'#3b82f6', listo:'#10b981', entregado:'#6b7280', cancelado:'#ef4444' };
        const estadoLabel = { pendiente:'Pendiente', en_proceso:'En proceso', listo:'Listo', entregado:'Entregado', cancelado:'Cancelado' };
        return (
          <div className="lx-modal-mask" onClick={() => setModal(null)}>
            <div className="lx-modal lx-perfil-modal" onClick={e => e.stopPropagation()} style={{maxWidth:520,width:'95%',maxHeight:'90vh',overflowY:'auto',padding:'32px 28px'}}>
              <button className="lx-modal__x" onClick={() => setModal(null)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
                <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,#4CAF50,#2e7d32)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,color:'white',flexShrink:0}}>{clienteSession.nombre.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:18,color:'#f0ece4'}}>{clienteSession.nombre}</div>
                  <div style={{fontSize:13,color:'#a09880'}}>{cliente?.correo}</div>
                  <div style={{fontSize:11,color:'#4CAF50',fontWeight:600,marginTop:2}}>● Cliente activo</div>
                </div>
              </div>
              <div style={{display:'flex',borderBottom:'2px solid rgba(255,255,255,.08)',marginBottom:24,gap:0}}>
                {[["info","👤 Mi perfil"],["historial","📋 Historial"],["editar","✏️ Editar datos"]].map(([tab,label]) => (
                  <button key={tab} onClick={() => { setPerfilTab(tab); setEditError(""); setEditSuccess(""); }} style={{flex:1,padding:'10px 0',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:perfilTab===tab?'#4CAF50':'rgba(255,255,255,.35)',borderBottom:perfilTab===tab?'2px solid #4CAF50':'2px solid transparent',marginBottom:-2,transition:'all .2s'}}>{label}</button>
                ))}
              </div>
              {perfilTab === "info" && (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {[{icon:'📧',label:'Correo',val:cliente?.correo},{icon:'📞',label:'Teléfono',val:cliente?.telefono||'—'},{icon:'📍',label:'Dirección',val:cliente?.direccion||'—'},{icon:'🗺️',label:'Ubicación',val:cliente?.municipio&&cliente?.departamento?`${cliente.municipio}, ${cliente.departamento}`:'—'},{icon:'🪪',label:'Documento',val:cliente?.tipoDoc&&cliente?.numeroDoc?`${cliente.tipoDoc}: ${cliente.numeroDoc}`:'—'},{icon:'📅',label:'Miembro desde',val:cliente?.fechaRegistro?new Date(cliente.fechaRegistro).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'}):'—'}].map(({icon,label,val}) => (
                    <div key={label} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'rgba(255,255,255,.04)',borderRadius:10,border:'1px solid rgba(255,255,255,.07)'}}>
                      <span style={{fontSize:18,width:28,textAlign:'center'}}>{icon}</span>
                      <div><div style={{fontSize:11,color:'rgba(255,255,255,.35)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>{label}</div><div style={{fontSize:14,color:'#f0ece4',fontWeight:500,marginTop:1}}>{val}</div></div>
                    </div>
                  ))}
                  <button className="lx-btn" style={{marginTop:8}} onClick={() => setPerfilTab("editar")}>Editar mis datos →</button>
                </div>
              )}
              {perfilTab === "historial" && (
                <div>
                  {pedidosCliente.length === 0 ? (
                    <div style={{textAlign:'center',padding:'40px 0',color:'var(--muted)'}}><div style={{fontSize:40,marginBottom:12}}>📦</div><div style={{fontWeight:600}}>Aún no tienes pedidos</div><div style={{fontSize:13,marginTop:4}}>¡Haz tu primer pedido desde el menú!</div></div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      <div style={{fontSize:13,color:'var(--muted)',marginBottom:4}}>{pedidosCliente.length} pedido{pedidosCliente.length!==1?'s':''} en total</div>
                      {pedidosCliente.map(p => (
                        <div key={p.id} style={{border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'14px 16px',background:'rgba(255,255,255,.04)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                            <span style={{fontWeight:700,fontSize:13,color:'#f0ece4'}}>Pedido #{p.id}</span>
                            <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,background:estadoColor[p.estado]+'25',color:estadoColor[p.estado]}}>{estadoLabel[p.estado]||p.estado}</span>
                          </div>
                          {Array.isArray(p.productos)&&p.productos.length>0&&<div style={{fontSize:12,color:'#a09880',marginBottom:6}}>{p.productos.map(x=>`${x.nombre||x} x${x.cantidad||1}`).join(' · ')}</div>}
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:12,color:'rgba(255,255,255,.3)'}}>{p.fechaCreacion?new Date(p.fechaCreacion).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}):''}{p.hora?` · ${p.hora}`:''}</span>
                            <span style={{fontWeight:700,fontSize:14,color:'#4CAF50'}}>{fmt2(p.total)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {perfilTab === "editar" && (
                <form onSubmit={handleEditPerfil} style={{display:'flex',flexDirection:'column',gap:14}}>
                  {editError && <div className="lx-modal__err">{editError}</div>}
                  {editSuccess && <div className="lx-modal__ok">{editSuccess}</div>}
                  <div className="lx-field"><label>Nombre completo *</label><input type="text" required value={editData.nombre||""} onChange={e=>setEditData({...editData,nombre:e.target.value})}/></div>
                  <div className="lx-field"><label>Teléfono</label><input type="tel" value={editData.telefono||""} onChange={e=>setEditData({...editData,telefono:e.target.value})}/></div>
                  <div className="lx-field"><label>Dirección</label><input type="text" value={editData.direccion||""} placeholder="Ej: Calle 10 # 43-20" onChange={e=>setEditData({...editData,direccion:e.target.value})}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div className="lx-field"><label>Departamento</label>
                      <select value={editData.departamento||""} onChange={e=>setEditData({...editData,departamento:e.target.value,municipio:""})}>
                        <option value="">Seleccionar</option>
                        {["Antioquia","Bogotá D.C.","Valle del Cauca","Cundinamarca","Atlántico","Bolívar","Santander","Córdoba","Nariño","Risaralda","Tolima","Huila","Cauca"].map(d=><option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="lx-field"><label>Municipio</label><input type="text" value={editData.municipio||""} placeholder="Tu ciudad" onChange={e=>setEditData({...editData,municipio:e.target.value})}/></div>
                  </div>
                  <button type="submit" className="lx-btn lx-btn--full" disabled={editLoading} style={{marginTop:4}}>{editLoading?"Guardando...":"Guardar cambios"}</button>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modal: producto duplicado en carrito ── */}
      {modalDuplicar && (
        <div className="lx-modal-mask" onClick={() => setModalDuplicar(null)}>
          <div className="lx-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <button className="lx-modal__x" onClick={() => setModalDuplicar(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div style={{textAlign:'center',padding:'8px 0 16px'}}>
              <div style={{fontSize:32,marginBottom:8}}>☕</div>
              <h3 style={{fontSize:17,fontWeight:700,margin:'0 0 6px'}}>{modalDuplicar.nombre}</h3>
              <p style={{fontSize:13,color:'var(--lx-muted)',margin:'0 0 20px'}}>
                Ya tienes este producto en el carrito.<br/>¿Qué quieres hacer?
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {/* Agregar uno igual */}
                <button
                  className="lx-btn lx-btn--full"
                  onClick={() => {
                    const prod = modalDuplicar;
                    const prodOriginal = productosService.getById(prod.id);
                    const precioOriginal = prodOriginal && descuentoVigente(prodOriginal) ? prodOriginal.precio : null;
                    const cartKey = `${prod.id}-${Date.now()}`;
                    setCart(prev => [...prev, {...prod, qty:1, toppings:[], adiciones:[], precioFinal:prod.precio||prod.price, _precioOriginal: precioOriginal, _cartKey: cartKey}]);
                    showToast(`${prod.nombre} agregado`);
                    setModalDuplicar(null);
                  }}
                  style={{justifyContent:'center'}}>
                  Agregar uno igual (sin adiciones)
                </button>
                {/* Agregar uno personalizado */}
                {(TOPPINGS_DISP.length > 0 || ADICIONES_DISP.length > 0) && (
                  <button
                    className="lx-btn lx-btn--full"
                    style={{background:'rgba(76,175,80,0.15)',color:'#4CAF50',border:'1.5px solid rgba(76,175,80,0.3)',justifyContent:'center'}}
                    onClick={() => {
                      setModalDuplicar(null);
                      setModalPersonalizar(modalDuplicar);
                    }}>
                    Agregar uno con adiciones diferentes
                  </button>
                )}
                {/* Cancelar */}
                <button
                  style={{background:'none',border:'none',color:'var(--lx-muted)',fontSize:13,cursor:'pointer',padding:'4px 0'}}
                  onClick={() => setModalDuplicar(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalPersonalizar && (
        <div className="lx-modal-mask" onClick={() => setModalPersonalizar(null)}>
          <div className="lx-modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <button className="lx-modal__x" onClick={() => setModalPersonalizar(null)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <LxPersonalizar producto={modalPersonalizar} toppings={TOPPINGS_DISP} adiciones={getAdicionesPorProducto(modalPersonalizar)} onAdd={addToCartWithExtras} onClose={() => setModalPersonalizar(null)}/>
          </div>
        </div>
      )}
    </div>
  );
}