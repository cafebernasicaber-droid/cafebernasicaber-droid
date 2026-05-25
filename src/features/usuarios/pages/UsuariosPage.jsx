import React, { useState } from 'react';
import Layout from '../../../shared/components/Layout';
import useUsuarios from '../hooks/useUsuarios';
import usuariosService from '../services/usuariosService';
import rolesService from '../../roles/services/rolesService';
import '../../insumos/pages/InsumosPage.css';
import './Usuarios.css';
import './Usuarios.modal.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = iso => iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(iso)) : '—';
const fmtLong = iso => iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(iso)) : '—';

// ── Modal: Ver usuario ────────────────────────────────────────────────────────
function ModalVerUsuario({ usuario, roles, onClose, onEditar }) {
  const rol = roles.find(r => r.id === usuario.rolId);
  const campos = [
    ['Correo',            usuario.email    || '—'],
    ['Teléfono',          usuario.telefono || '—'],
    ['Rol',               rol?.nombre      || 'Sin rol'],
    ['Estado',            usuario.estado ? '✅ Activo' : '❌ Inactivo'],
    ['Fecha de creación', fmtLong(usuario.fechaCreacion)],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="usuario-modal-box" style={{ width: '100%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>

        <div className="usuario-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: (rol?.color || '#888') + '20', color: rol?.color || '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
            }}>
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{usuario.nombre}</span>
                {usuario.esAdmin && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#E3F2FD', color: '#1565C0', padding: '2px 7px', borderRadius: 100 }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>@{usuario.username}</div>
            </div>
          </div>
          <button className="usuario-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="usuario-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {campos.map(([label, val]) => (
              <div key={label} style={{ background: '#faf8f5', borderRadius: 10, padding: '11px 14px' }}>
                <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-cancel" onClick={onClose}>Cerrar</button>
            <button className="btn-confirm-primary" onClick={onEditar}>✏️ Editar usuario</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Crear / Editar usuario ─────────────────────────────────────────────
function ModalFormUsuario({ usuario, roles, onCreate, onUpdate, onClose }) {
  const isEdit = !!usuario;
  const [form, setForm]       = useState({
    nombre:   usuario?.nombre   || '',
    username: usuario?.username || '',
    email:    usuario?.email    || '',
    telefono: usuario?.telefono || '',
    password: '',
    rolId:    usuario?.rolId    || '',
  });
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = e => {
    e.preventDefault(); setError('');
    if (form.password && form.password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    setTimeout(() => {
      const data = { ...form, rolId: parseInt(form.rolId) };
      const r = isEdit ? onUpdate(usuario.id, data) : onCreate(data);
      if (r?.error) { setError(r.error); setLoading(false); return; }
      setLoading(false);
    }, 400);
  };

  const pwMatch   = confirm && form.password && confirm === form.password;
  const pwNoMatch = confirm && form.password && confirm !== form.password;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="usuario-modal-box" style={{ width: '100%', maxWidth: 560 }} onClick={e => e.stopPropagation()}>

        <div className="usuario-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E3F2FD', color: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              👤
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
                {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                {isEdit ? `Modificando: ${usuario.nombre}` : 'Agrega un nuevo usuario al sistema'}
              </div>
            </div>
          </div>
          <button className="usuario-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="usuario-modal-body">
          {error && (
            <div style={{ background: '#FFEBEE', color: '#B71C1C', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Fila 1: Nombre y Username */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nombre completo *</label>
                  <input style={inputStyle} type="text" placeholder="Nombre completo" required
                    value={form.nombre} onChange={e => set('nombre', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Nombre de usuario *</label>
                  <input style={inputStyle} type="text" placeholder="usuario_ejemplo" required
                    value={form.username} onChange={e => set('username', e.target.value)} />
                </div>
              </div>

              {/* Fila 2: Email y Teléfono */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Correo electrónico</label>
                  <input style={inputStyle} type="email" placeholder="correo@ejemplo.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input style={inputStyle} type="tel" placeholder="300 000 0000"
                    value={form.telefono} onChange={e => set('telefono', e.target.value)} />
                </div>
              </div>

              {/* Fila 3: Contraseñas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>
                    {isEdit ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                  </label>
                  <input style={inputStyle} type="password"
                    placeholder={isEdit ? 'Nueva contraseña...' : 'Mín. 6 caracteres'}
                    required={!isEdit}
                    value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>
                    {isEdit ? 'Confirmar nueva contraseña' : 'Confirmar contraseña *'}
                  </label>
                  <input
                    style={{ ...inputStyle, borderColor: pwNoMatch ? '#E53935' : pwMatch ? '#4CAF50' : '#ddd' }}
                    type="password" placeholder="Repite la contraseña"
                    required={!isEdit}
                    value={confirm} onChange={e => setConfirm(e.target.value)} />
                  {pwNoMatch && <div style={{ fontSize: 11, color: '#E53935', marginTop: 3 }}>Las contraseñas no coinciden</div>}
                  {pwMatch   && <div style={{ fontSize: 11, color: '#4CAF50', marginTop: 3 }}>✓ Las contraseñas coinciden</div>}
                </div>
              </div>

              {/* Fila 4: Rol */}
              <div style={{ maxWidth: '50%', paddingRight: 6 }}>
                <label style={labelStyle}>Rol *</label>
                <select style={inputStyle} required
                  value={form.rolId} onChange={e => set('rolId', e.target.value)}>
                  <option value="">Seleccionar rol...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-confirm-primary" disabled={loading}>
                {loading ? 'Guardando...' : isEdit ? '💾 Guardar cambios' : '✅ Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 5 };
const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #ddd',
  borderRadius: 8, fontSize: 13, outline: 'none', background: 'white',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

// ── Página principal ──────────────────────────────────────────────────────────
const UsuariosPage = () => {
  const { usuarios, create, update, remove, toggleEstado } = useUsuarios();
  const [query, setQuery]           = useState('');
  const [modal, setModal]           = useState(null); // null | 'nuevo' | 'editar' | 'ver'
  const [targetUser, setTargetUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError]   = useState('');
  const [success, setSuccess]           = useState('');
  const roles = rolesService.getAll();

  const getRol = id => roles.find(r => r.id === id);
  const shownFiltered = query.trim()
    ? usuarios.filter(u =>
        u.nombre.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(query.toLowerCase()))
    : usuarios;
  const shown = [...shownFiltered].sort((a, b) => Number(b.id) - Number(a.id));

  const showOk = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const openNuevo  = ()  => { setTargetUser(null); setModal('nuevo'); };
  const openEditar = u   => { setTargetUser(u);    setModal('editar'); };
  const openVer    = u   => { setTargetUser(u);    setModal('ver'); };
  const closeModal = ()  => { setModal(null); setTargetUser(null); };

  const handleCreate = data => {
    const r = create(data);
    if (r?.error) return r;
    showOk('Usuario creado correctamente.');
    closeModal();
    return r;
  };

  const handleUpdate = (id, data) => {
    const r = update(id, data);
    if (r?.error) return r;
    showOk('Usuario actualizado correctamente.');
    closeModal();
    return r;
  };

  const handleDelete = () => {
    const r = remove(deleteTarget.id);
    if (r.error) { setDeleteError(r.error); return; }
    showOk(`Usuario "${deleteTarget.nombre}" eliminado.`);
    setDeleteTarget(null); setDeleteError('');
  };

  return (
    <Layout>
      <div className="insumos-root">
        {success && <div className="toast toast-success">✓ {success}</div>}

        {/* ── Modales ── */}
        {modal === 'ver' && targetUser && (
          <ModalVerUsuario
            usuario={targetUser}
            roles={roles}
            onClose={closeModal}
            onEditar={() => { setModal('editar'); }}
          />
        )}
        {(modal === 'nuevo' || modal === 'editar') && (
          <ModalFormUsuario
            usuario={modal === 'editar' ? targetUser : null}
            roles={roles}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onClose={closeModal}
          />
        )}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </div>
              <h3>¿Anular este usuario?</h3>
              <p>Esta acción es <strong>permanente</strong>.</p>
              <div className="modal-detail">"{deleteTarget.nombre}"</div>
              {deleteError && (
                <div style={{ background: '#FFEBEE', color: '#B71C1C', padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                  ⚠ {deleteError}
                </div>
              )}
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => { setDeleteTarget(null); setDeleteError(''); }}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleDelete}>Sí, anular</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Usuarios del sistema</h1>
            <p className="page-subtitle">
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-add" onClick={openNuevo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo usuario
          </button>
        </div>

        {/* ── Buscador ── */}
        <div className="insumos-toolbar">
          <div className="search-group">
            <div className="search-wrap">
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input className="search-input" placeholder="Buscar por nombre, usuario o correo..."
                value={query} onChange={e => setQuery(e.target.value)} />
              {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
            </div>
          </div>
          <span style={{ fontSize: 13, color: '#888', marginLeft: 'auto' }}>
            {shown.length} usuario{shown.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Tabla ── */}
        <div className="insumos-card">
          {shown.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>{query ? 'Sin resultados' : 'No hay usuarios'}</h3>
              <p>{query ? 'Intenta con otro término.' : 'Crea el primer usuario del sistema.'}</p>
              {!query && (
                <button className="btn-add-first" onClick={openNuevo}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Crear usuario
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="insumos-table">
                <thead>
                  <tr>
                    <th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Creación</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(u => {
                    const rol = getRol(u.rolId);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-cell__avatar"
                              style={{ background: (rol?.color || '#888') + '22', color: rol?.color || '#888' }}>
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="user-cell__name">{u.nombre}</div>
                              <div className="user-cell__user">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td-muted">{u.email || '—'}</td>
                        <td>
                          {rol ? (
                            <span className="rol-chip"
                              style={{ background: rol.color + '15', color: rol.color, border: `1px solid ${rol.color}33` }}>
                              <span className="rol-chip__dot" style={{ background: rol.color }}/>
                              {rol.nombre}
                            </span>
                          ) : <span className="td-muted">Sin rol</span>}
                        </td>
                        <td>
                          <button
                            className={`toggle-btn ${u.estado ? 'toggle-on' : 'toggle-off'}`}
                            onClick={() => !u.esAdmin && toggleEstado(u.id)}
                            style={{ cursor: u.esAdmin ? 'default' : 'pointer' }}
                            title={u.estado ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                          >
                            <span className="toggle-thumb"/>
                          </button>
                        </td>
                        <td className="td-muted">{fmt(u.fechaCreacion)}</td>
                        <td>
                          <div className="actions-group">
                            <button className="btn-ver" title="Ver" onClick={() => openVer(u)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            <button className="btn-editar" title="Editar" onClick={() => openEditar(u)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            {!u.esAdmin && (
                              <button className="btn-anular" title="Anular"
                                onClick={() => { setDeleteError(''); setDeleteTarget(u); }}>
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
        </div>
      </div>
    </Layout>
  );
};

export default UsuariosPage;