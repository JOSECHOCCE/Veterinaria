import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { name: 'Agenda', icon: 'calendar_today', path: '/admin/agenda' },
    { name: 'Cola de Atención', icon: 'pending_actions', path: '/admin/cola' },
    { name: 'Clientes', icon: 'person', path: '/admin/clientes' },
    { name: 'Mascotas', icon: 'pets', path: '/admin/mascotas' },
    { name: 'Servicios', icon: 'medical_services', path: '/admin/servicios' },
    { name: 'Pagos', icon: 'payments', path: '/admin/pagos' },
    { name: 'Reportes e Ingresos', icon: 'analytics', path: '/admin/reportes' },
  ];

  if (user?.role === 'Admin') {
    menuItems.push(
      { name: 'Usuarios', icon: 'group', path: '/admin/usuarios' },
      { name: 'Auditoría', icon: 'policy', path: '/admin/auditoria' }
    );
  }

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 pt-20 pb-6 px-md bg-surface-container-low/70 backdrop-blur-lg border-r border-outline-variant/20 z-30 shadow-md">
      {/* Branding */}
      <div className="mb-xl px-sm flex flex-col gap-xs">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
            <span className="material-symbols-outlined font-semibold text-[22px]">pets</span>
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md font-bold tracking-tight text-on-surface">VetCare Pro</h1>
            <p className="font-label-sm text-label-sm text-outline-variant tracking-wider uppercase font-semibold">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <div className="flex-1 space-y-xs overflow-y-auto">
        {menuItems.map((item) => {
          // Si estamos en la raíz (index), marcar dashboard como activo
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
                className={`relative z-10 flex items-center gap-sm px-md py-sm rounded-xl font-label-md text-label-md transition-all ${
                  isActive 
                    ? 'text-primary font-bold shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-[22px]" 
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
      <div className="mt-auto pt-md space-y-md border-t border-outline-variant/30">
        {/* User Card */}
        {user && (
          <div className="bg-surface-container-high/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-sm flex items-center gap-sm shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary text-headline-md font-bold border border-primary/10 shadow">
              {user.nombreCompleto ? user.nombreCompleto.charAt(0) : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-label-md text-label-md text-on-surface font-semibold truncate leading-none mb-[2px]">
                {user.nombreCompleto}
              </h4>
              <span className="inline-block font-label-sm text-[10px] bg-secondary-container text-on-secondary-container px-[6px] py-[1px] rounded-full uppercase font-bold leading-none">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-xs">
          <Link 
            to="/admin/configuracion" 
            className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all rounded-xl font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Configuración
          </Link>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-sm px-md py-sm text-error hover:bg-error-container/30 transition-all rounded-xl font-label-md text-label-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
