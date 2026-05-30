import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedLayout() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)' }}>
        <h2 className="display-lg">Cargando...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'Usuario' || user?.role === 'Cliente') {
    return <Navigate to="/cliente/portal" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <header className="flex justify-between items-center" style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-card)', borderBottom: '1px solid var(--color-hairline)' }}>
        <div className="title-md">VetCare Pro - Admin</div>
        <div className="flex gap-sm items-center">
          <span>{user?.nombreCompleto}</span>
          <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: 'var(--color-surface-strong)', borderRadius: 'var(--rounded-pill)' }}>{user?.role}</span>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: 'var(--spacing-xl)' }}>
        <Outlet />
      </main>
    </div>
  );
}
