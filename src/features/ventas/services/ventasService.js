import { ventasApi } from '../../../shared/services/api';

const ventasService = {
  getAll:        ()              => ventasApi.getAll(),
  getStats:      ()              => ventasApi.getStats(),
  getById:       (id)            => ventasApi.getById(id),
  crearDesde:    (id_pedido)     => ventasApi.crearDesde(id_pedido),
  cambiarEstado: (id, estado)    => ventasApi.cambiarEstado(id, estado),
};

export default ventasService;
