import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import productosService from '../services/productosService';
import '../../insumos/pages/InsumosPage.css';
import './Modulos.css';

export default function ProductoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [form, setForm] = useState({
    nombre: '', precio: '', categoria: '',
    descripcion: '', imagen: '', estado: 'Activo'
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const [imgError, setImgError] = useState('');
  const fileInputRef = useRef(null);
  const categorias = productosService.getCategorias();

  useEffect(() => {
    if (esEdicion) {
      const p = productosService.getById(Number(id));
      if (p) setForm(p);
    }
  }, [id]);

  /* Convertir archivo a base64 */
  const processFile = useCallback((file) => {
    setImgError('');
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setImgError('Solo se aceptan imágenes PNG, JPG, WEBP o GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImgError('La imagen no puede superar 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setForm(prev => ({ ...prev, imagen: e.target.result }));
    reader.readAsDataURL(file);
  }, []);

  /* Drag & Drop handlers */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };
  const onFileChange = (e) => processFile(e.target.files[0]);

  const removeImage = () => {
    setForm(prev => ({ ...prev, imagen: '' }));
    setImgError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* Submit */
  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    const r = esEdicion
      ? productosService.update(Number(id), form)
      : productosService.create(form);
    if (r.error) { setError(r.error); return; }
    setSuccess(esEdicion ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
    setTimeout(() => navigate('/productos'), 1200);
  };

  return (
    <Layout>
      <div className="insumos-root">
        {success && <div className="toast toast-success">✓ {success}</div>}

        <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          <span style={{ color: '#4CAF50', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/productos')}>Productos</span>
          {' › '}{esEdicion ? 'Editar' : 'Nuevo producto'}
        </div>

        <div className="page-header">
          <h1 className="page-title">{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h1>
          <p className="page-subtitle">
            {esEdicion ? 'Modifica los campos del producto' : 'Completa los datos para registrar un producto'}
          </p>
        </div>

        <div className="insumos-card" style={{ padding: 32 }}>
          {error && (
            <div style={{ background: '#FFEBEE', color: '#B71C1C', padding: '10px 16px',
              borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

              {/* Nombre */}
              <div className="form-group">
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Nombre *</label>
                <input type="text" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Cappuccino Artesanal" required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              </div>

              {/* Categoría */}
              <div className="form-group">
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Categoría *</label>
                <select value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })} required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }}>
                  <option value="">-- Seleccionar --</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Precio */}
              <div className="form-group">
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Precio (COP) *</label>
                <input type="number" value={form.precio}
                  onChange={e => setForm({ ...form, precio: e.target.value })}
                  placeholder="0" required min="0"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              </div>

              {/* Estado */}
              <div className="form-group">
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Estado</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <button type="button"
                    className={`toggle-btn ${form.estado === 'Activo' ? 'toggle-on' : 'toggle-off'}`}
                    onClick={() => setForm({ ...form, estado: form.estado === 'Activo' ? 'Inactivo' : 'Activo' })}>
                    <span className="toggle-thumb" />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: form.estado === 'Activo' ? '#2E7D32' : '#888' }}>
                    {form.estado}
                  </span>
                </div>
              </div>

              {/* Imagen con drag & drop */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>
                  Imagen del producto
                </label>

                {!form.imagen ? (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragging ? '#4CAF50' : '#ccc'}`,
                      borderRadius: 12,
                      padding: '36px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: dragging ? '#F1F8E9' : '#fafafa',
                      transition: 'all 0.2s',
                      userSelect: 'none',
                    }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#555' }}>
                      Arrastra tu imagen aquí
                    </p>
                    <p style={{ margin: '4px 0 12px', fontSize: 12, color: '#aaa' }}>
                      o haz clic para seleccionarla
                    </p>
                    <span style={{
                      display: 'inline-block', padding: '6px 18px',
                      background: '#4CAF50', color: 'white',
                      borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>
                      Seleccionar imagen
                    </span>
                    <p style={{ margin: '10px 0 0', fontSize: 11, color: '#bbb' }}>
                      PNG, JPG, WEBP, GIF · máx. 5 MB
                    </p>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={form.imagen}
                      alt="preview"
                      style={{
                        width: 140, height: 140, borderRadius: 12,
                        objectFit: 'cover', border: '2px solid #4CAF50', display: 'block',
                      }} />
                    <button type="button" onClick={removeImage} title="Quitar imagen"
                      style={{
                        position: 'absolute', top: -8, right: -8,
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#E53935', border: 'none', color: 'white',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}>
                      ×
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      style={{
                        marginTop: 8, display: 'block', fontSize: 12,
                        color: '#4CAF50', background: 'none', border: 'none',
                        cursor: 'pointer', fontWeight: 600, padding: 0,
                      }}>
                      🔄 Cambiar imagen
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={onFileChange} />

                {imgError && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E53935', fontWeight: 600 }}>
                    ⚠ {imgError}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Descripción</label>
                <textarea value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción del producto..." rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #eee', paddingTop: 20 }}>
              <button type="button" className="btn-cancel" onClick={() => navigate('/productos')}>Cancelar</button>
              <button type="submit" className="btn-add">{esEdicion ? '💾 Actualizar' : '+ Registrar producto'}</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}