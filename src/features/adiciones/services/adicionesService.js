// ─────────────────────────────────────────────────────────────
//  src/features/adiciones/services/adicionesService.js
//
//  Adiciones coherentes por tipo de producto:
//
//  BEBIDAS CALIENTES (Café Don Berna, Capuchino, Carajillo,
//                     Café con Leche, Perico, Tinto):
//    - Leches alternativas, endulzantes, shots extra,
//      aperitivos, siropes
//
//  BEBIDAS FRÍAS (Café Don Berna Frío, Frappé, Capuchino Helado,
//                 Amaretto, Granizado, Café Helado):
//    - Cremas, toppings, salsas, barquillos, chispas
//
//  ESPECIALES (los 7 que eran productos):
//    - Copa de Vitafer, Copa Rompe Chiquito, Copa Mero Macho,
//      Copa de Ginseng, Vitacerebrina,
//      Porción de Chantilly, Porción de Aperitivo o Licor
//
//  Cada adición tiene un campo "categoria" que indica
//  con qué tipo de bebida es coherente usarla.
//
//  ⚠ Después de reemplazar ejecuta en consola del navegador:
//    localStorage.removeItem('sicaber_adiciones')
//    location.reload()
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sicaber_adiciones';

const ADDS_DEFAULT = [

  // ══ ADICIONES PARA BEBIDAS CALIENTES ══════════════════════
  {
    id: 1,
    nombre: 'Leche de Coco',
    precio: 1500,
    imagen: '',
    descripcion: 'Alternativa vegana para tu bebida caliente.',
    categoria: 'Bebidas Calientes',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    nombre: 'Leche de Almendra',
    precio: 1500,
    imagen: '',
    descripcion: 'Alternativa vegana con sabor suave y dulce.',
    categoria: 'Bebidas Calientes',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    nombre: 'Shot extra de espresso',
    precio: 2000,
    imagen: '',
    descripcion: 'Para los que necesitan más cafeína.',
    categoria: 'Bebidas Calientes',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 4,
    nombre: 'Sirope de vainilla',
    precio: 1000,
    imagen: '',
    descripcion: 'Toque dulce artesanal para tus bebidas.',
    categoria: 'Bebidas Calientes',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 5,
    nombre: 'Sirope de caramelo',
    precio: 1000,
    imagen: '',
    descripcion: 'Dulce toque caramelizado.',
    categoria: 'Bebidas Calientes',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 6,
    nombre: 'Aperitivo extra',
    precio: 1500,
    imagen: '',
    descripcion: 'Porción adicional de aperitivo para tu bebida.',
    categoria: 'Bebidas Calientes',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 7,
    nombre: 'Canela en polvo extra',
    precio: 500,
    imagen: '',
    descripcion: 'Toque cálido y aromático adicional.',
    categoria: 'Bebidas Calientes',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },

  // ══ ADICIONES PARA BEBIDAS FRÍAS ══════════════════════════
  {
    id: 8,
    nombre: 'Crema chantilly extra',
    precio: 1500,
    imagen: '',
    descripcion: 'Porción adicional de crema chantilly.',
    categoria: 'Bebidas Frías',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 9,
    nombre: 'Arequipe extra',
    precio: 1500,
    imagen: '',
    descripcion: 'Porción adicional de arequipe cremoso.',
    categoria: 'Bebidas Frías',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 10,
    nombre: 'Salsa de chocolate extra',
    precio: 1000,
    imagen: '',
    descripcion: 'Más salsa de chocolate para tu bebida fría.',
    categoria: 'Bebidas Frías',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 11,
    nombre: 'Chispas de chocolate',
    precio: 1000,
    imagen: '',
    descripcion: 'Trocitos de chocolate encima de tu bebida.',
    categoria: 'Bebidas Frías',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 12,
    nombre: 'Barquillo cubierto',
    precio: 1000,
    imagen: '',
    descripcion: 'Barquillo cubierto de chocolate para decorar.',
    categoria: 'Bebidas Frías',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 13,
    nombre: 'Leche de Coco (frío)',
    precio: 1500,
    imagen: '',
    descripcion: 'Base vegana para tus bebidas frías.',
    categoria: 'Bebidas Frías',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },

  // ══ ESPECIALES (antes eran productos) ═════════════════════
  {
    id: 14,
    nombre: 'Copa de Vitafer',
    precio: 3000,
    imagen: '',
    descripcion: 'Copa revitalizante a base de Vitafer. Ideal para recuperar energía de forma natural.',
    categoria: 'Especiales',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 15,
    nombre: 'Copa de Rompe Chiquito',
    precio: 2500,
    imagen: '',
    descripcion: 'Bebida tradicional reconocida por sus propiedades estimulantes y vigorizantes.',
    categoria: 'Especiales',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 16,
    nombre: 'Copa Mero Macho',
    precio: 2000,
    imagen: '',
    descripcion: 'Mezcla potente y reconfortante, preparada con ingredientes naturales seleccionados.',
    categoria: 'Especiales',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 17,
    nombre: 'Copa de Ginseng',
    precio: 2000,
    imagen: '',
    descripcion: 'Bebida con extracto de ginseng, conocida por sus efectos energizantes.',
    categoria: 'Especiales',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 18,
    nombre: 'Vitacerebrina',
    precio: 2500,
    imagen: '',
    descripcion: 'Clásico reconstituyente vitamínico, favorito por su sabor y beneficios.',
    categoria: 'Especiales',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 19,
    nombre: 'Porción de Chantilly',
    precio: 3000,
    imagen: '',
    descripcion: 'Deliciosa porción de crema chantilly para acompañar tu bebida.',
    categoria: 'Especiales',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 20,
    nombre: 'Porción de Aperitivo o Licor',
    precio: 3000,
    imagen: '',
    descripcion: 'Porción de aperitivo o licor seleccionado para complementar tu experiencia.',
    categoria: 'Especiales',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
];

// ── Lógica del servicio ───────────────────────────────────────
const init    = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(ADDS_DEFAULT)); };
const getAll  = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a, b) => a.id - b.id); };
const save    = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId  = () => { const items = getAll(); return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1; };
const norm    = s => (s || '').toLowerCase().trim();
const isDup   = (nombre, exId = null) => getAll().some(i => i.id !== exId && norm(i.nombre) === norm(nombre));

// Retorna adiciones coherentes con la categoría del producto
const getByCategoria = categoria => getAll().filter(a => a.estado === 'Activo' && a.categoria === categoria);

const create = add => {
  if (!add.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (!add.precio && add.precio !== 0) return { error: 'El precio es obligatorio.' };
  if (isDup(add.nombre)) return { error: 'Ya existe una adición con ese nombre.' };
  const items = getAll();
  const n = { ...add, id: nextId(), precio: Number(add.precio), fechaCreacion: new Date().toISOString() };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1)             return { error: 'Adición no encontrada.' };
  if (!data.nombre?.trim())   return { error: 'El nombre es obligatorio.' };
  if (isDup(data.nombre, id)) return { error: 'Ya existe otra adición con ese nombre.' };
  items[idx] = { ...items[idx], ...data, id, precio: Number(data.precio) };
  save(items); return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id === id)) return { error: 'Adición no encontrada.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx].estado = items[idx].estado === 'Activo' ? 'Inactivo' : 'Activo'; save(items); }
};

const adicionesService = { getAll, getById, getByCategoria, create, update, remove, toggleEstado };
export default adicionesService;