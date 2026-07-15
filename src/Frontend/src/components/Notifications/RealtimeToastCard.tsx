import React from 'react';
import { toast } from 'sonner';

export interface ServerNotification {
  id?: number;
  titulo?: string;
  mensaje?: string;
  tipo?: string; // Info | Success | Warning | Error
  icono?: string;
  urlAccion?: string;
  fecha?: string;
}

interface RealtimeToastCardProps {
  toastId: string | number;
  notification: ServerNotification;
}

export default function RealtimeToastCard({ toastId, notification }: RealtimeToastCardProps) {
  const titulo = notification?.titulo || 'Nueva Notificación';
  const mensaje = notification?.mensaje || '';
  const url = notification?.urlAccion;

  const isCobro = titulo.toLowerCase().includes('cobro') || titulo.toLowerCase().includes('atención finalizada') || url?.includes('/pagos/registrar/');

  const handleAceptar = () => {
    toast.dismiss(toastId);
    if (url) {
      let targetUrl = url;
      // Si es un cobro o tiene URL de registro de cobro/pagos y falta autofill, lo añadimos
      if (targetUrl.includes('/admin/pagos/registrar/') && !targetUrl.includes('autofill=')) {
        targetUrl += targetUrl.includes('?') ? '&autofill=true' : '?autofill=true';
      }
      window.location.href = targetUrl;
    }
  };

  const handleDetalles = () => {
    toast.dismiss(toastId);
    const isClient = window.location.pathname.startsWith('/cliente');
    if (url?.includes('/admin/pagos/registrar/')) {
      const match = url.match(/\/registrar\/(\d+)/);
      if (match) {
        window.location.href = `/admin/atencion/${match[1]}`;
        return;
      }
    }
    window.location.href = isClient ? '/cliente/notificaciones' : '/admin/notificaciones';
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-card border-2 border-primary/40 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto select-none overflow-hidden relative transition-all">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-amber-500" />
      
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
            isCobro ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/15 text-primary'
          }`}>
            <i className={`bi ${notification?.icono || (isCobro ? 'bi-cash-coin' : 'bi-bell-fill')} text-xl`} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h4 className="font-title-sm font-extrabold text-ink leading-tight">{titulo}</h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                Tiempo Real
              </span>
            </div>
            <span className="text-[11px] text-secondary font-medium">Hace unos instantes</span>
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(toastId)}
          className="text-secondary hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-soft cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <p className="font-body-sm text-secondary text-xs leading-relaxed pl-14">{mensaje}</p>

      {/* Acciones: Detalles y Aceptar */}
      <div className="flex items-center justify-end gap-2.5 mt-1 pt-3 border-t border-hairline/60">
        <button
          onClick={handleDetalles}
          className="px-3.5 py-2 rounded-xl border border-hairline bg-canvas/80 hover:bg-canvas text-xs font-bold text-secondary hover:text-ink transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <i className="bi bi-info-circle text-[14px]" />
          Detalles
        </button>
        {url && (
          <button
            onClick={handleAceptar}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="bi bi-arrow-right-circle-fill text-[15px]" />
            Aceptar
          </button>
        )}
      </div>
    </div>
  );
}
