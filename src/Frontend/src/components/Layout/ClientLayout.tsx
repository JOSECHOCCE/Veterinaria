import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Logo from './Logo';

export default function ClientLayout() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { name: 'Inicio', icon: 'home', path: '/cliente/portal' },
    { name: 'Mis Mascotas', icon: 'pets', path: '/cliente/mis-mascotas' },
    { name: 'Mis Citas', icon: 'calendar_month', path: '/cliente/mis-citas' },
    { name: 'Mis Pagos', icon: 'receipt_long', path: '/cliente/mis-pagos' },
    { name: 'Mi Perfil', icon: 'manage_accounts', path: '/cliente/mi-perfil' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Navbar Superior Horizontal Exclusiva para Clientes */}
      <header className="sticky top-0 z-40 bg-surface-card border-b border-hairline shadow-sm select-none">
        <div className="max-w-7xl mx-auto px-gutter h-16 flex items-center justify-between">
          
          {/* Logo Oficial */}
          <Link to="/cliente/portal" className="flex items-center">
            <Logo showSubtitle={false} />
          </Link>

          {/* Menú de Navegación Horizontal (Pantallas Medianas y Grandes) */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-3 rounded-lg text-label-md font-label-md transition-colors"
                >
                  {/* Animación de píldora activa de Framer Motion */}
                  {isActive && (
                    <motion.div
                      layoutId="activeClientMenu"
                      className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-3 font-semibold ${
                     isActive ? 'text-primary' : 'text-body-muted hover:text-ink'
                  }`}>
                    <span 
                      className="material-symbols-outlined text-[18px]"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Acciones del Usuario en Navbar */}
          <div className="flex items-center gap-3">
            {/* Perfil del Cliente */}
            <div className="hidden sm:flex items-center gap-3 bg-surface-soft border border-hairline rounded-full pl-3 pr-2 py-[3px] shadow-sm">
              <span className="font-label-sm text-ink font-semibold max-w-[120px] truncate">
                {user.nombreCompleto?.split(' ')[0]}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary-active text-on-primary font-bold text-label-md flex items-center justify-center border border-primary/10">
                {user.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : 'C'}
              </div>
            </div>

            {/* Botón de Cerrar Sesión */}
            <button
              onClick={logout}
              className="p-2 text-body-muted hover:text-error hover:bg-error-container/30 rounded-lg transition-all cursor-pointer flex items-center justify-center"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>

            {/* Menú de Hamburguesa para Móviles */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ink bg-surface-soft rounded-lg border border-hairline flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable (Responsivo) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-hairline bg-surface-card overflow-hidden"
            >
              <div className="px-gutter py-4 flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-bold border border-primary/20' 
                          : 'text-body-muted hover:text-ink hover:bg-surface-soft'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Área de Contenido Principal del Portal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-gutter lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
