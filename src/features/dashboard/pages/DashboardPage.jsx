import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import rolesService from '../../roles/services/rolesService';
import usuariosService from '../../usuarios/services/usuariosService';
import clientesService from '../../clientes/services/clientesService';
import insumosService from '../../insumos/services/insumosService';
import proveedoresService from '../../proveedores/services/proveedoresService';
import comprasService from '../../compras/services/comprasService';
import pedidosService from '../../pedidos/services/pedidosService';
import empleadosService from '../../empleados/services/empleadosService';
import productosService from '../../productos/services/productosService';
import categoriasService from '../../categorias/services/categoriasService';
import adicionesService from '../../adiciones/services/adicionesService';
import toppingsService from '../../toppings/services/toppingsService';
import ventasService from '../../ventas/services/ventasService';
import devolucionesService from '../../devoluciones/services/devolucionesService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import '../../insumos/pages/InsumosPage.css';
import './DashboardPage.css';

const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0}).format(n||0);

// ── SVG Icon set (professional, no emojis) ──────────────────────────────────
const Icon = ({ d, size=16, stroke='currentColor', sw=1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const ICONS = {
  roles:       'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  usuarios:    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  clientes:    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  pedidos:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  empleados:   'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8L6 7h12l-2-4z',
  ventas:      'M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6',
  devoluciones:'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  productos:   'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3',
  toppings:    'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z',
  adiciones:   'M12 5v14M5 12h14',
  insumos:     'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M10 12h4',
  proveedores: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  alert_warn:  'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  alert_truck: 'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M9 17a2 2 0 100 4 2 2 0 000-4zM20 17a2 2 0 100 4 2 2 0 000-4zM14 9h4l3 5v3h-7V9z',
  alert_back:  'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  check:       'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  trending:    'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
};

// ── Pure SVG bar chart ───────────────────────────────────────────────────────
function BarChart({ data, color='#4CAF50', title }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 380, H = 140, PAD = 32, BAR_W = 24;
  const step = (W - PAD * 2) / data.length;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 40}`} style={{ display:'block' }}>
        {/* Grid lines */}
        {[0,.25,.5,.75,1].map((pct,i) => {
          const y = PAD + (H - PAD) * (1 - pct);
          return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#F0F0F0" strokeWidth="1"/>;
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const x = PAD + i * step + step/2 - BAR_W/2;
          const barH = ((d.value / max) * (H - PAD)) || 2;
          const y = PAD + (H - PAD) - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={BAR_W} height={barH} rx="5" fill={color} opacity="0.85"/>
              {d.value > 0 && <text x={x + BAR_W/2} y={y - 5} textAnchor="middle" fontSize="10" fill="#888" fontFamily="'Open Sans',sans-serif">{d.value}</text>}
              <text x={x + BAR_W/2} y={H + 20} textAnchor="middle" fontSize="10" fill="#AAAAAA" fontFamily="'Open Sans',sans-serif">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments, title }) {
  const total = segments.reduce((s,g) => s + g.value, 0) || 1;
  const R = 54, CX = 70, CY = 70, STROKE = 18;
  let offset = 0;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <svg width={140} height={140}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F5F5F5" strokeWidth={STROKE}/>
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const gap  = circ - dash;
          const el = (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={seg.color} strokeWidth={STROKE}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ / total + circ * 0.25}
              strokeLinecap="butt"
              style={{ transition:'stroke-dasharray .5s ease' }}
            />
          );
          offset += seg.value;
          return el;
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#1A1A1A" fontFamily="'Montserrat',sans-serif">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="9" fill="#AAAAAA" fontFamily="'Open Sans',sans-serif">TOTAL</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {segments.map((seg,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:seg.color, flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#555', fontWeight:600 }}>{seg.label}</span>
            <span style={{ fontSize:12, color:'#AAA', marginLeft:'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState(7);

  // Data
  const roles      = rolesService.getAll();
  const usuarios   = usuariosService.getAll();
  const clientes   = clientesService.getAll();
  const insumos    = insumosService.getAll();
  const proveedores= proveedoresService.getAll();
  const compras    = comprasService.getAll();
  const pedStats   = pedidosService.getStats();
  const empleados  = empleadosService.getAll();
  const productos  = productosService.getAll();
  const categorias = categoriasService.getAll();
  const adiciones  = adicionesService.getAll();
  const toppings   = toppingsService.getAll();
  const ventasStats= ventasService.getStats();
  const devStats   = devolucionesService.getStats();

  const insumosLow      = insumos.filter(i => i.stockActual < i.stockMinimo);
  const comprasPend     = compras.filter(c => c.estado === 'Pendiente');
  const empleadosActivos= empleados.filter(e => e.activo).length;
  const pedidosPendLanding = pedidosService.getAll().filter(p => p.origen === 'landing' && p.estado === 'pendiente').length;

  // Chart data — pedidos by day
  const pedidosPorDia = useMemo(() => {
    const allPedidos = pedidosService.getAll();
    const days = [];
    for (let i = chartPeriod - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('es-CO', { weekday:'short' }).slice(0,2);
      const fecha = d.toISOString().slice(0,10);
      const value = allPedidos.filter(p => (p.fechaCreacion||'').startsWith(fecha)).length;
      days.push({ label, value });
    }
    return days;
  }, [chartPeriod]);

  // Chart data — ventas status donut
  const ventasDonut = [
    { label:'Vendidas',   value: ventasStats.vendido,  color:'#4CAF50' },
    { label:'Devueltas',  value: ventasStats.devuelto, color:'#EF5350' },
  ];

  // Chart data — pedidos status donut
  const pedidosRaw = pedidosService.getAll();
  const pedidosDonut = [
    { label:'Pendiente',  value: pedidosRaw.filter(p=>p.estado==='pendiente').length,   color:'#FF9800' },
    { label:'En proceso', value: pedidosRaw.filter(p=>p.estado==='en_proceso').length,  color:'#2196F3' },
    { label:'Listo',      value: pedidosRaw.filter(p=>p.estado==='listo').length,       color:'#9C27B0' },
    { label:'Entregado',  value: pedidosRaw.filter(p=>p.estado==='entregado').length,   color:'#4CAF50' },
    { label:'Cancelado',  value: pedidosRaw.filter(p=>p.estado==='cancelado').length,   color:'#EF5350' },
  ];

  const statCards = [
    { label:'Roles',          value:roles.length,           icon:ICONS.roles,        color:'#E53935', bg:'#FFEBEE', path:'/admin/roles' },
    { label:'Usuarios',       value:usuarios.length,        icon:ICONS.usuarios,     color:'#1976D2', bg:'#E3F2FD', path:'/admin/usuarios' },
    { label:'Clientes',       value:clientes.length,        icon:ICONS.clientes,     color:'#2E7D32', bg:'#E8F5E9', path:'/admin/clientes' },
    { label:'Pedidos hoy',    value:pedStats.total,         icon:ICONS.pedidos,      color:'#7B1FA2', bg:'#F3E5F5', path:'/pedidos' },

    { label:'Ventas',         value:ventasStats.total,      icon:ICONS.ventas,       color:'#2E7D32', bg:'#E8F5E9', path:'/ventas' },
    { label:'Dev. pendientes',value:devStats.pendiente,     icon:ICONS.devoluciones, color:'#F57F17', bg:'#FFF8E1', path:'/devoluciones' },
    { label:'Productos',      value:productos.length,       icon:ICONS.productos,    color:'#6D4C41', bg:'#EFEBE9', path:'/productos' },

  ];

  const recentClientes = [...clientes].sort((a,b)=>b.id-a.id).slice(0,5);

  return (
    <Layout>
      <div className="dash">

        {/* ── STAT CARDS ── */}
        <div className="dash-stats">
          {statCards.map((s,i) => (
            <div className="dash-stat" key={i} onClick={() => navigate(s.path)} style={{cursor:'pointer'}}>
              <div className="dash-stat__icon" style={{background:s.bg, color:s.color}}>
                <Icon d={s.icon} size={18} stroke={s.color} sw={2}/>
              </div>
              <div>
                <div className="dash-stat__value" style={{color:s.color}}>{s.value}</div>
                <div className="dash-stat__label">{s.label}{s.sub && <span style={{color:'#bbb',fontWeight:400}}> {s.sub}</span>}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ALERTS ── */}
        {(insumosLow.length>0||comprasPend.length>0||pedStats.pendiente>0||pedidosPendLanding>0||devStats.pendiente>0) && (
          <div className="dash-alerts">
            {pedidosPendLanding>0 && (
              <div className="dash-alert dash-alert--green" onClick={()=>navigate('/pedidos')}>
                <Icon d={ICONS.alert_truck} size={18} sw={2}/>
                <div>
                  <strong>{pedidosPendLanding} pedido{pedidosPendLanding>1?'s':''} desde la landing</strong>
                  <p>Clientes esperando confirmación de domicilio</p>
                </div>
              </div>
            )}
            {devStats.pendiente>0 && (
              <div className="dash-alert dash-alert--warn" onClick={()=>navigate('/devoluciones')}>
                <Icon d={ICONS.alert_back} size={18} sw={2}/>
                <div>
                  <strong>{devStats.pendiente} devolución{devStats.pendiente>1?'es':''} pendiente{devStats.pendiente>1?'s':''}</strong>
                  <p>Requieren aprobación o rechazo</p>
                </div>
              </div>
            )}
            {pedStats.pendiente>0 && (
              <div className="dash-alert dash-alert--purple" onClick={()=>navigate('/pedidos')}>
                <Icon d={ICONS.pedidos} size={18} sw={2}/>
                <div>
                  <strong>{pedStats.pendiente} pedido{pedStats.pendiente>1?'s':''} pendiente{pedStats.pendiente>1?'s':''}</strong>
                  <p>Ventas del día: {fmt(pedStats.ventas)}</p>
                </div>
              </div>
            )}
            {insumosLow.length>0 && (
              <div className="dash-alert dash-alert--warn" onClick={()=>navigate('/insumos')}>
                <Icon d={ICONS.alert_warn} size={18} sw={2}/>
                <div>
                  <strong>{insumosLow.length} insumo{insumosLow.length>1?'s':''} con stock bajo</strong>
                  <p>{insumosLow.map(i=>i.nombre).slice(0,3).join(', ')}{insumosLow.length>3?` +${insumosLow.length-3} más`:''}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CHARTS ROW ── */}
        <div className="dash-charts">
          {/* Bar chart: pedidos por día */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <h3>Pedidos por día</h3>
                <p style={{fontSize:12,color:'#aaa',marginTop:2}}>Últimos {chartPeriod} días</p>
              </div>
              <div style={{display:'flex',gap:6}}>
                {[7,14,30].map(d => (
                  <button key={d} onClick={()=>setChartPeriod(d)}
                    style={{padding:'4px 10px',borderRadius:6,border:'1.5px solid',fontSize:11,fontWeight:700,cursor:'pointer',
                      borderColor: chartPeriod===d ? '#4CAF50' : '#E0E0E0',
                      background: chartPeriod===d ? '#E8F5E9' : 'white',
                      color: chartPeriod===d ? '#2E7D32' : '#888'}}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <BarChart data={pedidosPorDia} color="#4CAF50"/>
          </div>

          {/* Donut: ventas estado */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <h3>Estado de ventas</h3>
                <p style={{fontSize:12,color:'#aaa',marginTop:2}}>Distribución actual</p>
              </div>
            </div>
            <DonutChart segments={ventasDonut}/>
          </div>

          {/* Donut: pedidos estado */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <h3>Estado de pedidos</h3>
                <p style={{fontSize:12,color:'#aaa',marginTop:2}}>Todos los pedidos</p>
              </div>
            </div>
            <DonutChart segments={pedidosDonut}/>
          </div>
        </div>

        {/* ── LISTS GRID ── */}
        <div className="dash-grid">
          {/* Últimos clientes */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3>Últimos clientes</h3>
              <button className="dash-card__link" onClick={()=>navigate('/admin/clientes')}>Ver todos →</button>
            </div>
            {recentClientes.length===0
              ? <div className="dash-empty">Aún no hay clientes registrados.</div>
              : <div className="dash-list">{recentClientes.map(c=>(
                <div className="dash-list__item" key={c.id}>
                  <div className="dash-list__avatar">{c.nombre.charAt(0).toUpperCase()}</div>
                  <div className="dash-list__info">
                    <div className="dash-list__name">{c.nombre}</div>
                    <div className="dash-list__email">{c.correo}</div>
                  </div>
                  <span className={`dash-list__badge ${c.estado?'dash-list__badge--green':'dash-list__badge--gray'}`}>
                    {c.estado?'Activo':'Inactivo'}
                  </span>
                </div>
              ))}</div>
            }
          </div>

          {/* Pedidos recientes */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3>Pedidos recientes</h3>
              <button className="dash-card__link" onClick={()=>navigate('/pedidos')}>Ver todos →</button>
            </div>
            {pedStats.total===0
              ? <div className="dash-empty">No hay pedidos registrados.</div>
              : <div className="dash-list">{pedidosService.getAll().sort((a,b)=>String(b.id).localeCompare(String(a.id))).slice(0,5).map(p=>{
                const cfg={pendiente:{c:'#F57F17',bg:'#FFF8E1'},en_proceso:{c:'#1565C0',bg:'#E3F2FD'},listo:{c:'#2E7D32',bg:'#E8F5E9'},entregado:{c:'#388E3C',bg:'#F1F8E9'},cancelado:{c:'#B71C1C',bg:'#FFEBEE'}};
                const labels={pendiente:'Pendiente',en_proceso:'En proceso',listo:'Listo',entregado:'Entregado',cancelado:'Cancelado'};
                const c = cfg[p.estado]||{c:'#888',bg:'#F5F5F5'};
                return (
                  <div className="dash-list__item" key={p.id}>
                    <div className="dash-list__avatar" style={{background:'#F3E5F5',color:'#7B1FA2'}}>
                      <Icon d={ICONS.pedidos} size={14} stroke="#7B1FA2" sw={2}/>
                    </div>
                    <div className="dash-list__info">
                      <div className="dash-list__name">#{p.id} — {p.cliente}</div>
                      <div className="dash-list__email">{fmt(p.total)}</div>
                    </div>
                    <span className="dash-list__badge" style={{background:c.bg,color:c.c}}>{labels[p.estado]||p.estado}</span>
                  </div>
                );
              })}</div>
            }
          </div>

          {/* Insumos stock bajo */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3>Insumos — stock bajo</h3>
              <button className="dash-card__link" onClick={()=>navigate('/insumos')}>Ver todos →</button>
            </div>
            {insumosLow.length===0
              ? <div className="dash-empty"><Icon d={ICONS.check} size={20} stroke="#4CAF50" sw={2}/> Todos los insumos tienen stock suficiente.</div>
              : <div className="dash-list">{insumosLow.slice(0,5).map(i=>(
                <div className="dash-list__item" key={i.id}>
                  <div className="dash-list__avatar" style={{background:'#FFF3E0',color:'#E65100'}}>
                    <Icon d={ICONS.insumos} size={14} stroke="#E65100" sw={2}/>
                  </div>
                  <div className="dash-list__info">
                    <div className="dash-list__name">{i.nombre}</div>
                    <div className="dash-list__email">{i.stockActual} / {i.stockMinimo} {i.unidadMedida}</div>
                  </div>
                  <span className="dash-list__badge dash-list__badge--warn">Stock bajo</span>
                </div>
              ))}</div>
            }
          </div>

          {/* Roles */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3>Roles del sistema</h3>
              <button className="dash-card__link" onClick={()=>navigate('/admin/roles')}>Ver todos →</button>
            </div>
            <div className="dash-list">{roles.map(r=>(
              <div className="dash-list__item" key={r.id}>
                <div className="dash-list__avatar" style={{background:(r.color||'#4CAF50')+'22',color:r.color||'#4CAF50'}}>
                  <Icon d={ICONS.roles} size={14} stroke={r.color||'#4CAF50'} sw={2}/>
                </div>
                <div className="dash-list__info">
                  <div className="dash-list__name">{r.nombre}</div>
                  <div className="dash-list__email">{r.permisos?.length||0} permisos</div>
                </div>
                {r.esAdmin && <span className="dash-list__badge dash-list__badge--red">Admin</span>}
              </div>
            ))}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}