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

  return (
    <header className="fixed top-6 right-8 z-40 flex items-center gap-2 px-3 py-2 bg-canvas/70 backdrop-blur-xl border border-hairline shadow-md rounded-full select-none">
      {/* Campana de Notificaciones en Tiempo Real */}
      <div className="relative">
        <motion.button
          animate={shouldAnimate ? "wiggle" : "idle"}
          variants={bellVariants}
          onClick={handleToggleDropdown}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-soft hover:bg-surface-card hover:text-primary transition-all text-secondary relative cursor-pointer shadow-sm border border-transparent hover:border-hairline"
          title={`${unreadCount} notificaciones no leídas - Haz clic para ver notificaciones`}
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 bg-error text-white text-[9px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center border border-canvas shadow-sm leading-none transform translate-x-1/4 -translate-y-1/4"
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
        className="w-10 h-10 flex items-center justify-center rounded-full bg-error/10 hover:bg-error/20 text-error transition-all cursor-pointer shadow-sm border border-transparent"
        title="Ingresar Emergencia (Triage)"
      >
        <span className="material-symbols-outlined text-[22px]">medical_services</span>
      </button>

      {/* Perfil del Usuario / Mi Cuenta */}
      <button
        onClick={() => navigate('/admin/configuracion')}
        className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-body-sm font-bold shadow-sm hover:bg-primary/20 transition-all cursor-pointer"
        title="Mi Cuenta (Configuración)"
      >
        {user?.nombreCompleto ? (
          user.nombreCompleto.charAt(0).toUpperCase()
        ) : (
          <span className="material-symbols-outlined text-[22px]">person</span>
        )}
      </button>
    </header>
  );
}
