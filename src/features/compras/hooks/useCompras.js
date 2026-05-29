import { useState, useCallback } from 'react';
import comprasService from '../services/comprasService';

const useCompras = () => {
  const [compras, setCompras] = useState(() => comprasService.getActivas());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setCompras(comprasService.getActivas());
  }, []);

  const search = useCallback((query) => {
    const results = comprasService.search(query);
    setCompras(results);
    return results;
  }, []);

  const create = useCallback((data) => {
    setLoading(true);
    const result = comprasService.create(data);
    refresh();
    setLoading(false);
    return result;
  }, [refresh]);

  const anular = useCallback((id, motivo) => {
    const result = comprasService.anular(id, motivo);
    if (result) refresh();
    return result;
  }, [refresh]);

  const getById = useCallback((id) => {
    return comprasService.getById(id);
  }, []);

  return { compras, loading, refresh, search, create, anular, getById };
};

export default useCompras;
