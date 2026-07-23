import { useState, useCallback, useEffect } from 'react';
import insumosService from '../services/insumosService';

const useInsumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    insumosService.getAll()
      .then(data => setInsumos(Array.isArray(data) ? data : []))
      .catch(() => setInsumos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (d) => { const r = await insumosService.create(d); refresh(); return r; }, [refresh]);
  const update = useCallback(async (id, d) => { const r = await insumosService.update(id, d); refresh(); return r; }, [refresh]);
  const remove = useCallback(async (id) => { const r = await insumosService.remove(id); refresh(); return r; }, [refresh]);
  const toggleEstado = useCallback(async (id) => { const r = await insumosService.toggleEstado(id); refresh(); return r; }, [refresh]);
  const getById = useCallback((id) => insumosService.getById(id), []);

  return { insumos, loading, refresh, create, update, remove, toggleEstado, getById };
};

export default useInsumos;