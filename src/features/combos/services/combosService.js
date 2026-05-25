// ─────────────────────────────────────────────────────────────
//  src/features/adiciones/services/combosService.js
//  Gestión de combos: nombre + precio especial + productos incluidos
//  Ej: "Combo Mañanero" = Tinto + Copa de Vitafer por $3.500
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sicaber_combos';

const COMBOS_DEFAULT = [
  {
    id: 1,
    nombre: 'Combo Mañanero',
    descripcion: 'Empieza el día con energía. Tinto + Copa de Vitafer.',
    precio: 3500,
    productos: [{ id: 6, nombre: 'Tinto', precioOriginal: 1300 }],
    adiciones: [{ id: 14, nombre: 'Copa de Vitafer', precioOriginal: 3000 }],
    imagen: '',
    estado: 'Activo',
    fechaInicio: '',
    fechaFin: '',
    fechaCreacion: '2025-01-01T00:00:00.000Z',
  },
];

// Fecha local de hoy como 'YYYY-MM-DD'
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ── Lógica del servicio ───────────────────────────────────────
const init    = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(COMBOS_DEFAULT)); };
const getAll  = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a, b) => a.id - b.id); };
const save    = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId  = () => { const items = getAll(); return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1; };
const norm    = s => (s || '').toLowerCase().trim();
const isDup   = (nombre, exId = null) => getAll().some(i => i.id !== exId && norm(i.nombre) === norm(nombre));

// Evalúa si un combo está dentro de su rango de fechas
const esVigente = (combo) => {
  const today = hoy();
  if (combo.fechaInicio && today < combo.fechaInicio) return false;
  if (combo.fechaFin    && today > combo.fechaFin)    return false;
  return true;
};

// Para la landing: solo activos y dentro de su rango
const getActivos = () => getAll().filter(c => c.estado === 'Activo' && esVigente(c));

// Auto-desactiva en storage los combos cuya fechaFin ya pasó
const autoDesactivarVencidos = () => {
  const today = hoy();
  const items = getAll();
  let changed = false;
  items.forEach(c => {
    if (c.estado === 'Activo' && c.fechaFin && today > c.fechaFin) {
      c.estado = 'Inactivo';
      changed = true;
    }
  });
  if (changed) save(items);
};

const create = combo => {
  if (!combo.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (!combo.precio || Number(combo.precio) <= 0) return { error: 'El precio es obligatorio.' };
  if (isDup(combo.nombre)) return { error: 'Ya existe un combo con ese nombre.' };
  if (combo.fechaInicio && combo.fechaFin && combo.fechaInicio > combo.fechaFin)
    return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' };
  const items = getAll();
  const n = {
    ...combo,
    id: nextId(),
    precio: Number(combo.precio),
    productos: combo.productos || [],
    adiciones: combo.adiciones || [],
    fechaInicio: combo.fechaInicio || '',
    fechaFin:    combo.fechaFin    || '',
    fechaCreacion: new Date().toISOString(),
  };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Combo no encontrado.' };
  if (!data.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDup(data.nombre, id)) return { error: 'Ya existe otro combo con ese nombre.' };
  if (data.fechaInicio && data.fechaFin && data.fechaInicio > data.fechaFin)
    return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' };
  items[idx] = {
    ...items[idx], ...data, id,
    precio:     Number(data.precio),
    fechaInicio: data.fechaInicio || '',
    fechaFin:    data.fechaFin    || '',
  };
  save(items); return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id === id)) return { error: 'Combo no encontrado.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx].estado = items[idx].estado === 'Activo' ? 'Inactivo' : 'Activo'; save(items); }
};

const combosService = { getAll, getById, getActivos, create, update, remove, toggleEstado, autoDesactivarVencidos, esVigente, hoy };
export default combosService;
