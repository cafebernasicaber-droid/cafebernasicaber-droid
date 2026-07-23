import React, { useState, useEffect } from 'react';
import Layout from '../../../shared/components/Layout';
import fichasTecnicasService from '../services/fichasTecnicasService';
import productosService from '../../productos/services/productosService';
import insumosService from '../../insumos/services/insumosService';
import '../../insumos/pages/InsumosPage.css';

const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n||0);
const fmtFecha = iso => iso ? new Intl.DateTimeFormat('es-CO',{dateStyle:'medium'}).format(new Date(iso)) : '—';

// El backend puede devolver el identificador como `id_ficha` o como `id`
// según el endpoint. Este helper evita que el frontend rompa si el nombre
// del campo cambia — antes se asumía siempre `id_ficha` y al ser `undefined`
// fallaban tanto el borrado (500 "sintaxis no válida para integer") como
// las keys de React (todas las filas compartían la misma key undefined).
const getFichaId = f => f?.id_ficha ?? f?.id;

// ── FORM MODAL ──────────────────────────────────────────────────────────────
function ModalFichaForm({ fichaInicial, onSave, onClose }) {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos]     = useState([]);
  useEffect(() => {
    productosService.getAll().then(d => setProductos(Array.isArray(d) ? d.filter(p=>p.estado==='Activo') : [])).catch(()=>{});
    insumosService.getAll().then(d => setInsumos(Array.isArray(d) ? d : [])).catch(()=>{});
  }, []);
  const def = fichaInicial ? {
    id_producto: String(fichaInicial.id_producto),
    categoria_prep: fichaInicial.categoria_prep,
    porciones: String(fichaInicial.porciones),
    tiempo_prep: String(fichaInicial.tiempo_prep),
    costo_estimado: String(fichaInicial.costo_estimado),
    estado: fichaInicial.estado,
    notas: fichaInicial.notas || '',
    resumen_prep: fichaInicial.resumen_prep || '',
    preparacion: fichaInicial.preparacion || '',
    // Antes: fichaInicial.insumos.map(...) — si el backend no traía el
    // arreglo `insumos` en la ficha, esto tronaba al abrir "Editar".
    insumos: (fichaInicial.insumos || []).map(i => ({ id_insumo: String(i.id_insumo), cantidad: String(i.cantidad), unidad: i.unidad })),
  } : {
    id_producto:'', categoria_prep:'Caliente', porciones:'1', tiempo_prep:'5',
    costo_estimado:'', estado:true, notas:'', resumen_prep:'', preparacion:'',
    insumos:[{ id_insumo:'', cantidad:'', unidad:'g' }],
  };

  const [form, setForm] = useState(def);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const prodSel = productos.find(p => p.id === Number(form.id_producto));
  const setF = (k, v) => { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:''})); };
  const addIns = () => setForm(f => ({...f, insumos:[...f.insumos, {id_insumo:'',cantidad:'',unidad:'g'}]}));
  const removeIns = i => setForm(f => ({...f, insumos:f.insumos.filter((_,idx)=>idx!==i)}));
  const setIns = (i,k,v) => setForm(f => { const ins=[...f.insumos]; ins[i]={...ins[i],[k]:v}; return {...f,insumos:ins}; });

  const validate = () => {
    const er = {};
    if (!form.id_producto) er.id_producto = 'Selecciona un producto';
    if (!form.porciones || isNaN(form.porciones) || Number(form.porciones)<1) er.porciones = 'Número ≥ 1';
    if (!form.tiempo_prep || isNaN(form.tiempo_prep) || Number(form.tiempo_prep)<1) er.tiempo_prep = 'Número ≥ 1';
    if (!form.costo_estimado || isNaN(form.costo_estimado)) er.costo_estimado = 'Valor numérico requerido';
    if (!form.preparacion.trim()) er.preparacion = 'La preparación es obligatoria';
    if (form.insumos.some(i => !i.id_insumo || !i.cantidad || isNaN(i.cantidad))) er.insumos = 'Completa todos los insumos';
    setErrors(er); return Object.keys(er).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault(); if (!validate()) return;
    setLoading(true); await new Promise(r => setTimeout(r, 600)); setLoading(false);
    const data = { ...form, id_producto:Number(form.id_producto), porciones:Number(form.porciones), tiempo_prep:Number(form.tiempo_prep), costo_estimado:Number(form.costo_estimado) };
    const r = fichaInicial ? await fichasTecnicasService.update(getFichaId(fichaInicial), data) : await fichasTecnicasService.create(data);
    if (r.error) { setErrors({general:r.error}); return; }
    onSave(r.data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)', borderRadius:18, width:'100%', maxWidth:720,
        maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,.5)', animation:'popIn .22s ease',
      }}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 28px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,#4CAF50,#388E3C)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:'var(--text-primary)'}}>{fichaInicial ? 'Editar ficha técnica' : 'Nueva ficha técnica'}</div>
              <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>{fichaInicial ? `Modificando: ${productos.find(p=>p.id===fichaInicial.id_producto)?.nombre}` : 'Registra los ingredientes y el proceso de preparación'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'var(--bg-hover)',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body - form */}
        <form onSubmit={handleSubmit} style={{padding:'20px 28px'}}>
          {errors.general && <div style={{background:'rgba(229,57,53,0.12)',color:'var(--color-red)',padding:'10px 16px',borderRadius:8,marginBottom:20,fontSize:13}}>⚠ {errors.general}</div>}

          {/* 1. Producto */}
          <div className="insumos-card" style={{padding:'20px 24px',marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>1. Producto</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>Producto *</label>
                <select value={form.id_producto} onChange={e => setF('id_producto', e.target.value)}
                  style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${errors.id_producto?'#EF5350':'var(--border-input)'}`,borderRadius:8,fontSize:13,outline:'none',background:'var(--bg-input)',color:'var(--text-primary)'}}>
                  <option value="">— Seleccionar —</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>)}
                </select>
                {errors.id_producto && <div style={{fontSize:11,color:'#E53935',marginTop:3}}>{errors.id_producto}</div>}
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>Tipo de preparación</label>
                <select value={form.categoria_prep} onChange={e => setF('categoria_prep', e.target.value)}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border-input)',borderRadius:8,fontSize:13,outline:'none',background:'var(--bg-input)',color:'var(--text-primary)'}}>
                  {['Caliente','Frío','Batido','Al vapor','Sin preparación'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {prodSel && (
              <div style={{background:'var(--color-green-glow)',borderRadius:8,padding:'10px 14px',marginTop:10,display:'flex',gap:20,fontSize:13,flexWrap:'wrap'}}>
                <span><strong>Nombre:</strong> {prodSel.nombre}</span>
                <span><strong>Categoría:</strong> {prodSel.categoria}</span>
                <span><strong>Precio venta:</strong> <span style={{color:'var(--color-green)',fontWeight:700}}>{fmt(prodSel.precio)}</span></span>
                {form.costo_estimado && !isNaN(form.costo_estimado) && <span><strong>Margen:</strong> <span style={{color:'var(--color-green)',fontWeight:700}}>{fmt(prodSel.precio - Number(form.costo_estimado))}</span></span>}
              </div>
            )}
          </div>

          {/* 2. Parámetros */}
          <div className="insumos-card" style={{padding:'20px 24px',marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>2. Parámetros de producción</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12}}>
              {[['Porciones *','porciones','number'],['Tiempo (min) *','tiempo_prep','number'],['Costo estimado (COP) *','costo_estimado','number']].map(([label,key,type]) => (
                <div key={key}>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>{label}</label>
                  <input type={type} min="0" value={form[key]} onChange={e => setF(key, e.target.value)}
                    style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${errors[key]?'#EF5350':'var(--border-input)'}`,borderRadius:8,fontSize:13,outline:'none',background:'var(--bg-input)',color:'var(--text-primary)'}}/>
                  {errors[key] && <div style={{fontSize:11,color:'#E53935',marginTop:3}}>{errors[key]}</div>}
                </div>
              ))}
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>Estado</label>
                <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8}}>
                  <button type="button" className={`toggle-btn ${form.estado?'toggle-on':'toggle-off'}`} onClick={() => setF('estado', !form.estado)}><span className="toggle-thumb"/></button>
                  <span style={{fontSize:13,fontWeight:600,color:form.estado?'var(--color-green)':'var(--text-muted)'}}>{form.estado?'Activa':'Inactiva'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Insumos */}
          <div className="insumos-card" style={{padding:'20px 24px',marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>3. Insumos requeridos</div>
            {errors.insumos && <div style={{fontSize:12,color:'#E53935',marginBottom:10}}>{errors.insumos}</div>}
            <div style={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr auto',gap:8,marginBottom:6}}>
              {['Insumo','Cantidad','Unidad',''].map((h,i) => <div key={i} style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.5}}>{h}</div>)}
            </div>
            {form.insumos.map((ins, i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr auto',gap:8,marginBottom:8}}>
                <select value={ins.id_insumo} onChange={e => { setIns(i,'id_insumo',e.target.value); if(e.target.value){const found=insumos.find(ins=>String(ins.id)===String(e.target.value));if(found)setIns(i,'unidad',found.unidadMedida||'g');} }}
                  style={{padding:'9px 10px',border:'1.5px solid var(--border-input)',borderRadius:8,fontSize:12,outline:'none',background:'var(--bg-input)',color:'var(--text-primary)'}}>
                  <option value="">— Seleccionar —</option>
                  {insumos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <input type="number" min="0" step="0.1" placeholder="Cant." value={ins.cantidad} onChange={e => setIns(i,'cantidad',e.target.value)}
                  style={{padding:'9px 10px',border:'1.5px solid var(--border-input)',borderRadius:8,fontSize:12,outline:'none',background:'var(--bg-input)',color:'var(--text-primary)'}}/>
                <select value={ins.unidad} onChange={e => setIns(i,'unidad',e.target.value)}
                  style={{padding:'9px 10px',border:'1.5px solid var(--border-input)',borderRadius:8,fontSize:12,outline:'none',background:'var(--bg-input)',color:'var(--text-primary)'}}>
                  {['g','kg','ml','l','und','cdta','cda','taza'].map(u => <option key={u}>{u}</option>)}
                </select>
                <button type="button" onClick={() => removeIns(i)} disabled={form.insumos.length===1}
                  style={{padding:'6px 10px',borderRadius:8,border:'1.5px solid #ffcdd2',background:'rgba(229,57,53,0.12)',color:'#EF5350',cursor:'pointer',fontSize:12,opacity:form.insumos.length===1?0.4:1}}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addIns}
              style={{marginTop:6,padding:'7px 14px',background:'transparent',border:'1.5px dashed #4CAF50',borderRadius:8,color:'#4CAF50',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar insumo
            </button>
          </div>

          {/* 4. Preparación */}
          <div className="insumos-card" style={{padding:'20px 24px',marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>4. Proceso de preparación</div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>Resumen</label>
              <input type="text" value={form.resumen_prep} onChange={e => setF('resumen_prep', e.target.value)} placeholder="Descripción corta del proceso..."
                style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border-input)',borderRadius:8,fontSize:13,outline:'none',background:'var(--bg-input)',color:'var(--text-primary)'}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:5}}>Pasos detallados *</label>
              <textarea value={form.preparacion} onChange={e => setF('preparacion', e.target.value)} rows={4}
                placeholder={'1. Primer paso...\n2. Segundo paso...\n3. Tercer paso...'}
                style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${errors.preparacion?'#EF5350':'var(--border-input)'}`,borderRadius:8,fontSize:13,outline:'none',resize:'vertical',background:'var(--bg-input)',color:'var(--text-primary)'}}/>
              {errors.preparacion && <div style={{fontSize:11,color:'#E53935',marginTop:3}}>{errors.preparacion}</div>}
            </div>
          </div>

          {/* 5. Notas */}
          <div className="insumos-card" style={{padding:'20px 24px',marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:14}}>5. Notas opcionales</div>
            <textarea value={form.notas} onChange={e => setF('notas', e.target.value)} rows={3}
              placeholder="Temperatura de servicio, variaciones, observaciones..."
              style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border-input)',borderRadius:8,fontSize:13,outline:'none',resize:'vertical',background:'var(--bg-input)',color:'var(--text-primary)'}}/>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-add" disabled={loading}>
              {loading ? '⏳ Guardando...' : fichaInicial ? '💾 Actualizar ficha' : '+ Registrar ficha técnica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── DETALLE MODAL ────────────────────────────────────────────────────────────
function ModalDetalleFicha({ ficha, onClose, onEditar, onAnular }) {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos]     = useState([]);
  useEffect(() => {
    productosService.getAll().then(d => setProductos(Array.isArray(d) ? d : [])).catch(()=>{});
    insumosService.getAll().then(d => setInsumos(Array.isArray(d) ? d : [])).catch(()=>{});
  }, []);
  const p = productos.find(x => x.id === ficha.id_producto);
  const pasos = (ficha.preparacion || '').split('\n').filter(x => x.trim());
  // Antes: ficha.insumos (sin respaldo) — si el backend no traía el
  // arreglo, tronaba al abrir el detalle de esa ficha.
  const fichaInsumos = ficha.insumos || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)', borderRadius:18, width:'100%', maxWidth:680,
        maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 24px 64px rgba(0,0,0,.5)', animation:'popIn .22s ease',
      }}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#4CAF50,#388E3C)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',flexShrink:0}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:'var(--text-primary)'}}>{p?.nombre || 'Ficha técnica'}</div>
              <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>{ficha.categoria_prep} · {ficha.porciones} porción{ficha.porciones>1?'es':''} · {ficha.tiempo_prep} min</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="btn-add" onClick={onEditar} style={{padding:'7px 14px',fontSize:12}}>✏️ Editar</button>
            <button className="btn-confirm-danger" onClick={onAnular} style={{padding:'7px 14px',fontSize:12,borderRadius:8}}>✕ Stop</button>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'var(--bg-hover)',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div style={{background:'var(--bg-surface-2)',borderRadius:12,padding:'16px 18px',border:'1px solid var(--border)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10}}>Información general</div>
              {[['Producto',p?.nombre||'—'],['Categoría',p?.categoria||'—'],['Tipo prep.',ficha.categoria_prep],['Registrada',fmtFecha(ficha.fecha_registro)]].map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <span style={{color:'var(--text-secondary)',fontWeight:600}}>{k}</span>
                  <span style={{color:'var(--text-primary)',fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:'var(--bg-surface-2)',borderRadius:12,padding:'16px 18px',border:'1px solid var(--border)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10}}>Costos y márgenes</div>
              {[['Precio de venta',fmt(p?.precio||0),true],['Costo estimado',fmt(ficha.costo_estimado),false],['Margen estimado',fmt((p?.precio||0)-ficha.costo_estimado),true]].map(([k,v,green]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <span style={{color:'var(--text-secondary)',fontWeight:600}}>{k}</span>
                  <span style={{color:green?'var(--color-green)':'var(--text-primary)',fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:'var(--bg-surface-2)',borderRadius:12,padding:'16px 18px',border:'1px solid var(--border)',marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10}}>Insumos requeridos ({fichaInsumos.length})</div>
            {fichaInsumos.length === 0 && (
              <p style={{fontSize:13,color:'var(--text-muted)',margin:0}}>Esta ficha no tiene insumos registrados.</p>
            )}
            {fichaInsumos.map((ins, i) => {
              const insumo = insumos.find(s => s.id === ins.id_insumo);
              return (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',borderRadius:6,background:i%2===0?'var(--bg-hover)':'transparent',fontSize:13}}>
                  <span style={{fontWeight:600,color:'var(--text-primary)'}}>{insumo?.nombre||`Insumo #${ins.id_insumo}`}</span>
                  <span style={{color:'var(--text-secondary)'}}>{ins.cantidad} {ins.unidad}</span>
                </div>
              );
            })}
          </div>

          <div style={{background:'var(--bg-surface-2)',borderRadius:12,padding:'16px 18px',border:'1px solid var(--border)',marginBottom:ficha.notas?14:0}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10}}>Proceso de preparación</div>
            {ficha.resumen_prep && <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:10}}>{ficha.resumen_prep}</p>}
            <ol style={{paddingLeft:20,margin:0}}>
              {pasos.map((paso,i) => <li key={i} style={{fontSize:13,color:'var(--text-primary)',marginBottom:7,lineHeight:1.6}}>{paso.replace(/^\d+\.\s*/,'')}</li>)}
            </ol>
          </div>

          {ficha.notas && (
            <div style={{background:'var(--bg-surface-2)',borderRadius:12,padding:'14px 18px',border:'1px solid rgba(245,176,0,0.35)',marginTop:14}}>
              <div style={{fontWeight:700,marginBottom:6,color:'var(--text-primary)'}}>💡 Notas</div>
              <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,margin:0}}>{ficha.notas}</p>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
            <button className="btn-cancel" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function FichasTecnicasPage() {
  const [fichas, setFichas]         = useState([]);
  const [query, setQuery]           = useState('');
  const [modal, setModal]           = useState(null); // null | 'ver' | 'nuevo' | 'editar'
  const [fichaActual, setFichaActual] = useState(null);
  const [deleteTarget, setDel]      = useState(null);
  const [success, setSuccess]       = useState('');
  const [page, setPage]             = useState(1);
  const PER_PAGE = 4;

  const refresh  = () => { fichasTecnicasService.getAll().then(d => setFichas(Array.isArray(d) ? d : [])).catch(()=>{}); };
  const showOk   = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const closeModal = () => { setModal(null); setFichaActual(null); };

  // Antes: stats.avgTiempo se usaba en el header de estadísticas pero nunca
  // se calculaba (quedaba "undefined min"). Ahora se calcula el promedio real.
  const stats = {
    total: fichas.length,
    activas: fichas.filter(f=>f.estado).length,
    inactivas: fichas.filter(f=>!f.estado).length,
    avgTiempo: fichas.length ? Math.round(fichas.reduce((s,f)=>s+(f.tiempo_prep||0),0) / fichas.length) : 0,
  };

  const [productos, setProductos] = useState([]);
  const [insumos,   setInsumos]   = useState([]);
  useEffect(() => {
    productosService.getAll().then(d => setProductos(Array.isArray(d) ? d : [])).catch(()=>{});
    insumosService.getAll().then(d => setInsumos(Array.isArray(d) ? d : [])).catch(()=>{});
  }, []);
  const getProd   = id => productos.find(p => p.id === id);

  const displayed = query.trim()
    ? fichas.filter(f => { const p = getProd(f.id_producto); return (p?.nombre||'').toLowerCase().includes(query.toLowerCase()) || f.categoria_prep.toLowerCase().includes(query.toLowerCase()); })
    : fichas;

  const totalPages = Math.ceil(displayed.length / PER_PAGE);
  const paginated  = displayed.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async () => {
    await fichasTecnicasService.remove(getFichaId(deleteTarget));
    refresh(); showOk('Ficha técnica anulada'); setDel(null); closeModal();
  };

  return (
    <Layout>
      <div className="insumos-root">
        {success && <div className="toast toast-success">✓ {success}</div>}

        {/* ── Modales ── */}
        {modal === 'ver' && fichaActual && (
          <ModalDetalleFicha
            ficha={fichaActual}
            onClose={closeModal}
            onEditar={() => setModal('editar')}
            onAnular={() => setDel(fichaActual)}
          />
        )}
        {(modal === 'nuevo' || modal === 'editar') && (
          <ModalFichaForm
            fichaInicial={modal === 'editar' ? fichaActual : null}
            onClose={closeModal}
            onSave={() => { refresh(); showOk(modal === 'editar' ? 'Ficha técnica actualizada' : 'Ficha técnica creada'); closeModal(); }}
          />
        )}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDel(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></div>
              <h3>¿Stop ficha técnica?</h3>
              <p>Esta acción es <strong>permanente</strong>.</p>
              <div className="modal-detail">"{getProd(deleteTarget.id_producto)?.nombre}"</div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDel(null)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleDelete}>Sí, anular</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <h1 className="page-title">Fichas Técnicas</h1>
            <p className="page-subtitle">Gestiona las fichas de preparación de cada producto del menú</p>
          </div>
          <button className="btn-add" onClick={() => { setFichaActual(null); setModal('nuevo'); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva ficha técnica
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[{l:'Total fichas',v:stats.total,c:'#1565C0'},{l:'Activas',v:stats.activas,c:'#2E7D32'},{l:'Inactivas',v:stats.inactivas,c:'#757575'},{l:'Tiempo prom.',v:stats.avgTiempo+' min',c:'#E65100'}].map((s,i) => (
            <div key={i} style={{background:'var(--stat-card-bg)',borderRadius:12,padding:'16px 18px',borderTop:`3px solid ${s.c}`,boxShadow:'var(--stat-card-shadow)',border:`1px solid var(--border)`,borderTopColor:s.c}}>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{s.l}</div>
              <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="insumos-toolbar">
          <div className="search-group">
            <div className="search-wrap">
              <span className="search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input type="text" className="search-input" placeholder="Buscar por producto o tipo de preparación..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}/>
              {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
            </div>
          </div>
          <span style={{fontSize:13,color:'var(--text-muted)',marginLeft:'auto'}}>{displayed.length} ficha{displayed.length!==1?'s':''}</span>
        </div>

        {/* ── Tabla ── */}
        <div className="insumos-card">
          {displayed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{query ? 'Sin coincidencias' : 'No hay fichas técnicas'}</h3>
              <p>Crea fichas técnicas para documentar la preparación de cada producto</p>
              {!query && <button className="btn-add-first" onClick={() => setModal('nuevo')}>Nueva ficha técnica</button>}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="insumos-table">
                <thead><tr><th>Producto</th><th>Categoría</th><th>Tipo prep.</th><th>Porciones</th><th>Tiempo</th><th>Insumos</th><th>Costo</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {paginated.map(f => {
                    const p = getProd(f.id_producto);
                    return (
                      <tr key={getFichaId(f)}>
                        <td>
                          <div className="td-nombre">{p?.nombre||'—'}</div>
                          <div style={{fontSize:11,color:'var(--text-muted)'}}>{p ? fmt(p.precio) : ''}</div>
                        </td>
                        <td><span className="badge-cat">{p?.categoria||'—'}</span></td>
                        <td style={{fontSize:12,color:'var(--text-secondary)'}}>{f.categoria_prep}</td>
                        <td style={{textAlign:'center',fontWeight:600}}>{f.porciones}</td>
                        <td style={{fontWeight:600}}>{f.tiempo_prep} min</td>
                        {/* Antes: f.insumos.length — tronaba si el backend no incluía
                            el arreglo `insumos` en la ficha. Ahora usa respaldo a 0. */}
                        <td><span style={{fontSize:12,color:'var(--text-secondary)'}}>{(f.insumos?.length ?? 0)} ingr.</span></td>
                        <td style={{fontWeight:600,color:'#E65100'}}>{fmt(f.costo_estimado)}</td>
                        <td>
                          <button className={`toggle-btn ${f.estado?'toggle-on':'toggle-off'}`} onClick={async () => { await fichasTecnicasService.toggleEstado?.(getFichaId(f)); refresh(); }} title={f.estado?'Activa':'Inactiva'}>
                            <span className="toggle-thumb"/>
                          </button>
                        </td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-ver" title="Ver detalle" onClick={() => { setFichaActual(f); setModal('ver'); }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="btn-editar" title="Editar" onClick={() => { setFichaActual(f); setModal('editar'); }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="btn-anular" title="Stop" onClick={() => setDel(f)}>✕ Stop</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderTop:'1px solid var(--border)',marginTop:4}}>
              <span style={{fontSize:13,color:'var(--text-muted)'}}>
                Mostrando {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,displayed.length)} de {displayed.length} fichas
              </span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--border-input)',background:page===1?'var(--bg-surface-3)':'var(--bg-surface)',color:page===1?'var(--text-muted)':'var(--text-primary)',cursor:page===1?'not-allowed':'pointer',fontSize:13,fontWeight:600}}>← Ant.</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{padding:'6px 11px',borderRadius:8,border:`1.5px solid ${n===page?'var(--color-green)':'var(--border)'}`,background:n===page?'var(--color-green)':'var(--bg-surface)',color:n===page?'#ffffff':'var(--text-primary)',cursor:'pointer',fontSize:13,fontWeight:700}}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--border-input)',background:page===totalPages?'var(--bg-surface-3)':'var(--bg-surface)',color:page===totalPages?'var(--text-muted)':'var(--text-primary)',cursor:page===totalPages?'not-allowed':'pointer',fontSize:13,fontWeight:600}}>Sig. →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}