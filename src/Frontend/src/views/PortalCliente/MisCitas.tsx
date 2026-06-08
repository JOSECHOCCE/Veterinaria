import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalClienteService from '../../services/portalCliente.service';
import { motion, AnimatePresence } from 'framer-motion';

interface Cita {
  id: number;
  fechaHora: string;
  mascotaNombre: string;
  servicioNombre: string;
  veterinarioNombre: string;
  estado: string;
  montoTotal: number;
  montoPagado: number;
}

export default function MisCitas() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation State
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PortalClienteService.getMisCitas();
      if (res.success && res.data) {
        setCitas(res.data);
      } else {
        setError(res.message || 'Error al cargar el historial de citas.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, []);

  const handleOpenCancelModal = (id: number) => {
    setCancellingId(id);
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancellingId(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    try {
      setSubmittingCancel(true);
      setCancelError(null);
      const res = await PortalClienteService.cancelarCita(cancellingId);
      if (res.success) {
        handleCloseCancelModal();
        fetchCitas();
      } else {
        setCancelError(res.message || 'No se pudo cancelar la cita.');
      }
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Error al procesar la cancelación.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Helper de badge de estado y color
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PendienteConfirmacion':
        return {
          text: 'Por Confirmar',
          classes: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: 'pending'
        };
      case 'PendienteAsignacion':
        return {
          text: 'Pendiente Médico',
          classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: 'person_search'
        };
      case 'Confirmada':
        return {
          text: 'Confirmada',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: 'check_circle'
        };
      case 'EnEspera':
        return {
          text: 'En Sala de Espera',
          classes: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: 'hourglass_empty'
        };
      case 'EnAtencion':
        return {
          text: 'En Consulta',
          classes: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: 'medical_services'
        };
      case 'Completada':
        return {
          text: 'Completada',
          classes: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: 'task_alt'
        };
      case 'Cancelada':
        return {
          text: 'Cancelada',
          classes: 'bg-red-100 text-red-800 border-red-200',
          icon: 'cancel'
        };
      case 'Rechazada':
        return {
          text: 'Rechazada',
          classes: 'bg-red-100 text-red-800 border-red-200',
          icon: 'block'
        };
      case 'NoAsistio':
        return {
          text: 'No Asistió',
          classes: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: 'person_off'
        };
      case 'Reprogramada':
        return {
          text: 'Reprogramada',
          classes: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          icon: 'update'
        };
      default:
        return {
          text: estado,
          classes: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: 'info'
        };
    }
  };

  // Validación de la regla de negocio (cancelable con >= 2 horas de anticipación)
  const isCancelable = (fechaHoraStr: string, estado: string) => {
    // Solo se cancelan citas activas
    if (estado !== 'Confirmada' && estado !== 'PendienteConfirmacion' && estado !== 'PendienteAsignacion' && estado !== 'Reprogramada') {
      return false;
    }

    const citaTime = new Date(fechaHoraStr).getTime();
    const nowTime = new Date().getTime();
    const diffHours = (citaTime - nowTime) / (1000 * 60 * 60);

    return diffHours >= 2;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-20 bg-surface-card rounded-lg w-full"></div>
        <div className="h-24 bg-surface-card rounded-lg w-full mt-4"></div>
        <div className="h-24 bg-surface-card rounded-lg w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Error al cargar citas</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={fetchCitas}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="font-display-lg text-display-lg text-ink">Mis Citas</h2>
          <p className="font-body-md text-body-md text-body-muted mt-1 max-w-2xl">
            Lleva el control de tus citas programadas, revisa el estado de tus solicitudes y cancela reservas si lo necesitas.
          </p>
        </div>
        <button
          onClick={() => navigate('/cliente/nueva-cita')}
          className="bg-primary hover:bg-primary-active text-on-primary font-button text-button py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 whitespace-nowrap self-start md:self-auto shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          Reservar Nueva Cita
        </button>
      </header>

      {/* Listado de Citas */}
      {citas.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-xl flex flex-col items-center justify-center p-12 bg-canvas/30 text-center">
          <span className="material-symbols-outlined text-[48px] text-body-muted mb-3">calendar_month</span>
          <h3 className="font-title-md text-title-md font-bold text-ink">No se encontraron citas</h3>
          <p className="font-body-sm text-body-sm text-body-muted mt-1 max-w-md">
            No tienes un historial de citas registrado en esta cuenta. Haz clic en el botón de reservar para agendar tu primera visita.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {citas.map((cita) => {
            const badge = getEstadoBadge(cita.estado);
            const cancelable = isCancelable(cita.fechaHora, cita.estado);
            
            return (
              <div
                key={cita.id}
                className="bg-surface-card rounded-xl p-5 border border-hairline flex flex-col lg:flex-row justify-between lg:items-center gap-4 hover:shadow-sm transition-shadow relative overflow-hidden"
              >
                {/* Visual state line left */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  cita.estado === 'Confirmada' ? 'bg-success' : 
                  cita.estado === 'Cancelada' || cita.estado === 'Rechazada' ? 'bg-error' : 'bg-primary'
                }`}></div>

                {/* Left: Info */}
                <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-start pl-2">
                  {/* Date Badge */}
                  <div className="bg-canvas border border-hairline p-3 rounded-lg flex flex-col items-center justify-center min-w-[70px] text-center shadow-inner">
                    <span className="font-caption-uppercase text-[10px] text-body-muted uppercase font-bold">
                      {new Date(cita.fechaHora).toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="font-display-md text-display-md leading-none text-ink font-bold mt-1">
                      {new Date(cita.fechaHora).getDate()}
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-title-lg text-title-lg text-ink font-bold leading-tight">
                        {cita.servicioNombre}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 uppercase ${badge.classes}`}>
                        <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                        {badge.text}
                      </span>
                    </div>
                    
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-body-sm text-body-muted mt-2">
                      <li className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-body-muted">pets</span>
                        <span>Mascota: <strong className="text-ink">{cita.mascotaNombre}</strong></span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-body-muted">person</span>
                        <span>Veterinario: <strong className="text-ink">{cita.veterinarioNombre}</strong></span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-body-muted">schedule</span>
                        <span>Hora: <strong className="text-ink">{formatTime(cita.fechaHora)}</strong></span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-body-muted">payments</span>
                        <span>Pago: <strong className="text-ink">
                          {cita.montoPagado >= cita.montoTotal && cita.montoTotal > 0 ? 'Pagado' : `S/. ${cita.montoPagado} / S/. ${cita.montoTotal}`}
                        </strong></span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-hairline pt-3 lg:border-t-0 lg:pt-0 pl-2">
                  {cancelable ? (
                    <button
                      onClick={() => handleOpenCancelModal(cita.id)}
                      className="bg-transparent border border-error text-error hover:bg-error-container/20 font-button text-button px-5 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Cancelar Cita
                    </button>
                  ) : (
                    cita.estado !== 'Cancelada' && cita.estado !== 'Rechazada' && cita.estado !== 'Completada' && (
                      <span className="text-[11px] text-body-muted bg-surface-soft border border-hairline px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        No Cancelable
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCancelModal}
              className="absolute inset-0 bg-[#141413]/40 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-canvas border border-hairline w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center">
                <h3 className="font-title-lg text-title-lg text-error font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                  ¿Cancelar esta cita?
                </h3>
              </div>

              <div className="p-6 flex flex-col gap-4">
                {cancelError && (
                  <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-sm border border-error/15">
                    {cancelError}
                  </div>
                )}

                <p className="font-body-md text-body-md text-body-muted leading-relaxed">
                  ¿Estás seguro de que deseas cancelar esta cita? Esta acción liberará el espacio horario inmediatamente y notificará a la clínica.
                </p>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseCancelModal}
                    className="flex-1 bg-surface-card border border-hairline hover:bg-surface-soft text-ink py-2.5 rounded-full font-button text-button cursor-pointer"
                  >
                    Mantener Cita
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={submittingCancel}
                    className="flex-1 bg-error hover:bg-opacity-90 disabled:bg-primary-disabled text-on-error py-2.5 rounded-full font-button text-button flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {submittingCancel ? 'Cancelando...' : 'Confirmar Cancelación'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
