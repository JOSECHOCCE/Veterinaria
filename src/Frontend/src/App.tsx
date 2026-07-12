import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import ClientLayout from './components/Layout/ClientLayout';
import RoleGuard from './components/Layout/RoleGuard';
import { AuthLayout } from './components/Layout/AuthLayout';
import { useAuth } from './context/AuthContext';

// Views (Placeholder para probar la arquitectura)
import Login from './views/Auth/Login';
import Register from './views/Auth/Register';
import UserManagement from './views/Admin/UserManagement';
import ClientesDashboard from './views/Clientes/ClientesDashboard';
import FichaClienteDetalle from './views/Clientes/FichaClienteDetalle';
import RegistrarCliente from './views/Clientes/RegistrarCliente';
import EditarCliente from './views/Clientes/EditarCliente';
import FichaMascota from './views/Mascotas/FichaMascota';
import DetalleMascota from './views/Mascotas/DetalleMascota';
import RegistrarMascota from './views/Mascotas/RegistrarMascota';
import EditarMascota from './views/Mascotas/EditarMascota';
import CambioResponsable from './views/Mascotas/CambioResponsable';
import GestionServicios from './views/Servicios/GestionServicios';
import ConfigurarServicio from './views/Servicios/ConfigurarServicio';
import Agenda from './views/Citas/Agenda';
import NuevaCita from './views/Citas/NuevaCita';
import ColaAtencion from './views/Atencion/ColaAtencion';
import Triage from './views/Atencion/Triage';
import HistoriaClinicaSOAP from './views/Atencion/HistoriaClinicaSOAP';
import MiAgenda from './views/Atencion/MiAgenda';
import HistorialClinicoMascota from './views/Atencion/HistorialClinicoMascota';
import GestionPagos from './views/Pagos/GestionPagos';
import RegistrarCobro from './views/Pagos/RegistrarCobro';
import PortalCliente from './views/PortalCliente/PortalCliente';
import MisMascotas from './views/PortalCliente/MisMascotas';
import MisCitas from './views/PortalCliente/MisCitas';
import MisPagos from './views/PortalCliente/MisPagos';
import MiPerfil from './views/PortalCliente/MiPerfil';
import NuevoFlujoCita from './views/PortalCliente/NuevoFlujoCita';
import CentroNotificaciones from './views/Notificaciones/CentroNotificaciones';
import PreferenciasNotificacion from './views/Notificaciones/PreferenciasNotificacion';
import Dashboard from './views/Dashboard/Dashboard';
import ReportesHub from './views/Reportes/ReportesHub';
import LandingPage from './views/PortalPublico/LandingPage';
import ServiciosPublic from './views/PortalPublico/ServiciosPublic';
import EquipoPublic from './views/PortalPublico/EquipoPublic';
import ContactoPublic from './views/PortalPublico/ContactoPublic';

function DummyView({ title }: { title: string }) {
  return (
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--color-surface-card)', borderRadius: 'var(--rounded-xl)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
      <h2 className="display-md" style={{ marginBottom: 'var(--spacing-md)' }}>{title}</h2>
      <p style={{ color: 'var(--color-body)' }}>Esta vista es un placeholder. (Módulo en construcción)</p>
    </div>
  );
}

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'Usuario' || user?.role === 'Cliente') return <Navigate to="/cliente/portal" replace />;
  if (user?.role === 'Veterinario') return <Navigate to="/admin/mi-agenda" replace />;
  if (user?.role === 'Recepcionista') return <Navigate to="/admin/agenda" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/servicios" element={<ServiciosPublic />} />
      <Route path="/equipo" element={<EquipoPublic />} />
      <Route path="/contacto" element={<ContactoPublic />} />

      {/* Admin / Staff Routes */}
      <Route path="/admin" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<ClientesDashboard />} />
        <Route path="clientes/nuevo" element={<RegistrarCliente />} />
        <Route path="clientes/:id" element={<FichaClienteDetalle />} />
        <Route path="clientes/:id/editar" element={<EditarCliente />} />
        <Route path="mascotas" element={<FichaMascota />} />
        <Route path="mascotas/nuevo" element={<RegistrarMascota />} />
        <Route path="mascotas/:id" element={<DetalleMascota />} />
        <Route path="mascotas/:id/editar" element={<EditarMascota />} />
        <Route path="mascotas/:id/cambiar-responsable" element={<CambioResponsable />} />
        <Route path="servicios" element={<GestionServicios />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="agenda/nueva" element={<NuevaCita />} />
        <Route path="cola" element={<ColaAtencion />} />
        <Route path="triage" element={<Triage />} />
        <Route path="atencion/:citaId" element={<HistoriaClinicaSOAP />} />
        <Route path="mi-agenda" element={<MiAgenda />} />
        <Route path="mascotas/:id/historial" element={<HistorialClinicoMascota />} />
        <Route path="pagos" element={<GestionPagos />} />
        <Route path="pagos/registrar/:citaId" element={<RegistrarCobro />} />
        <Route path="notificaciones" element={<CentroNotificaciones />} />
        <Route path="preferencias-notificaciones" element={<PreferenciasNotificacion />} />
        <Route path="reportes" element={<ReportesHub />} />
        
        {/* Protected via RoleGuard */}
        <Route element={<RoleGuard allowedRoles={['Admin']} />}>
          <Route path="usuarios" element={<UserManagement />} />
          <Route path="servicios/nuevo" element={<ConfigurarServicio />} />
          <Route path="servicios/:id/editar" element={<ConfigurarServicio />} />
        </Route>
      </Route>

      {/* Client Routes */}
      <Route path="/cliente" element={<ClientLayout />}>
        <Route index element={<Navigate to="/cliente/portal" replace />} />
        <Route path="portal" element={<PortalCliente />} />
        <Route path="mis-mascotas" element={<MisMascotas />} />
        <Route path="mascotas/:id" element={<DetalleMascota />} />
        <Route path="mascotas/:id/historial" element={<HistorialClinicoMascota />} />
        <Route path="mis-citas" element={<MisCitas />} />
        <Route path="mis-pagos" element={<MisPagos />} />
        <Route path="mi-perfil" element={<MiPerfil />} />
        <Route path="nueva-cita" element={<NuevoFlujoCita />} />
        <Route path="notificaciones" element={<CentroNotificaciones />} />
        <Route path="preferencias-notificaciones" element={<PreferenciasNotificacion />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
