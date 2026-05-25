import { useState, useCallback } from 'react';
import adicionesService from '../services/adicionesService';

const useAdiciones = () => {
  const [adiciones, setAdiciones] = useState(() => adicionesService.getAll());
  const refresh = useCallback(() => setAdiciones(adicionesService.getAll()), []);
  const create = data => { const r = adicionesService.create(data); if (r.data) refresh(); return r; };
  const update = (id, data) => { const r = adicionesService.update(id, data); if (r.data) refresh(); return r; };
  const remove = id => { const r = adicionesService.remove(id); if (r.ok) refresh(); return r; };
  const toggleEstado = id => { adicionesService.toggleEstado(id); refresh(); };
  return { adiciones, refresh, create, update, remove, toggleEstado };
};
export default useAdiciones;
