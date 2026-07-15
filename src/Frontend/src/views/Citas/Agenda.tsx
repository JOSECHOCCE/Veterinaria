import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'semanal' | 'solicitudes'>('semanal');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Filters
  const [selectedVet, setSelectedVet] = useState<string>('all');
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([
    'Confirmada', 'EnEspera', 'EnAtencion', 'Reprogramada'
  ]);
  
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

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vetRes = await VeterinariosService.getVeterinarios();
      if (vetRes.success && vetRes.data) {
        setVeterinarios(vetRes.data.veterinarios.map((v: any) => v.veterinario) || []);
      }

      // Fetch appointments for +/- 15 days around selected date
      const baseDate = new Date(selectedDate + 'T00:00:00');
      const start = new Date(baseDate);
      start.setDate(start.getDate() - 15);
      const end = new Date(baseDate);
      end.setDate(end.getDate() + 15);

      const startIso = start.toISOString().split('T')[0] + 'T00:00:00';
      const endIso = end.toISOString().split('T')[0] + 'T23:59:59';

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

  // Handle URL actions
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      navigate('/admin/agenda/nueva');
    }
  }, [searchParams, navigate]);

  // Load client details
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

  // Load availability slots
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
      if (activeCita && activeCita.id === id) {
        setActiveCita({
          ...activeCita,
          extendedProps: { ...activeCita.extendedProps, estado: nuevoEstado },
        });
      }
      fetchData();
    } catch (err: any) {
      console.error('Error changing state:', err);
      toast.error(err.response?.data?.message || 'Error al cambiar el estado.');
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await CitasService.cancelarCita(id);
      toast.success('Cita cancelada con éxito.');
      if (activeCita && activeCita.id === id) {
        setActiveCita({
          ...activeCita,
          extendedProps: { ...activeCita.extendedProps, estado: 'Cancelada' },
        });
      }
      fetchData();
    } catch (err: any) {
      console.error('Error canceling appointment:', err);
      toast.error(err.response?.data?.message || 'Error al cancelar la cita.');
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

  // Generate week dates based on selectedDate starting from Monday
  const getWeekDays = () => {
    const baseDate = new Date(selectedDate + 'T00:00:00');
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start on Monday
    const monday = new Date(baseDate.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();

  // Navigation helpers
  const navigateWeek = (direction: 'prev' | 'next') => {
    const baseDate = new Date(selectedDate + 'T00:00:00');
    baseDate.setDate(baseDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(baseDate.toISOString().split('T')[0]);
  };

  const getWeekRangeLabel = () => {
    const first = weekDays[0];
    const last = weekDays[6];
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${first.toLocaleDateString('es-ES', options)} - ${last.toLocaleDateString('es-ES', { ...options, year: 'numeric' })}`;
  };

  // Filters calculation
  const filteredCitas = citas.filter((cita) => {
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

  const solicitudesCitas = citas.filter(
    (cita) => cita.extendedProps.estado === 'PendienteConfirmacion'
  );

  const toggleStatusFilter = (status: string) => {
    setActiveStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  if (loading && citas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow p-lg">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none p-gutter">
      {/* Page Header */}
      <PageHeader
        title="Agenda de la Clínica"
        description={getWeekRangeLabel()}
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
              className="flex items-center justify-center gap-xs px-lg py-2.5 bg-primary text-on-primary rounded-lg font-button text-button hover:bg-primary-active transition-all cursor-pointer shadow-sm animate-pulse"
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
          onClick={() => setActiveTab('semanal')}
          className={`px-lg py-3 font-title-sm text-title-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'semanal' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          Agenda Semanal
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
      </div>

      {activeTab === 'semanal' && (
        <div className="flex flex-col lg:flex-row gap-gutter flex-grow overflow-hidden min-h-0">
          {/* Left Column: Quick Glance & Navigation (3 cols equivalent) */}
          <div className="w-full lg:w-72 flex flex-col gap-md shrink-0">
            {/* Quick stats */}
            <div className="bg-surface-card rounded-xl border border-hairline p-md shadow-sm">
              <h3 className="font-title-md text-title-md text-ink border-b border-hairline pb-2 mb-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">today</span>
                Hoy
              </h3>
              <div className="grid grid-cols-2 gap-md mb-md">
                <div className="flex flex-col items-center p-3 bg-surface-container-low rounded-lg">
                  <span className="font-headline-lg text-headline-lg text-primary">{filteredCitas.length}</span>
                  <span className="text-[10px] text-secondary mt-1 text-center font-bold">Total Citas</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-error-container/30 rounded-lg">
                  <span className="font-headline-lg text-headline-lg text-error">{solicitudesCitas.length}</span>
                  <span className="text-[10px] text-on-error-container mt-1 text-center font-bold">Pendientes</span>
                </div>
              </div>
              <div className="space-y-xs text-body-sm font-medium">
                {['Confirmada', 'EnEspera', 'EnAtencion', 'Completada'].map((status) => {
                  const count = filteredCitas.filter(c => c.extendedProps.estado === status).length;
                  const label = status === 'EnEspera' ? 'En Sala' : status === 'EnAtencion' ? 'En Consulta' : status;
                  return (
                    <div key={status} className="flex justify-between items-center py-1">
                      <span className="text-secondary">{label}</span>
                      <span className="text-ink font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date Pickers & Vet Filter */}
            <div className="bg-surface-card rounded-xl border border-hairline p-md shadow-sm flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-1.5 rounded-full hover:bg-surface-soft border border-hairline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-canvas border border-hairline rounded-lg py-1 px-2 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer text-center"
                />
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-1.5 rounded-full hover:bg-surface-soft border border-hairline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>

              <div>
                <label className="text-caption font-caption text-secondary block mb-1">Filtrar Veterinario</label>
                <div className="relative">
                  <select
                    value={selectedVet}
                    onChange={(e) => setSelectedVet(e.target.value)}
                    className="w-full bg-canvas border border-hairline rounded-lg pl-3 pr-8 py-2 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer appearance-none"
                  >
                    <option value="all">Todos los Médicos</option>
                    {veterinarios.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.nombre}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap gap-xs pt-2 border-t border-hairline/60">
                {['Confirmada', 'EnEspera', 'EnAtencion', 'Reprogramada'].map((status) => {
                  const isActive = activeStatusFilters.includes(status);
                  const colors = ESTADO_COLORS[status] || { text: 'text-secondary', bg: 'bg-surface-dim' };
                  const label = status === 'EnEspera' ? 'En Sala' : status === 'EnAtencion' ? 'En Consulta' : status;
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold cursor-pointer transition-all ${
                        isActive
                          ? `${colors.bg} ${colors.text} border-primary/20 shadow-xs`
                          : 'bg-canvas text-secondary border-hairline opacity-65 hover:opacity-85'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[10px]">{colors.icon}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Grid View */}
          <div className="flex-grow bg-surface-card rounded-xl border border-hairline shadow-sm overflow-hidden flex flex-col min-w-0 relative">
            {/* Week Days Header */}
            <div className="flex border-b border-hairline bg-surface-soft/60 sticky top-0 z-20">
              {/* Hour scale spacer */}
              <div className="w-16 border-r border-hairline shrink-0" />
              {/* Days Columns */}
              <div className="flex-grow grid grid-cols-7">
                {weekDays.map((day, idx) => {
                  const isToday = new Date().toDateString() === day.toDateString();
                  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
                  const [wday, dnum] = day.toLocaleDateString('es-ES', options).split(' ');
                  return (
                    <div
                      key={idx}
                      className={`py-3 text-center border-r border-hairline last:border-r-0 flex flex-col items-center justify-center relative ${
                        isToday ? 'bg-primary/5' : ''
                      }`}
                    >
                      {isToday && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                      <span className={`font-caption text-caption uppercase tracking-wider ${isToday ? 'text-primary font-bold' : 'text-secondary'}`}>
                        {wday}
                      </span>
                      <span className={`font-title-md text-title-md mt-1 ${isToday ? 'text-primary font-bold' : 'text-ink'}`}>
                        {dnum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Calendar Body */}
            <div className="flex-1 overflow-y-auto relative bg-canvas select-none" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <div className="flex min-h-[1248px] relative">
                {/* Hours column labels */}
                <div className="w-16 border-r border-hairline shrink-0 flex flex-col text-right pr-2 pt-2 bg-surface-card sticky left-0 z-10">
                  {HOURS.map((hour) => {
                    const label = `${String(hour > 12 ? hour - 12 : hour).padStart(2, '0')}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
                    return (
                      <div key={hour} className="h-24 relative">
                        <span className="font-caption text-[10px] text-secondary absolute -top-2 right-2">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grid columns */}
                <div className="flex-grow grid grid-cols-7 relative">
                  {/* Grid hour background lines */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col pt-2">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-24 border-t border-hairline/60 w-full" />
                    ))}
                  </div>

                  {/* Day Columns containing appointments */}
                  {weekDays.map((day, colIdx) => {
                    const dayStr = day.toISOString().split('T')[0];
                    const appointmentsForDay = filteredCitas.filter((c) => {
                      const cDate = new Date(c.start).toISOString().split('T')[0];
                      return cDate === dayStr;
                    });

                    return (
                      <div key={colIdx} className="border-r border-hairline/50 relative min-h-[1248px]">
                        {appointmentsForDay.map((c) => {
                          const startDate = new Date(c.start);
                          const startHour = startDate.getHours();
                          const startMin = startDate.getMinutes();
                          const durationMin = c.extendedProps.duracion || 45;

                          // Positioning math: 1 hour = 96px (h-24)
                          const topOffset = (startHour - 8) * 96 + (startMin / 60) * 96 + 8; // +8 for top margin adjustment
                          const cardHeight = (durationMin / 60) * 96 - 4; // -4 for padding space

                          const colors = ESTADO_COLORS[c.extendedProps.estado] || {
                            bg: 'bg-surface-soft',
                            border: 'border-l-4 border-hairline',
                            text: 'text-secondary',
                            icon: 'circle',
                          };

                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setActiveCita(c);
                                setIsRescheduling(false);
                                setShowDetail(true);
                              }}
                              style={{
                                top: `${topOffset}px`,
                                height: `${cardHeight}px`,
                              }}
                              className={`absolute left-1 right-1 rounded-r border-l-4 ${colors.bg} ${colors.border} p-1.5 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md cursor-pointer hover:-translate-y-0.5 duration-200 group z-10 transition-all`}
                            >
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex justify-between items-start gap-1">
                                  <span className={`font-title-sm text-[11px] font-bold truncate ${colors.text} leading-tight`}>
                                    {c.extendedProps.servicio}
                                  </span>
                                  <span className={`material-symbols-outlined text-[12px] shrink-0 ${colors.text}`}>
                                    {colors.icon}
                                  </span>
                                </div>
                                <div className="font-body-sm text-[12px] text-ink font-semibold truncate leading-tight">
                                  {c.extendedProps.mascota}
                                </div>
                                <div className="text-[10px] text-secondary truncate leading-tight">
                                  {c.extendedProps.propietario}
                                </div>
                              </div>
                              {cardHeight > 55 && (
                                <div className="text-[9px] text-body-muted flex items-center gap-0.5 font-medium border-t border-hairline/20 pt-1 mt-1 truncate">
                                  <span className="material-symbols-outlined text-[10px]">person</span>
                                  {c.extendedProps.veterinario?.split(' ')[0]}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
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
                          placeholder="Ej: No disponible este especialista..."
                          className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-body-sm focus:outline-none focus:border-error transition-all text-ink"
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

      {/* Detail Cita Drawer / Side panel overlay */}
      <AnimatePresence>
        {showDetail && activeCita && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-surface-container-lowest z-50 shadow-2xl flex flex-col p-lg border-l border-hairline overflow-y-auto"
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
              </div>

              {isRescheduling ? (
                /* Reprogram Form Inline inside Drawer */
                <form onSubmit={handleReprogramar} className="flex flex-col gap-md flex-1">
                  <h3 className="font-title-md text-title-md text-ink font-bold mb-xs">Reprogramar Consulta</h3>
                  
                  <div>
                    <label className="font-caption text-caption text-secondary block mb-1">Veterinario Asignado</label>
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
                    <label className="font-caption text-caption text-secondary block mb-1">Nueva Fecha</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="bg-canvas border border-hairline rounded-lg w-full py-2 px-3 text-body-sm text-ink focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-caption text-caption text-secondary block mb-1">Nuevo Horario</label>
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
                    <label className="font-caption text-caption text-secondary block mb-1">Motivo de Reprogramación</label>
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

                  {/* Cost Summary & Actions */}
                  <section className="bg-canvas border border-hairline rounded-xl p-md shadow-xs flex flex-col gap-sm">
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-secondary font-medium">Precio del Servicio:</span>
                      <span className="text-ink font-bold font-code text-body-lg">
                        ${activeCita.extendedProps.precio?.toFixed(2) || '0.00'}
                      </span>
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
                        {user?.role === 'Recepcionista' ? (
                          !activeCita.extendedProps.hasTriage ? (
                            <>
                              <p className="font-body-sm text-body-sm text-outline-variant">
                                El paciente se encuentra en sala de espera. Registra sus signos vitales para enviarlo a la cola de atención.
                              </p>
                              <button
                                onClick={() => navigate('/admin/triage', {
                                  state: {
                                    citaId: activeCita.id,
                                    mascotaId: activeCita.extendedProps.mascotaId,
                                    mascotaNombre: activeCita.extendedProps.mascota || activeCita.title?.split(' - ')[0],
                                    motivo: activeCita.extendedProps.motivo
                                  }
                                })}
                                className="w-full bg-[#4fd1c5] hover:bg-[#3dbdb1] text-white font-button text-button py-2.5 px-md rounded-lg transition-all flex justify-center items-center gap-sm cursor-pointer shadow-sm font-bold"
                              >
                                <span className="material-symbols-outlined">edit_note</span>
                                Registrar Triage
                              </button>
                            </>
                          ) : (
                            <div className="bg-[#e6f4ea]/10 border border-[#137333]/20 text-[#137333] p-3 rounded-lg text-center text-xs font-semibold">
                              ✓ Triaje registrado. Paciente en cola de espera médica.
                            </div>
                          )
                        ) : (
                          // Rol Veterinario / Admin
                          activeCita.extendedProps.hasTriage ? (
                            <>
                              <p className="font-body-sm text-body-sm text-outline-variant">
                                El paciente tiene el triaje listo. Inicia su consulta clínica.
                              </p>
                              <button
                                onClick={() => handleCambiarEstado(activeCita.id, 'EnAtencion')}
                                className="w-full bg-accent-teal hover:opacity-95 text-ink font-button text-button py-2.5 px-md rounded-lg transition-all flex justify-center items-center gap-sm cursor-pointer shadow-sm font-bold"
                              >
                                <span className="material-symbols-outlined">stethoscope</span>
                                Iniciar Atención Clínica
                              </button>
                            </>
                          ) : (
                            <div className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-[#ba1a1a] p-3 rounded-lg text-center text-xs font-semibold">
                              ⚠️ Paciente en sala. Esperando registro de triaje en recepción.
                            </div>
                          )
                        )}
                        <div className="grid grid-cols-2 gap-md mt-1">
                          <button
                            onClick={() => handleCambiarEstado(activeCita.id, 'NoAsistio')}
                            className="bg-[#252320] hover:bg-[#32302c] text-surface-soft border border-[#3a3834] font-button text-button py-2 px-md rounded-lg transition-colors cursor-pointer"
                          >
                            No Asistió
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
    </div>
  );
}
