const STORAGE_KEY = 'sicaber_usuarios';

const DEFAULT = [{ id: 1, nombre: 'Admin Sicaber', username: 'Admin_Sicaber', email: 'admin@sicaber.com', password: 'admin2024#', rolId: 1, estado: true, esAdmin: true, fechaCreacion: '2024-01-01T00:00:00.000Z' }];

const init = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT)); };
const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a,b) => a.id - b.id); };
const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i=>i.id)) + 1 : 1; };
const norm = s => (s||'').toLowerCase().trim();

const isDupUser = (u, exId=null) => getAll().some(i => i.id !== exId && norm(i.username) === norm(u));
const isDupEmail = (e, exId=null) => !!e && getAll().some(i => i.id !== exId && norm(i.email) === norm(e));

const create = u => {
  if (!u.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (!u.username?.trim()) return { error: 'El nombre de usuario es obligatorio.' };
  if (!u.password || u.password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  if (!u.rolId) return { error: 'Asigna un rol al usuario.' };
  if (isDupUser(u.username)) return { error: 'Ya existe ese nombre de usuario.' };
  if (isDupEmail(u.email)) return { error: 'Ya existe ese correo.' };
  const items = getAll();
  const n = { ...u, id: nextId(), esAdmin: false, estado: true, fechaCreacion: new Date().toISOString() };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Usuario no encontrado.' };
  if (items[idx].esAdmin && data.rolId !== items[idx].rolId) return { error: 'No se puede cambiar el rol del administrador.' };
  if (!data.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (!data.username?.trim()) return { error: 'El nombre de usuario es obligatorio.' };
  if (!data.rolId) return { error: 'Asigna un rol.' };
  if (isDupUser(data.username, id)) return { error: 'Ya existe ese nombre de usuario.' };
  if (isDupEmail(data.email, id)) return { error: 'Ya existe ese correo.' };
  if (data.password && data.password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  const updated = { ...items[idx], ...data, id };
  if (!data.password) updated.password = items[idx].password;
  items[idx] = updated; save(items); return { data: items[idx] };
};

const remove = id => {
  const items = getAll(); const u = items.find(i => i.id === id);
  if (!u) return { error: 'Usuario no encontrado.' };
  if (u.esAdmin) return { error: 'No se puede eliminar el administrador principal.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx !== -1 && !items[idx].esAdmin) { items[idx].estado = !items[idx].estado; save(items); }
};

const usuariosService = { getAll, getById, create, update, remove, toggleEstado };
export default usuariosService;
