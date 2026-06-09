import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import CitasService from '../../services/citas.service';
import type { CalendarioEventDto, CitaDto } from '../../services/citas.service';
import VeterinariosService from '../../services/veterinarios.service';
import type { Veterinario } from '../../services/veterinarios.service';
import ClientesService from '../../services/clientes.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

// Horarios de la clínica operativos (08:00 AM a 08:00 PM)
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8, 9, ..., 20

const ESTADO_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  ReservaTemporal: { bg: 'bg-surface-dim', border: 'border-l-4 border-secondary', text: 'text-secondary', icon: 'hourglass_empty' },
  PendienteConfirmacion: { bg: 'bg-accent-amber/10', border: 'border-l-4 border-accent-amber', text: 'text-accent-amber', icon: 'pending' },
  PendienteAsignacion: { bg: 'bg-accent-amber/5', border: 'border-l-4 border-accent-teal', text: 'text-accent-teal', icon: 'person_search' },
  Confirmada: { bg: 'bg-success/5', border: 'border-l-4 border-success', text: 'text-success', icon: 'check_circle' },
  EnEspera: { bg: 'bg-primary/5', border: 'border-l-4 border-primary', text: 'text-primary', icon: 'hail' },
  EnAtencion: { bg: 'bg-accent-teal/5', border: 'border-l-4 border-accent-teal', text: 'text-accent-teal', icon: 'stethoscope' },
  Completada: { bg: 'bg-surface-card', border: 'border-l-4 border-body-muted opacity-70', text: 'text-body-muted', icon: 'task_alt' },
  Cancelada: { bg: 'bg-error/5', border: 'border-l-4 border-error', text: 'text-error', icon: 'cancel' },
  Rechazada: { bg: 'bg-error/5', border: 'border-l-4 border-error', text: 'text-error', icon: 'do_not_disturb_on' },
  NoAsistio: { bg: 'bg-[#343a40]/5', border: 'border-l-4 border-[#343a40]', text: 'text-[#343a40]', icon: 'person_off' },
  Reprogramada: { bg: 'bg-accent-teal/5', border: 'border-l-4 border-accent-teal', text: 'text-accent-teal', icon: 'edit_calendar' },
};

export default function Agenda() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'diaria' | 'solicitudes' | 'configuracion'>('diaria');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Filters
  const [selectedVet, setSelectedVet] = useState<string>('all');
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>(['Confirmada', 'EnEspera', 'EnAtencion', 'PendienteConfirmacion', 'Reprogramada']);
  
  // Data
  const [citas, setCitas] = useState<CalendarioEventDto[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Drawer State
  const [activeCita, setActiveCita] = useState<CalendarioEventDto | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Reschedule Form Inline
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduleVetId, setRescheduleVetId] = useState<number>(0);
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Rejection Form
  const [rejectingCitaId, setRejectingCitaId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Horarios configuration
  const [horariosClinica, setHorariosClinica] = useState([
    { day: 'Lunes', active: true, open: '08:00', close: '20:00' },
    { day: 'Martes', active: true, open: '08:00', close: '20:00' },
    { day: 'Miércoles', active: true, open: '08:00', close: '20:00' },
    { day: 'Jueves', active: true, open: '08:00', close: '20:00' },
    { day: 'Viernes', active: true, open: '08:00', close: '18:00' },
    { day: 'Sábado', active: true, open: '09:00', close: '14:00' },
    { day: 'Domingo', active: false, open: '', close: '' },
  ]);
  const [upcomingBlocks, setUpcomingBlocks] = useState([
    { id: 1, title: 'Día de la Independencia', time: '16 Septiembre (Todo el día)', type: 'event_busy' },
    { id: 2, title: 'Mantenimiento Quirófano', time: '22 Octubre (14:00 - 18:00)', type: 'construction' },
  ]);
  const [showAddBlockModal, setShowAddBlockModal] = useState<boolean>(false);
  const [newBlockTitle, setNewBlockTitle] = useState<string>('');
  const [newBlockDate, setNewBlockDate] = useState<string>('');
  const [newBlockStart, setNewBlockStart] = useState<string>('00:00');
  const [newBlockEnd, setNewBlockEnd] = useState<string>('23:59');

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch veterinarians
      const vetRes = await VeterinariosService.getVeterinarios();
      if (vetRes.success && vetRes.data) {
        setVeterinarios(vetRes.data.veterinarios.map((v: any) => v.veterinario) || []);
      }

      // Fetch appointments for a broad range (+/- 30 days) to populate both daily view and solicitudes
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 30);
      const startIso = startDate.toISOString().split('T')[0] + 'T00:00:00';

      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 30);
      const endIso = endDate.toISOString().split('T')[0] + 'T23:59:59';

      const citasData = await CitasService.getCalendarioData(startIso, endIso);
      setCitas(citasData || []);
    } catch (err: any) {
      console.error('Error fetching agenda data:', err);
      setError('Error al conectar con el servidor. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle URL actions (e.g. from Sidebar clicking "Nueva Consulta")
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      navigate('/admin/agenda/nueva');
    }
  }, [searchParams, navigate]);

  // Load client details when opening active appointment details
  useEffect(() => {
    const loadClientInfo = async () => {
      if (!activeCita) return;
      setPhone('');
      setEmail('');
      try {
        const query = await ClientesService.getClientes(activeCita.extendedProps.propietario || '');
        if (query.success && query.data?.usuarios?.length > 0) {
          const matched = query.data.usuarios.find(
            (u: any) => u.nombre === activeCita.extendedProps.propietario
          );
          if (matched) {
            setPhone(matched.telefono || '');
            setEmail(matched.email || '');
          }
        }
      } catch (err) {
        console.error('Error loading client contact info:', err);
      }
    };
    loadClientInfo();
  }, [activeCita]);

  // Load availability slots when rescheduling
  useEffect(() => {
    const loadSlots = async () => {
      if (!isRescheduling || !rescheduleDate || !rescheduleVetId) return;
      setLoadingSlots(true);
      try {
        const slots = await CitasService.getHorariosDisponibles(rescheduleVetId, rescheduleDate);
        setAvailableSlots(slots.map((s) => s.text) || []);
      } catch (err) {
        console.error('Error loading available slots:', err);
        toast.error('No se pudieron obtener los horarios disponibles.');
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [isRescheduling, rescheduleDate, rescheduleVetId]);

  // Actions
  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await CitasService.cambiarEstado(id, nuevoEstado);
      toast.success(`Cita cambiada a estado: ${nuevoEstado}`);
      
      // Update local state details if drawer is open
      if (activeCita && activeCita.id === id) {
        setActiveCita({
          ...activeCita,
          extendedProps: {
            ...activeCita.extendedProps,
            estado: nuevoEstado,
          },
        });
      }
      
      fetchData();
    } catch (err: any) {
      console.error('Error changing state:', err);
      const msg = err.response?.data?.message || 'Error al cambiar el estado.';
      toast.error(msg);
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await CitasService.cancelarCita(id);
      toast.success('Cita cancelada con éxito.');
      
      if (activeCita && activeCita.id === id) {
        setActiveCita({
          ...activeCita,
          extendedProps: {
            ...activeCita.extendedProps,
            estado: 'Cancelada',
          },
        });
      }

      fetchData();
    } catch (err: any) {
      console.error('Error canceling appointment:', err);
      const msg = err.response?.data?.message || 'Error al cancelar la cita.';
      toast.error(msg);
    }
  };

  const handleConfirmarRechazo = async (id: number) => {
    if (!rejectReason.trim()) {
      toast.error('Debes especificar un motivo para rechazar la solicitud.');
      return;
    }
    try {
      await CitasService.cambiarEstado(id, 'Rechazada');
      toast.success('Solicitud rechazada con éxito.');
      setRejectingCitaId(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      console.error('Error rejecting appointment:', err);
      toast.error(err.response?.data?.message || 'Error al rechazar la solicitud.');
    }
  };

  const handleReprogramar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCita || !rescheduleDate || !rescheduleTime || !rescheduleVetId) {
      toast.error('Complete todos los campos de reprogramación.');
      return;
    }

    try {
      const fechaHora = `${rescheduleDate}T${rescheduleTime}:00`;
      
      const payload: CitaDto = {
        id: activeCita.id,
        fechaHora,
        estado: 'Reprogramada',
        motivo: rescheduleReason || activeCita.extendedProps.motivo || '',
        mascotaId: activeCita.extendedProps.mascotaId || 0,
        veterinarioId: rescheduleVetId,
        servicioId: activeCita.extendedProps.servicioId || 0,
      };

      await CitasService.updateCita(activeCita.id, payload);
      toast.success('Cita reprogramada exitosamente.');
      setIsRescheduling(false);
      setShowDetail(false);
      setActiveCita(null);
      fetchData();
    } catch (err: any) {
      console.error('Error rescheduling appointment:', err);
      toast.error(err.response?.data?.message || 'El horario seleccionado no está disponible.');
    }
  };

  const startRescheduling = () => {
    if (!activeCita) return;
    setRescheduleDate(new Date(activeCita.start).toISOString().split('T')[0]);
    setRescheduleTime(new Date(activeCita.start).toTimeString().slice(0, 5));
    setRescheduleVetId(activeCita.extendedProps.veterinarioId || 0);
    setRescheduleReason('');
    setIsRescheduling(true);
  };

  // Add Block Configuration
  const handleAddManualBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim() || !newBlockDate) {
      toast.error('Debes completar el título y la fecha.');
      return;
    }
    const newBlock = {
      id: Date.now(),
      title: newBlockTitle,
      time: `${newBlockDate} (${newBlockStart} - ${newBlockEnd})`,
      type: 'event_busy'
    };
    setUpcomingBlocks([...upcomingBlocks, newBlock]);
    toast.success('Bloqueo registrado con éxito.');
    setShowAddBlockModal(false);
    setNewBlockTitle('');
    setNewBlockDate('');
  };

  // Filters calculation
  const getFormattedSelectedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const formatted = dateObj.toLocaleDateString('es-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Filter appointments for the timeline (exact selectedDate matching)
  const filteredCitas = citas.filter((cita) => {
    const citaDay = new Date(cita.start).toISOString().split('T')[0];
    if (citaDay !== selectedDate) return false;

    // Vet filter
    if (selectedVet !== 'all' && String(cita.extendedProps.veterinarioId) !== selectedVet) {
      return false;
    }

    // Status filter
    if (!activeStatusFilters.includes(cita.extendedProps.estado)) {
      return false;
    }

    return true;
  });

  // Filter requests (PendienteConfirmacion) in the +/- 30 day range
  const solicitudesCitas = citas.filter(
    (cita) => cita.extendedProps.estado === 'PendienteConfirmacion'
  );

  const toggleStatusFilter = (status: string) => {
    setActiveStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Stats for the day
  const confirmedCount = filteredCitas.filter(c => c.extendedProps.estado === 'Confirmada').length;
  const waitingCount = filteredCitas.filter(c => c.extendedProps.estado === 'EnEspera').length;
  const inTreatmentCount = filteredCitas.filter(c => c.extendedProps.estado === 'EnAtencion').length;

  if (loading && citas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-lg">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none">
      {/* Page Header */}
      <PageHeader
        title="Agenda de la Clínica"
        description={getFormattedSelectedDate()}
        actions={
          <>
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-xs px-md py-2.5 bg-surface-card text-ink border border-hairline rounded-lg font-button text-button hover:bg-surface-soft transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Imprimir
            </button>
            <button 
              onClick={() => navigate('/admin/agenda/nueva')}
              className="flex items-center justify-center gap-xs px-lg py-2.5 bg-primary text-on-primary rounded-lg font-button text-button hover:bg-primary-active transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva Cita
            </button>
          </>
        }
        hasDivider={true}
      />

      {/* Tabs */}
      <div className="flex border-b border-hairline mb-lg overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('diaria')}
          className={`px-lg py-3 font-title-sm text-title-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'diaria' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          Agenda Diaria
        </button>
        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`px-lg py-3 font-title-sm text-title-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'solicitudes' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          Solicitudes Pendientes
          {solicitudesCitas.length > 0 && (
            <span className="bg-accent-amber/20 text-accent-amber text-[10px] font-bold px-2 py-0.5 rounded-full">
              {solicitudesCitas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('configuracion')}
          className={`px-lg py-3 font-title-sm text-title-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'configuracion' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          Configuración y Bloqueos
        </button>
      </div>

      {activeTab === 'diaria' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
          {/* Main Agenda Grid (8 cols) */}
          <div className="lg:col-span-9 flex flex-col gap-md">
            {/* Control Bar (Filters) */}
            <div className="bg-surface-card rounded-xl border border-hairline p-md flex flex-col md:flex-row md:items-center justify-between gap-md shadow-sm">
              <div className="flex flex-wrap items-center gap-md">
                {/* Date Picker */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer"
                />

                {/* Vet Filter */}
                <div className="relative">
                  <select
                    value={selectedVet}
                    onChange={(e) => setSelectedVet(e.target.value)}
                    className="bg-canvas border border-hairline rounded-lg pl-3 pr-8 py-2 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none min-w-[200px]"
                  >
                    <option value="all">Todos los Veterinarios</option>
                    {veterinarios.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.nombre} ({v.especialidad})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap gap-xs">
                {['Confirmada', 'EnEspera', 'EnAtencion', 'Reprogramada'].map((status) => {
                  const isActive = activeStatusFilters.includes(status);
                  const colors = ESTADO_COLORS[status] || { text: 'text-secondary', bg: 'bg-surface-dim' };
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-caption font-caption cursor-pointer transition-all ${
                        isActive
                          ? `${colors.bg} ${colors.text} border-primary/20 font-semibold shadow-xs`
                          : 'bg-canvas text-secondary border-hairline opacity-60 hover:opacity-85'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">{colors.icon || 'circle'}</span>
                      {status === 'EnEspera' ? 'En Sala' : status === 'EnAtencion' ? 'En Consulta' : status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hourly Schedule Track */}
            <div className="bg-surface-lowest rounded-xl border border-hairline shadow-sm overflow-hidden flex flex-col">
              <div className="relative divide-y divide-hairline">
                {HOURS.map((hour) => {
                  const formattedHour = `${String(hour).padStart(2, '0')}:00`;
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const hourLabel = `${String(hour > 12 ? hour - 12 : hour).padStart(2, '0')}:00 ${ampm}`;

                  // Filter appointments for this exact starting hour
                  const appointmentsInHour = filteredCitas.filter((c) => {
                    const cDate = new Date(c.start);
                    return cDate.getHours() === hour;
                  });

                  return (
                    <div key={hour} className="flex min-h-[105px]">
                      {/* Time Label Column */}
                      <div className="w-24 shrink-0 py-4 pr-4 text-right border-r border-hairline bg-canvas/40 flex flex-col justify-start">
                        <span className="font-caption-uppercase text-caption-uppercase text-secondary text-[11px] tracking-wider">
                          {hourLabel}
                        </span>
                      </div>

                      {/* Appointment Cards Column */}
                      <div className="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md relative">
                        {appointmentsInHour.length > 0 ? (
                          appointmentsInHour.map((c) => {
                            const colors = ESTADO_COLORS[c.extendedProps.estado] || {
                              bg: 'bg-surface-soft',
                              border: 'border-l-4 border-hairline',
                              text: 'text-secondary',
                              icon: 'circle',
                            };
                            const startStr = new Date(c.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            const endStr = new Date(c.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                            return (
                              <motion.div
                                key={c.id}
                                layoutId={`appointment-${c.id}`}
                                onClick={() => {
                                  setActiveCita(c);
                                  setIsRescheduling(false);
                                  setShowDetail(true);
                                }}
                                className={`rounded-lg p-3 ${colors.bg} ${colors.border} shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5 duration-200`}
                              >
                                <div>
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-title-sm text-title-sm text-ink group-hover:text-primary transition-colors font-semibold">
                                      {c.extendedProps.mascota}
                                    </h3>
                                    <span className="material-symbols-outlined text-[18px] text-secondary">
                                      {colors.icon}
                                    </span>
                                  </div>
                                  <p className="font-body-sm text-body-sm text-secondary mb-2">
                                    {c.extendedProps.propietario}
                                  </p>
                                  <div className="inline-flex items-center gap-1 bg-canvas px-2 py-0.5 rounded font-caption text-caption text-ink border border-hairline">
                                    <span className="material-symbols-outlined text-[13px] text-primary">
                                      medical_services
                                    </span>
                                    {c.extendedProps.servicio}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-hairline/40 pt-2 text-[12px] font-medium text-body-muted">
                                  <span className="truncate max-w-[100px]">{c.extendedProps.veterinario}</span>
                                  <span className="font-code text-ink font-semibold">{startStr} - {endStr}</span>
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="col-span-full h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/admin/agenda/nueva?date=${selectedDate}&time=${formattedHour}`)}
                              className="text-primary hover:text-primary-active font-button text-button flex items-center gap-xs py-1 px-3 border border-dashed border-primary/40 rounded bg-canvas/50"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                              Agendar en este bloque
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats Sidebar (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-md">
            <div className="bg-surface-card rounded-xl border border-hairline p-lg shadow-sm">
              <h3 className="font-title-md text-title-md text-ink mb-md font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Resumen del Día
              </h3>
              <div className="space-y-sm">
                <div className="flex justify-between items-center py-2 border-b border-hairline/50">
                  <span className="font-body-sm text-body-sm text-secondary">Confirmadas</span>
                  <span className="font-title-sm text-title-sm text-ink font-bold">{confirmedCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-hairline/50">
                  <span className="font-body-sm text-body-sm text-secondary">En Sala de Espera</span>
                  <span className="font-title-sm text-title-sm text-primary font-bold">{waitingCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-hairline/50">
                  <span className="font-body-sm text-body-sm text-secondary">En Atención Clínica</span>
                  <span className="font-title-sm text-title-sm text-accent-teal font-bold">{inTreatmentCount}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-body-sm text-body-sm text-secondary">Total Citados</span>
                  <span className="font-title-sm text-title-sm text-ink font-bold">{filteredCitas.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-soft p-lg border border-hairline rounded-xl flex flex-col gap-sm">
              <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-amber">info</span>
                Atención Rápida
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                Los clientes pueden agendar a través del portal y aparecerán en la pestaña <strong>"Solicitudes Pendientes"</strong>.
              </p>
              <button
                onClick={() => navigate('/admin/clientes')}
                className="w-full text-center bg-canvas hover:bg-surface-card border border-hairline text-ink font-button text-button py-2 rounded-lg transition-colors cursor-pointer mt-2"
              >
                Buscar Ficha de Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'solicitudes' && (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-md">
          {solicitudesCitas.length === 0 ? (
            <EmptyState
              title="Sin solicitudes pendientes"
              description="No hay solicitudes de citas por parte de los clientes esperando confirmación."
            />
          ) : (
            solicitudesCitas.map((s) => {
              const requestDate = new Date(s.start).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <article
                  key={s.id}
                  className="bg-surface-card rounded-xl p-lg flex flex-col md:flex-row gap-lg border border-hairline hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex-1 flex flex-col gap-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-sm mb-1">
                          <h3 className="font-display-sm text-display-sm text-ink font-semibold">{s.extendedProps.mascota}</h3>
                          <span className="px-3 py-1 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-caption text-caption flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[13px]">pending</span>
                            Pendiente confirmación
                          </span>
                        </div>
                        <p className="font-title-sm text-title-sm text-body-strong">
                          Cliente: {s.extendedProps.propietario}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-sm border-t border-hairline/40 pt-sm">
                      <div>
                        <span className="block font-caption text-caption text-secondary uppercase tracking-wider mb-1">
                          Servicio Solicitado
                        </span>
                        <span className="font-body-md text-body-md text-ink flex items-center gap-xs">
                          <span className="material-symbols-outlined text-secondary text-[18px]">vaccines</span>
                          {s.extendedProps.servicio}
                        </span>
                      </div>
                      <div>
                        <span className="block font-caption text-caption text-secondary uppercase tracking-wider mb-1">
                          Fecha y Hora Sugerida
                        </span>
                        <span className="font-body-md text-body-md text-primary font-semibold flex items-center gap-xs">
                          <span className="material-symbols-outlined text-primary text-[18px]">event</span>
                          {requestDate}
                        </span>
                      </div>
                    </div>
                    {s.extendedProps.motivo && (
                      <div className="mt-xs bg-canvas/50 p-3 rounded-lg border border-hairline/40">
                        <span className="block font-caption text-caption text-secondary mb-1">Notas del cliente:</span>
                        <p className="font-body-sm text-body-sm text-body-muted italic">"{s.extendedProps.motivo}"</p>
                      </div>
                    )}
                  </div>

                  {/* Action Column */}
                  <div className="flex flex-col gap-sm justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-hairline/50 pt-md md:pt-0 md:pl-lg">
                    <button
                      onClick={() => handleCambiarEstado(s.id, 'Confirmada')}
                      className="w-full bg-primary text-on-primary font-button text-button py-2.5 px-md rounded-lg hover:bg-primary-active transition-colors flex justify-center items-center gap-xs cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Confirmar Cita
                    </button>
                    <button
                      onClick={() => {
                        setActiveCita(s);
                        startRescheduling();
                        setShowDetail(true);
                      }}
                      className="w-full bg-canvas text-ink border border-hairline font-button text-button py-2.5 px-md rounded-lg hover:bg-surface-soft transition-colors flex justify-center items-center gap-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                      Reprogramar
                    </button>
                    <button
                      onClick={() => setRejectingCitaId(s.id)}
                      className="w-full text-error font-button text-button py-1.5 hover:underline flex justify-center items-center gap-xs cursor-pointer mt-1"
                    >
                      Rechazar solicitud
                    </button>

                    {/* Reject Dialog Inline */}
                    {rejectingCitaId === s.id && (
                      <div className="mt-3 p-3 bg-error-container/20 border border-error/20 rounded-lg flex flex-col gap-2">
                        <label className="font-caption text-caption text-error block">Motivo del rechazo:</label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Ej: No atendemos esa especialidad hoy..."
                          className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-body-sm focus:outline-none focus:border-error transition-all"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setRejectingCitaId(null)}
                            className="px-2 py-1 font-caption text-caption bg-canvas hover:bg-surface-card rounded text-secondary"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleConfirmarRechazo(s.id)}
                            className="px-3 py-1 font-caption text-caption bg-error text-white rounded font-bold hover:opacity-90"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'configuracion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl max-w-6xl mx-auto w-full">
          {/* Main Matrix Settings (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-lg bg-surface-card rounded-xl border border-hairline p-lg shadow-sm">
            <div className="flex justify-between items-center mb-md border-b border-hairline pb-3">
              <div>
                <h3 className="font-title-lg text-title-lg text-ink font-bold">Matriz de Apertura Semanal</h3>
                <p className="font-body-sm text-body-sm text-secondary">Establece los horarios generales de operación de la clínica.</p>
              </div>
              <button 
                onClick={() => toast.success('Matriz de horarios guardada con éxito.')}
                className="bg-primary text-on-primary font-button text-button px-5 py-2 rounded-lg hover:bg-primary-active transition-all cursor-pointer shadow-xs"
              >
                Guardar Plantilla
              </button>
            </div>
            
            <div className="border border-hairline rounded-lg overflow-hidden bg-canvas">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-soft">
                  <tr className="border-b border-hairline">
                    <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Día</th>
                    <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Estado</th>
                    <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Apertura</th>
                    <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {horariosClinica.map((hc, idx) => (
                    <tr key={hc.day} className={`hover:bg-surface-soft/40 transition-colors ${!hc.active ? 'bg-surface-container/20 opacity-60' : ''}`}>
                      <td className="py-3.5 px-4 font-body-sm text-ink font-semibold">{hc.day}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            const updated = [...horariosClinica];
                            updated[idx].active = !updated[idx].active;
                            if (updated[idx].active) {
                              updated[idx].open = '08:00';
                              updated[idx].close = '20:00';
                            } else {
                              updated[idx].open = '';
                              updated[idx].close = '';
                            }
                            setHorariosClinica(updated);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-caption text-caption cursor-pointer transition-all ${
                            hc.active ? 'bg-success/15 text-success font-semibold' : 'bg-surface-dim text-secondary'
                          }`}
                        >
                          {hc.active ? 'Abierto' : 'Cerrado'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="time"
                          disabled={!hc.active}
                          value={hc.open}
                          onChange={(e) => {
                            const updated = [...horariosClinica];
                            updated[idx].open = e.target.value;
                            setHorariosClinica(updated);
                          }}
                          className="bg-canvas border border-hairline rounded px-2 py-1 font-body-sm text-body-sm w-full max-w-[120px] focus:outline-none focus:border-primary disabled:opacity-50"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="time"
                          disabled={!hc.active}
                          value={hc.close}
                          onChange={(e) => {
                            const updated = [...horariosClinica];
                            updated[idx].close = e.target.value;
                            setHorariosClinica(updated);
                          }}
                          className="bg-canvas border border-hairline rounded px-2 py-1 font-body-sm text-body-sm w-full max-w-[120px] focus:outline-none focus:border-primary disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Blocks Settings (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-lg">
            <div className="bg-surface-soft p-lg border border-hairline rounded-xl shadow-sm">
              <h3 className="font-title-lg text-title-lg text-ink font-bold mb-sm">Bloqueos Próximos</h3>
              <p className="font-body-sm text-body-sm text-secondary mb-md">Días no laborables, festividades o mantenimientos específicos.</p>
              
              <div className="space-y-sm">
                {upcomingBlocks.map((block) => (
                  <div key={block.id} className="flex items-start gap-sm p-3 bg-canvas border border-hairline rounded-lg">
                    <span className="material-symbols-outlined text-primary mt-0.5 text-[20px]">{block.type}</span>
                    <div className="flex-grow">
                      <h4 className="font-title-sm text-title-sm text-ink font-semibold">{block.title}</h4>
                      <p className="font-caption text-caption text-body-muted mt-0.5">{block.time}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUpcomingBlocks(upcomingBlocks.filter((b) => b.id !== block.id));
                        toast.info('Bloqueo eliminado.');
                      }}
                      className="text-body-muted hover:text-error transition-colors p-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAddBlockModal(true)}
                className="mt-lg w-full flex items-center justify-center gap-xs py-2.5 border border-dashed border-primary text-primary font-button text-button hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Añadir Bloqueo Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Cita Drawer / Side panel overlay */}
      <AnimatePresence>
        {showDetail && activeCita && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-canvas z-50 shadow-2xl flex flex-col p-lg border-l border-hairline overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-hairline pb-md mb-md">
                <div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="flex items-center gap-xs text-secondary hover:text-ink transition-colors font-button text-button mb-3 cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    Cerrar Detalle
                  </button>
                  <div className="flex items-center gap-sm">
                    <span className="font-caption-uppercase text-caption-uppercase text-secondary tracking-widest text-[11px]">
                      ID: CITA-{activeCita.id}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-caption font-semibold ${
                      ESTADO_COLORS[activeCita.extendedProps.estado]?.bg
                    } ${ESTADO_COLORS[activeCita.extendedProps.estado]?.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                      {activeCita.extendedProps.estado}
                    </span>
                  </div>
                  <h2 className="font-display-sm text-display-sm text-ink mt-2 font-bold">
                    {activeCita.extendedProps.servicio}
                  </h2>
                </div>
                <div className="flex items-center gap-xs">
                  <button 
                    onClick={() => window.print()} 
                    title="Imprimir Cita"
                    className="w-9 h-9 flex items-center justify-center rounded border border-hairline bg-canvas hover:bg-surface-soft transition-colors cursor-pointer text-secondary hover:text-ink"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                  </button>
                </div>
              </div>

              {isRescheduling ? (
                /* Reprogram Form Inline inside Drawer */
                <form onSubmit={handleReprogramar} className="flex flex-col gap-md flex-1">
                  <h3 className="font-title-md text-title-md text-ink font-bold mb-xs">Reprogramar Consulta</h3>
                  
                  <div>
                    <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Veterinario Asignado</label>
                    <select
                      value={rescheduleVetId}
                      onChange={(e) => setRescheduleVetId(Number(e.target.value))}
                      className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm text-ink focus:outline-none focus:border-primary"
                    >
                      {veterinarios.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre} ({v.especialidad})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Nueva Fecha</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm text-ink focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Nuevo Horario</label>
                    {loadingSlots ? (
                      <div className="py-2"><Spinner size="sm" /></div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-xs mt-1">
                        {availableSlots.map((slot) => {
                          const isActive = rescheduleTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setRescheduleTime(slot)}
                              className={`py-1.5 text-center border rounded font-body-sm text-body-sm cursor-pointer transition-colors ${
                                isActive
                                  ? 'border-primary bg-primary/10 text-primary font-bold'
                                  : 'border-hairline bg-canvas text-secondary hover:border-primary hover:text-primary'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="font-body-sm text-body-sm text-error mt-1">
                        No hay horarios laborables/disponibles para este profesional en la fecha seleccionada.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Motivo de Reprogramación</label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Motivo del cambio de fecha/hora..."
                      rows={3}
                      className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm text-ink focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex gap-md mt-auto pt-lg border-t border-hairline">
                    <button
                      type="button"
                      onClick={() => setIsRescheduling(false)}
                      className="flex-1 py-2.5 border border-hairline rounded-lg text-ink font-button hover:bg-surface-soft transition-colors cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loadingSlots || !rescheduleTime}
                      className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-button hover:bg-primary-active transition-colors cursor-pointer text-center shadow-sm disabled:opacity-50"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                /* Cita Details Content */
                <div className="flex flex-col gap-lg flex-1">
                  {/* Time / Room strip */}
                  <section className="bg-surface-container-low border border-hairline rounded-xl p-md flex items-center justify-between gap-md shadow-xs">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded bg-canvas flex items-center justify-center text-primary border border-hairline shadow-xs">
                        <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                      </div>
                      <div>
                        <h4 className="font-title-sm text-title-sm text-ink font-semibold">
                          {new Date(activeCita.start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h4>
                        <p className="font-body-sm text-body-sm text-secondary">
                          {new Date(activeCita.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ({activeCita.extendedProps.duracion} min)
                        </p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-hairline" />
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded bg-canvas flex items-center justify-center text-secondary border border-hairline shadow-xs">
                        <span className="material-symbols-outlined text-[22px]">meeting_room</span>
                      </div>
                      <div>
                        <h4 className="font-title-sm text-title-sm text-ink font-semibold">Consultorio Principal</h4>
                        <p className="font-body-sm text-body-sm text-secondary">Box de Atención</p>
                      </div>
                    </div>
                  </section>

                  {/* Bento Grid: Client & Pet */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    {/* Pet Info */}
                    <div className="bg-surface-card border border-hairline rounded-xl p-md flex flex-col relative overflow-hidden shadow-xs">
                      <span className="material-symbols-outlined text-secondary opacity-25 text-[64px] absolute right-0 bottom-0 pointer-events-none">pets</span>
                      <div className="flex items-center gap-1 text-secondary mb-3">
                        <span className="material-symbols-outlined text-[18px]">pets</span>
                        <span className="font-caption-uppercase text-caption-uppercase text-[11px] tracking-wider font-semibold">Paciente</span>
                      </div>
                      <h4 className="font-display-sm text-display-sm text-ink leading-tight font-bold">{activeCita.extendedProps.mascota}</h4>
                      <p className="font-body-sm text-body-sm text-secondary mt-1">Expediente Médico Activo</p>
                    </div>

                    {/* Propietario Info */}
                    <div className="bg-surface-soft border border-hairline rounded-xl p-md flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1 text-secondary">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            <span className="font-caption-uppercase text-caption-uppercase text-[11px] tracking-wider font-semibold">Propietario</span>
                          </div>
                        </div>
                        <h4 className="font-title-md text-title-md text-ink font-bold leading-tight">{activeCita.extendedProps.propietario}</h4>
                      </div>
                      <div className="flex flex-col gap-1 mt-md text-[13px] text-body-muted font-medium">
                        {phone && (
                          <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[16px]">call</span>
                            {phone}
                          </a>
                        )}
                        {email && (
                          <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors truncate max-w-[200px]">
                            <span className="material-symbols-outlined text-[16px]">mail</span>
                            {email}
                          </a>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Motivo de Consulta */}
                  <section className="bg-canvas border border-hairline rounded-xl p-md shadow-xs">
                    <h3 className="font-title-sm text-title-sm text-ink mb-2 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
                      Motivo de la Cita
                    </h3>
                    <div className="bg-surface-soft p-3 rounded-lg border border-hairline">
                      <p className="font-body-md text-body-md text-ink leading-relaxed">
                        {activeCita.extendedProps.motivo || 'Sin detalles adicionales ingresados.'}
                      </p>
                    </div>
                  </section>

                  {/* Veterinario Asignado */}
                  <section className="bg-canvas border border-hairline rounded-xl p-md flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-xs">
                        {activeCita.extendedProps.veterinario?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-caption text-caption text-secondary text-[11px]">Veterinario Titular</span>
                        <h4 className="font-title-sm text-title-sm text-ink font-bold">{activeCita.extendedProps.veterinario}</h4>
                      </div>
                    </div>
                  </section>

                  {/* Operations Block */}
                  <section className="mt-auto bg-[#181715] rounded-xl p-lg shadow-lg text-on-primary border border-[#2a2926]">
                    <h3 className="font-title-md text-title-md text-surface-soft font-bold mb-2">Acciones de Estado</h3>
                    
                    {activeCita.extendedProps.estado === 'Confirmada' && (
                      <div className="flex flex-col gap-3">
                        <p className="font-body-sm text-body-sm text-outline-variant">
                          El cliente tiene una cita agendada. Registra su arribo a la clínica.
                        </p>
                        <button
                          onClick={() => handleCambiarEstado(activeCita.id, 'EnEspera')}
                          className="w-full bg-primary hover:bg-primary-active text-on-primary font-button text-button py-2.5 px-md rounded-lg transition-colors flex justify-center items-center gap-sm cursor-pointer shadow-sm"
                        >
                          <span className="material-symbols-outlined">hail</span>
                          Registrar Llegada (En Sala)
                        </button>
                        <div className="grid grid-cols-2 gap-md mt-1">
                          <button
                            onClick={startRescheduling}
                            className="bg-[#252320] hover:bg-[#32302c] text-surface-soft border border-[#3a3834] font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer"
                          >
                            Reprogramar
                          </button>
                          <button
                            onClick={() => handleCancelar(activeCita.id)}
                            className="bg-[#252320] hover:bg-[#32302c] text-error border border-[#3a3834] font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer font-semibold"
                          >
                            Cancelar Cita
                          </button>
                        </div>
                      </div>
                    )}

                    {activeCita.extendedProps.estado === 'EnEspera' && (
                      <div className="flex flex-col gap-3">
                        <p className="font-body-sm text-body-sm text-outline-variant">
                          El paciente se encuentra esperando en sala. Inicia su consulta clínica.
                        </p>
                        <button
                          onClick={() => handleCambiarEstado(activeCita.id, 'EnAtencion')}
                          className="w-full bg-accent-teal hover:opacity-95 text-ink font-button text-button py-2.5 px-md rounded-lg transition-all flex justify-center items-center gap-sm cursor-pointer shadow-sm font-bold"
                        >
                          <span className="material-symbols-outlined">stethoscope</span>
                          Iniciar Atención Clínica
                        </button>
                        <div className="grid grid-cols-2 gap-md mt-1">
                          <button
                            onClick={() => handleCambiarEstado(activeCita.id, 'NoAsistio')}
                            className="bg-[#252320] hover:bg-[#32302c] text-surface-soft border border-[#3a3834] font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer"
                          >
                            No Asistió
                          </button>
                          <button
                            onClick={() => handleCancelar(activeCita.id)}
                            className="bg-[#252320] hover:bg-[#32302c] text-error border border-[#3a3834] font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {activeCita.extendedProps.estado === 'EnAtencion' && (
                      <div className="flex flex-col gap-3">
                        <p className="font-body-sm text-body-sm text-outline-variant">
                          La atención del paciente está en curso en el consultorio.
                        </p>
                        <button
                          onClick={() => handleCambiarEstado(activeCita.id, 'Completada')}
                          className="w-full bg-success hover:opacity-95 text-white font-button text-button py-2.5 px-md rounded-lg transition-all flex justify-center items-center gap-sm cursor-pointer shadow-sm font-bold"
                        >
                          <span className="material-symbols-outlined">task_alt</span>
                          Finalizar Consulta
                        </button>
                        <button
                          onClick={() => handleCancelar(activeCita.id)}
                          className="w-full bg-transparent border border-error/40 hover:bg-error-container/10 text-error font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar Cita (Emergencia)
                        </button>
                      </div>
                    )}

                    {['Completada', 'Cancelada', 'Rechazada', 'NoAsistio'].includes(
                      activeCita.extendedProps.estado
                    ) && (
                      <div className="flex flex-col gap-2">
                        <p className="font-body-sm text-body-sm text-outline-variant">
                          Esta cita se encuentra en un estado final y no admite más transiciones de flujo.
                        </p>
                      </div>
                    )}

                    {activeCita.extendedProps.estado === 'PendienteConfirmacion' && (
                      <div className="flex flex-col gap-3">
                        <p className="font-body-sm text-body-sm text-outline-variant">
                          Solicitud sugerida por el cliente. Confirma o reprograma.
                        </p>
                        <button
                          onClick={() => handleCambiarEstado(activeCita.id, 'Confirmada')}
                          className="w-full bg-success text-white font-button text-button py-2.5 px-md rounded-lg hover:opacity-95 transition-all flex justify-center items-center gap-sm cursor-pointer shadow-sm font-bold"
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                          Confirmar Cita
                        </button>
                        <div className="grid grid-cols-2 gap-md mt-1">
                          <button
                            onClick={startRescheduling}
                            className="bg-[#252320] hover:bg-[#32302c] text-surface-soft border border-[#3a3834] font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer"
                          >
                            Proponer Cambio
                          </button>
                          <button
                            onClick={() => handleCambiarEstado(activeCita.id, 'Rechazada')}
                            className="bg-[#252320] hover:bg-[#32302c] text-error border border-[#3a3834] font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer"
                          >
                            Rechazar Cita
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Block Manual Modal */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-canvas border border-hairline rounded-xl p-lg w-full max-w-md shadow-xl"
          >
            <h3 className="font-title-lg text-title-lg text-ink font-bold mb-md">Añadir Bloqueo Manual</h3>
            <form onSubmit={handleAddManualBlock} className="flex flex-col gap-md">
              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Título / Motivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mantimiento Quirófano..."
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={newBlockStart}
                    onChange={(e) => setNewBlockStart(e.target.value)}
                    className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={newBlockEnd}
                    onChange={(e) => setNewBlockEnd(e.target.value)}
                    className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex gap-md justify-end mt-lg">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-4 py-2 font-button text-button border border-hairline rounded-lg hover:bg-surface-soft cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-button text-button bg-primary text-on-primary rounded-lg hover:bg-primary-active cursor-pointer"
                >
                  Crear Bloqueo
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
