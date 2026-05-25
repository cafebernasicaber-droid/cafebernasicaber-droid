const STORAGE_KEY = 'sicaber_clientes';

const init = () => { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify([])); };
const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').sort((a,b) => b.id - a.id); };
const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i=>i.id)) + 1 : 1; };
const norm = s => (s||'').toLowerCase().trim();

const isDupEmail = (email, exId=null) => getAll().some(i => i.id !== exId && norm(i.correo) === norm(email));
const isDupTel = (tel, exId=null) => !!tel && getAll().some(i => i.id !== exId && norm(i.telefono) === norm(tel));

const register = datos => {
  if (!datos.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (!datos.correo?.trim()) return { error: 'El correo es obligatorio.' };
  if (isDupEmail(datos.correo)) return { error: 'Ya existe un cliente con ese correo.' };
  if (datos.password?.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  const items = getAll();
  const n = { ...datos, id: nextId(), estado: true, fechaRegistro: new Date().toISOString() };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Cliente no encontrado.' };
  if (!data.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDupEmail(data.correo, id)) return { error: 'Ya existe otro cliente con ese correo.' };
  items[idx] = { ...items[idx], ...data, id }; save(items);
  return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id === id)) return { error: 'Cliente no encontrado.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleEstado = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx].estado = !items[idx].estado; save(items); }
};

const loginCliente = (correo, password) => {
  const clientes = getAll();
  const c = clientes.find(c => norm(c.correo) === norm(correo) && c.password === password);
  if (!c) return { error: 'Correo o contraseña incorrectos.' };
  if (!c.estado) return { error: 'Tu cuenta está desactivada.' };
  return { data: c };
};

const clientesService = { getAll, getById, register, update, remove, toggleEstado, loginCliente };
export default clientesService;
