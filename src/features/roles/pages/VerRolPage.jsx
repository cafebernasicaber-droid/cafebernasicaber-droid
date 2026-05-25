import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import rolesService from '../services/rolesService';
import './Roles.css';

const VerRolPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const rol = rolesService.getById(parseInt(id));
  const modulos = rolesService.getModulosPermisos();

  if (!rol) return (
    <Layout>
      <div className="mod-root">
        <button className="btn-back" onClick={() => navigate('/admin/roles')}>← Volver</button>
        <p>Rol no encontrado.</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="mod-root">
        <button className="btn-back" onClick={() => navigate('/admin/roles')}>← Volver a roles</button>
        <div className="ver-card">
          <div className="ver-header">
            <div className="ver-icon" style={{background: rol.color+'18', border:`1.5px solid ${rol.color}33`}}>
              🛡️
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div className="ver-nombre">{rol.nombre}</div>
                {rol.esAdmin && <span className="badge-admin">Admin</span>}
              </div>
              <div className="ver-desc">{rol.descripcion || 'Sin descripción.'}</div>
            </div>
            {!rol.esAdmin && (
              <button className="btn-nuevo" onClick={() => navigate(`/admin/roles/editar/${rol.id}`)}>
                ✏️ Editar
              </button>
            )}
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:13, fontWeight:700, color:'#555', marginBottom:14}}>
              Permisos asignados ({rol.permisos.length})
            </div>
            {modulos.map(mod => {
              const asignados = mod.permisos.filter(p => rol.permisos.includes(p.id));
              if (asignados.length === 0) return null;
              return (
                <div className="ver-modulo" key={mod.modulo}>
                  <div className="ver-modulo-name">{mod.modulo}</div>
                  <div className="ver-permisos-list">
                    {asignados.map(p => (
                      <span className="ver-permiso-chip" key={p.id}>{p.label}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerRolPage;
