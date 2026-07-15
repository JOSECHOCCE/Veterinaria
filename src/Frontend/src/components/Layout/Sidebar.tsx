import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  name: string;
  icon: string;
  path: string;
}

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  let menuItems: MenuItem[] = [];

  if (user?.role === 'Admin') {
    menuItems = [
      { name: 'Agenda Operativa', icon: 'calendar', path: '/admin/agenda' },
      { name: 'Cola de Atención', icon: 'queue', path: '/admin/cola' },
      { name: 'Directorio Clientes', icon: 'person', path: '/admin/clientes' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
      { name: 'Servicios', icon: 'medical', path: '/admin/servicios' },
      { name: 'Pagos y Cobros', icon: 'payments', path: '/admin/pagos' },
      { name: 'Reportes e Ingresos', icon: 'analytics', path: '/admin/reportes' },
      { name: 'Gestión Usuarios', icon: 'badge', path: '/admin/usuarios' },
      { name: 'Configuración Horarios', icon: 'settings', path: '/admin/configuracion' },
    ];
  } else if (user?.role === 'Recepcionista') {
    menuItems = [
      { name: 'Panel Control', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Agenda Operativa', icon: 'calendar', path: '/admin/agenda' },
      { name: 'Cola de Atención', icon: 'queue', path: '/admin/cola' },
      { name: 'Directorio Clientes', icon: 'person', path: '/admin/clientes' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
      { name: 'Pagos y Cobros', icon: 'payments', path: '/admin/pagos' },
      { name: 'Configuración Horarios', icon: 'settings', path: '/admin/configuracion' },
    ];
  } else if (user?.role === 'Veterinario') {
    menuItems = [
      { name: 'Panel Control', icon: 'dashboard', path: '/admin/dashboard' },
      { name: 'Mi Agenda', icon: 'calendar', path: '/admin/mi-agenda' },
      { name: 'Cola de Atención', icon: 'queue', path: '/admin/cola' },
      { name: 'Expedientes Mascotas', icon: 'pets', path: '/admin/mascotas' },
    ];
  }

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/30 z-20 overflow-hidden select-none">
      <div className="p-gutter flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
        {/* Logo Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">VetCarePro</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 leading-none">Gestión Veterinaria</p>
          </div>
        </div>

        {/* CTA Nueva Cita */}
        <button className="w-full bg-primary text-on-primary rounded-lg h-12 flex items-center justify-center gap-2 mb-4 hover:bg-surface-tint transition-colors cursor-pointer border-none shadow-sm shrink-0">
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-md text-label-md">Nueva Cita</span>
        </button>

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
                className={`rounded-xl mx-2 my-1 px-4 py-2.5 flex items-center gap-3 transition-all duration-200 ease-in-out ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
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
                <span className="font-label-md text-label-md">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer - Cerrar Sesión */}
      <div className="mt-auto p-4 border-t border-outline-variant/30 bg-surface-container-low shrink-0">
        <button
          onClick={logout}
          className="w-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all duration-200 ease-in-out cursor-pointer border-none bg-transparent text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}