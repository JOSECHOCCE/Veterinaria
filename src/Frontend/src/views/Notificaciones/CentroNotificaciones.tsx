import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificacionesService, { type NotificacionDto } from '../../services/notificaciones.service';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'sonner';

export default function CentroNotificaciones() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificacionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Todas' | 'NoLeidas' | 'Criticas'>('Todas');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificacionesService.getNotificaciones();
      if (res.success && res.data) {
        setNotifications(res.data.notificaciones || []);
        setUnreadCount(res.data.noLeidasCount || 0);
      } else {
        setError(res.message || 'Error al obtener las notificaciones.');
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Recargar notificaciones cuando cambia el conteo en tiempo real (por SignalR)
  useEffect(() => {
    fetchNotifications();
  }, [unreadCount]);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await notificacionesService.marcarLeida(id);
      if (res.success) {
        // Actualizar localmente
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        toast.success('Notificación marcada como leída');
      } else {
        toast.error(res.message || 'Error al marcar como leída');
      }
    } catch (err) {
      toast.error('Error de red al actualizar la notificación');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificacionesService.marcarTodasLeidas();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
        setUnreadCount(0);
        toast.success('Todas las notificaciones marcadas como leídas');
      } else {
        toast.error(res.message || 'Error al marcar todas como leídas');
      }
    } catch (err) {
      toast.error('Error de red al actualizar las notificaciones');
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta notificación?')) return;

    try {
      const res = await notificacionesService.eliminarNotificacion(id);
      if (res.success) {
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (deleted && !deleted.leida) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success('Notificación eliminada');
      } else {
        toast.error(res.message || 'Error al eliminar la notificación');
      }
    } catch (err) {
      toast.error('Error de red al eliminar la notificación');
    }
  };

  const handleNotificationClick = async (n: NotificacionDto) => {
    if (!n.leida) {
      await handleMarkAsRead(n.id);
    }
    if (n.urlAccion) {
      // Si la URL es relativa, navegar con react-router, si es externa usar window.location
      if (n.urlAccion.startsWith('http')) {
        window.location.href = n.urlAccion;
      } else {
        navigate(n.urlAccion);
      }
    }
  };

  // Helper para estilos e iconos
  const getIconDetails = (tipo: string, customIcon?: string | null) => {
    let iconName = customIcon || 'info';
    let containerClass = 'bg-surface-dim text-ink border border-hairline';

    if (!customIcon) {
      switch (tipo) {
        case 'Success':
          iconName = 'check_circle';
          break;
        case 'Warning':
          iconName = 'warning';
          break;
        case 'Error':
          iconName = 'error';
          break;
        default:
          iconName = 'info';
      }
    }

    switch (tipo) {
      case 'Success':
        containerClass = 'bg-tertiary-container text-tertiary border border-tertiary/20';
        break;
      case 'Warning':
      case 'Error':
        containerClass = 'bg-error-container text-error border border-error/20';
        break;
      default:
        containerClass = 'bg-surface-dim text-ink border border-hairline';
    }

    return { iconName, containerClass };
  };

  const getActionLinkText = (url?: string | null) => {
    if (!url) return '';
    if (url.includes('/mascotas') || url.includes('/historial')) return 'Ver ficha médica';
    if (url.includes('/agenda') || url.includes('/citas') || url.includes('/mi-agenda')) return 'Ver agenda';
    if (url.includes('/pagos') || url.includes('/cobros')) return 'Ver pagos';
    if (url.includes('/atencion')) return 'Ver consulta';
    return 'Ver detalle';
  };

  // Filtrado de notificaciones según pestaña activa
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'NoLeidas') return !n.leida;
    if (activeTab === 'Criticas') return n.tipo === 'Error' || n.tipo === 'Warning';
    return true; // 'Todas'
  });

  const totalCount = notifications.length;
  const unreadTabCount = notifications.filter((n) => !n.leida).length;
  const criticalCount = notifications.filter((n) => n.tipo === 'Error' || n.tipo === 'Warning').length;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4 max-w-4xl mx-auto">
        <div className="h-16 bg-surface-card rounded-lg w-full"></div>
        <div className="h-12 bg-surface-card/60 rounded-md w-3/4"></div>
        <div className="space-y-4 mt-6">
          <div className="h-24 bg-surface-card rounded-xl w-full"></div>
          <div className="h-24 bg-surface-card rounded-xl w-full"></div>
          <div className="h-24 bg-surface-card rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-8 pb-12 select-none">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-hairline pb-6">
        <div>
          <h2 className="font-display-lg text-display-lg text-ink tracking-tight">Centro de Notificaciones</h2>
          <p className="font-body-md text-body-md text-body-muted mt-2 max-w-2xl">
            Mantente al día con las alertas clínicas, actualizaciones de agenda y mensajes del equipo.
          </p>
        </div>
        {unreadTabCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center justify-center gap-2 border border-outline text-ink bg-transparent hover:bg-surface-card rounded-full px-5 py-2.5 font-button text-button transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Marcar todas como leídas
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-hairline -mt-4">
        <button
          onClick={() => setActiveTab('Todas')}
          className={`relative pb-3 font-nav-link text-nav-link transition-all cursor-pointer ${
            activeTab === 'Todas' ? 'text-primary font-bold' : 'text-body-muted hover:text-ink'
          }`}
        >
          Todas ({totalCount})
          {activeTab === 'Todas' && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('NoLeidas')}
          className={`relative pb-3 font-nav-link text-nav-link transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'NoLeidas' ? 'text-primary font-bold' : 'text-body-muted hover:text-ink'
          }`}
        >
          No leídas
          {unreadTabCount > 0 && (
            <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
              {unreadTabCount}
            </span>
          )}
          {activeTab === 'NoLeidas' && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('Criticas')}
          className={`relative pb-3 font-nav-link text-nav-link transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'Criticas' ? 'text-primary font-bold' : 'text-body-muted hover:text-ink'
          }`}
        >
          Críticas
          {criticalCount > 0 && (
            <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
              {criticalCount}
            </span>
          )}
          {activeTab === 'Criticas' && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-[36px] text-error">error</span>
          <p className="font-body-md">{error}</p>
          <button
            onClick={fetchNotifications}
            className="bg-error text-on-error font-button text-button px-5 py-2 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Notifications List */}
      {!error && (
        <div className="flex flex-col gap-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-surface-soft/40 border border-hairline rounded-xl flex flex-col items-center justify-center gap-3 text-body-muted">
              <span className="material-symbols-outlined text-[48px] text-secondary">notifications_off</span>
              <p className="font-body-md font-medium">No tienes notificaciones en esta categoría.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const { iconName, containerClass } = getIconDetails(n.tipo, n.icono);
              const relativeTime = n.tiempoRelativo || n.fecha || new Date(n.fechaCreacion).toLocaleString();

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative flex gap-4 p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    !n.leida
                      ? 'bg-surface-card border-transparent hover:border-outline-variant hover:bg-surface-soft shadow-sm'
                      : 'bg-canvas border-hairline hover:border-outline-variant hover:bg-surface-soft'
                  }`}
                >
                  {/* Unread dot */}
                  {!n.leida && (
                    <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(143,72,47,0.4)]"></div>
                  )}

                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${containerClass}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {iconName}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col pr-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <h3 className={`font-title-md text-title-md ${!n.leida ? 'text-ink font-bold' : 'text-secondary font-medium'}`}>
                        {n.titulo}
                      </h3>
                      <span className="font-caption text-caption text-primary font-semibold whitespace-nowrap">
                        {relativeTime}
                      </span>
                    </div>

                    <p
                      className={`font-body-sm text-body-sm mt-2 max-w-2xl leading-relaxed ${
                        !n.leida ? 'text-body-strong font-medium' : 'text-body-muted'
                      }`}
                      dangerouslySetInnerHTML={{ __html: n.mensaje }}
                    />

                    {/* Action link & Delete button */}
                    <div className="mt-4 flex items-center justify-between gap-4">
                      {n.urlAccion ? (
                        <span className="inline-flex items-center gap-1 font-nav-link text-nav-link text-primary hover:text-primary-active transition-colors group-hover:underline">
                          <span>{getActionLinkText(n.urlAccion)}</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </span>
                      ) : (
                        <div />
                      )}

                      <div className="flex gap-2">
                        {!n.leida && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="text-[12px] font-semibold text-primary hover:text-primary-active bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full transition-all cursor-pointer"
                            title="Marcar como leída"
                          >
                            Leída
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          className="text-[12px] font-semibold text-error hover:text-on-error hover:bg-error px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 border border-transparent hover:border-error/20"
                          title="Eliminar notificación"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
