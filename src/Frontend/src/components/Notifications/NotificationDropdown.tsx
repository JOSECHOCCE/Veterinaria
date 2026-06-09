import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { type NotificacionDto, mapBootstrapIconToMaterial } from '../../services/notificaciones.service';
import { useAuth } from '../../context/AuthContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notificaciones: NotificacionDto[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: number) => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  notificaciones,
  onMarkAllAsRead,
  onMarkAsRead
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleVerTodas = () => {
    onClose();
    navigate(user?.role === 'Cliente' ? '/cliente/notificaciones' : '/admin/notificaciones');
  };

  const handleNotificationClick = (n: NotificacionDto) => {
    if (!n.leida) {
      onMarkAsRead(n.id);
    }
    if (n.urlAccion) {
      onClose();
      navigate(n.urlAccion);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-14 right-0 w-[350px] bg-canvas border border-hairline shadow-xl rounded-2xl overflow-hidden z-50 flex flex-col"
        >
          <div className="p-4 border-b border-hairline bg-surface-soft flex justify-between items-center">
            <h3 className="font-title-sm text-title-sm text-ink font-bold">Notificaciones</h3>
            {notificaciones.some(n => !n.leida) && (
              <button 
                onClick={onMarkAllAsRead}
                className="text-[12px] text-primary hover:text-primary-active font-bold cursor-pointer transition-colors"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-6 text-center text-body-muted flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] opacity-50">notifications_paused</span>
                <p className="text-body-sm">No tienes notificaciones recientes.</p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {notificaciones.map((n) => (
                  <li 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 hover:bg-surface-soft transition-colors cursor-pointer flex gap-3 ${!n.leida ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                      ${n.tipo === 'Success' ? 'bg-emerald-100 text-emerald-600' : 
                        n.tipo === 'Warning' ? 'bg-amber-100 text-amber-600' : 
                        n.tipo === 'Error' ? 'bg-red-100 text-red-600' : 
                        'bg-blue-100 text-blue-600'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {mapBootstrapIconToMaterial(n.icono)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-body-sm leading-tight ${!n.leida ? 'font-bold text-ink' : 'font-medium text-ink/80'}`}>
                          {n.titulo}
                        </p>
                        {!n.leida && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>}
                      </div>
                      <p className={`text-[12px] mt-1 line-clamp-2 ${!n.leida ? 'text-body-muted' : 'text-body-muted/70'}`}>
                        {n.mensaje}
                      </p>
                      <p className="text-[11px] text-body-muted/60 mt-2 font-medium">
                        {n.tiempoRelativo || n.fechaCreacion.split('T')[0]}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3 border-t border-hairline bg-surface-card text-center">
            <button 
              onClick={handleVerTodas}
              className="text-body-sm font-bold text-ink hover:text-primary transition-colors cursor-pointer w-full"
            >
              Ver todo el centro de notificaciones
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
