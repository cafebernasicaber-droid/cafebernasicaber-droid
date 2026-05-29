import ventasService from '../../ventas/services/ventasService';

const STORAGE_KEY = 'sicaber_devoluciones';

const init = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify([])); };
const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a,b) => b.id_dev - a.id_dev); };
const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id_dev === id) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i=>i.id_dev)) + 1 : 1; };

const getByVenta = id_venta => getAll().filter(d => d.id_venta === id_venta);

const create = datos => {
  if (!datos.id_venta) return { error: 'La venta es obligatoria.' };
  if (!datos.motivo?.trim()) return { error: 'El motivo es obligatorio.' };
  const venta = ventasService.getById(datos.id_venta);
  if (!venta) return { error: 'Venta no encontrada.' };
  const items = getAll();
  const n = {
    ...datos,
    id_dev: nextId(),
    estado: 'pendiente',
    fecha: new Date().toISOString(),
    motivo: datos.motivo.trim(),
  };
  items.push(n); save(items);
  // Marcar venta como devuelta al registrar devolución
  ventasService.cambiarEstado(datos.id_venta, 'devuelto');
  return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id_dev === id);
  if (idx === -1) return { error: 'Devolución no encontrada.' };
  items[idx] = { ...items[idx], ...data, id_dev: id }; save(items);
  return { data: items[idx] };
};

const cambiarEstado = (id, nuevoEstado) => {
  const items = getAll(); const idx = items.findIndex(i => i.id_dev === id);
  if (idx === -1) return { error: 'Devolución no encontrada.' };
  const dev = items[idx];
  items[idx] = { ...dev, estado: nuevoEstado }; save(items);
  // Sincronizar estado de la venta vinculada
  if (nuevoEstado === 'aprobada') {
    ventasService.cambiarEstado(dev.id_venta, 'devuelto');
  } else if (nuevoEstado === 'rechazada') {
    // Solo revertir si no hay otras devoluciones aprobadas para esta venta
    const otrasAprobadas = items.filter(d => d.id_dev !== id && d.id_venta === dev.id_venta && d.estado === 'aprobada');
    if (otrasAprobadas.length === 0) {
      ventasService.cambiarEstado(dev.id_venta, 'vendido');
    }
  }
  return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id_dev === id)) return { error: 'Devolución no encontrada.' };
  save(items.filter(i => i.id_dev !== id)); return { ok: true };
};

const getStats = () => {
  const items = getAll();
  return {
    total: items.length,
    pendiente: items.filter(d => d.estado === 'pendiente').length,
    aprobada: items.filter(d => d.estado === 'aprobada').length,
    rechazada: items.filter(d => d.estado === 'rechazada').length,
  };
};

const devolucionesService = { getAll, getById, getByVenta, create, update, cambiarEstado, remove, getStats };
export default devolucionesService;
