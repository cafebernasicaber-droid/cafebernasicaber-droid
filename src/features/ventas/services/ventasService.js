import pedidosService from '../../pedidos/services/pedidosService';

const STORAGE_KEY = 'sicaber_ventas';

const init = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify([])); };
const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a,b) => b.id_venta - a.id_venta); };
const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id_venta === id) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i=>i.id_venta)) + 1 : 1; };

// Crear venta desde un pedido entregado
const crearDesde = pedido => {
  const items = getAll();
  // Evitar duplicados: no crear si ya existe venta para este pedido
  if (items.find(v => v.id_pedido === pedido.id)) return { error: 'Ya existe una venta para este pedido.' };
  const n = {
    id_venta: nextId(),
    id_pedido: pedido.id,
    cliente: pedido.cliente,
    clienteId: pedido.clienteId || null,
    fecha: new Date().toISOString(),
    total: pedido.total,
    metodo_pago: pedido.pago || 'Efectivo',
    tipo_venta: pedido.tipo === 'domicilio' ? 'Domicilio' : 'Local',
    estado: 'vendido',
    productos: pedido.productos || [],
    toppings: pedido.toppings || [],
    adiciones: pedido.adiciones || [],
    barista: pedido.barista || '',
    origen: pedido.origen || 'admin',
    comprobante: pedido.comprobante || null,
  };
  items.push(n); save(items);
  return { data: n };
};

const create = datos => {
  const items = getAll();
  const n = { ...datos, id_venta: nextId(), fecha: datos.fecha || new Date().toISOString(), estado: datos.estado || 'vendido' };
  items.push(n); save(items);
  return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id_venta === id);
  if (idx === -1) return { error: 'Venta no encontrada.' };
  items[idx] = { ...items[idx], ...data, id_venta: id }; save(items);
  return { data: items[idx] };
};

const cambiarEstado = (id, estado) => {
  const items = getAll(); const idx = items.findIndex(i => i.id_venta === id);
  if (idx === -1) return { error: 'Venta no encontrada.' };
  items[idx] = { ...items[idx], estado }; save(items);
  return { data: items[idx] };
};

const getStats = () => {
  const items = getAll();
  return {
    total: items.length,
    vendido: items.filter(v => v.estado === 'vendido').length,
    devuelto: items.filter(v => v.estado === 'devuelto').length,
    totalIngresos: items.filter(v => v.estado === 'vendido').reduce((s,v) => s + (Number(v.total)||0), 0),
  };
};

const search = q => {
  const lq = (q||'').toLowerCase().trim();
  if (!lq) return getAll();
  return getAll().filter(v =>
    String(v.id_venta).includes(q) ||
    (v.cliente||'').toLowerCase().includes(lq) ||
    (v.metodo_pago||'').toLowerCase().includes(lq) ||
    String(v.id_pedido).includes(q)
  );
};

const ventasService = { getAll, getById, crearDesde, create, update, cambiarEstado, getStats, search };
export default ventasService;
