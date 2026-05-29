// Servicio de proveedores usando localStorage como persistencia
const STORAGE_KEY = 'sicaber_proveedores';

const getCategorias = () => [
  'Café y derivados',
  'Lácteos',
  'Panadería y repostería',
  'Bebidas',
  'Limpieza y aseo',
  'Empaque y embalaje',
  'Condimentos y salsas',
  'Equipos y utensilios',
  'Otros'
];

const getAll = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  const items = data ? JSON.parse(data) : [];
  return items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
};

const save = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const generateId = (existingIds = []) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  do {
    id = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existingIds.includes(id));
  return id;
};

const getById = (id) => {
  return getAll().find(item => item.id === id) || null;
};

const isDuplicate = (nombre, nit, telefono, correo, excludeId = null) => {
  const normalize = (s) => (s || '').toLowerCase().trim();
  const conflicts = [];
  getAll().forEach(p => {
    if (p.id === excludeId) return;
    if (normalize(p.nombre) === normalize(nombre)) conflicts.push('nombre');
    if (nit && nit.trim() && normalize(p.nit) === normalize(nit)) conflicts.push('nit');
    if (telefono && telefono.trim() && normalize(p.telefono) === normalize(telefono)) conflicts.push('telefono');
    if (correo && correo.trim() && normalize(p.correo) === normalize(correo)) conflicts.push('correo');
  });
  return conflicts.length > 0 ? conflicts : null;
};

const validarNIT = (nit) => /^\d{6,10}-?\d$/.test((nit || '').trim());

const buildDuplicateMessage = (conflicts) => {
  const labels = { nombre: 'nombre', nit: 'NIT', telefono: 'teléfono', correo: 'correo electrónico' };
  const found = conflicts.map(k => labels[k] || k);
  if (found.length === 1) return `Ya existe un proveedor con ese ${found[0]}.`;
  const last = found.pop();
  return `Ya existe un proveedor con ese ${found.join(', ')} y ${last}.`;
};

const create = (proveedor) => {
  const conflicts = isDuplicate(proveedor.nombre, proveedor.nit, proveedor.telefono, proveedor.correo);
  if (conflicts) {
    return { error: buildDuplicateMessage(conflicts), duplicateFields: conflicts };
  }
  const items = getAll();
  const newItem = {
    ...proveedor,
    id: generateId(items.map(i => i.id)),
    estado: true,
    fechaCreacion: new Date().toISOString()
  };
  items.push(newItem);
  save(items);
  return { data: newItem };
};

const update = (id, data) => {
  const conflicts = isDuplicate(data.nombre, data.nit, data.telefono, data.correo, id);
  if (conflicts) {
    return { error: buildDuplicateMessage(conflicts), duplicateFields: conflicts };
  }
  const items = getAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Proveedor no encontrado.' };
  items[idx] = { ...items[idx], ...data, id };
  save(items);
  return { data: items[idx] };
};

const getInsumosDelProveedor = (id, nombreProveedor) => {
  const insumos = JSON.parse(localStorage.getItem('sicaber_insumos') || '[]');
  return insumos.filter(i => String(i.proveedorId) === String(id) || i.proveedor === nombreProveedor);
};

const tieneComprasActivas = (id, nombreProveedor) => {
  const compras = JSON.parse(localStorage.getItem('sicaber_compras') || '[]');
  return compras.filter(c => c.estado !== 'anulada').some(c => c.proveedorId === id || c.proveedorNombre === nombreProveedor);
};

const remove = (id) => {
  const proveedor = getById(id);
  if (!proveedor) return { error: 'Proveedor no encontrado.' };
  if (tieneComprasActivas(id, proveedor.nombre)) return { error: `No se puede eliminar: "${proveedor.nombre}" tiene compras activas. Inactívalo en su lugar.` };
  const insumosAsociados = getInsumosDelProveedor(id, proveedor.nombre);
  if (insumosAsociados.length > 0) {
    const todosInsumos = JSON.parse(localStorage.getItem('sicaber_insumos') || '[]');
    const idsAEliminar = new Set(insumosAsociados.map(i => i.id));
    localStorage.setItem('sicaber_insumos', JSON.stringify(todosInsumos.filter(i => !idsAEliminar.has(i.id))));
  }
  save(getAll().filter(i => i.id !== id));
  return { data: true, insumosEliminados: insumosAsociados.length, nombresInsumos: insumosAsociados.map(i => i.nombre) };
};

const search = (query) => {
  const q = query.toLowerCase().trim();
  if (!q) return getAll();
  return getAll().filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    (p.nit || '').toLowerCase().includes(q) ||
    (p.ciudad || '').toLowerCase().includes(q) ||
    (p.categoria || '').toLowerCase().includes(q) ||
    (p.id || '').includes(q.toUpperCase())
  );
};

const proveedoresService = {
  getAll, getById, create, update, remove, search, getCategorias,
  validarNIT, getInsumosDelProveedor, tieneComprasActivas, generateId
};
export default proveedoresService;
