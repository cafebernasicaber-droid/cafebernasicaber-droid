// Servicio de compras usando localStorage como persistencia
const STORAGE_KEY = 'sicaber_compras';
const PROVEEDORES_KEY = 'sicaber_proveedores';
const INSUMOS_KEY = 'sicaber_insumos';

const DIAS_EN_LISTADO = 30;

const generateId = (existingIds = []) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  do {
    id = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existingIds.includes(id));
  return id;
};

const actualizarStockInsumos = (compraItems) => {
  const insumos = JSON.parse(localStorage.getItem(INSUMOS_KEY) || '[]');
  compraItems.forEach(item => {
    const nombre = (item.insumo || '').toLowerCase().trim();
    const cantidad = parseInt(item.cantidad || 0, 10);
    const precio = Number(item.precioUnitario || 0);
    if (!nombre || cantidad <= 0) return;
    const idx = insumos.findIndex(i => (i.nombre || '').toLowerCase().trim() === nombre);
    if (idx !== -1) {
      insumos[idx] = {
        ...insumos[idx],
        stockActual: parseInt(insumos[idx].stockActual || 0, 10) + cantidad,
        precioUnitario: precio > 0 ? precio : insumos[idx].precioUnitario
      };
    }
  });
  localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));
};

const revertirStockInsumos = (compraItems) => {
  const insumos = JSON.parse(localStorage.getItem(INSUMOS_KEY) || '[]');
  compraItems.forEach(item => {
    const nombre = (item.insumo || '').toLowerCase().trim();
    const cantidad = parseInt(item.cantidad || 0, 10);
    if (!nombre || cantidad <= 0) return;
    const idx = insumos.findIndex(i => (i.nombre || '').toLowerCase().trim() === nombre);
    if (idx !== -1) {
      insumos[idx] = {
        ...insumos[idx],
        stockActual: Math.max(0, parseInt(insumos[idx].stockActual || 0, 10) - cantidad)
      };
    }
  });
  localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));
};

const getAll = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  const items = data ? JSON.parse(data) : [];
  return items.sort((a, b) => Number(b.id) - Number(a.id));
};

const save = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const getById = (id) => {
  return getAll().find(item => item.id === id) || null;
};

const getProveedores = () => {
  const data = localStorage.getItem(PROVEEDORES_KEY);
  return data ? JSON.parse(data) : [];
};

const calcTotal = (items) =>
  (items || []).reduce((acc, it) =>
    acc + (Number(it.cantidad || 0) * Number(it.precioUnitario || 0)), 0);

const create = (compra) => {
  const items = getAll();
  const newItem = {
    ...compra,
    id: generateId(items.map(i => i.id)),
    total: calcTotal(compra.items),
    estado: 'activa',
    fechaCreacion: new Date().toISOString(),
    items: (compra.items || []).map(it => ({
      ...it,
      cantidad: parseInt(it.cantidad, 10) || 0,
      precioUnitario: Number(it.precioUnitario) || 0
    }))
  };
  items.push(newItem);
  save(items);
  actualizarStockInsumos(newItem.items || []);
  return newItem;
};

const anular = (id, motivo = '') => {
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1 || items[idx].estado === 'anulada') return false;
  revertirStockInsumos(items[idx].items || []);
  items[idx] = {
    ...items[idx],
    estado: 'anulada',
    motivoAnulacion: motivo,
    fechaAnulacion: new Date().toISOString()
  };
  save(items);
  return true;
};

const debeIrAlHistorial = (compra) => {
  if (compra.estado === 'anulada') return true;
  const diff = (new Date() - new Date(compra.fechaCreacion)) / (1000 * 60 * 60 * 24);
  return diff > DIAS_EN_LISTADO;
};

const getActivas = () => getAll().filter(c => !debeIrAlHistorial(c));
const getHistorial = () => getAll();

const search = (query) => {
  const q = query.toLowerCase().trim();
  if (!q) return getActivas();
  return getActivas().filter(c =>
    (c.proveedorNombre || '').toLowerCase().includes(q) ||
    (c.estado || '').toLowerCase().includes(q) ||
    (c.fecha || '').includes(q) ||
    (c.id || '').includes(q.toUpperCase())
  );
};

const insumoTieneCompras = (nombreInsumo) => {
  const compras = getAll();
  return compras
    .filter(c => c.estado !== 'anulada')
    .some(c => (c.items || []).some(it =>
      (it.insumo || '').toLowerCase().trim() === (nombreInsumo || '').toLowerCase().trim()
    ));
};

const comprasService = {
  getAll, getActivas, getHistorial, getById, create, anular,
  remove: () => false, // removido, usar anular
  search, getProveedores, calcTotal, insumoTieneCompras, generateId
};
export default comprasService;
