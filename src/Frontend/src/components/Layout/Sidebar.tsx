import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  name: string;
  icon: string;
  path: string;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ isCollapsed: externalCollapsed, onToggleCollapse }: SidebarProps = {}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const getMenuItems = (): MenuItem[] => {
    const role = user?.role;
    if (role === 'Cliente') {
      return [
        { name: 'Portal Cliente', icon: 'dashboard', path: '/cliente/portal' },
        { name: 'Mis Mascotas', icon: 'pets', path: '/cliente/mis-mascotas' },
        { name: 'Mis Citas', icon: 'calendar', path: '/cliente/mis-citas' },
        { name: 'Mis Pagos', icon: 'payments', path: '/cliente/mis-pagos' },
        { name: 'Mi Perfil', icon: 'person', path: '/cliente/mi-perfil' },
      ];
    }
    const adminItems: MenuItem[] = [
      { name: 'Panel de Control', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Agenda & Citas', icon: 'calendar', path: '/admin/agenda' },
      { name: 'Triaje & Espera', icon: 'queue', path: '/admin/triaje' },
      { name: 'Clientes & Mascotas', icon: 'person', path: '/admin/clientes' },
      { name: 'Consulta Clínicas', icon: 'medical', path: '/admin/atencion' },
      { name: 'Inventario & Botica', icon: 'pets', path: '/admin/productos' },
      { name: 'Ventas (POS)', icon: 'payments', path: '/admin/ventas' },
      { name: 'Caja & Cobros', icon: 'payments', path: '/admin/pagos' },
      { name: 'Reportes', icon: 'analytics', path: '/admin/reportes' },
      { name: 'Configuración', icon: 'settings', path: '/admin/configuracion' },
    ];
    if (role === 'Veterinario' || role === 'Operador') {
      return adminItems.filter(item => item.path !== '/admin/configuracion');
    }
    return adminItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-container-low border-b border-outline-variant/30 fixed top-0 left-0 right-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
          </div>
          <span className="font-bold text-primary text-base">VetCarePro</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high border-none bg-transparent cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <span className="material-symbols-outlined text-2xl">{isMobileOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar & Mobile Drawer */}
      <aside className={`flex flex-col h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/30 z-50 transition-all duration-300 ease-in-out select-none ${
        isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 ' + (isCollapsed ? 'w-20' : 'w-64')
      }`}>
        <div className="p-gutter flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar pt-16 md:pt-4">
          {/* Logo Header & Collapse Toggle (Desktop) */}
          <div className="hidden md:flex items-center justify-between mb-5 px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
              </div>
              {!isCollapsed && (
                <div className="transition-opacity duration-200">
                  <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">VetCarePro</h1>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 leading-none">Gestión Veterinaria</p>
                </div>
              )}
            </div>
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high border-none bg-transparent cursor-pointer shrink-0"
              title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              <span className="material-symbols-outlined text-xl">
                {isCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === '/admin/dashboard' && location.pathname === '/admin');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                  className={`rounded-xl my-0.5 px-3 py-2.5 flex items-center gap-3 transition-all duration-200 ease-in-out ${
                    isCollapsed ? 'justify-center mx-1.5' : 'mx-2'
                  } ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl shrink-0" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {item.icon === 'dashboard' ? 'dashboard' :
                     item.icon === 'calendar' ? 'calendar_today' :
                     item.icon === 'queue' ? 'queue' :
                     item.icon === 'person' ? 'group' :
                     item.icon === 'pets' ? 'pets' :
                     item.icon === 'medical' ? 'medical_services' :
                     item.icon === 'payments' ? 'payments' :
                     item.icon === 'analytics' ? 'analytics' :
                     item.icon === 'settings' ? 'settings' :
                     'badge'}
                  </span>
                  {!isCollapsed && <span className="font-label-md text-label-md truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer - Cerrar Sesión */}
        <div className="mt-auto p-3 border-t border-outline-variant/30 bg-surface-container-low shrink-0">
          <button
            onClick={() => { setIsMobileOpen(false); logout(); }}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
            className={`w-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all duration-200 ease-in-out cursor-pointer border-none bg-transparent text-left ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <span className="material-symbols-outlined text-xl shrink-0">logout</span>
            {!isCollapsed && <span className="font-label-md text-label-md truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}