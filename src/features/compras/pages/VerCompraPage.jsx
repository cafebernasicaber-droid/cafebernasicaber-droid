import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import comprasService from '../services/comprasService';
import './VerCompraPage.css';
import Layout from '../../../shared/components/Layout';

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(val) || 0);

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
};

const VerCompraPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [compra, setCompra]       = useState(null);
  const [notFound, setNotFound]   = useState(false);
  const [anularModal, setAnularModal] = useState(false);
  const [motivo, setMotivo]       = useState('');
  const [motivoError, setMotivoError] = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const found = comprasService.getById(id);
    if (!found) setNotFound(true);
    else setCompra(found);
  }, [id]);

  const showError   = (msg) => { setErrorMsg(msg);  setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); };

  const handleAnular = () => {
    if (!motivo.trim()) { setMotivoError('El motivo es obligatorio.'); return; }
    const ok = comprasService.anular(id, motivo.trim());
    if (ok) {
      setCompra(prev => ({ ...prev, estado: 'anulada', motivoAnulacion: motivo, fechaAnulacion: new Date().toISOString() }));
      showSuccess('Compra anulada. El stock fue revertido.');
    } else {
      showError('No se pudo anular la compra.');
    }
    setAnularModal(false);
    setMotivo('');
  };

  if (notFound) return (
    <Layout>
      <div className="ver-root">
        <div className="not-found-state">
          <div className="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h3>Compra no encontrada</h3>
          <p>La compra solicitada no existe o fue eliminada.</p>
          <button className="btn-outline-green" onClick={() => navigate('/compras')}>Volver a la lista</button>
        </div>
      </div>
    </Layout>
  );

  if (!compra) return <div className="loading-state">Cargando...</div>;

  const esAnulada = compra.estado === 'anulada';

  return (
    <Layout>
      <div className="ver-root">
        {successMsg && (
          <div className="toast toast-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="toast toast-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {errorMsg}
          </div>
        )}

        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/compras')}>Compras a Proveedores</button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>Detalle de Compra</span>
        </div>

        <div className="ver-header">
          <div className="ver-header-left">
            <div className="ver-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div>
              <h1>Compra #{compra.id}</h1>
              <div className="ver-meta">
                <span className="badge-cat">{compra.proveedorNombre}</span>
                {esAnulada ? (
                  <span style={{ padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:'rgba(229,57,53,0.15)',color:'#EF5350',border:'1px solid #EF9A9A' }}>
                    Anulada
                  </span>
                ) : (
                  <span style={{ padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:'rgba(58,158,66,0.15)',color:'var(--color-green)',border:'1px solid #A5D6A7' }}>
                    Activa
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="ver-header-actions">
            {!esAnulada && (
              <button
                className="btn-delete-ver"
                onClick={() => { setAnularModal(true); setMotivo(''); setMotivoError(''); }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Anular
              </button>
            )}
          </div>
        </div>

        <div className="ver-grid">
          <div className="ver-card">
            <h3 className="ver-card-title">Información General</h3>
            <div className="ver-fields">
              <div className="ver-field">
                <span className="vf-label">Proveedor</span>
                <span className="vf-value">{compra.proveedorNombre}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Fecha de compra</span>
                <span className="vf-value">{compra.fecha}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Total</span>
                <span className="vf-value vf-big text-brown">{formatCOP(compra.total)}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Estado</span>
                <span className="vf-value">{esAnulada ? 'Anulada' : 'Activa'}</span>
              </div>
            </div>
          </div>

          <div className="ver-card">
            <h3 className="ver-card-title">Resumen</h3>
            <div className="ver-fields">
              <div className="ver-field">
                <span className="vf-label">Cantidad de ítems</span>
                <span className="vf-value vf-big">{compra.items?.length || 0}</span>
              </div>
              <div className="ver-field">
                <span className="vf-label">Fecha de registro</span>
                <span className="vf-value">{formatDate(compra.fechaCreacion)}</span>
              </div>
              {esAnulada && (
                <>
                  <div className="ver-field">
                    <span className="vf-label">Fecha de anulación</span>
                    <span className="vf-value">{formatDate(compra.fechaAnulacion)}</span>
                  </div>
                  <div className="ver-field">
                    <span className="vf-label">Motivo</span>
                    <span className="vf-value">{compra.motivoAnulacion || '—'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="ver-card ver-card-full">
            <h3 className="ver-card-title">Detalle de Insumos</h3>
            {compra.items && compra.items.length > 0 ? (
              <div className="items-detalle-wrap">
                <table className="items-detalle-table">
                  <thead>
                    <tr>
                      <th>Insumo</th><th>Unidad</th><th>Cantidad</th>
                      <th>Precio unitario</th><th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compra.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.insumo}</td>
                        <td>{item.unidad || '—'}</td>
                        <td>{item.cantidad}</td>
                        <td>{formatCOP(item.precioUnitario)}</td>
                        <td className="subtotal-cell">{formatCOP(item.cantidad * item.precioUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="total-label">Total</td>
                      <td className="total-value">{formatCOP(compra.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="vf-desc">Sin insumos registrados.</p>
            )}
          </div>

          <div className="ver-card ver-card-full">
            <h3 className="ver-card-title">Observaciones</h3>
            <div className="ver-fields">
              <div className="ver-field ver-field-col">
                <span className="vf-label">Notas</span>
                <span className="vf-value vf-desc">{compra.observaciones || 'Sin observaciones registradas'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Anular */}
        {anularModal && (
          <div className="modal-overlay" onClick={() => setAnularModal(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-icon modal-icon-danger">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </div>
              <h3>Anular compra</h3>
              <p>El stock de los insumos será <strong>revertido</strong> al anular.</p>
              <div className="modal-detail">Compra #{compra.id} — {compra.proveedorNombre}</div>
              <div style={{ marginTop:12 }}>
                <label style={{ fontWeight:600,fontSize:13,display:'block',marginBottom:6 }}>
                  Motivo <span style={{ color:'#E53935' }}>*</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={e => { setMotivo(e.target.value); if(motivoError) setMotivoError(''); }}
                  placeholder="Motivo de la anulación..."
                  rows={3}
                  style={{ width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:`1px solid ${motivoError?'#E53935':'#ddd'}`,fontSize:13,resize:'vertical' }}
                />
                {motivoError && <span style={{ color:'#E53935',fontSize:12 }}>{motivoError}</span>}
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setAnularModal(false)}>Cancelar</button>
                <button className="btn-confirm-danger" onClick={handleAnular}>Anular compra</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerCompraPage;