import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import useClientes from '../hooks/useClientes';
import clientesService from '../services/clientesService';
import '../../roles/pages/Roles.css';

export const EditarClientePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { update } = useClientes();
  const [form, setForm] = useState({
    nombre: '', correo: '', telefono: '',
    tipoDoc: 'Cédula de Ciudadanía', numeroDoc: '',
    departamento: 'Antioquia', municipio: 'Medellín', direccion: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = clientesService.getById(parseInt(id));
    if (!c) { navigate('/admin/clientes'); return; }
    setForm({
      nombre: c.nombre,
      correo: c.correo,
      telefono: c.telefono || '',
      tipoDoc: c.tipoDoc || 'Cédula de Ciudadanía',
      numeroDoc: c.numeroDoc || '',
      departamento: c.departamento || 'Antioquia',
      municipio: c.municipio || 'Medellín',
      direccion: c.direccion || ''
    });
  }, [id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    setTimeout(() => {
      const r = update(parseInt(id), form);
      if (r.error) { setError(r.error); setLoading(false); return; }
      navigate('/admin/clientes');
    }, 400);
  };

  return (
    <Layout>
      <div className="mod-root">
        <button className="btn-back" onClick={() => navigate('/admin/clientes')}>← Volver a clientes</button>
        <div className="mod-header" style={{marginBottom:24}}>
          <div className="mod-header__left">
            <div className="mod-header__icon" style={{background:'#E8F5E9',color:'#2E7D32'}}>👥</div>
            <div>
              <h1 className="mod-title">Editar cliente</h1>
              <p className="mod-sub">Modificando: {form.nombre}</p>
            </div>
          </div>
        </div>
        <div className="form-card">
          {error && <div className="form-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Correo electrónico *</label>
                <input type="email" required value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tipo de documento</label>
                <select value={form.tipoDoc} onChange={e => setForm({...form, tipoDoc: e.target.value})}>
                  <option>Cédula de Ciudadanía</option>
                  <option>Tarjeta de Identidad</option>
                  <option>Cédula de Extranjería</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Número de documento</label>
                <input type="text" value={form.numeroDoc} onChange={e => setForm({...form, numeroDoc: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Departamento</label>
                <select value={form.departamento} onChange={e => setForm({...form, departamento: e.target.value, municipio: 'Medellín'})}>
                  <option>Antioquia</option>
                  <option>Bogotá D.C.</option>
                  <option>Valle del Cauca</option>
                  <option>Cundinamarca</option>
                  <option>Atlántico</option>
                  <option>Bolívar</option>
                  <option>Santander</option>
                  <option>Córdoba</option>
                  <option>Nariño</option>
                  <option>Risaralda</option>
                  <option>Tolima</option>
                  <option>Huila</option>
                  <option>Cauca</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Municipio / Ciudad</label>
                <select value={form.municipio} onChange={e => setForm({...form, municipio: e.target.value})}>
                  {form.departamento === 'Antioquia' && <><option>Medellín</option><option>Bello</option><option>Itagüí</option><option>Envigado</option><option>Sabaneta</option><option>Rionegro</option><option>Apartadó</option><option>Turbo</option></>}
                  {form.departamento === 'Bogotá D.C.' && <><option>Bogotá</option></>}
                  {form.departamento === 'Valle del Cauca' && <><option>Cali</option><option>Buenaventura</option><option>Palmira</option><option>Tuluá</option><option>Cartago</option></>}
                  {form.departamento === 'Cundinamarca' && <><option>Soacha</option><option>Facatativá</option><option>Zipaquirá</option><option>Chía</option><option>Fusagasugá</option></>}
                  {form.departamento === 'Atlántico' && <><option>Barranquilla</option><option>Soledad</option><option>Malambo</option></>}
                  {form.departamento === 'Bolívar' && <><option>Cartagena</option><option>Magangué</option><option>Turbaco</option></>}
                  {form.departamento === 'Santander' && <><option>Bucaramanga</option><option>Floridablanca</option><option>Girón</option><option>Piedecuesta</option></>}
                  {form.departamento === 'Córdoba' && <><option>Montería</option><option>Lorica</option><option>Sahagún</option></>}
                  {form.departamento === 'Nariño' && <><option>Pasto</option><option>Tumaco</option><option>Ipiales</option></>}
                  {form.departamento === 'Risaralda' && <><option>Pereira</option><option>Dosquebradas</option><option>Santa Rosa de Cabal</option></>}
                  {form.departamento === 'Tolima' && <><option>Ibagué</option><option>Espinal</option><option>Melgar</option></>}
                  {form.departamento === 'Huila' && <><option>Neiva</option><option>Pitalito</option><option>Garzón</option></>}
                  {form.departamento === 'Cauca' && <><option>Popayán</option><option>Santander de Quilichao</option></>}
                </select>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input type="text" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate('/admin/clientes')}>Cancelar</button>
              <button type="submit" className="btn-nuevo" disabled={loading}>{loading ? 'Guardando...' : '💾 Guardar cambios'}</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export const VerClientePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const c = clientesService.getById(parseInt(id));
  const fmt = iso => iso ? new Intl.DateTimeFormat('es-CO',{dateStyle:'long'}).format(new Date(iso)) : '—';

  if (!c) return (
    <Layout><div className="mod-root">
      <button className="btn-back" onClick={() => navigate('/admin/clientes')}>← Volver</button>
      <p>Cliente no encontrado.</p>
    </div></Layout>
  );

  return (
    <Layout>
      <div className="mod-root">
        <button className="btn-back" onClick={() => navigate('/admin/clientes')}>← Volver a clientes</button>
        <div className="ver-card">
          <div className="ver-header">
            <div className="ver-icon" style={{background:'#E8F5E9',color:'#2E7D32',fontSize:28}}>
              {c.nombre.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div className="ver-nombre">{c.nombre}</div>
              <div className="ver-desc">{c.correo}</div>
            </div>
            <button className="btn-nuevo" onClick={() => navigate(`/admin/clientes/editar/${c.id}`)}>✏️ Editar</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[
              ['Teléfono', c.telefono||'—'],
              ['Tipo de documento', c.tipoDoc||'—'],
              ['Número de documento', c.numeroDoc||'—'],
              ['Departamento', c.departamento||'Antioquia'],
              ['Municipio / Ciudad', c.municipio||'Medellín'],
              ['Dirección', c.direccion||'—'],
              ['Estado', c.estado ? '✅ Activo' : '❌ Inactivo'],
              ['Fecha de registro', fmt(c.fechaRegistro)],
            ].map(([label,val],i) => (
              <div key={i} style={{background:'#faf8f5',borderRadius:10,padding:'12px 16px'}}>
                <div style={{fontSize:11,color:'#aaa',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>{label}</div>
                <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};