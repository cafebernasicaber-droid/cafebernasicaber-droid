import { devolucionesApi } from '../../../shared/services/api';

const devolucionesService = {
  getAll:        ()              => devolucionesApi.getAll(),
  create:        (data)          => devolucionesApi.create(data),
  cambiarEstado: (id, estado)    => devolucionesApi.cambiarEstado(id, estado),
  // No hay endpoint /devoluciones/stats en el backend, así que lo calculamos
  // aquí mismo a partir del listado completo (usado por el Dashboard).
  getStats: async () => {
    const data = await devolucionesApi.getAll();
    const lista = Array.isArray(data) ? data : [];
    const pendiente = lista.filter(d => (d.estado || '').toLowerCase() === 'pendiente').length;
    return { pendiente };
  },
};

export default devolucionesService;