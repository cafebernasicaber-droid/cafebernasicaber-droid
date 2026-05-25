import { useState, useCallback } from 'react';
import proveedoresService from '../services/proveedoresService';

const useProveedores = () => {
  const [proveedores, setProveedores] = useState(() => proveedoresService.getAll());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setProveedores(proveedoresService.getAll());
  }, []);

  const search = useCallback((query) => {
    const results = proveedoresService.search(query);
    setProveedores(results);
    return results;
  }, []);

  const create = useCallback((data) => {
    setLoading(true);
    const result = proveedoresService.create(data);
    refresh();
    setLoading(false);
    return result;
  }, [refresh]);

  const update = useCallback((id, data) => {
    setLoading(true);
    const result = proveedoresService.update(id, data);
    refresh();
    setLoading(false);
    return result;
  }, [refresh]);

  const remove = useCallback((id) => {
    const result = proveedoresService.remove(id);
    refresh();
    return result;
  }, [refresh]);

  const getById = useCallback((id) => {
    return proveedoresService.getById(id);
  }, []);

  const toggleEstado = useCallback((id) => {
    const proveedor = proveedoresService.getById(id);
    if (!proveedor) return;
    const nuevoEstado = !proveedor.estado;
    proveedoresService.update(id, { ...proveedor, estado: nuevoEstado });
    // Sincronizar estado de insumos asociados
    const insumosAsociados = proveedoresService.getInsumosDelProveedor(id, proveedor.nombre);
    if (insumosAsociados.length > 0) {
      const todosInsumos = JSON.parse(localStorage.getItem('sicaber_insumos') || '[]');
      const idsAfectados = new Set(insumosAsociados.map(i => i.id));
      localStorage.setItem('sicaber_insumos', JSON.stringify(
        todosInsumos.map(i => idsAfectados.has(i.id) ? { ...i, estado: nuevoEstado } : i)
      ));
    }
    refresh();
  }, [refresh]);

  return { proveedores, loading, refresh, search, create, update, remove, getById, toggleEstado };
};

export default useProveedores;
