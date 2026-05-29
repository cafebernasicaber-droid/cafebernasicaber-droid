import { useState, useCallback } from 'react';
import empleadosService from '../services/empleadosService';

const useEmpleados = () => {
  const [empleados, setEmpleados] = useState(() => empleadosService.getAll());
  const refresh = useCallback(() => setEmpleados(empleadosService.getAll()), []);
  const create = data => { const r = empleadosService.create(data); if (r.data) refresh(); return r; };
  const update = (id, data) => { const r = empleadosService.update(id, data); if (r.data) refresh(); return r; };
  const remove = id => { const r = empleadosService.remove(id); if (r.ok) refresh(); return r; };
  const toggleActivo = id => { empleadosService.toggleActivo(id); refresh(); };
  const getById = id => empleadosService.getById(id);
  return { empleados, refresh, create, update, remove, toggleActivo, getById };
};

export default useEmpleados;
