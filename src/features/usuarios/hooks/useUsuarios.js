import { useState, useCallback } from 'react';
import usuariosService from '../services/usuariosService';

const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState(() => usuariosService.getAll());
  const refresh = useCallback(() => setUsuarios(usuariosService.getAll()), []);
  const create = (data) => { const r = usuariosService.create(data); if (r.data) refresh(); return r; };
  const update = (id, data) => { const r = usuariosService.update(id, data); if (r.data) refresh(); return r; };
  const remove = (id) => { const r = usuariosService.remove(id); if (r.ok) refresh(); return r; };
  const toggleEstado = (id) => { usuariosService.toggleEstado(id); refresh(); };
  return { usuarios, refresh, create, update, remove, toggleEstado };
};

export default useUsuarios;
