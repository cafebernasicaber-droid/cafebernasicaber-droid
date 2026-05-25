import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './shared/components/PrivateRoute';

import Landing from './landing/Landing';
import DashboardPage from './features/dashboard/pages/DashboardPage';

import RolesPage from './features/roles/pages/RolesPage';
import { AgregarRolPage, EditarRolPage } from './features/roles/pages/RolFormPage';
import VerRolPage from './features/roles/pages/VerRolPage';

import UsuariosPage from './features/usuarios/pages/UsuariosPage';
import { AgregarUsuarioPage, EditarUsuarioPage } from './features/usuarios/pages/UsuarioFormPage';
import VerUsuarioPage from './features/usuarios/pages/VerUsuarioPage';

import ClientesPage from './features/clientes/pages/ClientesPage';
import { EditarClientePage, VerClientePage } from './features/clientes/pages/ClienteFormPages';

import InsumosPage from './features/insumos/pages/InsumosPage';
import AgregarInsumoPage from './features/insumos/pages/AgregarInsumoPage';
import EditarInsumoPage from './features/insumos/pages/EditarInsumoPage';
import VerInsumoPage from './features/insumos/pages/VerInsumoPage';

import ProveedoresPage from './features/proveedores/pages/ProveedoresPage';
import AgregarProveedorPage from './features/proveedores/pages/AgregarProveedorPage';
import EditarProveedorPage from './features/proveedores/pages/EditarProveedorPage';
import VerProveedorPage from './features/proveedores/pages/VerProveedorPage';

import ComprasPage from './features/compras/pages/ComprasPage';
import AgregarCompraPage from './features/compras/pages/AgregarCompraPage';
import VerCompraPage from './features/compras/pages/VerCompraPage';
import HistorialComprasPage from './features/compras/pages/HistorialComprasPage';

import PedidosPage from './features/pedidos/pages/PedidosPage';
import EmpleadosPage from './features/empleados/pages/EmpleadosPage';

import ProductosPage from './features/productos/pages/ProductosPage';
import ProductoFormPage from './features/productos/pages/ProductoFormPage';
import CategoriasPage from './features/categorias/pages/CategoriasPage';
import AdicionesPage from './features/adiciones/pages/AdicionesPage';
import CombosPage from './features/combos/pages/CombosPage';
import ToppingsPage from './features/toppings/pages/ToppingsPage';

import VentasPage from './features/ventas/pages/VentasPage';
import DevolucionesPage from './features/devoluciones/pages/DevolucionesPage';
import FichasTecnicasPage from './features/fichasTecnicas/pages/FichasTecnicasPage';

import CajeroPage    from './features/cajero/pages/CajeroPage';
import BartenderPage from './features/bartender/pages/BartenderPage';

const PR = ({ children }) => <PrivateRoute>{children}</PrivateRoute>;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Navigate to="/" replace />} />

    {/* ── Panel Admin ── */}
    <Route path="/admin/dashboard"           element={<PR><DashboardPage /></PR>} />
    <Route path="/admin/roles"               element={<PR><RolesPage /></PR>} />
    <Route path="/admin/roles/nuevo"         element={<PR><AgregarRolPage /></PR>} />
    <Route path="/admin/roles/editar/:id"    element={<PR><EditarRolPage /></PR>} />
    <Route path="/admin/roles/ver/:id"       element={<PR><VerRolPage /></PR>} />
    <Route path="/admin/usuarios"            element={<PR><UsuariosPage /></PR>} />
    <Route path="/admin/usuarios/nuevo"      element={<PR><AgregarUsuarioPage /></PR>} />
    <Route path="/admin/usuarios/editar/:id" element={<PR><EditarUsuarioPage /></PR>} />
    <Route path="/admin/usuarios/ver/:id"    element={<PR><VerUsuarioPage /></PR>} />
    <Route path="/admin/clientes"            element={<PR><ClientesPage /></PR>} />
    <Route path="/admin/clientes/editar/:id" element={<PR><EditarClientePage /></PR>} />
    <Route path="/admin/clientes/ver/:id"    element={<PR><VerClientePage /></PR>} />

    <Route path="/pedidos"         element={<PR><PedidosPage /></PR>} />
    <Route path="/empleados"       element={<PR><EmpleadosPage /></PR>} />
    <Route path="/ventas"          element={<PR><VentasPage /></PR>} />
    <Route path="/devoluciones"    element={<PR><DevolucionesPage /></PR>} />
    <Route path="/fichas-tecnicas" element={<PR><FichasTecnicasPage /></PR>} />

    <Route path="/productos"            element={<PR><ProductosPage /></PR>} />
    <Route path="/productos/nuevo"      element={<PR><ProductoFormPage /></PR>} />
    <Route path="/productos/editar/:id" element={<PR><ProductoFormPage /></PR>} />
    <Route path="/categorias"           element={<PR><CategoriasPage /></PR>} />
    <Route path="/adiciones"            element={<PR><AdicionesPage /></PR>} />
    <Route path="/combos"               element={<PR><CombosPage /></PR>} />
    <Route path="/toppings"             element={<PR><ToppingsPage /></PR>} />

    <Route path="/insumos"            element={<PR><InsumosPage /></PR>} />
    <Route path="/insumos/nuevo"      element={<PR><AgregarInsumoPage /></PR>} />
    <Route path="/insumos/editar/:id" element={<PR><EditarInsumoPage /></PR>} />
    <Route path="/insumos/ver/:id"    element={<PR><VerInsumoPage /></PR>} />

    <Route path="/proveedores"            element={<PR><ProveedoresPage /></PR>} />
    <Route path="/proveedores/nuevo"      element={<PR><AgregarProveedorPage /></PR>} />
    <Route path="/proveedores/editar/:id" element={<PR><EditarProveedorPage /></PR>} />
    <Route path="/proveedores/ver/:id"    element={<PR><VerProveedorPage /></PR>} />

    <Route path="/compras"             element={<PR><ComprasPage /></PR>} />
    <Route path="/compras/nueva"       element={<PR><AgregarCompraPage /></PR>} />
    <Route path="/compras/ver/:id"     element={<PR><VerCompraPage /></PR>} />
    <Route path="/compras/historial"   element={<PR><HistorialComprasPage /></PR>} />

    {/* ── Cajero ── */}
    <Route path="/cajero"    element={<PR><CajeroPage /></PR>} />

    {/* ── Bartender ── */}
    <Route path="/bartender" element={<PR><BartenderPage /></PR>} />

    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="*"      element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
