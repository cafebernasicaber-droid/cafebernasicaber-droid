import { useState, useCallback } from 'react';
import clientesService from '../services/clientesService';

const useClientes = () => {
  const [clientes, setClientes] = useState(() => clientesService.getAll());
  const refresh = useCallback(() => setClientes(clientesService.getAll()), []);
  const update = (id, data) => { const r = clientesService.update(id, data); if (r.data) refresh(); return r; };
  const remove = (id) => { const r = clientesService.remove(id); if (r.ok) refresh(); return r; };
  const toggleEstado = (id) => { clientesService.toggleEstado(id); refresh(); };
  return { clientes, refresh, update, remove, toggleEstado };
};

export default useClientes;
