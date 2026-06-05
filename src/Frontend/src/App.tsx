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
import PortalCliente from './views/PortalCliente/PortalCliente';

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
  return <Navigate to="/admin/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      <Route path="/" element={<RootRedirect />} />

      {/* Admin / Staff Routes */}
      <Route path="/admin" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DummyView title="Dashboard" />} />
        <Route path="clientes" element={<ClientesDashboard />} />
        <Route path="clientes/nuevo" element={<RegistrarCliente />} />
        <Route path="clientes/:id" element={<FichaClienteDetalle />} />
        <Route path="clientes/:id/editar" element={<EditarCliente />} />
        <Route path="mascotas" element={<FichaMascota />} />
        <Route path="mascotas/:id" element={<DetalleMascota />} />
        
        {/* Protected via RoleGuard */}
        <Route element={<RoleGuard allowedRoles={['Admin']} />}>
          <Route path="usuarios" element={<UserManagement />} />
          <Route path="servicios" element={<DummyView title="Gestión de Servicios" />} />
        </Route>
      </Route>

      {/* Client Routes */}
      <Route path="/cliente" element={<ClientLayout />}>
        <Route index element={<Navigate to="/cliente/portal" replace />} />
        <Route path="portal" element={<PortalCliente />} />
        <Route path="mis-mascotas" element={<FichaMascota />} />
        <Route path="mascotas/:id" element={<DetalleMascota />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
