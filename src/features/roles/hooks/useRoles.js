import { useState, useCallback } from 'react';
import rolesService from '../services/rolesService';

const useRoles = () => {
  const [roles, setRoles] = useState(() => rolesService.getAll());
  const refresh = useCallback(() => setRoles(rolesService.getAll()), []);
  const create = (data) => { const r = rolesService.create(data); if (r.data) refresh(); return r; };
  const update = (id, data) => { const r = rolesService.update(id, data); if (r.data) refresh(); return r; };
  const remove = (id) => { const r = rolesService.remove(id); if (r.ok) refresh(); return r; };
  return { roles, refresh, create, update, remove };
};

export default useRoles;
