import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ClientLayout() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
        <h2 className="display-lg">Cargando Portal...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Usuario' && user?.role !== 'Cliente') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <header className="flex justify-between items-center" style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-card)', borderBottom: '1px solid var(--color-hairline)' }}>
        <div className="title-md">Portal Cliente</div>
        <div>{user?.nombreCompleto}</div>
      </header>
      
      <main style={{ flex: 1, padding: 'var(--spacing-xl)' }}>
        <Outlet />
      </main>
    </div>
  );
}
