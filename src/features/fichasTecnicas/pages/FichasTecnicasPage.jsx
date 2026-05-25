import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import fichasTecnicasService from '../services/fichasTecnicasService';
import productosService from '../../productos/services/productosService';
import insumosService from '../../insumos/services/insumosService';
import '../../insumos/pages/InsumosPage.css';

const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n||0);
const fmtFecha = iso => iso ? new Intl.DateTimeFormat('es-CO',{dateStyle:'medium'}).format(new Date(iso)) : '—';

// ── FORM ────────────────────────────────────────────────────────
function FichaForm({ fichaInicial, onSave, onCancel }) {
  const productos = productosService.getAll().filter(p => p.estado === 'Activo');
  const insumos   = insumosService.getAll();
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
    insumos: fichaInicial.insumos.map(i => ({ id_insumo: String(i.id_insumo), cantidad: String(i.cantidad), unidad: i.unidad })),
  } : {
    id_producto:'', categoria_prep:'Bebida caliente', porciones:'1', tiempo_prep:'5',
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
    const r = fichaInicial ? fichasTecnicasService.update(fichaInicial.id_ficha, data) : fichasTecnicasService.create(data);
    if (r.error) { setErrors({general:r.error}); return; }
    onSave(r.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.general && <div style={{background:'#FFEBEE',color:'#B71C1C',padding:'10px 16px',borderRadius:8,marginBottom:20,fontSize:13}}>⚠ {errors.general}</div>}

      {/* Sección 1: Producto */}
      <div className="insumos-card" style={{padding:'24px 28px',marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:1,marginBottom:16}}>1. Producto</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Producto *</label>
            <select value={form.id_producto} onChange={e => setF('id_producto', e.target.value)}
              style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${errors.id_producto?'#E53935':'#ddd'}`,borderRadius:8,fontSize:13,outline:'none',background:'white'}}>
              <option value="">— Seleccionar —</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>)}
            </select>
            {errors.id_producto && <div style={{fontSize:11,color:'#E53935',marginTop:3}}>{errors.id_producto}</div>}
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Tipo de preparación</label>
            <select value={form.categoria_prep} onChange={e => setF('categoria_prep', e.target.value)}
              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,outline:'none',background:'white'}}>
              {fichasTecnicasService.CAT_PREP.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {prodSel && (
          <div style={{background:'#F1F8E9',borderRadius:8,padding:'12px 16px',marginTop:12,display:'flex',gap:24,fontSize:13}}>
            <span><strong>Nombre:</strong> {prodSel.nombre}</span>
            <span><strong>Categoría:</strong> {prodSel.categoria}</span>
            <span><strong>Precio venta:</strong> <span style={{color:'#2E7D32',fontWeight:700}}>{fmt(prodSel.precio)}</span></span>
            {form.costo_estimado && !isNaN(form.costo_estimado) && <span><strong>Margen:</strong> <span style={{color:'#2E7D32',fontWeight:700}}>{fmt(prodSel.precio - Number(form.costo_estimado))}</span></span>}
          </div>
        )}
      </div>

      {/* Sección 2: Parámetros */}
      <div className="insumos-card" style={{padding:'24px 28px',marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:1,marginBottom:16}}>2. Parámetros de producción</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:14}}>
          {[['Porciones *','porciones','number'],['Tiempo (min) *','tiempo_prep','number'],['Costo estimado (COP) *','costo_estimado','number']].map(([label,key,type]) => (
            <div key={key}>
              <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>{label}</label>
              <input type={type} min="0" value={form[key]} onChange={e => setF(key, e.target.value)}
                style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${errors[key]?'#E53935':'#ddd'}`,borderRadius:8,fontSize:13,outline:'none'}}/>
              {errors[key] && <div style={{fontSize:11,color:'#E53935',marginTop:3}}>{errors[key]}</div>}
            </div>
          ))}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Estado</label>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8}}>
              <button type="button" className={`toggle-btn ${form.estado?'toggle-on':'toggle-off'}`} onClick={() => setF('estado', !form.estado)}><span className="toggle-thumb"/></button>
              <span style={{fontSize:13,fontWeight:600,color:form.estado?'#2E7D32':'#888'}}>{form.estado?'Activa':'Inactiva'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Insumos */}
      <div className="insumos-card" style={{padding:'24px 28px',marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:1,marginBottom:16}}>3. Insumos requeridos</div>
        {errors.insumos && <div style={{fontSize:12,color:'#E53935',marginBottom:10}}>{errors.insumos}</div>}
        <div style={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr auto',gap:8,marginBottom:8}}>
          {['Insumo','Cantidad','Unidad',''].map((h,i) => <div key={i} style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:0.5}}>{h}</div>)}
        </div>
        {form.insumos.map((ins, i) => (
          <div key={i} style={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr auto',gap:8,marginBottom:8}}>
            <select value={ins.id_insumo} onChange={e => { setIns(i,'id_insumo',e.target.value); if(e.target.value){const d=insumosService.getById(Number(e.target.value));if(d)setIns(i,'unidad',d.unidadMedida||'g');} }}
              style={{padding:'9px 10px',border:'1.5px solid #ddd',borderRadius:8,fontSize:12,outline:'none',background:'white'}}>
              <option value="">— Seleccionar —</option>
              {insumos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <input type="number" min="0" step="0.1" placeholder="Cant." value={ins.cantidad} onChange={e => setIns(i,'cantidad',e.target.value)}
              style={{padding:'9px 10px',border:'1.5px solid #ddd',borderRadius:8,fontSize:12,outline:'none'}}/>
            <select value={ins.unidad} onChange={e => setIns(i,'unidad',e.target.value)}
              style={{padding:'9px 10px',border:'1.5px solid #ddd',borderRadius:8,fontSize:12,outline:'none',background:'white'}}>
              {['g','kg','ml','l','und','cdta','cda','taza'].map(u => <option key={u}>{u}</option>)}
            </select>
            <button type="button" onClick={() => removeIns(i)} disabled={form.insumos.length===1}
              style={{padding:'6px 10px',borderRadius:8,border:'1.5px solid #ffcdd2',background:'#FFEBEE',color:'#C62828',cursor:'pointer',fontSize:12,opacity:form.insumos.length===1?0.4:1}}>✕</button>
          </div>
        ))}
        <button type="button" onClick={addIns}
          style={{marginTop:8,padding:'8px 16px',background:'transparent',border:'1.5px dashed #4CAF50',borderRadius:8,color:'#4CAF50',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar insumo
        </button>
      </div>

      {/* Sección 4: Preparación */}
      <div className="insumos-card" style={{padding:'24px 28px',marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:1,marginBottom:16}}>4. Proceso de preparación</div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Resumen</label>
          <input type="text" value={form.resumen_prep} onChange={e => setF('resumen_prep', e.target.value)} placeholder="Descripción corta del proceso..."
            style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,outline:'none'}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Pasos detallados *</label>
          <textarea value={form.preparacion} onChange={e => setF('preparacion', e.target.value)} rows={5}
            placeholder={'1. Primer paso...\n2. Segundo paso...\n3. Tercer paso...'}
            style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${errors.preparacion?'#E53935':'#ddd'}`,borderRadius:8,fontSize:13,outline:'none',resize:'vertical'}}/>
          {errors.preparacion && <div style={{fontSize:11,color:'#E53935',marginTop:3}}>{errors.preparacion}</div>}
        </div>
      </div>

      {/* Sección 5: Notas */}
      <div className="insumos-card" style={{padding:'24px 28px',marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:1,marginBottom:16}}>5. Notas opcionales</div>
        <textarea value={form.notas} onChange={e => setF('notas', e.target.value)} rows={3}
          placeholder="Temperatura de servicio, variaciones, observaciones..."
          style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13,outline:'none',resize:'vertical'}}/>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-add" disabled={loading}>
          {loading ? '⏳ Guardando...' : fichaInicial ? '💾 Actualizar ficha' : '+ Registrar ficha técnica'}
        </button>
      </div>
    </form>
  );
}

// ── LIST ────────────────────────────────────────────────────────
export default function FichasTecnicasPage() {
  const navigate = useNavigate();
  const [fichas, setFichas]     = useState(() => fichasTecnicasService.getAll());
  const [query, setQuery]       = useState('');
  const [vista, setVista]       = useState('lista'); // lista | nueva | editar | detalle
  const [fichaActual, setFichaActual] = useState(null);
  const [deleteTarget, setDel]  = useState(null);
  const [success, setSuccess]   = useState('');

  const [page, setPage] = useState(1);
  const PER_PAGE = 4;

  const refresh = () => setFichas(fichasTecnicasService.getAll());
  const showOk = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const stats = fichasTecnicasService.getStats();

  const productos = productosService.getAll();
  const getProd = id => productos.find(p => p.id === id);

  const displayed = query.trim()
    ? fichas.filter(f => { const p = getProd(f.id_producto); return (p?.nombre||'').toLowerCase().includes(query.toLowerCase()) || f.categoria_prep.toLowerCase().includes(query.toLowerCase()); })
    : fichas;

  const totalPages = Math.ceil(displayed.length / PER_PAGE);
  const paginated = displayed.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const handleSearch = val => { setQuery(val); setPage(1); };

  const handleDelete = () => {
    fichasTecnicasService.remove(deleteTarget.id_ficha);
    refresh(); showOk('Ficha técnica eliminada'); setDel(null);
  };

  if (vista === 'nueva') return (
    <Layout>
      <div className="insumos-root">
        <div style={{fontSize:13,color:'#888',marginBottom:16}}>
          <span style={{color:'#4CAF50',cursor:'pointer',fontWeight:600}} onClick={() => setVista('lista')}>Fichas técnicas</span> › Nueva ficha
        </div>
        <div className="page-header"><h1 className="page-title">Nueva ficha técnica</h1><p className="page-subtitle">Registra los ingredientes y el proceso de preparación</p></div>
        <FichaForm onCancel={() => setVista('lista')} onSave={() => { refresh(); showOk('Ficha técnica creada'); setVista('lista'); }}/>
      </div>
    </Layout>
  );

  if (vista === 'editar' && fichaActual) return (
    <Layout>
      <div className="insumos-root">
        <div style={{fontSize:13,color:'#888',marginBottom:16}}>
          <span style={{color:'#4CAF50',cursor:'pointer',fontWeight:600}} onClick={() => { setVista('lista'); setFichaActual(null); }}>Fichas técnicas</span> › Editar
        </div>
        <div className="page-header"><h1 className="page-title">Editar ficha técnica</h1><p className="page-subtitle">Modifica la ficha de {getProd(fichaActual.id_producto)?.nombre}</p></div>
        <FichaForm fichaInicial={fichaActual} onCancel={() => { setVista('lista'); setFichaActual(null); }} onSave={() => { refresh(); showOk('Ficha técnica actualizada'); setVista('lista'); setFichaActual(null); }}/>
      </div>
    </Layout>
  );

  if (vista === 'detalle' && fichaActual) {
    const p = getProd(fichaActual.id_producto);
    const insumos = insumosService.getAll();
    const pasos = (fichaActual.preparacion || '').split('\n').filter(x => x.trim());
    return (
      <Layout>
        <div className="insumos-root">
          {success && <div className="toast toast-success">✓ {success}</div>}
          <div style={{fontSize:13,color:'#888',marginBottom:16}}>
            <span style={{color:'#4CAF50',cursor:'pointer',fontWeight:600}} onClick={() => { setVista('lista'); setFichaActual(null); }}>Fichas técnicas</span> › {p?.nombre}
          </div>
          <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
            <div>
              <h1 className="page-title">{p?.nombre || 'Ficha técnica'}</h1>
              <p className="page-subtitle">{fichaActual.categoria_prep} · {fichaActual.porciones} porción{fichaActual.porciones>1?'es':''} · {fichaActual.tiempo_prep} min</p>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn-add" onClick={() => { setVista('editar'); }}>✏️ Editar</button>
              <button className="btn-confirm-danger" style={{padding:'10px 18px',borderRadius:10}} onClick={() => setDel(fichaActual)}>✕ Anular</button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div className="insumos-card" style={{padding:'20px 24px'}}>
              <div style={{fontWeight:700,marginBottom:12}}>Información general</div>
              {[['Producto',p?.nombre||'—'],['Categoría',p?.categoria||'—'],['Tipo prep.',fichaActual.categoria_prep],['Registrada',fmtFecha(fichaActual.fecha_registro)]].map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f0f0f0',fontSize:13}}>
                  <span style={{color:'#888'}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="insumos-card" style={{padding:'20px 24px'}}>
              <div style={{fontWeight:700,marginBottom:12}}>Costos y márgenes</div>
              {[['Precio de venta',fmt(p?.precio||0),true],['Costo estimado',fmt(fichaActual.costo_estimado)],['Margen estimado',fmt((p?.precio||0)-fichaActual.costo_estimado),true]].map(([k,v,green]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f0f0f0',fontSize:13}}>
                  <span style={{color:'#888'}}>{k}</span><span style={{fontWeight:700,color:green?'#2E7D32':'#1a1a1a'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="insumos-card" style={{padding:'20px 24px',marginBottom:16}}>
            <div style={{fontWeight:700,marginBottom:12}}>Insumos requeridos ({fichaActual.insumos.length})</div>
            {fichaActual.insumos.map((ins, i) => {
              const insumo = insumos.find(s => s.id === ins.id_insumo);
              return (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:6,background:i%2===0?'#F5F5F5':'transparent',fontSize:13}}>
                  <span style={{fontWeight:600}}>{insumo?.nombre||`Insumo #${ins.id_insumo}`}</span>
                  <span style={{color:'#555'}}>{ins.cantidad} {ins.unidad}</span>
                </div>
              );
            })}
          </div>
          <div className="insumos-card" style={{padding:'20px 24px',marginBottom:16}}>
            <div style={{fontWeight:700,marginBottom:12}}>Proceso de preparación</div>
            {fichaActual.resumen_prep && <p style={{fontSize:13,color:'#888',marginBottom:12}}>{fichaActual.resumen_prep}</p>}
            <ol style={{paddingLeft:20}}>
              {pasos.map((paso,i) => <li key={i} style={{fontSize:13,color:'#333',marginBottom:8,lineHeight:1.6}}>{paso.replace(/^\d+\.\s*/,'')}</li>)}
            </ol>
          </div>
          {fichaActual.notas && (
            <div className="insumos-card" style={{padding:'16px 24px',marginBottom:16,background:'#FFFDE7',border:'1px solid #FFE082'}}>
              <div style={{fontWeight:700,marginBottom:6}}>💡 Notas</div>
              <p style={{fontSize:13,color:'#555',lineHeight:1.6}}>{fichaActual.notas}</p>
            </div>
          )}
          {deleteTarget && (
            <div className="modal-overlay" onClick={() => setDel(null)}>
              <div className="modal-box" onClick={e=>e.stopPropagation()}>
                <div className="modal-icon modal-icon-danger"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></div>
                <h3>¿Anular ficha técnica?</h3>
                <p>Esta acción es <strong>permanente</strong>.</p>
                <div className="modal-detail">"{getProd(deleteTarget.id_producto)?.nombre}"</div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setDel(null)}>Cancelar</button>
                  <button className="btn-confirm-danger" onClick={() => { handleDelete(); setVista('lista'); setFichaActual(null); }}>Sí, anular</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ── LISTA ──
  return (
    <Layout>
      <div className="insumos-root">
        {success && <div className="toast toast-success">✓ {success}</div>}
        <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <h1 className="page-title">Fichas Técnicas</h1>
            <p className="page-subtitle">Gestiona las fichas de preparación de cada producto del menú</p>
          </div>
          <button className="btn-add" onClick={() => setVista('nueva')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva ficha técnica
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[{l:'Total fichas',v:stats.total,c:'#1565C0'},{l:'Activas',v:stats.activas,c:'#2E7D32'},{l:'Inactivas',v:stats.inactivas,c:'#757575'},{l:'Tiempo prom.',v:stats.avgTiempo+' min',c:'#E65100'}].map((s,i) => (
            <div key={i} style={{background:'white',borderRadius:12,padding:'16px 18px',borderTop:`3px solid ${s.c}`,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:12,color:'#888',marginBottom:4}}>{s.l}</div>
              <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        <div className="insumos-toolbar">
          <div className="search-group">
            <div className="search-wrap">
              <span className="search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input type="text" className="search-input" placeholder="Buscar por producto o tipo de preparación..." value={query} onChange={e => handleSearch(e.target.value)}/>
              {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
            </div>
          </div>
          <span style={{fontSize:13,color:'#888',marginLeft:'auto'}}>{displayed.length} ficha{displayed.length!==1?'s':''}</span>
        </div>

        <div className="insumos-card">
          {displayed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{query ? 'Sin coincidencias' : 'No hay fichas técnicas'}</h3>
              <p>Crea fichas técnicas para documentar la preparación de cada producto</p>
              {!query && <button className="btn-add-first" onClick={() => setVista('nueva')}>Nueva ficha técnica</button>}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="insumos-table">
                <thead><tr><th>Producto</th><th>Categoría</th><th>Tipo prep.</th><th>Porciones</th><th>Tiempo</th><th>Insumos</th><th>Costo</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {paginated.map(f => {
                    const p = getProd(f.id_producto);
                    return (
                      <tr key={f.id_ficha}>

                        <td>
                          <div className="td-nombre">{p?.nombre||'—'}</div>
                          <div style={{fontSize:11,color:'#888'}}>{p ? fmt(p.precio) : ''}</div>
                        </td>
                        <td><span className="badge-cat">{p?.categoria||'—'}</span></td>
                        <td style={{fontSize:12,color:'#666'}}>{f.categoria_prep}</td>
                        <td style={{textAlign:'center',fontWeight:600}}>{f.porciones}</td>
                        <td style={{fontWeight:600}}>{f.tiempo_prep} min</td>
                        <td><span style={{fontSize:12,color:'#666'}}>{f.insumos.length} ingr.</span></td>
                        <td style={{fontWeight:600,color:'#E65100'}}>{fmt(f.costo_estimado)}</td>
                        <td>
                          <button className={`toggle-btn ${f.estado?'toggle-on':'toggle-off'}`} onClick={() => { fichasTecnicasService.toggleEstado(f.id_ficha); refresh(); }} title={f.estado?'Activa':'Inactiva'}>
                            <span className="toggle-thumb"/>
                          </button>
                        </td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-ver" title="Ver detalle" onClick={() => { setFichaActual(f); setVista('detalle'); }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="btn-editar" title="Editar" onClick={() => { setFichaActual(f); setVista('editar'); }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="btn-anular" title="Anular" onClick={() => setDel(f)}>
                              ✕ Anular
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
          {totalPages > 1 && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderTop:'1px solid #f0f0f0',marginTop:4}}>
              <span style={{fontSize:13,color:'#888'}}>
                Mostrando {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,displayed.length)} de {displayed.length} fichas
              </span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid #ddd',background:page===1?'#f5f5f5':'white',color:page===1?'#bbb':'#333',cursor:page===1?'not-allowed':'pointer',fontSize:13,fontWeight:600}}>← Ant.</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{padding:'6px 11px',borderRadius:8,border:`1.5px solid ${n===page?'#4CAF50':'#ddd'}`,background:n===page?'#4CAF50':'white',color:n===page?'white':'#333',cursor:'pointer',fontSize:13,fontWeight:700}}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid #ddd',background:page===totalPages?'#f5f5f5':'white',color:page===totalPages?'#bbb':'#333',cursor:page===totalPages?'not-allowed':'pointer',fontSize:13,fontWeight:600}}>Sig. →</button>
              </div>
            </div>
          )}
        </div>
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDel(null)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></div>
              <h3>¿Anular ficha técnica?</h3>
              <p>Esta acción es <strong>permanente</strong>.</p>
              <div className="modal-detail">"{getProd(deleteTarget.id_producto)?.nombre}"</div>
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