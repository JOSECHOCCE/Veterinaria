import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from './Layout';

export default function ProtectedLayout() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen animate-pulse" style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)' }}>
        <h2 className="display-lg">Cargando VetCare Pro...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'Usuario' || user?.role === 'Cliente') {
    return <Navigate to="/cliente/portal" replace />;
  }

  // Renderizar la estructura global que contiene la barra lateral y la barra superior
  return <Layout />;
}

