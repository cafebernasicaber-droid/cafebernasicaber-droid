import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useInsumos from '../hooks/useInsumos';
import './VerInsumoPage.css';
import Layout from '../../../shared/components/Layout';

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
};

const VerInsumoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, remove, toggleEstado } = useInsumos();
  const [insumo, setInsumo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    const found = getById(Number(id));
    if (!found) setNotFound(true);
    else setInsumo(found);
  }, [id, getById]);

  const handleDelete = () => { remove(Number(id)); navigate('/insumos'); };

  const handleToggle = () => {
    toggleEstado(Number(id));
    setInsumo(prev => ({ ...prev, estado: !prev.estado }));
  };

  if (notFound) return (
    <div className="ver-root">
      <div className="not-found-state">
        <div className="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3>Insumo no encontrado</h3>
        <p>El insumo solicitado no existe o fue eliminado.</p>
        <button className="btn-outline-green" onClick={() => navigate('/insumos')}>Volver a la lista</button>
      </div>
    </div>
  );

  if (!insumo) return <div className="loading-state">Cargando...</div>;

  const stockOk = insumo.stockActual >= insumo.stockMinimo;

  return (
    <Layout>
      <div className="ver-root">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/insumos')}>Gestión de Insumos</button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>Detalle de Insumo</span>
        </div>

        <div className="ver-header">
          <div className="ver-header-left">
            <div className="ver-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div>
              <h1>{insumo.nombre}</h1>
              <div className="ver-meta">
                <span className="badge-cat">{insumo.categoria}</span>
                <span className={`badge-estado ${insumo.estado ? 'estado-activo' : 'estado-inactivo'}`}>
                  {insumo.estado ? 'Activo' : 'Inactivo'}
                </span>
                {!stockOk && <span className="badge-stock-low">⚠ Stock bajo</span>}
              </div>
            </div>
          </div>
          <div className="ver-header-actions">
            <button className="btn-edit-ver" onClick={() => navigate(`/insumos/editar/${id}`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <button className="btn-delete-ver" onClick={() => setDeleteModal(true)}>
              ✕ Anular
            </button>
          </div>
        </div>

        <div className="ver-grid">
          <div className="ver-card">
            <h3 className="ver-card-title">Información General</h3>
            <div className="ver-fields">
              <div className="ver-field"><span className="vf-label">Nombre</span><span className="vf-value">{insumo.nombre}</span></div>
              <div className="ver-field"><span className="vf-label">Categoría</span><span className="vf-value"><span className="badge-cat">{insumo.categoria}</span></span></div>
              <div className="ver-field"><span className="vf-label">Unidad de medida</span><span className="vf-value">{insumo.unidadMedida}</span></div>
              <div className="ver-field"><span className="vf-label">Proveedor</span><span className="vf-value">{insumo.proveedor}</span></div>
              <div className="ver-field">
                <span className="vf-label">Estado</span>
                <span className="vf-value ver-estado-wrap">
                  <button className={`toggle-btn-ver ${insumo.estado ? 'toggle-on' : 'toggle-off'}`} onClick={handleToggle}>
                    <span className="toggle-thumb"></span>
                  </button>
                  <span className={insumo.estado ? 'text-activo' : 'text-inactivo'}>
                    {insumo.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="ver-card">
            <h3 className="ver-card-title">Inventario & Precio</h3>
            <div className="ver-fields">
              <div className="ver-field">
                <span className="vf-label">Stock actual</span>
                <span className={`vf-value vf-big ${stockOk ? 'text-green' : 'text-red'}`}>
                  {insumo.stockActual} {insumo.unidadMedida}
                </span>
              </div>
              <div className="ver-field"><span className="vf-label">Stock mínimo</span><span className="vf-value">{insumo.stockMinimo} {insumo.unidadMedida}</span></div>
              <div className="ver-field"><span className="vf-label">Precio unitario</span><span className="vf-value vf-big text-brown">{formatCOP(insumo.precioUnitario)}</span></div>
              <div className="ver-field"><span className="vf-label">Valor en inventario</span><span className="vf-value">{formatCOP(insumo.stockActual * insumo.precioUnitario)}</span></div>
            </div>
          </div>

          <div className="ver-card ver-card-full">
            <h3 className="ver-card-title">Descripción y Registro</h3>
            <div className="ver-fields">
              <div className="ver-field ver-field-col">
                <span className="vf-label">Descripción</span>
                <span className="vf-value vf-desc">{insumo.descripcion || 'Sin descripción registrada'}</span>
              </div>
              <div className="ver-field"><span className="vf-label">Fecha de registro</span><span className="vf-value">{formatDate(insumo.fechaCreacion)}</span></div>
              <div className="ver-field"><span className="vf-label">ID del insumo</span><span className="vf-value" style={{ fontFamily: 'monospace', color: '#888' }}>{insumo.id}</span></div>
            </div>
          </div>
        </div>

        {!stockOk && (
          <div className="stock-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <strong>Alerta de stock:</strong> El stock actual ({insumo.stockActual} {insumo.unidadMedida}) está por debajo del mínimo requerido ({insumo.stockMinimo} {insumo.unidadMedida}).
          </div>
        )}

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
              <h3>¿Anular insumo?</h3>
              <p>Esta acción es <strong>permanente</strong> y no se puede deshacer.</p>
              <div className="modal-detail">"{insumo.nombre}"</div>
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

export default VerInsumoPage;
