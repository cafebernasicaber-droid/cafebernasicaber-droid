// ─────────────────────────────────────────────────────────────
//  src/features/productos/services/productosService.js
//
//  ✅ Sistema de versión automático:
//     Cuando un compañero abre el proyecto por primera vez
//     (o cuando cambia la VERSION), se cargan automáticamente
//     los datos con las URLs de Cloudinary. Sin consola, sin
//     configuración manual.
//
//  ⚠ Cada vez que actualices imágenes o productos:
//     Cambia VERSION de 'v2' a 'v3', de 'v3' a 'v4', etc.
//     Todos los compañeros recibirán los nuevos datos solos.
// ─────────────────────────────────────────────────────────────

import categoriasService from '../../categorias/services/categoriasService';

const STORAGE_KEY = 'sicaber_productos_menu';
const VERSION     = 'v2'; // ← sube esto cada vez que cambies imágenes

const PRODS_DEFAULT = [

  // ── BEBIDAS CALIENTES ─────────────────────────────────────
  {
    id: 1,
    nombre: 'Café Don Berna',
    categoria: 'Bebidas Calientes',
    precio: 6500,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café con chocolate, leche, masmelo y canela. La firma de la casa.',
    imagen: '',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    nombre: 'Capuchino',
    categoria: 'Bebidas Calientes',
    precio: 4500,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café, leche, canela, esencia y aperitivo de tu preferencia.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389047/sicaber/mloszeqahnjtheg3aooa.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    nombre: 'Carajillo',
    categoria: 'Bebidas Calientes',
    precio: 4500,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café y aperitivo de tu preferencia. Clásico y reconfortante.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389061/sicaber/ik2arcfgvm7efoi2k16p.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 4,
    nombre: 'Café con Leche',
    categoria: 'Bebidas Calientes',
    precio: 2000,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café y leche. Simple, clásico y delicioso.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389096/sicaber/xjcc8cvk0s8ixhh0ngt2.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 5,
    nombre: 'Perico',
    categoria: 'Bebidas Calientes',
    precio: 1600,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café y leche. Pequeño y perfecto para cualquier momento del día.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389115/sicaber/r9scl2sb4qvqgfuelaad.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 6,
    nombre: 'Tinto',
    categoria: 'Bebidas Calientes',
    precio: 1300,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café negro puro. El favorito del día a día.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389181/sicaber/egogd6gtwzuxolt0mrkw.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },

  // ── BEBIDAS FRÍAS ─────────────────────────────────────────
  {
    id: 7,
    nombre: 'Café Don Berna Frío',
    categoria: 'Bebidas Frías',
    precio: 9000,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café granizado con cacao, leche, salsa de chocolate, crema chantilly, chispas y barquillo cubierto de chocolate.',
    imagen: '',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 8,
    nombre: 'Frappé',
    categoria: 'Bebidas Frías',
    precio: 8000,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café granizado, leche, arequipe, crema chantilly y chocolates en forma de café.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389206/sicaber/zi4vimjlrlphmkjezwww.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 9,
    nombre: 'Capuchino Helado',
    categoria: 'Bebidas Frías',
    precio: 7000,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café, leche, canela, esencia, salsa de chocolate y aperitivo de tu preferencia. Versión helada.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389310/sicaber/altjtp1ji6m6mvrsmrj2.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 10,
    nombre: 'Amaretto',
    categoria: 'Bebidas Frías',
    precio: 6500,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café, leche, salsa de chocolate y amaretto coctel de almendras.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389238/sicaber/xft4y4meujiutgxz47af.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 11,
    nombre: 'Granizado de Café',
    categoria: 'Bebidas Frías',
    precio: 6000,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café granizado, leche y salsa de chocolate. Refrescante y cremoso.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389258/sicaber/uccigsodxqrfyhohxss2.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 12,
    nombre: 'Café Helado',
    categoria: 'Bebidas Frías',
    precio: 5500,
    descuento: 0,
    fechaInicioDesc: '',
    fechaFinDesc: '',
    descripcion: 'Café, leche y salsa de chocolate. Frío, suave y delicioso.',
    imagen: 'https://res.cloudinary.com/dwkdxelo4/image/upload/v1779389329/sicaber/m0pb8lyybgxtlugey6xy.png',
    estado: 'Activo',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
];

// ── Helpers ────────────────────────────────────────────────────
const hoy = () => new Date().toISOString().split('T')[0];

export const descuentoVigente = p => {
  if (!p.descuento || p.descuento <= 0) return false;
  const h = hoy();
  if (p.fechaInicioDesc && h < p.fechaInicioDesc) return false;
  if (p.fechaFinDesc    && h > p.fechaFinDesc)    return false;
  return true;
};

export const calcPrecioFinal = p => {
  if (!descuentoVigente(p)) return p.precio;
  return Math.round(p.precio * (1 - p.descuento / 100));
};

// ── Lógica del servicio ────────────────────────────────────────

// Si la versión guardada es diferente a VERSION, recarga los defaults automáticamente.
// Esto garantiza que todos los compañeros vean las imágenes sin hacer nada en consola.
const init = () => {
  const savedVersion = localStorage.getItem(STORAGE_KEY + '_version');
  if (savedVersion !== VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODS_DEFAULT));
    localStorage.setItem(STORAGE_KEY + '_version', VERSION);
  }
};

const getAll     = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a, b) => a.id - b.id); };
const getActivos = () => getAll().filter(p => p.estado === 'Activo');
const getConDescuentoVigente = () => getActivos().filter(descuentoVigente);
const save       = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById    = id    => getAll().find(i => i.id === id) || null;
const nextId     = ()    => { const items = getAll(); return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1; };
const norm       = s     => (s || '').toLowerCase().trim();
const isDup      = (nombre, exId = null) => getAll().some(i => i.id !== exId && norm(i.nombre) === norm(nombre));
const getCategorias = () => categoriasService.getAll().filter(c => c.estado === 'Activo').map(c => c.nombre);

const create = prod => {
  if (!prod.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (!prod.precio)         return { error: 'El precio es obligatorio.' };
  if (!prod.categoria)      return { error: 'La categoría es obligatoria.' };
  if (isDup(prod.nombre))   return { error: 'Ya existe un producto con ese nombre.' };
  const items = getAll();
  const n = {
    ...prod, id: nextId(),
    precio: Number(prod.precio),
    descuento: Number(prod.descuento) || 0,
    fechaInicioDesc: prod.fechaInicioDesc || '',
    fechaFinDesc:    prod.fechaFinDesc    || '',
    fechaCreacion: new Date().toISOString(),
  };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1)             return { error: 'Producto no encontrado.' };
  if (!data.nombre?.trim())   return { error: 'El nombre es obligatorio.' };
  if (isDup(data.nombre, id)) return { error: 'Ya existe otro producto con ese nombre.' };
  items[idx] = {
    ...items[idx], ...data, id,
    precio:          Number(data.precio),
    descuento:       Number(data.descuento) || 0,
    fechaInicioDesc: data.fechaInicioDesc || '',
    fechaFinDesc:    data.fechaFinDesc    || '',
  };
  save(items); return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id === id)) return { error: 'Producto no encontrado.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx].estado = items[idx].estado === 'Activo' ? 'Inactivo' : 'Activo'; save(items); }
};

const search = q => {
  const lq = (q || '').toLowerCase().trim();
  if (!lq) return getAll();
  return getAll().filter(p => p.nombre.toLowerCase().includes(lq) || (p.categoria || '').toLowerCase().includes(lq));
};

const productosService = {
  getAll, getActivos, getById, create, update, remove,
  toggleEstado, search, getCategorias,
  getConDescuentoVigente, descuentoVigente, calcPrecioFinal,
};
export default productosService;
