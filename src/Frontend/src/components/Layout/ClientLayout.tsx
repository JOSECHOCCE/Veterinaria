import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function ClientLayout() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const location = useLocation();
  const { unreadCount, setUnreadCount } = useNotifications();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Gatillo de animación de sacudida cuando llega una nueva notificación
  useEffect(() => {
    if (unreadCount > 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const navItems = [
    { name: 'Inicio', path: '/cliente/portal', icon: 'home' },
    { name: 'Nueva Cita', path: '/cliente/nueva-cita', icon: 'calendar_add_on' },
    { name: 'Historial', path: '/cliente/historial', icon: 'history' },
    { name: 'Mis Pagos', path: '/cliente/mis-pagos', icon: 'payments' },
    { name: 'Mi Perfil', path: '/cliente/mi-perfil', icon: 'account_circle' }
  ];

  // Pantalla de carga ultra premium
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-secondary/15 blur-3xl animate-pulse" />

        <div className="z-10 flex flex-col items-center gap-md">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-lg border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[32px] animate-pulse">pets</span>
          </motion.div>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-headline-md font-headline-md font-semibold text-on-surface">Cargando Mi Portal...</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Verificando sesión segura</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar que el usuario no sea Admin/Veterinario para estar aquí
  if (user?.role === 'Admin' || user?.role === 'Veterinario') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden pb-16 md:pb-0">
      {/* Elementos de diseño premium - Efectos luminosos de fondo */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/5 blur-[120px] pointer-events-none z-0" />
      
      {/* Navegación Superior para Clientes */}
      <header className="h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 flex items-center justify-between px-md md:px-xl sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-outlined text-[24px]">pets</span>
          </div>
          <span className="font-headline-md text-headline-md font-extrabold text-on-surface">
            Mi <span className="text-primary">Portal</span>
          </span>
        </div>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-lg font-body-md font-semibold">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors relative py-xs px-xs hover:text-primary ${
                  isActive ? 'text-primary font-bold shadow-none' : 'text-on-surface-variant font-medium'
                }`}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="activeClientTab"
                    className="absolute bottom-[-18px] left-0 right-0 h-[3px] bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-md">
          {/* Campana de Notificaciones en Tiempo Real para Cliente */}
          <motion.button
            animate={shouldAnimate ? { rotate: [0, -18, 15, -15, 12, -10, 8, -4, 4, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => {
              setUnreadCount(0);
              toast.info('Notificaciones restablecidas.');
            }}
            className="p-xs rounded-full hover:bg-surface-container-high transition-colors relative cursor-pointer text-primary"
            title={`${unreadCount} notificaciones`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-error text-white text-[8px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center border border-surface shadow-sm leading-none"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <div className="hidden md:flex flex-col text-right">
            <span className="font-label-md text-label-md text-on-surface font-bold leading-none">{user?.nombreCompleto}</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant font-semibold">Cliente</span>
          </div>
          
          <button onClick={logout} className="w-10 h-10 rounded-full bg-error-container/30 text-error flex items-center justify-center hover:bg-error-container/50 transition-colors border border-error/20 cursor-pointer" title="Cerrar sesión">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>
      
      {/* Contenido Principal */}
      <main className="flex-grow p-gutter lg:p-lg pb-24 md:pb-lg z-10 relative max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Navegación Móvil Inferior (Bottom Navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest/90 backdrop-blur-lg border-t border-outline-variant/20 z-40 px-xs py-[6px] flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-[2px] w-14 transition-all relative ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBottomTab"
                  className="absolute -top-[6px] w-8 h-[3px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              <span 
                className="material-symbols-outlined text-[20px] block"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[9px] font-bold leading-none tracking-tight truncate w-full text-center block">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Notificaciones globales */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

