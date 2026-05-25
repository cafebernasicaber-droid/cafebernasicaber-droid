// ─────────────────────────────────────────────────────────────
//  src/features/categorias/services/categoriasService.js
//
//  3 categorías reales — Café Don Berna
//    1. Bebidas Especiales
//    2. Bebidas Calientes
//    3. Bebidas Frías
//
//  ⚠ Después de reemplazar ejecuta en consola del navegador:
//    localStorage.removeItem('sicaber_categorias')
//    location.reload()
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sicaber_categorias';

const CATS_DEFAULT = [
  {
    id: 1,
    nombre: 'Bebidas Especiales',
    descripcion: 'Bebidas reconstituyentes, energizantes y revitalizantes naturales',
    imagen: 'PEGAR_URL_CLOUDINARY_CAT_ESPECIALES',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    nombre: 'Bebidas Calientes',
    descripcion: 'Cafés calientes artesanales — firma de Café Don Berna',
    imagen: 'PEGAR_URL_CLOUDINARY_CAT_CALIENTES',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    nombre: 'Bebidas Frías',
    descripcion: 'Granizados, frappés y bebidas frías de especialidad',
    imagen: 'PEGAR_URL_CLOUDINARY_CAT_FRIAS',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
];

// ── Lógica del servicio (NO modificar) ────────────────────────

const init    = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(CATS_DEFAULT)); };
const getAll  = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a, b) => a.id - b.id); };
const save    = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId  = () => { const items = getAll(); return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1; };
const norm    = s => (s || '').toLowerCase().trim();
const isDup   = (nombre, exId = null) => getAll().some(i => i.id !== exId && norm(i.nombre) === norm(nombre));

const create = cat => {
  if (!cat.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDup(cat.nombre))   return { error: 'Ya existe una categoría con ese nombre.' };
  const items = getAll();
  const n = { ...cat, id: nextId(), fechaCreacion: new Date().toISOString() };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1)             return { error: 'Categoría no encontrada.' };
  if (!data.nombre?.trim())   return { error: 'El nombre es obligatorio.' };
  if (isDup(data.nombre, id)) return { error: 'Ya existe otra categoría con ese nombre.' };
  items[idx] = { ...items[idx], ...data, id }; save(items);
  return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id === id)) return { error: 'Categoría no encontrada.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx].estado = items[idx].estado === 'Activo' ? 'Inactivo' : 'Activo'; save(items); }
};

const search = q => {
  const lq = (q || '').toLowerCase().trim();
  if (!lq) return getAll();
  return getAll().filter(c => c.nombre.toLowerCase().includes(lq) || (c.descripcion || '').toLowerCase().includes(lq));
};

const categoriasService = { getAll, getById, create, update, remove, toggleEstado, search };
export default categoriasService;