const STORAGE_KEY = 'sicaber_roles';

const MODULOS_PERMISOS = [
  { modulo: 'Dashboard', permisos: [{ id: 'dashboard.ver', label: 'Ver dashboard' }] },
  { modulo: 'Roles', permisos: [
    { id: 'roles.ver', label: 'Ver roles' },
    { id: 'roles.crear', label: 'Crear roles' },
    { id: 'roles.editar', label: 'Editar roles' },
    { id: 'roles.eliminar', label: 'Eliminar roles' },
  ]},
  { modulo: 'Usuarios', permisos: [
    { id: 'usuarios.ver', label: 'Ver usuarios' },
    { id: 'usuarios.crear', label: 'Crear usuarios' },
    { id: 'usuarios.editar', label: 'Editar usuarios' },
    { id: 'usuarios.eliminar', label: 'Eliminar usuarios' },
    { id: 'usuarios.cambiar_rol', label: 'Cambiar rol de usuarios' },
  ]},
  { modulo: 'Clientes', permisos: [
    { id: 'clientes.ver', label: 'Ver clientes' },
    { id: 'clientes.editar', label: 'Editar clientes' },
    { id: 'clientes.eliminar', label: 'Eliminar clientes' },
  ]},
  { modulo: 'Productos', permisos: [
    { id: 'productos.ver', label: 'Ver productos' },
    { id: 'productos.crear', label: 'Crear productos' },
    { id: 'productos.editar', label: 'Editar productos' },
    { id: 'productos.eliminar', label: 'Eliminar productos' },
  ]},
  { modulo: 'Reportes', permisos: [
    { id: 'reportes.ver', label: 'Ver reportes' },
    { id: 'reportes.exportar', label: 'Exportar reportes' },
  ]},
  { modulo: 'Configuración', permisos: [
    { id: 'config.ver', label: 'Ver configuración' },
    { id: 'config.editar', label: 'Editar configuración' },
  ]},
];

const TODOS = MODULOS_PERMISOS.flatMap(m => m.permisos.map(p => p.id));

const ROLES_DEFAULT = [
  { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al sistema.', color: '#E53935', permisos: [...TODOS], esAdmin: true, fechaCreacion: '2024-01-01T00:00:00.000Z' },
  { id: 2, nombre: 'Vendedor', descripcion: 'Puede gestionar clientes y ver productos.', color: '#3A7D44', permisos: ['dashboard.ver','clientes.ver','productos.ver'], esAdmin: false, fechaCreacion: '2024-01-01T00:00:00.000Z' },
  { id: 3, nombre: 'Supervisor', descripcion: 'Puede ver reportes y gestionar usuarios.', color: '#1976D2', permisos: ['dashboard.ver','usuarios.ver','reportes.ver','reportes.exportar'], esAdmin: false, fechaCreacion: '2024-01-01T00:00:00.000Z' },
];

const init = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(ROLES_DEFAULT)); };
const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a,b) => a.id - b.id); };
const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i=>i.id)) + 1 : 1; };
const isDup = (nombre, exId=null) => { const n = s => (s||'').toLowerCase().trim(); return getAll().some(i => i.id !== exId && n(i.nombre) === n(nombre)); };

const create = rol => {
  if (!rol.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDup(rol.nombre)) return { error: 'Ya existe un rol con ese nombre.' };
  if (!rol.permisos?.length) return { error: 'Asigna al menos un permiso.' };
  const items = getAll();
  const n = { ...rol, id: nextId(), esAdmin: false, fechaCreacion: new Date().toISOString() };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Rol no encontrado.' };
  if (items[idx].esAdmin) return { error: 'El rol Administrador no puede modificarse.' };
  if (!data.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDup(data.nombre, id)) return { error: 'Ya existe otro rol con ese nombre.' };
  if (!data.permisos?.length) return { error: 'Asigna al menos un permiso.' };
  items[idx] = { ...items[idx], ...data, id, esAdmin: false }; save(items);
  return { data: items[idx] };
};

const remove = id => {
  const items = getAll(); const r = items.find(i => i.id === id);
  if (!r) return { error: 'Rol no encontrado.' };
  if (r.esAdmin) return { error: 'No se puede eliminar el rol Administrador.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const COLORES = ['#3A7D44','#1976D2','#9C27B0','#FF9800','#00BCD4','#795548','#607D8B','#E91E63','#C8973A'];

const rolesService = { getAll, getById, create, update, remove, getModulosPermisos: () => MODULOS_PERMISOS, getTodosLosPermisos: () => TODOS, COLORES };
export default rolesService;
