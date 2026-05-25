import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import useRoles from '../hooks/useRoles';
import rolesService from '../services/rolesService';
import '../../insumos/pages/InsumosPage.css';
import './Roles.css';

const RolesPage = () => {
  const navigate = useNavigate();
  const { roles, remove } = useRoles();
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [success, setSuccess] = useState('');
  const total = rolesService.getTodosLosPermisos().length;

  const shownFiltered = query.trim()
    ? roles.filter(r => r.nombre.toLowerCase().includes(query.toLowerCase()) || (r.descripcion||'').toLowerCase().includes(query.toLowerCase()))
    : roles;
  const shown = [...shownFiltered].sort((a, b) => Number(b.id) - Number(a.id));

  const handleDelete = () => {
    const r = remove(deleteTarget.id);
    if (r.error) { setDeleteError(r.error); return; }
    setDeleteTarget(null); setDeleteError('');
    setSuccess(`Rol "${deleteTarget.nombre}" eliminado.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Layout>
      <div className="mod-root">
        {success && <div className="toast toast-success">✓ {success}</div>}

        <div className="page-header" style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
          <div>
            <h1 className="page-title">Gestión de Roles</h1>
            <p className="page-subtitle">Define permisos y accesos del sistema</p>
          </div>
          <button className="btn-add" onClick={() => navigate('/admin/roles/nuevo')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo rol
          </button>
        </div>

        <div className="insumos-toolbar">
          <div className="search-group">
            <div className="search-wrap">
              <span className="search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input className="search-input" placeholder="Buscar rol..." value={query} onChange={e => setQuery(e.target.value)} />
              {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
            </div>
          </div>
          <span style={{fontSize:13,color:'#888',marginLeft:'auto'}}>{shown.length} rol{shown.length !== 1 ? 'es' : ''}</span>
        </div>

        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛡️</div>
            <h3>{query ? 'Sin coincidencias' : 'No hay roles'}</h3>
            <p>{query ? `Sin roles para "${query}"` : 'Crea el primer rol del sistema'}</p>
            {!query && <button className="btn-nuevo" onClick={() => navigate('/admin/roles/nuevo')}>Crear primer rol</button>}
          </div>
        ) : (
          <div className="roles-grid">
            {shown.map(rol => {
              const pct = Math.round((rol.permisos.length / total) * 100);
              return (
                <div className="rol-card" key={rol.id}>
                  <div className="rol-card__stripe" style={{background: rol.color}}/>
                  <div className="rol-card__head">
                    <div className="rol-card__icon" style={{background: rol.color+'18', border: `1.5px solid ${rol.color}33`}}>
                      <span style={{fontSize:20}}>🛡️</span>
                    </div>
                    <div className="rol-card__info">
                      <div className="rol-card__name">{rol.nombre}</div>
                      <div className="rol-card__date">{rol.fechaCreacion ? new Intl.DateTimeFormat('es-CO',{dateStyle:'medium'}).format(new Date(rol.fechaCreacion)) : '—'}</div>
                    </div>
                    {rol.esAdmin && <span className="badge-admin">Admin</span>}
                  </div>
                  <p className="rol-card__desc">{rol.descripcion || <em style={{color:'#bbb'}}>Sin descripción</em>}</p>
                  <div className="rol-card__perms">
                    <div className="rol-card__perms-header">
                      <span>Permisos</span>
                      <strong style={{color: rol.color}}>{rol.permisos.length}<span style={{color:'#bbb',fontWeight:400}}>/{total}</span></strong>
                    </div>
                    <div className="perm-bar"><div className="perm-bar__fill" style={{width:`${pct}%`, background: rol.color}}/></div>
                    <div className="perm-pct">{pct}% de cobertura</div>
                  </div>
                  <div className="rol-card__actions">
                    <button className="btn-ver" onClick={() => navigate(`/admin/roles/ver/${rol.id}`)}>Ver detalle</button>
                    <button className="btn-icon btn-icon--edit" disabled={rol.esAdmin} onClick={() => !rol.esAdmin && navigate(`/admin/roles/editar/${rol.id}`)} title={rol.esAdmin ? 'No editable' : 'Editar'}>
                      ✏️
                    </button>
                    <button className="btn-icon btn-icon--del" disabled={rol.esAdmin} onClick={() => { if(!rol.esAdmin){setDeleteError('');setDeleteTarget(rol);} }} title={rol.esAdmin ? 'No anulable' : 'Anular'}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">✕</div>
              <h3>¿Anular este rol?</h3>
              <p>Esta acción es <strong>permanente</strong> y no se puede deshacer.</p>
              <div className="modal-detail" style={{borderLeft:`4px solid ${deleteTarget.color}`}}>"{deleteTarget.nombre}"</div>
              {deleteError && <div className="modal-error">⚠ {deleteError}</div>}
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleDelete}>Sí, anular</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RolesPage;
