import { PEDIDOS_INIT } from '../data/datos';

const STORAGE_KEY = 'sicaber_pedidos';

const getAll = () => {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : PEDIDOS_INIT;
  } catch { return PEDIDOS_INIT; }
};

const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;

const nextId = () => {
  const items = getAll();
  if (!items.length) return '0001';
  const nums = items.map(i => parseInt(i.id, 10)).filter(n => !isNaN(n));
  return String(Math.max(...nums) + 1).padStart(4, '0');
};

const create = pedido => {
  const items = getAll();
  const n = { ...pedido, id: nextId(), fechaCreacion: new Date().toISOString() };
  items.push(n); save(items); return n;
};

const cambiarEstado = (id, estado) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], estado }; save(items); return items[idx];
};

const remove = id => {
  const items = getAll();
  save(items.filter(i => i.id !== id)); return true;
};

const search = q => {
  const lq = (q || '').toLowerCase().trim();
  if (!lq) return getAll();
  return getAll().filter(p =>
    (p.cliente || '').toLowerCase().includes(lq) ||
    (p.estado || '').toLowerCase().includes(lq) ||
    (Array.isArray(p.productos) && p.productos.some(x => (x.nombre || x).toLowerCase().includes(lq)))
  );
};

const getStats = () => {
  const items = getAll();
  return {
    total:     items.length,
    pendiente: items.filter(p => p.estado === 'pendiente').length,
    proceso:   items.filter(p => p.estado === 'en_proceso').length,
    listo:     items.filter(p => p.estado === 'listo').length,
    ventas:    items.reduce((s, p) => s + (Number(p.total) || 0), 0),
  };
};

const pedidosService = { getAll, getById, create, cambiarEstado, remove, search, getStats };
export default pedidosService;
