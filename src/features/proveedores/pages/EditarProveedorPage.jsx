import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useProveedores from '../hooks/useProveedores';
import ProveedorForm from '../components/ProveedorForm';
import './FormPage.css';
import Layout from '../../../shared/components/Layout';

const EditarProveedorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { update, getById } = useProveedores();
  const [proveedor, setProveedor] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const found = getById(Number(id));
    if (!found) setNotFound(true);
    else setProveedor(found);
  }, [id, getById]);

  const handleSubmit = (data, onDuplicateError) => {
    const result = update(Number(id), data);
    if (result.error) {
      if (result.duplicateFields) {
        onDuplicateError(result.duplicateFields);
      }
      setServerError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/proveedores'), 1500);
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
        <h3>Proveedor no encontrado</h3>
        <p>El proveedor que intentas editar no existe o fue eliminado.</p>
        <button className="btn-outline-green" onClick={() => navigate('/proveedores')}>Volver a la lista</button>
      </div>
    </div>
  );

  if (!proveedor) return <div className="loading-state">Cargando...</div>;

  return (
    <Layout>
      <div className="form-page-root">
        {success && (
          <div className="toast toast-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            ¡Proveedor actualizado correctamente! Redirigiendo...
          </div>
        )}

        {serverError && (
          <div className="toast toast-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {serverError}
          </div>
        )}

        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/proveedores')}>
            Gestión de Proveedores
          </button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>Editar Proveedor</span>
        </div>

        <div className="form-page-header">
          <div className="form-page-icon form-page-icon-edit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div>
            <h1>Editar Proveedor</h1>
            <p>Modifica los campos del proveedor: <strong>{proveedor.nombre}</strong></p>
          </div>
        </div>

        <div className="form-card">
          <ProveedorForm
            initialData={proveedor}
            isEditing={true}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/proveedores')}
          />
        </div>
      </div>
    </Layout>

  );
};

export default EditarProveedorPage;
