// ─────────────────────────────────────────────────────────────
//  src/shared/contexts/AuthContext.jsx
//  REEMPLAZA el archivo existente.
//
//  Cambios:
//  - Agrega credenciales fijas para Cajero y Bartender
//  - Redirige a /cajero o /bartender según el rol
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// ── Credenciales fijas del sistema ───────────────────────────
const ADMIN     = { username: 'Admin_Sicaber',    password: 'admin2024#' };
const CAJERO    = { username: 'Cajero_Sicaber',   password: 'cajero2024#' };
const BARTENDER = { username: 'Bartender_Sicaber',password: 'bartender2024#' };

const getStorage = key => {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : []; }
  catch { return []; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('sicaber_session');
    return s ? JSON.parse(s) : null;
  });

  const login = (username, password) => {
    // ── Admin ──────────────────────────────────────────────
    if (username === ADMIN.username && password === ADMIN.password) {
      const u = {
        username,
        nombre: 'Admin Sicaber',
        role: 'Administrador',
        esAdmin: true,
        permisos: null,
      };
      setUser(u);
      localStorage.setItem('sicaber_session', JSON.stringify(u));
      return { success: true, redirectTo: '/admin/dashboard' };
    }

    // ── Cajero ─────────────────────────────────────────────
    if (username === CAJERO.username && password === CAJERO.password) {
      const u = {
        username,
        nombre: 'Cajero Sicaber',
        role: 'Cajero',
        esCajero: true,
        esAdmin: false,
        permisos: ['pedidos', 'ventas', 'clientes'],
      };
      setUser(u);
      localStorage.setItem('sicaber_session', JSON.stringify(u));
      return { success: true, redirectTo: '/cajero' };
    }

    // ── Bartender ──────────────────────────────────────────
    if (username === BARTENDER.username && password === BARTENDER.password) {
      const u = {
        username,
        nombre: 'Bartender Sicaber',
        role: 'Bartender',
        esBartender: true,
        esAdmin: false,
        permisos: ['pedidos'],
      };
      setUser(u);
      localStorage.setItem('sicaber_session', JSON.stringify(u));
      return { success: true, redirectTo: '/bartender' };
    }

    // ── Usuarios dinámicos (creados desde el admin) ────────
    const usuarios = getStorage('sicaber_usuarios');
    const norm = s => (s || '').toLowerCase().trim();
    const found = usuarios.find(
      u => norm(u.username) === norm(username) && u.password === password
    );

    // ── Empleados cajero/bartender ─────────────────────────
    if (!found) {
      const empleados = getStorage('sicaber_empleados');
      const emp = empleados.find(
        e => e.username && norm(e.username) === norm(username) && e.password === password
      );
      if (emp) {
        if (emp.activo === false) return { success: false, error: 'Tu cuenta está desactivada.' };
        const cargo = norm(emp.cargo);
        if (!cargo.includes('cajero') && !cargo.includes('bartender')) {
          return { success: false, error: 'Usuario o contraseña incorrectos.' };
        }
        const u = {
          username: emp.username,
          nombre: emp.nombre,
          role: emp.cargo,
          esCajero: cargo.includes('cajero'),
          esBartender: cargo.includes('bartender'),
          esAdmin: false,
          empleadoId: emp.id,
        };
        setUser(u);
        localStorage.setItem('sicaber_session', JSON.stringify(u));
        const redirectTo = cargo.includes('cajero') ? '/cajero' : '/bartender';
        return { success: true, redirectTo };
      }
      return { success: false, error: 'Usuario o contraseña incorrectos.' };
    }

    if (!found.estado) return { success: false, error: 'Tu cuenta está desactivada.' };

    const roles = getStorage('sicaber_roles');
    const rol   = roles.find(r => r.id === found.rolId);
    const u = {
      username: found.username,
      nombre: found.nombre,
      role: rol?.nombre || 'Usuario',
      esAdmin: false,
      rolId: found.rolId,
      permisos: rol?.permisos || [],
    };
    setUser(u);
    localStorage.setItem('sicaber_session', JSON.stringify(u));
    const rolNombre = (rol?.nombre || '').toLowerCase();
    const redirectTo = rolNombre.includes('bartender') ? '/bartender'
      : rolNombre.includes('cajero') ? '/cajero'
      : '/admin/dashboard';
    return { success: true, redirectTo };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sicaber_session');
  };

  const hasPermiso = pid => {
    if (!user) return false;
    if (user.esAdmin || user.permisos === null) return true;
    return Array.isArray(user.permisos) && user.permisos.includes(pid);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermiso }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
};
