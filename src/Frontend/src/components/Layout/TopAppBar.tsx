import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import notificacionesService from '../../services/notificaciones.service';
import type { NotificacionDto } from '../../services/notificaciones.service';

export default function TopAppBar() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount } = useNotifications();
  const { user } = useAuth();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Gatillo de animación de sacudida cuando llega una nueva notificación
  useEffect(() => {
    if (unreadCount > 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const bellVariants = {
    idle: { rotate: 0 },
    wiggle: {
      rotate: [0, -18, 15, -15, 12, -10, 8, -4, 4, 0],
      transition: { duration: 0.6 }
    }
  };

  const handleToggleDropdown = async () => {
    if (!isDropdownOpen) {
      // Cargar notificaciones al abrir
      try {
        const res = await notificacionesService.getRecientes();
        if (res.success) {
          setNotificaciones(res.data?.notificaciones || []);
        }
        if (unreadCount > 0) {
          await notificacionesService.marcarTodasLeidas();
          setUnreadCount(0);
        }
      } catch (err) {
        console.error("Error al cargar notificaciones", err);
      }
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      setUnreadCount(0);
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (err) {
      console.error("Error al marcar todas como leídas", err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificacionesService.marcarLeida(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (err) {
      console.error("Error al marcar como leída", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Buscando:', searchQuery);
    }
  };

  return (
    <header className="w-full top-0 sticky z-10 bg-surface shadow-sm shadow-[0_4px_20px_rgba(79,209,197,0.08)]">
      <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
        <div className="flex-1 flex items-center">
          {/* Barra de Búsqueda Global */}
          <form onSubmit={handleSearch} className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant transition-all outline-none"
            />
          </form>
        </div>

        {/* Iconos de Acción */}
        <div className="flex items-center gap-4">
          {/* Campana de Notificaciones en Tiempo Real */}
          <div className="relative">
            <motion.button
              animate={shouldAnimate ? "wiggle" : "idle"}
              variants={bellVariants}
              onClick={handleToggleDropdown}
              className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all duration-300 scale-95 active:scale-90 flex items-center justify-center cursor-pointer relative"
              title={`${unreadCount} notificaciones no leídas`}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-error text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-surface shadow-sm leading-none">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <NotificationDropdown 
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              notificaciones={notificaciones}
              onMarkAllAsRead={handleMarkAllAsRead}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>

          {/* Botón de Configuración */}
          <button
            onClick={() => navigate('/admin/configuracion')}
            className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all duration-300 scale-95 active:scale-90 flex items-center justify-center cursor-pointer"
            title="Configuración"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          {/* Botón de Ayuda / Triage */}
          <button
            onClick={() => navigate('/admin/triage')}
            className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all duration-300 scale-95 active:scale-90 flex items-center justify-center cursor-pointer"
            title="Ayuda / Triage"
          >
            <span className="material-symbols-outlined">help</span>
          </button>

          {/* Perfil del Usuario / Mi Cuenta */}
          <div 
            onClick={() => navigate('/admin/configuracion')}
            className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 ml-2 cursor-pointer bg-surface-container shadow-sm flex items-center justify-center text-xs font-bold text-primary"
            title="Mi Cuenta"
          >
            {user?.nombreCompleto ? (
              <img 
                alt="Veterinary staff avatar" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuChAiJN4WBY9Z0-_W4WtNnH3TrvHvc3F4vDGHBQz9pfPZAidK-Ku06iVKsQg6FD1BzOiTqfG6xbGvk1Ro6U4mNkRTfWlDaMgp9QlXfSGqZvrhDZ0h2CEuuLz05R_5RgIm2Z8gjsHuzixh52Jn65Wtv3G2grmU_1GNuztQQbYTYVt7cu7I9uTA0cmL-RFK0f6DMn20neAiaK3J2tBgkAxT0m-BjtHXm5MeOHpyhMkUkQVFE4otbUiU22Cg"
              />
            ) : (
              <span className="material-symbols-outlined text-[18px]">person</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
