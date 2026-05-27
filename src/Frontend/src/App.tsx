import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import RoleGuard from './components/Layout/RoleGuard';
import ClientLayout from './components/Layout/ClientLayout';
import Dashboard from './views/Dashboard/Dashboard';

// Public Views
import Login from './views/Auth/Login';
import Register from './views/Auth/Register';

// Protected Views (Placeholder)
import PortalCliente from './views/PortalCliente/PortalCliente';
import Agenda from './views/Citas/Agenda';
import NuevaCita from './views/Citas/NuevaCita';
import ColaAtencion from './views/Atencion/ColaAtencion';
import Triage from './views/Atencion/Triage';
import HistoriaClinica from './views/Atencion/HistoriaClinicaSOAP';
import FichaCliente from './views/Clientes/FichaCliente';
import FichaMascota from './views/Mascotas/FichaMascota';
import GestionPagos from './views/Pagos/GestionPagos';
import Consentimiento from './views/Legal/Consentimiento';

// Vistas del Portal de Clientes
import MiPerfil from './views/PortalCliente/MiPerfil';
import MisPagos from './views/PortalCliente/MisPagos';
import HistorialCliente from './views/PortalCliente/HistorialCliente';
import NuevoFlujoCita from './views/PortalCliente/NuevoFlujoCita';

// Vistas del Panel Administrativo
import GestionServicios from './views/Servicios/GestionServicios';
import ReportesView from './views/Dashboard/ReportesView';
import GestionUsuarios from './views/Usuarios/GestionUsuarios';
import GestionVeterinarios from './views/Veterinarios/GestionVeterinarios';
import AuditoriaView from './views/Dashboard/AuditoriaView';
import ConfiguracionView from './views/Dashboard/ConfiguracionView';
import GestionProductos from './views/Productos/GestionProductos';
import GestionVentas from './views/Ventas/GestionVentas';

// Componente para manejar la redirección raíz basada en rol
import { useAuth } from './context/AuthContext';
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'Usuario' || user?.role === 'Cliente') return <Navigate to="/cliente/portal" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Redirección dinámica en la raíz */}
      <Route path="/" element={<RootRedirect />} />

      {/* Rutas Protegidas de Administradores y Veterinarios */}
      <Route path="/admin" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Módulo Citas */}
        <Route path="agenda" element={<Agenda />} />
        <Route path="agenda/nueva" element={<NuevaCita />} />
        
        {/* Módulo Atención */}
        <Route path="cola" element={<ColaAtencion />} />
        <Route path="triage" element={<Triage />} />
        <Route path="historia-clinica" element={<HistoriaClinica />} />
        
        {/* Módulos de Acceso General del Staff */}
        <Route path="inventario" element={<GestionProductos />} />
        <Route path="configuracion" element={<ConfiguracionView />} />
        <Route path="consentimiento" element={<Consentimiento />} />

        {/* Módulos exclusivos de Administrador (Admin) */}
        <Route element={<RoleGuard allowedRoles={['Admin']} />}>
          <Route path="servicios" element={<GestionServicios />} />
          <Route path="reportes" element={<ReportesView />} />
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="veterinarios" element={<GestionVeterinarios />} />
          <Route path="auditoria" element={<AuditoriaView />} />
        </Route>

        {/* Módulos exclusivos de Administrador y Recepcionista */}
        <Route element={<RoleGuard allowedRoles={['Admin', 'Recepcionista']} />}>
          <Route path="clientes" element={<FichaCliente />} />
          <Route path="ventas" element={<GestionVentas />} />
          <Route path="pagos" element={<GestionPagos />} />
        </Route>

        {/* Mascotas compartido por Admin, Recepcionista y Veterinario */}
        <Route element={<RoleGuard allowedRoles={['Admin', 'Recepcionista', 'Veterinario']} />}>
          <Route path="mascotas" element={<FichaMascota />} />
        </Route>
      </Route>

      {/* Rutas Protegidas de Clientes */}
      <Route path="/cliente" element={<ClientLayout />}>
        <Route index element={<Navigate to="/cliente/portal" replace />} />
        <Route path="portal" element={<PortalCliente />} />
        <Route path="mis-mascotas" element={<FichaMascota />} />
        <Route path="mis-citas" element={<Agenda />} />
        <Route path="nueva-cita" element={<NuevoFlujoCita />} />
        <Route path="historial" element={<HistorialCliente />} />
        <Route path="mis-pagos" element={<MisPagos />} />
        <Route path="mi-perfil" element={<MiPerfil />} />
        <Route path="consentimiento" element={<Consentimiento />} />
      </Route>
      
      {/* Fallback 404 */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
