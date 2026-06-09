import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import notificacionesService, { type NotificacionDto, mapBootstrapIconToMaterial } from '../../services/notificaciones.service';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface GreetingModalProps {
  onClose: () => void;
}

export default function GreetingModal({ onClose }: GreetingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recientes, setRecientes] = useState<NotificacionDto[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si ya se mostró en esta sesión
    const hasShown = sessionStorage.getItem('greeting_shown');
    if (hasShown) {
      onClose();
      return;
    }

    const fetchData = async () => {
      try {
        const countRes = await notificacionesService.getNoLeidasCount();
        if (countRes.success) {
          const count = countRes.data.count;
          setUnreadCount(count);
          
          if (count > 0) {
            const listRes = await notificacionesService.getRecientes();
            if (listRes.success) {
              setRecientes(listRes.data?.notificaciones || []);
            }
            setIsVisible(true);
            sessionStorage.setItem('greeting_shown', 'true');
          } else {
            // No hay notificaciones, no mostramos el modal
            sessionStorage.setItem('greeting_shown', 'true');
            onClose();
          }
        }
      } catch (error) {
        console.error("Error al cargar notificaciones de bienvenida", error);
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onClose]);

  if (!isVisible || loading) return null;

  return createPortal(
    <div className="premium-modal-overlay animate-modal-fade-in" onClick={onClose}>
      <div className="premium-modal-card animate-modal-scale-in max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
              {user?.nombreCompleto?.charAt(0).toUpperCase() || 'H'}
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg text-ink font-bold leading-tight">
                ¡Hola, {user?.nombreCompleto?.split(' ')[0] || 'Usuario'}!
              </h2>
              <p className="text-body-sm text-body-muted">
                Bienvenido nuevamente a tu portal
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-5">
            <h3 className="font-title-md text-title-md text-ink font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
              Tienes {unreadCount} {unreadCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
            </h3>
            <p className="text-body-sm text-body-muted mb-3">
              Aquí tienes un resumen de lo último que ha ocurrido:
            </p>
            
            <ul className="space-y-3">
              {recientes.slice(0, 3).map((notif) => (
                <li key={notif.id} className="flex gap-3 items-start">
                  <div className={`mt-0.5 rounded-full p-1 
                    ${notif.tipo === 'Success' ? 'bg-emerald-100 text-emerald-600' : 
                      notif.tipo === 'Warning' ? 'bg-amber-100 text-amber-600' : 
                      notif.tipo === 'Error' ? 'bg-red-100 text-red-600' : 
                      'bg-blue-100 text-blue-600'}`}
                  >
                    <span className="material-symbols-outlined text-[16px] block">
                      {mapBootstrapIconToMaterial(notif.icono)}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-sm font-bold text-ink leading-tight">{notif.titulo}</p>
                    <p className="text-[12px] text-body-muted line-clamp-1">{notif.mensaje}</p>
                  </div>
                </li>
              ))}
            </ul>
            {unreadCount > 3 && (
              <p className="text-[12px] text-primary font-bold mt-3 text-center cursor-pointer hover:underline" onClick={() => {
                onClose();
                navigate(user?.role === 'Cliente' ? '/cliente/notificaciones' : '/admin/notificaciones');
              }}>
                Ver las {unreadCount - 3} notificaciones restantes...
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-active text-on-primary font-bold py-3 rounded-full font-button text-button transition-all cursor-pointer shadow-md"
          >
            Continuar al Dashboard
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
