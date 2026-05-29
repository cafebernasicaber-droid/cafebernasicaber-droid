const STORAGE_KEY = 'sicaber_toppings';

const TOPS_DEFAULT = [
  { id: 1, nombre: 'Canela en polvo',    precio: 0,    gratuito: true,  descripcion: 'Toque cálido y aromático',     estado: 'Activo', fechaCreacion: '2024-01-01T00:00:00.000Z' },
  { id: 2, nombre: 'Cacao en polvo',     precio: 0,    gratuito: true,  descripcion: 'Sabor intenso de chocolate',   estado: 'Activo', fechaCreacion: '2024-01-01T00:00:00.000Z' },
  { id: 3, nombre: 'Crema batida',       precio: 1500, gratuito: false, descripcion: 'Cremosidad extra',             estado: 'Activo', fechaCreacion: '2024-01-01T00:00:00.000Z' },
  { id: 4, nombre: 'Sirope de caramelo', precio: 1500, gratuito: false, descripcion: 'Dulce toque caramelizado',     estado: 'Activo', fechaCreacion: '2024-01-01T00:00:00.000Z' },
  { id: 5, nombre: 'Sirope de vainilla', precio: 1000, gratuito: false, descripcion: 'Sabor clásico de vainilla',    estado: 'Activo', fechaCreacion: '2024-01-01T00:00:00.000Z' },
  { id: 6, nombre: 'Chips de chocolate', precio: 2000, gratuito: false, descripcion: 'Trocitos de chocolate belga', estado: 'Activo', fechaCreacion: '2024-01-01T00:00:00.000Z' },
];

const init = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(TOPS_DEFAULT)); };
const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a,b) => a.id - b.id); };
const getActivos = () => getAll().filter(t => t.estado === 'Activo');
const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i=>i.id)) + 1 : 1; };
const norm = s => (s||'').toLowerCase().trim();
const isDup = (nombre, exId=null) => getAll().some(i => i.id !== exId && norm(i.nombre) === norm(nombre));

const create = top => {
  if (!top.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDup(top.nombre)) return { error: 'Ya existe un topping con ese nombre.' };
  const items = getAll();
  const n = { ...top, id: nextId(), precio: Number(top.precio)||0, gratuito: top.gratuito||false, fechaCreacion: new Date().toISOString() };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Topping no encontrado.' };
  if (!data.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDup(data.nombre, id)) return { error: 'Ya existe otro topping con ese nombre.' };
  items[idx] = { ...items[idx], ...data, id, precio: Number(data.precio)||0 }; save(items);
  return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id === id)) return { error: 'Topping no encontrado.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx].estado = items[idx].estado === 'Activo' ? 'Inactivo' : 'Activo'; save(items); }
};

const toppingsService = { getAll, getActivos, getById, create, update, remove, toggleEstado };
export default toppingsService;
