// Servicio de insumos usando localStorage como persistencia
const STORAGE_KEY = 'sicaber_insumos';

const getCategorias = () => [
  'Café', 'Lácteos', 'Panadería', 'Bebidas',
  'Limpieza', 'Empaque', 'Condimentos', 'Otros'
];

const getUnidades = () => [
  'kg', 'g', 'litros', 'ml', 'unidades',
  'paquetes', 'cajas', 'bolsas', 'libras', 'onzas'
];

const getAll = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  const items = data ? JSON.parse(data) : [];
  return items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
};

const save = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

const generateId = (existingIds = []) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  do {
    id = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existingIds.includes(id));
  return id;
};

const getById = (id) => getAll().find(item => item.id === id) || null;

const isDuplicate = (nombre, excludeId = null) => {
  const normalize = (s) => (s || '').toLowerCase().trim();
  return getAll().some(i => i.id !== excludeId && normalize(i.nombre) === normalize(nombre));
};

const create = (insumo) => {
  if (isDuplicate(insumo.nombre)) return { error: 'Ya existe un insumo con ese nombre.' };
  const items = getAll();
  // eslint-disable-next-line no-unused-vars
  const { precioUnitario, ...rest } = insumo;
  const newItem = {
    ...rest,
    id: generateId(items.map(i => i.id)),
    estado: true,
    stockActual: parseInt(insumo.stockActual, 10) || 0,
    stockMinimo: parseInt(insumo.stockMinimo, 10) || 0,
    fechaCreacion: new Date().toISOString()
  };
  items.push(newItem);
  save(items);
  return { data: newItem };
};

const update = (id, data) => {
  if (isDuplicate(data.nombre, id)) return { error: 'Ya existe otro insumo con ese nombre.' };
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Insumo no encontrado.' };
  const original = items[idx];

  // Check if insumo has active purchases to decide if stockActual can be edited
  const compras = JSON.parse(localStorage.getItem('sicaber_compras') || '[]');
  const nombre = (original.nombre || '').toLowerCase().trim();
  const hasActiveCompras = compras
    .filter(c => c.estado !== 'anulada')
    .some(c => (c.items || []).some(it => (it.insumo || '').toLowerCase().trim() === nombre));

  // eslint-disable-next-line no-unused-vars
  const { precioUnitario: _p, ...rest } = data;
  items[idx] = {
    ...original,
    ...rest,
    id,
    // Only allow stockActual edit if no active purchases
    stockActual: hasActiveCompras ? original.stockActual : (parseInt(data.stockActual, 10) >= 0 ? parseInt(data.stockActual, 10) : original.stockActual),
    // Preservar precioUnitario original (lo gestiona comprasService)
    precioUnitario: original.precioUnitario,
    // Guardar proveedorId
    proveedorId: data.proveedorId || original.proveedorId,
    stockMinimo: parseInt(data.stockMinimo, 10) || 0,
  };
  save(items);
  return { data: items[idx] };
};

const remove = (id) => {
  const insumo = getById(id);
  if (!insumo) return { error: 'Insumo no encontrado.' };
  const compras = JSON.parse(localStorage.getItem('sicaber_compras') || '[]');
  const tieneComprasActivas = compras
    .filter(c => c.estado !== 'anulada')
    .some(c => (c.items || []).some(it =>
      (it.insumo || '').toLowerCase().trim() === (insumo.nombre || '').toLowerCase().trim()
    ));
  if (tieneComprasActivas) {
    return { error: `No se puede eliminar: "${insumo.nombre}" aparece en compras activas. Inactívalo en su lugar.` };
  }
  save(getAll().filter(i => i.id !== id));
  return { data: true };
};

const ajustarStock = (id, nuevaCantidad, motivo = '') => {
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Insumo no encontrado.' };
  const anterior = items[idx].stockActual;
  items[idx] = {
    ...items[idx],
    stockActual: parseInt(nuevaCantidad, 10) || 0,
    ultimoAjuste: { anterior, nuevo: parseInt(nuevaCantidad, 10) || 0, motivo, fecha: new Date().toISOString() }
  };
  save(items);
  return { data: items[idx] };
};

const search = (query) => {
  const q = (query || '').toLowerCase().trim();
  if (!q) return getAll();
  const qUp = q.toUpperCase();
  return getAll().filter(i =>
    (i.nombre || '').toLowerCase().includes(q) ||
    (i.categoria || '').toLowerCase().includes(q) ||
    (i.proveedor || '').toLowerCase().includes(q) ||
    (i.id || '').includes(qUp)
  );
};

const PROVEEDORES_KEY = 'sicaber_proveedores';

const getProveedores = () => {
  const data = localStorage.getItem(PROVEEDORES_KEY);
  const items = data ? JSON.parse(data) : [];
  return items.filter(p => p.estado);
};

const insumosService = {
  getAll, getById, create, update, remove, search,
  getCategorias, getUnidades, getProveedores, ajustarStock, generateId
};
export default insumosService;
