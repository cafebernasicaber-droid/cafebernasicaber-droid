import { useState, useCallback } from 'react';
import categoriasService from '../services/categoriasService';

const useCategorias = () => {
  const [categorias, setCategorias] = useState(() => categoriasService.getAll());
  const refresh = useCallback(() => setCategorias(categoriasService.getAll()), []);
  const create = data => { const r = categoriasService.create(data); if (r.data) refresh(); return r; };
  const update = (id, data) => { const r = categoriasService.update(id, data); if (r.data) refresh(); return r; };
  const remove = id => { const r = categoriasService.remove(id); if (r.ok) refresh(); return r; };
  const toggleEstado = id => { categoriasService.toggleEstado(id); refresh(); };
  return { categorias, refresh, create, update, remove, toggleEstado };
};
export default useCategorias;
