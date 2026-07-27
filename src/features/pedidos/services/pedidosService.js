import { pedidosApi } from '../../../shared/services/api';

const pedidosService = {
  getAll:        ()           => pedidosApi.getAll(),
  getStats:      ()           => pedidosApi.getStats(),
  getById:       (id)         => pedidosApi.getById(id),
  cambiarEstado: (id, estado) => pedidosApi.cambiarEstado(id, estado),
  remove:        (id)         => pedidosApi.remove(id),

  // Mapea la estructura del frontend al schema del backend
  create: (data) => pedidosApi.create({
    cliente_id: data.clienteId || null,
    mesa:       data.tipo === 'local' ? (data.mesa || 'Mostrador') : `Domicilio - ${data.cliente}`,
    total:      data.total || 0,
    items:      data.productos || [],
    // "Atendido por" y "domiciliario" — antes no se enviaban en absoluto
    // (ni siquiera en _meta), así que aunque el formulario los pedía y
    // validaba, esa información nunca llegaba a guardarse.
    barista:      data.barista || null,
    domiciliario: data.domiciliario || null,
    // Campos extra que el backend guarda en items o ignora
    _meta: {
      numero:              data.numero,
      cliente:             data.cliente,
      tipo:                data.tipo,
      pago:                data.pago,
      hora:                data.hora,
      estado:              data.estado,
      comprobante:         data.comprobante,
      comprobanteImg:      data.comprobanteImg,
      origen:              data.origen,
      direccionAlternativa: data.direccionAlternativa,
      barista:             data.barista,
      domiciliario:        data.domiciliario,
    },
  }),

  // Edición de un pedido ya creado (cliente, tipo, pago, productos/total,
  // personal asignado, dirección alternativa). No crea un pedido nuevo.
  update: (id, data) => pedidosApi.update(id, {
    cliente:      data.cliente,
    tipo:         data.tipo,
    pago:         data.pago,
    total:        data.total,
    items:        data.productos,
    barista:      data.barista || null,
    domiciliario: data.domiciliario || null,
    direccion_alternativa: data.direccionAlternativa,
  }),
};

export default pedidosService;
