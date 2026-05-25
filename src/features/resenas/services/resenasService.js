const STORAGE_KEY = 'sicaber_resenas';

const RESENAS_DEFAULT = [
  { id: 1, clienteId: null, nombre: 'Valentina R.', rol: 'Cliente frecuente', texto: 'El Cold Brew Reserve es adictivo. El mejor café de Medellín.', estrellas: 5, fecha: '2024-11-15T10:00:00.000Z', aprobada: true },
  { id: 2, clienteId: null, nombre: 'Sebastián M.', rol: 'Amante del café', texto: 'El Preentreno Natural me da la energía perfecta para entrenar.', estrellas: 5, fecha: '2024-12-02T14:00:00.000Z', aprobada: true },
  { id: 3, clienteId: null, nombre: 'Camila P.', rol: 'Nutricionista', texto: 'Los Bowls son deliciosos y saludables. Los recomiendo siempre.', estrellas: 5, fecha: '2025-01-10T09:00:00.000Z', aprobada: true },
];

const init = () => {
  if (!localStorage.getItem(STORAGE_KEY))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(RESENAS_DEFAULT));
};

const getAll = () => { init(); return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); };
const save   = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const nextId = () => { const items = getAll(); return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1; };

const getAprobadas = () => getAll().filter(r => r.aprobada).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

const yaReseño = clienteId => clienteId && getAll().some(r => r.clienteId === clienteId);

const create = ({ clienteId, nombre, rol, texto, estrellas }) => {
  if (!texto?.trim()) return { error: 'Escribe tu reseña antes de enviar.' };
  if (!estrellas || estrellas < 1) return { error: 'Selecciona al menos 1 estrella.' };
  if (texto.trim().length < 15) return { error: 'La reseña es muy corta. Cuéntanos un poco más.' };
  if (yaReseño(clienteId)) return { error: 'Ya dejaste una reseña. ¡Gracias!' };
  const items = getAll();
  const n = { id: nextId(), clienteId, nombre, rol: rol || 'Cliente', texto: texto.trim(), estrellas, fecha: new Date().toISOString(), aprobada: true };
  items.push(n); save(items);
  return { data: n };
};

const remove = id => { save(getAll().filter(r => r.id !== id)); return { ok: true }; };

const resenasService = { getAll, getAprobadas, create, remove, yaReseño };
export default resenasService;