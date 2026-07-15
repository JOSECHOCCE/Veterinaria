import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getHomeRouteForRole } from '../../context/AuthContext';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to={getHomeRouteForRole(user?.role)} replace />;
  }

  return (
    <div className="min-h-screen w-full antialiased bg-canvas">
      {children}
    </div>
  );
};
