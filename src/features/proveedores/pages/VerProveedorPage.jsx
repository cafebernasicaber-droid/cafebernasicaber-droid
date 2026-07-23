import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useProveedores from '../hooks/useProveedores';
import './VerProveedorPage.css';
import Layout from '../../../shared/components/Layout';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
};

const VerProveedorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, remove, toggleEstado } = useProveedores();
  const [proveedor, setProveedor] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    const found = getById(id);
    if (!found) setNotFound(true);
    else setProveedor(found);
  }, [id, getById]);

  const handleDelete = () => {
    remove(id);
    navigate('/proveedores');
  };

  const handleToggle = () => {
    toggleEstado(id);
    setProveedor(prev => ({ ...prev, estado: prev.estado === 'Activo' ? 'Inactivo' : 'Activo' }));
  };

  if (notFound) return (
    <div className="ver-root">
      <div className="not-found-state">
        <div className="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3>Proveedor no encontrado</h3>
        <p>El proveedor solicitado no existe o fue eliminado.</p>
        <button className="btn-outline-green" onClick={() => navigate('/proveedores')}>Volver a la lista</button>
      </div>
    </div>
  );

  if (!proveedor) return <div className="loading-state">Cargando...</div>;

  return (
    <Layout>
      <div className="ver-root">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/proveedores')}>Gestión de Proveedores</button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>Detalle de Proveedor</span>
        </div>

        <div className="ver-header">
          <div className="ver-header-left">
            <div className="ver-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h1>{proveedor.nombre}</h1>
              <div className="ver-meta">
                <span className="badge-cat">{proveedor.categoria}</span>
                <span className={`badge-estado ${proveedor.estado === 'Activo' ? 'estado-activo' : 'estado-inactivo'}`}>
                  {proveedor.estado === 'Activo' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <div className="ver-header-actions">
            <button className="btn-edit-ver" onClick={() => navigate(`/proveedores/editar/${id}`)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              Editar
            </button>
            <button className="btn-delete-ver" onClick={() => setDeleteModal(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Stop
            </button>
          </div>
        </div>

        <div className="ver-grid">
          <div className="ver-card">
            <h3 className="ver-card-title">Información de Contacto</h3>
            <div className="ver-fields">
              <div className="ver-field">
                <span className="vf-label">Nombre</span>
                <span className="vf-value">{proveedor.nombre}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">NIT / RUT</span>
                <span className="vf-value">{proveedor.nit}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Teléfono</span>
                <span className="vf-value">{proveedor.telefono}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Correo electrónico</span>
                <span className="vf-value">{proveedor.correo}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Estado</span>
                <span className="vf-value ver-estado-wrap">
                  <button
                    className={`toggle-btn-ver ${proveedor.estado === 'Activo' ? 'toggle-on' : 'toggle-off'}`}
                    onClick={handleToggle}
                  >
                    <span className="toggle-thumb"></span>
                  </button>
                  <span className={proveedor.estado === 'Activo' ? 'text-activo' : 'text-inactivo'}>
                    {proveedor.estado === 'Activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="ver-card">
            <h3 className="ver-card-title">Ubicación y Categoría</h3>
            <div className="ver-fields">
              <div className="ver-field">
                <span className="vf-label">Ciudad</span>
                <span className="vf-value">{proveedor.ciudad}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Dirección</span>
                <span className="vf-value">{proveedor.direccion || '—'}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Categoría</span>
                <span className="vf-value"><span className="badge-cat">{proveedor.categoria}</span></span>
              </div>
            </div>
          </div>

          <div className="ver-card ver-card-full">
            <h3 className="ver-card-title">Observaciones y Registro</h3>
            <div className="ver-fields">
              <div className="ver-field ver-field-col">
                <span className="vf-label">Observaciones</span>
                <span className="vf-value vf-desc">{proveedor.observaciones || 'Sin observaciones registradas'}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Fecha de registro</span>
                <span className="vf-value">{formatDate(proveedor.fechaCreacion)}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">ID del proveedor</span>
                <span className="vf-value" style={{ fontFamily: 'monospace', color: '#81C784', background:'rgba(76,175,80,.12)', padding:'2px 8px', borderRadius:6, fontSize:12 }}>{proveedor.id}</span>
              </div>
            </div>
          </div>
        </div>

        {deleteModal && (
          <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </div>
              <h3>¿Detener proveedor?</h3>
              <p>Esta acción es <strong>permanente</strong> y no se puede deshacer.</p>
              <div className="modal-detail">"{proveedor.nombre}"</div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteModal(false)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleDelete}>Sí, anular</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>

  );
};

export default VerProveedorPage;