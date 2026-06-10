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
      // Aquí puedes implementar la lógica de búsqueda global
      console.log('Buscando:', searchQuery);
      // Por ejemplo: navigate(`/admin/buscar?q=${searchQuery}`);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-72 z-50 flex items-center justify-between gap-4 px-6 py-3 bg-canvas border-b border-hairline shadow-sm">
      {/* Barra de Búsqueda Global */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar clientes, mascotas, citas..."
            className="w-full bg-surface-soft border border-hairline rounded-lg pl-10 pr-4 py-2 font-body-sm text-body-sm text-ink placeholder:text-body-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
      </form>

      {/* Iconos de Acción */}
      <div className="flex items-center gap-2">
        {/* Campana de Notificaciones en Tiempo Real */}
        <div className="relative">
          <motion.button
            animate={shouldAnimate ? "wiggle" : "idle"}
            variants={bellVariants}
            onClick={handleToggleDropdown}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent hover:bg-surface-soft hover:text-primary transition-all text-body-muted relative cursor-pointer"
            title={`${unreadCount} notificaciones no leídas - Haz clic para ver notificaciones`}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-error text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-canvas shadow-sm leading-none"
              >
                {unreadCount}
              </motion.span>
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

        {/* Botón de Emergencia / Triage */}
        <button
          onClick={() => navigate('/admin/triage')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent hover:bg-error/10 text-body-muted hover:text-error transition-all cursor-pointer"
          title="Ingresar Emergencia (Triage)"
        >
          <span className="material-symbols-outlined text-[20px]">medical_services</span>
        </button>

        {/* Perfil del Usuario / Mi Cuenta */}
        <button
          onClick={() => navigate('/admin/configuracion')}
          className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer"
          title="Mi Cuenta (Configuración)"
        >
          {user?.nombreCompleto ? (
            user.nombreCompleto.charAt(0).toUpperCase()
          ) : (
            <span className="material-symbols-outlined text-[20px]">person</span>
          )}
        </button>
      </div>
    </header>
  );
}
