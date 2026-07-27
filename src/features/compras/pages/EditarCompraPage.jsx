import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCompras from '../hooks/useCompras';
import CompraForm from '../components/CompraForm';
import './FormPage.css';
import Layout from '../../../shared/components/Layout';

const EditarCompraPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { update, cambiarEstado, getById } = useCompras();
  const [compra, setCompra] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [bloqueada, setBloqueada] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const found = getById(Number(id));
    if (!found) {
      setNotFound(true);
    } else if (found.estado !== 'Pendiente') {
      setBloqueada(true);
      setCompra(found);
    } else {
      setCompra(found);
    }
  }, [id, getById]);

  const handleSubmit = (data) => {
    const estadoOriginal = compra.estado;
    const estadoNuevo = data.estado;

    const result = update(Number(id), data);
    if (!result) return;

    if (estadoNuevo && estadoNuevo !== estadoOriginal) {
      cambiarEstado(Number(id), estadoNuevo);
    }

    setSuccess(true);
    setTimeout(() => navigate("/compras"), 1500);
  };

  if (notFound) return (
    <div className="form-page-root">
      <div className="not-found-state">
        <div className="empty-icon empty-icon-search">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3>Compra no encontrada</h3>
        <p>La compra que intentas editar no existe o fue eliminada.</p>
        <button className="btn-outline-green" onClick={() => navigate('/compras')}>Volver a la lista</button>
      </div>
    </div>
  );

  if (bloqueada && compra) return (
    <div className="form-page-root">
      <div className="not-found-state">
        <div className="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3>Compra no editable</h3>
        <p>La compra <strong>#{compra.id}</strong> está en estado <strong>{compra.estado}</strong> y no puede modificarse.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Solo las compras en estado <strong>Pendiente</strong> pueden editarse.</p>
        <button className="btn-outline-green" onClick={() => navigate(`/compras/ver/${compra.id}`)}>Ver detalle</button>
      </div>
    </div>
  );

  if (!compra) return <div className="loading-state">Cargando...</div>;

  return (
    <Layout>
      <div className="form-page-root">
        {success && (
          <div className="toast toast-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            ¡Compra actualizada correctamente! Redirigiendo...
          </div>
        )}

        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/compras')}>
            Compras a Proveedores
          </button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>Editar Compra</span>
        </div>

        <div className="form-page-header">
          <div className="form-page-icon form-page-icon-edit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div>
            <h1>Editar Compra</h1>
            <p>Modifica los campos de la compra: <strong>#{compra.id} — {compra.proveedorNombre}</strong></p>
          </div>
        </div>

        <div className="form-card">
          <CompraForm
            initialData={compra}
            isEditing={true}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/compras')}
          />
        </div>
      </div>
    </Layout>

  );
};

export default EditarCompraPage;
