import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import Logo from './Logo';

// SVG íconos inline — sin dependencia de Material Symbols
const Icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75v-4.5h-4.5V21a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 21V9.75z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  ),
  queue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
    </svg>
  ),
  person: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  pets: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8.5 13c-2 0-5.5 1.2-5.5 3.5V18h18v-1.5c0-2.3-3.5-3.5-5.5-3.5-.4 0-.8 0-1.2.1a5.5 5.5 0 0 0-4.6 0C9.3 13 8.9 13 8.5 13z" />
    </svg>
  ),
  medical: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  ),
  payments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5z" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" />
    </svg>
  ),
  badge: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  ),
};

type IconKey = keyof typeof Icons;

interface MenuItem {
  name: string;
  icon: IconKey;
  path: string;
}

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  let menuItems: MenuItem[] = [];

  if (user?.role === 'Admin') {
    menuItems = [
      { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Agenda Operativa', icon: 'calendar', path: '/admin/agenda' },
      { name: 'Cola de Atención', icon: 'queue', path: '/admin/cola' },
      { name: 'Directorio Clientes', icon: 'person', path: '/admin/clientes' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
      { name: 'Servicios', icon: 'medical', path: '/admin/servicios' },
      { name: 'Pagos y Cobros', icon: 'payments', path: '/admin/pagos' },
      { name: 'Reportes e Ingresos', icon: 'analytics', path: '/admin/reportes' },
      { name: 'Gestión Usuarios', icon: 'badge', path: '/admin/usuarios' },
    ];
  } else if (user?.role === 'Recepcionista') {
    menuItems = [
      { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Agenda Operativa', icon: 'calendar', path: '/admin/agenda' },
      { name: 'Cola de Atención', icon: 'queue', path: '/admin/cola' },
      { name: 'Directorio Clientes', icon: 'person', path: '/admin/clientes' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
      { name: 'Pagos y Cobros', icon: 'payments', path: '/admin/pagos' },
    ];
  } else if (user?.role === 'Veterinario') {
    menuItems = [
      { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Mi Agenda', icon: 'calendar', path: '/admin/mi-agenda' },
      { name: 'Cola de Atención', icon: 'queue', path: '/admin/cola' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
    ];
  }

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-72 pt-6 pb-6 px-4 bg-surface-card border-r border-hairline z-30 shadow-sm overflow-hidden select-none">

      {/* Logo */}
      <div className="mb-6 px-3">
        <Logo />
      </div>

      {/* Menú dinámico */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/admin/dashboard' && location.pathname === '/admin');
          return (
            <Link key={item.path} to={item.path} className="relative block">
              {isActive && (
                <motion.div
                  layoutId="activeMenu"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/25 shadow-inner"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div
                className={`relative z-10 flex items-center gap-3 px-4 py-[10px] rounded-xl transition-all ${isActive
                    ? 'text-primary font-bold'
                    : 'text-body-muted hover:text-ink hover:bg-surface-variant/30'
                  }`}
              >
                {Icons[item.icon]}
                <span className="font-label-md text-label-md">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer — perfil + acciones */}
      <div className="mt-auto pt-4 space-y-3 border-t border-hairline">
        {user && (
          <div className="bg-surface-soft border border-hairline rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-active flex items-center justify-center text-on-primary text-headline-md font-bold border border-primary/10 shadow shrink-0">
              {user.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-label-md text-label-md text-ink font-semibold truncate leading-none mb-1">
                {user.nombreCompleto}
              </h4>
              <span className="inline-block text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold border border-primary/20">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/30 transition-all rounded-xl cursor-pointer text-left"
          >
            {Icons.logout}
            <span className="font-label-md text-label-md">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </nav>
  );
}