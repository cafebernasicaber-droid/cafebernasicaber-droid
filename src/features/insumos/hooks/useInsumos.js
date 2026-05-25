import { useState, useCallback } from 'react';
import insumosService from '../services/insumosService';

const useInsumos = () => {
  const [insumos, setInsumos] = useState(() => insumosService.getAll());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => setInsumos(insumosService.getAll()), []);

  const search = useCallback((query) => {
    const results = insumosService.search(query);
    setInsumos(results);
    return results;
  }, []);

  const create = useCallback((data) => {
    setLoading(true);
    const result = insumosService.create(data);
    refresh();
    setLoading(false);
    return result;
  }, [refresh]);

  const update = useCallback((id, data) => {
    setLoading(true);
    const result = insumosService.update(id, data);
    refresh();
    setLoading(false);
    return result;
  }, [refresh]);

  const remove = useCallback((id) => {
    const result = insumosService.remove(id);
    refresh();
    return result;
  }, [refresh]);

  const getById = useCallback((id) => insumosService.getById(id), []);

  const toggleEstado = useCallback((id) => {
    const insumo = insumosService.getById(id);
    if (insumo) { insumosService.update(id, { ...insumo, estado: !insumo.estado }); refresh(); }
  }, [refresh]);

  return { insumos, loading, refresh, search, create, update, remove, getById, toggleEstado };
};

export default useInsumos;
