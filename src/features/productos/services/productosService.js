import { productosApi } from '../../../shared/services/api';

// El backend usa fecha_inicio_desc / fecha_fin_desc
export const descuentoVigente = (p) => {
  if (!p?.descuento || p.descuento <= 0) return null;
  const hoy = new Date().toISOString().slice(0, 10);
  if (p.fecha_inicio_desc && hoy < p.fecha_inicio_desc) return null;
  if (p.fecha_fin_desc    && hoy > p.fecha_fin_desc)    return null;
  return p.descuento;
};

export const calcPrecioFinal = (p) => {
  const desc = descuentoVigente(p);
  if (!desc) return p?.precio ?? 0;
  return Math.round(p.precio * (1 - desc / 100));
};

const productosService = {
  getActivos: ()        => productosApi.getActivos(),
  getAll:     ()        => productosApi.getAll(),
  getById:    (id)      => productosApi.getById(id),
  create:     (data)    => productosApi.create(data),
  update:     (id, d)   => productosApi.update(id, d),
  remove:     (id)      => productosApi.remove(id),
  toggleEstado: (id)      => productosApi.toggleEstado(id),
};

export default productosService;