import productosService from '../../productos/services/productosService';
import insumosService from '../../insumos/services/insumosService';

const STORAGE_KEY = 'sicaber_fichas_tecnicas';

const CAT_PREP = ['Bebida caliente','Bebida fría','Repostería','Panadería','Plato preparado','Snack'];

// Fichas técnicas iniciales basadas en los productos existentes
const buildDefault = () => {
  const prods = productosService.getAll();
  const defaults = [];
  prods.slice(0, 5).forEach((p, i) => {
    defaults.push({
      id_ficha: i + 1,
      id_producto: p.id,
      estado: true,
      porciones: 1,
      tiempo_prep: [5, 8, 4, 45, 6][i] || 5,
      costo_estimado: Math.round(p.precio * 0.35),
      categoria_prep: ['Bebida caliente','Bebida caliente','Bebida fría','Repostería','Bebida caliente'][i],
      fecha_registro: '2024-01-10T08:00:00.000Z',
      notas: `Servir a temperatura adecuada. Producto: ${p.nombre}`,
      resumen_prep: `Preparación estándar de ${p.nombre}`,
      preparacion: `1. Preparar los ingredientes base.\n2. Seguir el proceso estándar para ${p.nombre}.\n3. Verificar temperatura y presentación.\n4. Servir al cliente.`,
      insumos: [
        { id_insumo: 1, cantidad: 18, unidad: 'g' },
        { id_insumo: 2, cantidad: 150, unidad: 'ml' },
      ],
    });
  });
  return defaults;
};

const init = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDefault()));
  }
};

const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a,b) => a.id_ficha - b.id_ficha); };
const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id_ficha === id) || null;
const getByProducto = id_prod => getAll().find(f => f.id_producto === id_prod) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i=>i.id_ficha)) + 1 : 1; };

const create = ficha => {
  if (!ficha.id_producto) return { error: 'El producto es obligatorio.' };
  if (!ficha.preparacion?.trim()) return { error: 'La preparación es obligatoria.' };
  const existing = getByProducto(Number(ficha.id_producto));
  if (existing) return { error: 'Ya existe una ficha técnica para este producto.' };
  const items = getAll();
  const n = {
    ...ficha,
    id_ficha: nextId(),
    id_producto: Number(ficha.id_producto),
    porciones: Number(ficha.porciones) || 1,
    tiempo_prep: Number(ficha.tiempo_prep) || 5,
    costo_estimado: Number(ficha.costo_estimado) || 0,
    estado: ficha.estado !== undefined ? ficha.estado : true,
    fecha_registro: new Date().toISOString(),
    insumos: (ficha.insumos || []).map(i => ({ id_insumo: Number(i.id_insumo), cantidad: Number(i.cantidad), unidad: i.unidad })),
  };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id_ficha === id);
  if (idx === -1) return { error: 'Ficha técnica no encontrada.' };
  // Check duplicate producto (excluding self)
  const dup = items.find(f => f.id_ficha !== id && f.id_producto === Number(data.id_producto));
  if (dup) return { error: 'Ya existe otra ficha técnica para ese producto.' };
  items[idx] = {
    ...items[idx], ...data, id_ficha: id,
    id_producto: Number(data.id_producto),
    porciones: Number(data.porciones),
    tiempo_prep: Number(data.tiempo_prep),
    costo_estimado: Number(data.costo_estimado),
    insumos: (data.insumos || []).map(i => ({ id_insumo: Number(i.id_insumo), cantidad: Number(i.cantidad), unidad: i.unidad })),
  };
  save(items); return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id_ficha === id)) return { error: 'Ficha no encontrada.' };
  save(items.filter(i => i.id_ficha !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id_ficha === id);
  if (idx !== -1) { items[idx].estado = !items[idx].estado; save(items); }
};

const getStats = () => {
  const items = getAll();
  const tiempos = items.map(f => f.tiempo_prep).filter(Boolean);
  return {
    total: items.length,
    activas: items.filter(f => f.estado).length,
    inactivas: items.filter(f => !f.estado).length,
    avgTiempo: tiempos.length ? Math.round(tiempos.reduce((a,b) => a+b, 0) / tiempos.length) : 0,
  };
};

const fichasTecnicasService = { getAll, getById, getByProducto, create, update, remove, toggleEstado, getStats, CAT_PREP };
export default fichasTecnicasService;
