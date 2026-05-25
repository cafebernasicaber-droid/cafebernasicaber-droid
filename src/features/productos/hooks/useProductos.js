import { useState, useCallback } from 'react';
import productosService from '../services/productosService';

const useProductos = () => {
  const [productos, setProductos] = useState(() => productosService.getAll());
  const refresh = useCallback(() => setProductos(productosService.getAll()), []);
  const create = data => { const r = productosService.create(data); if (r.data) refresh(); return r; };
  const update = (id, data) => { const r = productosService.update(id, data); if (r.data) refresh(); return r; };
  const remove = id => { const r = productosService.remove(id); if (r.ok) refresh(); return r; };
  const toggleEstado = id => { productosService.toggleEstado(id); refresh(); };
  return { productos, refresh, create, update, remove, toggleEstado };
};
export default useProductos;
