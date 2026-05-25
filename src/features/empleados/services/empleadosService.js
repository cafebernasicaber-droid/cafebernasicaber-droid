import { EMPLEADOS_INIT } from '../../../features/pedidos/data/datos';
import rolesService from '../../roles/services/rolesService';

const STORAGE_KEY = 'sicaber_empleados';

// Lee los cargos dinámicamente desde el módulo de Roles
const getCargos = () => rolesService.getAll().map(r => r.nombre);

const getAll = () => {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : EMPLEADOS_INIT;
  } catch { return EMPLEADOS_INIT; }
};

const save = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getById = id => getAll().find(i => i.id === id) || null;
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1; };
const norm = s => (s || '').toLowerCase().trim();
const isDup = (nombre, exId = null) => getAll().some(i => i.id !== exId && norm(i.nombre) === norm(nombre));
const isDupUsername = (username, exId = null) => !!username?.trim() && getAll().some(i => i.id !== exId && norm(i.username) === norm(username));
const needsLogin = cargo => ['cajero', 'bartender'].some(c => norm(cargo).includes(c));

const create = emp => {
  if (!emp.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (!emp.cargo) return { error: 'El cargo es obligatorio.' };
  if (isDup(emp.nombre)) return { error: 'Ya existe un empleado con ese nombre.' };
  if (needsLogin(emp.cargo)) {
    if (!emp.username?.trim()) return { error: 'El usuario es obligatorio para Cajero y Bartender.' };
    if (!emp.password || emp.password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    if (isDupUsername(emp.username)) return { error: 'Ya existe ese nombre de usuario.' };
  }
  const items = getAll();
  const n = { ...emp, id: nextId(), activo: emp.activo !== false, fechaIngreso: new Date().toISOString() };
  items.push(n); save(items); return { data: n };
};

const update = (id, data) => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return { error: 'Empleado no encontrado.' };
  if (!data.nombre?.trim()) return { error: 'El nombre es obligatorio.' };
  if (isDup(data.nombre, id)) return { error: 'Ya existe otro empleado con ese nombre.' };
  if (data.username?.trim() && isDupUsername(data.username, id)) return { error: 'Ya existe ese nombre de usuario.' };
  if (data.password && data.password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  const updated = { ...items[idx], ...data, id };
  if (!data.password) updated.password = items[idx].password;
  if (!data.username?.trim()) updated.username = items[idx].username;
  items[idx] = updated; save(items);
  return { data: items[idx] };
};

const remove = id => {
  const items = getAll();
  if (!items.find(i => i.id === id)) return { error: 'Empleado no encontrado.' };
  save(items.filter(i => i.id !== id)); return { ok: true };
};

const toggleActivo = id => {
  const items = getAll(); const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx].activo = !items[idx].activo; save(items); }
};

const search = q => {
  const lq = (q || '').toLowerCase().trim();
  if (!lq) return getAll();
  return getAll().filter(e => e.nombre.toLowerCase().includes(lq) || e.cargo.toLowerCase().includes(lq));
};

const empleadosService = { getAll, getById, create, update, remove, toggleActivo, search, getCargos };
export default empleadosService;
