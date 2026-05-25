// ─────────────────────────────────────────────────────────────
//  src/shared/services/api.js
//
//  Cliente HTTP centralizado para consumir la API de Sicaber.
//  Todos los servicios del frontend deben usar este módulo
//  en vez de llamar a fetch directamente.
// ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// ── Helpers de token ─────────────────────────────────────────
export const getToken    = () => localStorage.getItem('sicaber_token');
export const setToken    = (t) => localStorage.setItem('sicaber_token', t);
export const removeToken = () => localStorage.removeItem('sicaber_token');

// ── Fetch base ───────────────────────────────────────────────
const request = async (method, path, body = null, publicRoute = false) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token && !publicRoute) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Propaga el mensaje de error del servidor
    throw Object.assign(new Error(data.error || 'Error en la solicitud'), {
      status: res.status,
      duplicateFields: data.duplicateFields,
    });
  }
  return data;
};

export const get    = (path, pub)        => request('GET',    path, null, pub);
export const post   = (path, body, pub)  => request('POST',   path, body, pub);
export const put    = (path, body)       => request('PUT',    path, body);
export const patch  = (path, body)       => request('PATCH',  path, body);
export const del    = (path)             => request('DELETE', path);

// ── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  loginAdmin:      (u, p)    => post('/auth/login',            { username: u, password: p }),
  loginCliente:    (c, p)    => post('/auth/cliente/login',    { correo: c,   password: p }, true),
  registroCliente: (datos)   => post('/auth/cliente/registro', datos, true),
  me:              ()        => get ('/auth/me'),
};

// ── ROLES ────────────────────────────────────────────────────
export const rolesApi = {
  getAll:   ()       => get ('/roles'),
  getById:  (id)     => get (`/roles/${id}`),
  create:   (data)   => post('/roles', data),
  update:   (id, d)  => put (`/roles/${id}`, d),
  remove:   (id)     => del (`/roles/${id}`),
};

// ── USUARIOS ─────────────────────────────────────────────────
export const usuariosApi = {
  getAll:        ()       => get ('/usuarios'),
  getById:       (id)     => get (`/usuarios/${id}`),
  create:        (data)   => post('/usuarios', data),
  update:        (id, d)  => put (`/usuarios/${id}`, d),
  remove:        (id)     => del (`/usuarios/${id}`),
  toggleEstado:  (id)     => patch(`/usuarios/${id}/estado`),
};

// ── CLIENTES ─────────────────────────────────────────────────
export const clientesApi = {
  getAll:         ()       => get ('/clientes'),
  getById:        (id)     => get (`/clientes/${id}`),
  update:         (id, d)  => put (`/clientes/${id}`, d),
  remove:         (id)     => del (`/clientes/${id}`),
  toggleEstado:   (id)     => patch(`/clientes/${id}/estado`),
  miPerfil:       ()       => get ('/clientes/mi-perfil'),
  actualizarPerfil:(data)  => put ('/clientes/mi-perfil', data),
};

// ── EMPLEADOS ────────────────────────────────────────────────
export const empleadosApi = {
  getAll:  ()       => get ('/empleados'),
  getById: (id)     => get (`/empleados/${id}`),
  create:  (data)   => post('/empleados', data),
  update:  (id, d)  => put (`/empleados/${id}`, d),
  remove:  (id)     => del (`/empleados/${id}`),
};

// ── CATEGORÍAS ───────────────────────────────────────────────
export const categoriasApi = {
  getAll:  ()       => get ('/categorias', true),
  create:  (data)   => post('/categorias', data),
  update:  (id, d)  => put (`/categorias/${id}`, d),
  remove:  (id)     => del (`/categorias/${id}`),
};

// ── PRODUCTOS ────────────────────────────────────────────────
export const productosApi = {
  getActivos: ()       => get ('/productos', true),
  getAll:     ()       => get ('/productos/todos'),
  getById:    (id)     => get (`/productos/${id}`, true),
  create:     (data)   => post('/productos', data),
  update:     (id, d)  => put (`/productos/${id}`, d),
  remove:     (id)     => del (`/productos/${id}`),
};

// ── TOPPINGS ─────────────────────────────────────────────────
export const toppingsApi = {
  getAll:  ()       => get ('/toppings', true),
  create:  (data)   => post('/toppings', data),
  update:  (id, d)  => put (`/toppings/${id}`, d),
  remove:  (id)     => del (`/toppings/${id}`),
};

// ── ADICIONES ────────────────────────────────────────────────
export const adicionesApi = {
  getAll:  ()       => get ('/adiciones', true),
  create:  (data)   => post('/adiciones', data),
  update:  (id, d)  => put (`/adiciones/${id}`, d),
  remove:  (id)     => del (`/adiciones/${id}`),
};

// ── COMBOS ───────────────────────────────────────────────────
export const combosApi = {
  getActivos:    ()       => get ('/combos', true),
  getAll:        ()       => get ('/combos/todos'),
  create:        (data)   => post('/combos', data),
  update:        (id, d)  => put (`/combos/${id}`, d),
  toggleEstado:  (id)     => patch(`/combos/${id}/estado`),
  remove:        (id)     => del (`/combos/${id}`),
};

// ── PROVEEDORES ──────────────────────────────────────────────
export const proveedoresApi = {
  getAll:        ()       => get ('/proveedores'),
  getById:       (id)     => get (`/proveedores/${id}`),
  create:        (data)   => post('/proveedores', data),
  update:        (id, d)  => put (`/proveedores/${id}`, d),
  remove:        (id)     => del (`/proveedores/${id}`),
  toggleEstado:  (id)     => patch(`/proveedores/${id}/estado`),
};

// ── INSUMOS ──────────────────────────────────────────────────
export const insumosApi = {
  getAll:  ()       => get ('/insumos'),
  getById: (id)     => get (`/insumos/${id}`),
  create:  (data)   => post('/insumos', data),
  update:  (id, d)  => put (`/insumos/${id}`, d),
  remove:  (id)     => del (`/insumos/${id}`),
};

// ── COMPRAS ──────────────────────────────────────────────────
export const comprasApi = {
  getActivas:  ()         => get ('/compras'),
  getHistorial:()         => get ('/compras/historial'),
  getById:     (id)       => get (`/compras/${id}`),
  create:      (data)     => post('/compras', data),
  anular:      (id, mot)  => patch(`/compras/${id}/anular`, { motivo: mot }),
};

// ── PEDIDOS ──────────────────────────────────────────────────
export const pedidosApi = {
  getAll:        ()           => get ('/pedidos'),
  getStats:      ()           => get ('/pedidos/stats'),
  getById:       (id)         => get (`/pedidos/${id}`),
  create:        (data)       => post('/pedidos', data, true),
  cambiarEstado: (id, estado) => patch(`/pedidos/${id}/estado`, { estado }),
  remove:        (id)         => del (`/pedidos/${id}`),
};

// ── VENTAS ───────────────────────────────────────────────────
export const ventasApi = {
  getAll:        ()           => get ('/ventas'),
  getStats:      ()           => get ('/ventas/stats'),
  getById:       (id)         => get (`/ventas/${id}`),
  crearDesde:    (id_pedido)  => post('/ventas/desde-pedido', { id_pedido }),
  cambiarEstado: (id, estado) => patch(`/ventas/${id}/estado`, { estado }),
};

// ── DEVOLUCIONES ─────────────────────────────────────────────
export const devolucionesApi = {
  getAll:        ()           => get ('/devoluciones'),
  create:        (data)       => post('/devoluciones', data),
  cambiarEstado: (id, estado) => patch(`/devoluciones/${id}/estado`, { estado }),
};

// ── FICHAS TÉCNICAS ──────────────────────────────────────────
export const fichasTecnicasApi = {
  getAll:  ()       => get ('/fichas-tecnicas'),
  getById: (id)     => get (`/fichas-tecnicas/${id}`),
  create:  (data)   => post('/fichas-tecnicas', data),
  update:  (id, d)  => put (`/fichas-tecnicas/${id}`, d),
  remove:  (id)     => del (`/fichas-tecnicas/${id}`),
};

// ── RESEÑAS ──────────────────────────────────────────────────
export const resenasApi = {
  getAprobadas: ()       => get ('/resenas', true),
  getAll:       ()       => get ('/resenas/todas'),
  create:       (data)   => post('/resenas', data),
  aprobar:      (id)     => patch(`/resenas/${id}/aprobar`),
  remove:       (id)     => del (`/resenas/${id}`),
};
