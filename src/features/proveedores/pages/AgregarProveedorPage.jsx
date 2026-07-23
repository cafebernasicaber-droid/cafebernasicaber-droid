import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProveedores from '../hooks/useProveedores';
import ProveedorForm from '../components/ProveedorForm';
import './FormPage.css';
import Layout from '../../../shared/components/Layout';

const AgregarProveedorPage = () => {
  const navigate = useNavigate();
  const { create } = useProveedores();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = (data, onDuplicateError) => {
    const result = create(data);
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

  return (
    <Layout>
      <div className="form-page-root">
        {success && (
          <div className="toast toast-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            ¡Proveedor registrado correctamente! Redirigiendo...
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
          <span>Agregar Proveedor</span>
        </div>

        <div className="form-page-header">
          <div className="form-page-icon form-page-icon-add">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div>
            <h1>Agregar Proveedor</h1>
            <p>Completa los campos para registrar un nuevo proveedor</p>
          </div>
        </div>

        <div className="form-card">
          <ProveedorForm
            isEditing={false}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/proveedores')}
          />
        </div>
      </div>
    </Layout>

  );
};

export default AgregarProveedorPage;
