import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import usuariosService from '../services/usuariosService';
import rolesService from '../../roles/services/rolesService';
import '../../roles/pages/Roles.css';

const VerUsuarioPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const u = usuariosService.getById(parseInt(id));
  const roles = rolesService.getAll();
  const rol = u ? roles.find(r => r.id === u.rolId) : null;
  const fmt = iso => iso ? new Intl.DateTimeFormat('es-CO',{dateStyle:'long'}).format(new Date(iso)) : '—';

  if (!u) return (
    <Layout><div className="mod-root">
      <button className="btn-back" onClick={() => navigate('/admin/usuarios')}>← Volver</button>
      <p>Usuario no encontrado.</p>
    </div></Layout>
  );

  return (
    <Layout>
      <div className="mod-root">
        <button className="btn-back" onClick={() => navigate('/admin/usuarios')}>← Volver a usuarios</button>
        <div className="ver-card">
          <div className="ver-header">
            <div className="ver-icon" style={{background:(rol?.color||'#888')+'18', border:`1.5px solid ${rol?.color||'#888'}33`, fontSize:28}}>
              {u.nombre.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div className="ver-nombre">{u.nombre}</div>
                {u.esAdmin && <span className="badge-admin">Admin</span>}
              </div>
              <div className="ver-desc">@{u.username}</div>
            </div>
            <button className="btn-nuevo" onClick={() => navigate(`/admin/usuarios/editar/${u.id}`)}>✏️ Editar</button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            {[
              ['Correo', u.email||'—'],
              ['Teléfono', u.telefono||'—'],
              ['Rol', rol?.nombre||'Sin rol'],
              ['Estado', u.estado ? '✅ Activo' : '❌ Inactivo'],
              ['Fecha de creación', fmt(u.fechaCreacion)],
            ].map(([label,val],i) => (
              <div key={i} style={{background:'#faf8f5',borderRadius:10,padding:'12px 16px'}}>
                <div style={{fontSize:11,color:'#aaa',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>{label}</div>
                <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerUsuarioPage;
