import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import { Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function ProtectedLayout() {
  const { isAuthenticated, loading, user } = useAuth();

  // Pantalla de carga ultra premium
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        {/* Luces de fondo decorativas */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-secondary/15 blur-3xl animate-pulse" />

        <div className="z-10 flex flex-col items-center gap-md">
          {/* Logo animado de carga */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-lg border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[32px] animate-pulse">pets</span>
          </motion.div>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-headline-md font-headline-md font-semibold text-on-surface">Cargando VetCare Pro...</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Verificando sesión segura</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir al cliente a su portal si intenta entrar al admin
  if (user?.role === 'Usuario' || user?.role === 'Cliente') {
    return <Navigate to="/cliente/portal" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-x-hidden">
      {/* Elementos de diseño premium - Efectos luminosos de fondo */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/5 blur-[120px] pointer-events-none z-0" />
      
      {/* Navegación y estructura */}
      <Sidebar />
      <TopAppBar />
      
      {/* Contenido Principal */}
      <main className="flex-1 mt-16 md:ml-64 p-gutter lg:p-lg pb-24 md:pb-lg overflow-y-auto z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Notificaciones globales */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

