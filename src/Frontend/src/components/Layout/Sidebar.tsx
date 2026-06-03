import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import Logo from './Logo';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  let menuItems: { name: string; icon: string; path: string }[] = [];

  // Mapeo dinámico de secciones según el rol del usuario (respetando la especificación funcional)
  if (user?.role === 'Admin') {
    menuItems = [
      { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Agenda Operativa', icon: 'calendar_today', path: '/admin/agenda' },
      { name: 'Cola de Atención', icon: 'pending_actions', path: '/admin/cola' },
      { name: 'Directorio Clientes', icon: 'person', path: '/admin/clientes' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
      { name: 'Servicios', icon: 'medical_services', path: '/admin/servicios' },
      { name: 'Pagos y Cobros', icon: 'payments', path: '/admin/pagos' },
      { name: 'Reportes e Ingresos', icon: 'analytics', path: '/admin/reportes' },
      { name: 'Gestión Usuarios', icon: 'badge', path: '/admin/usuarios' }
    ];
  } else if (user?.role === 'Recepcionista') {
    menuItems = [
      { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Agenda Operativa', icon: 'calendar_today', path: '/admin/agenda' },
      { name: 'Cola de Atención', icon: 'pending_actions', path: '/admin/cola' },
      { name: 'Directorio Clientes', icon: 'person', path: '/admin/clientes' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
      { name: 'Pagos y Cobros', icon: 'payments', path: '/admin/pagos' }
    ];
  } else if (user?.role === 'Veterinario') {
    menuItems = [
      { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Agenda Operativa', icon: 'calendar_today', path: '/admin/agenda' },
      { name: 'Cola de Atención', icon: 'pending_actions', path: '/admin/cola' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' }
    ];
  }

  // Mostrar acción de agendamiento rápido para Admin y Recepcionista
  const showQuickAction = user?.role === 'Admin' || user?.role === 'Recepcionista';

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-72 pt-6 pb-6 px-4 bg-surface-card border-r border-hairline z-30 shadow-sm overflow-hidden select-none">
      {/* Branding con Logotipo Unificado */}
      <div className="mb-6 px-3">
        <Logo />
      </div>

      {/* Acción Rápida (Consistente arriba del menú) */}
      {showQuickAction && (
        <div className="px-3 mb-4">
          <Link to="/admin/agenda?action=new">
            <motion.button 
              className="w-full bg-primary hover:bg-primary-active text-on-primary font-button text-button py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva Consulta
            </motion.button>
          </Link>
        </div>
      )}

      {/* Menú de Navegación Dinámico */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative block"
            >
              {/* Burbuja activa usando Framer Motion para deslizar */}
              {isActive && (
                <motion.div
                  layoutId="activeMenu"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/25 shadow-inner"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div
                className={`relative z-10 flex items-center gap-3 px-4 py-[10px] rounded-xl font-label-md text-label-md transition-all ${
                  isActive 
                    ? 'text-primary font-bold shadow-sm' 
                    : 'text-body-muted hover:text-ink hover:bg-surface-variant/30'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-[20px]" 
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Profile & Actions */}
      <div className="mt-auto pt-4 space-y-4 border-t border-hairline">
        {/* User Card */}
        {user && (
          <div className="bg-surface-soft border border-hairline rounded-xl p-3 flex items-center gap-3 shadow-sm select-none">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-active flex items-center justify-center text-on-primary text-headline-md font-bold border border-primary/10 shadow shrink-0">
              {user.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-label-md text-label-md text-ink font-semibold truncate leading-none mb-[4px]">
                {user.nombreCompleto}
              </h4>
              <span className="inline-block font-label-sm text-[9px] bg-primary/10 text-primary px-[6px] py-[2px] rounded-full uppercase font-bold leading-none border border-primary/20">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Link 
            to="/admin/configuracion" 
            className="flex items-center gap-3 px-4 py-3 text-body-muted hover:text-ink hover:bg-surface-variant/30 transition-all rounded-xl font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Configuración
          </Link>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/30 transition-all rounded-xl font-label-md text-label-md cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
