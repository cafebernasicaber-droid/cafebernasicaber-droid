import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useInsumos from '../hooks/useInsumos';
import InsumoForm from '../components/InsumoForm';
import './FormPage.css';
import Layout from '../../../shared/components/Layout';

const AgregarInsumoPage = () => {
  const navigate = useNavigate();
  const { create } = useInsumos();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = (data) => {
    const result = create(data);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setServerError('');
    setSuccess(true);
    setTimeout(() => navigate('/insumos'), 1500);
  };

  return (
    <Layout>
      <div className="form-page-root">
        {success && (
          <div className="toast toast-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            ¡Insumo registrado correctamente! Redirigiendo...
          </div>
        )}

        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/insumos')}>Gestión de Insumos</button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span>Agregar Insumo</span>
        </div>

        <div className="form-page-header">
          <div className="form-page-icon form-page-icon-add">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div>
            <h1>Agregar Insumo</h1>
            <p>Completa los campos para registrar un nuevo insumo</p>
          </div>
        </div>

        <div className="form-card">
          <InsumoForm
            isEditing={false}
            serverError={serverError}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/insumos')}
          />
        </div>
      </div>
    </Layout>

  );
};

export default AgregarInsumoPage;
