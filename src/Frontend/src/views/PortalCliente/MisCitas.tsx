import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import PortalClienteService from '../../services/portalCliente.service';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';

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
  const [showSuccessCancelModal, setShowSuccessCancelModal] = useState(false);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Past'>('All');

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
        setShowSuccessCancelModal(true);
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
    if (
      estado !== 'Confirmada' &&
      estado !== 'PendienteConfirmacion' &&
      estado !== 'PendienteAsignacion' &&
      estado !== 'Reprogramada' &&
      estado !== 'EnEspera'
    ) {
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

  const now = new Date().getTime();

  // Find the single upcoming highlight appointment
  const upcomingActiveCitas = citas
    .filter(c => new Date(c.fechaHora).getTime() >= now && c.estado !== 'Cancelada' && c.estado !== 'Rechazada')
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  
  const nextAppointment = upcomingActiveCitas[0];

  // Helper de fotos
  const getPetImage = (nombre: string) => {
    const name = nombre.toLowerCase();
    if (name.includes('bella') || name.includes('buddy') || name.includes('dog') || name.includes('bobby')) {
      return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300';
    }
    return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300';
  };

  // Filter and Search Logic
  const filteredCitas = citas
    .filter((cita) => {
      const matchesSearch = 
        cita.servicioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.mascotaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.veterinarioNombre.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      const isFuture = new Date(cita.fechaHora).getTime() >= now && cita.estado !== 'Cancelada' && cita.estado !== 'Rechazada';

      if (activeTab === 'Upcoming') {
        return isFuture;
      }
      if (activeTab === 'Past') {
        return !isFuture;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeTab === 'Upcoming') {
        return new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime();
      }
      return new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime();
    });

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto w-full relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[45%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-teal/5 blur-[120px]" />
      </div>

      {/* Header Area */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-variant/40">
        <div>
          <h2 className="text-3xl font-bold text-on-background mb-1">Mis Citas</h2>
          <p className="text-xs font-medium text-on-surface-variant">Visualiza y gestiona tus citas programadas e historial clínico.</p>
        </div>
        
        {/* Conceptual search & filter banner */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-primary/10 shadow-sm">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              className="pl-9 pr-4 py-1.5 bg-surface-container-low border-none rounded-lg text-xs font-semibold focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              placeholder="Buscar cita..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Next Appointment Bento Banner (Full width on top if exists) */}
        {nextAppointment && (
          <section className="lg:col-span-12 bg-white rounded-3xl overflow-hidden relative border border-primary/10 shadow-sm mb-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent pointer-events-none" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-sm shrink-0">
                <img
                  className="w-full h-full object-cover"
                  src={getPetImage(nextAppointment.mascotaNombre)}
                  alt={nextAppointment.mascotaNombre}
                />
              </div>
              <div className="flex-grow text-center md:text-left">
                <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  Próxima Cita
                </div>
                <h3 className="text-xl font-bold text-on-background mb-2">
                  {nextAppointment.servicioNombre}
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-semibold text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                    {new Date(nextAppointment.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="hidden md:inline text-outline-variant">•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                    {formatTime(nextAppointment.fechaHora)}
                  </span>
                  <span className="hidden md:inline text-outline-variant">•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">pets</span>
                    Paciente: <strong className="text-on-background">{nextAppointment.mascotaNombre}</strong>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button
                  onClick={() => navigate('/cliente/nueva-cita')}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-primary to-primary-active hover:shadow-lg text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Agendar Nueva Cita
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Citas List Area */}
        <section className="lg:col-span-12 bg-white rounded-3xl p-6 border border-primary/10 shadow-sm overflow-hidden flex flex-col min-h-[380px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-surface-variant/40 pb-4">
            <h3 className="font-bold text-base text-on-background">Historial de Citas</h3>
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
              <button
                onClick={() => setActiveTab('All')}
                className={`text-[11px] font-bold px-4 py-1.5 rounded-lg transition-all ${activeTab === 'All' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-background'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTab('Upcoming')}
                className={`text-[11px] font-bold px-4 py-1.5 rounded-lg transition-all ${activeTab === 'Upcoming' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-background'}`}
              >
                Próximas
              </button>
              <button
                onClick={() => setActiveTab('Past')}
                className={`text-[11px] font-bold px-4 py-1.5 rounded-lg transition-all ${activeTab === 'Past' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-background'}`}
              >
                Pasadas
              </button>
            </div>
          </div>

          {filteredCitas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-surface-container-low/20 rounded-2xl border border-dashed border-outline-variant/60">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40 mb-3">calendar_month</span>
              <h4 className="font-bold text-sm text-on-surface">No se encontraron citas</h4>
              <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm leading-relaxed">
                No hay registros que coincidan con la búsqueda o el filtro seleccionado en este momento.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-variant/40 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      <th className="pb-3 px-4">Fecha y Hora</th>
                      <th className="pb-3 px-4">Paciente</th>
                      <th className="pb-3 px-4">Servicio</th>
                      <th className="pb-3 px-4">Estado</th>
                      <th className="pb-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-on-background">
                    {filteredCitas.map((cita) => {
                      const badge = getEstadoBadge(cita.estado);
                      const cancelable = isCancelable(cita.fechaHora, cita.estado);
                      
                      return (
                        <tr key={cita.id} className="border-b border-surface-variant/20 hover:bg-surface-container-low/20 transition-colors group">
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold">
                                {new Date(cita.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[11px] text-on-surface-variant mt-0.5">
                                {formatTime(cita.fechaHora)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined text-[15px]">pets</span>
                              </div>
                              <span className="font-bold text-on-surface">{cita.mascotaNombre}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-on-surface-variant">{cita.servicioNombre}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badge.classes}`}>
                              <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                              {badge.text}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {cancelable ? (
                                <button
                                  onClick={() => handleOpenCancelModal(cita.id)}
                                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-all cursor-pointer"
                                  title="Cancelar Cita"
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-on-surface-variant/40 bg-surface-soft px-2.5 py-1 rounded-md border border-outline-variant/20">
                                  Bloqueada
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-4">
                {filteredCitas.map((cita) => {
                  const badge = getEstadoBadge(cita.estado);
                  const cancelable = isCancelable(cita.fechaHora, cita.estado);

                  return (
                    <div key={cita.id} className="p-4 border border-outline-variant/30 rounded-2xl flex flex-col gap-3 relative bg-white/40">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px]">pets</span>
                          </div>
                          <span className="font-bold text-xs">{cita.mascotaNombre}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${badge.classes}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        <p className="font-bold text-on-background">{cita.servicioNombre}</p>
                        <p className="flex items-center gap-1 mt-1 font-medium">
                          <span className="material-symbols-outlined text-[14px] text-primary">event</span>
                          {new Date(cita.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {formatTime(cita.fechaHora)}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2 border-t border-surface-variant/20 pt-3">
                        {cancelable ? (
                          <button
                            onClick={() => handleOpenCancelModal(cita.id)}
                            className="flex-1 py-2 text-error text-[11px] font-bold border border-error/20 rounded-lg text-center hover:bg-error-container/30 transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span className="flex-1 py-2 text-on-surface-variant/40 bg-surface-soft border border-outline-variant/20 rounded-lg text-center text-[10px] font-bold">
                            Cita Fija
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

      </div>

      {/* Modal de Confirmación de Cancelación (Premium M3 Glass) */}
      {isCancelModalOpen && createPortal(
        <div className="premium-modal-overlay animate-modal-fade-in" onClick={handleCloseCancelModal}>
          <div className="premium-modal-card animate-modal-scale-in bg-white/95 backdrop-blur-md border border-white/50" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>

            <div className="p-4">
              <h3 className="text-lg text-error font-bold flex items-center gap-2 justify-center mb-4">
                <span className="material-symbols-outlined text-[28px] animate-pulse">warning</span>
                ¿Cancelar cita?
              </h3>

              {cancelError && (
                <div className="bg-error-container/80 text-on-error-container p-3 rounded-lg text-xs border border-error/15 mb-4 font-bold">
                  {cancelError}
                </div>
              )}

              <p className="text-xs text-on-surface-variant font-medium leading-relaxed text-center mb-6">
                ¿Estás seguro de que deseas cancelar esta cita? Esta acción liberará el espacio horario inmediatamente y notificará a la clínica.
              </p>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  className="flex-1 bg-white border border-outline-variant hover:bg-surface-soft text-on-surface py-3 rounded-full font-button text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Mantener
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={submittingCancel}
                  className="flex-1 bg-error hover:bg-opacity-90 text-white py-3 rounded-full font-button text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  {submittingCancel ? 'Cancelando...' : 'Sí, Cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Éxito al Cancelar (M3 Glass) */}
      {showSuccessCancelModal && createPortal(
        <div className="premium-modal-overlay animate-modal-fade-in">
          <div className="premium-modal-card animate-modal-scale-in bg-white/95 backdrop-blur-md border border-white/50">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>

            {/* Checkmark SVG Animado */}
            <div className="mb-5 mt-2">
              <svg className="success-checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="circle" cx="26" cy="26" r="25" fill="none" />
                <path className="check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>

            <h3 className="text-lg text-on-background font-bold mb-1">
              Cita Cancelada
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mb-6 px-1">
              Tu cita ha sido cancelada exitosamente. Hemos notificado al especialista.
            </p>

            <button
              type="button"
              onClick={() => setShowSuccessCancelModal(false)}
              className="w-full bg-primary hover:bg-primary-active text-white font-bold py-3 rounded-full font-button text-xs transition-all cursor-pointer shadow-md active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
