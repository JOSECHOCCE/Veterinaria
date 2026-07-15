import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import PortalClienteService from '../../services/portalCliente.service';
import type { SolicitarCitaPortalDto } from '../../services/portalCliente.service';
import PageHeader from '../../components/common/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza?: string;
  fechaNacimiento?: string;
  sexo?: string;
  color?: string;
  alergiasConocidas?: string;
  peso?: number;
}

interface Servicio {
  id: number;
  nombre: string;
  duracionMinutos: number;
  precio: number;
  descripcion?: string;
}

interface Veterinario {
  id: number;
  nombre: string;
  especialidad?: string;
}

interface HorarioBloque {
  value: string; // "yyyy-MM-ddTHH:mm"
  text: string;  // "HH:mm"
}

export default function NuevoFlujoCita() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catalog Data
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [horarios, setHorarios] = useState<HorarioBloque[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // Selected Data
  const [selectedMascotaId, setSelectedMascotaId] = useState<number>(0);
  const [selectedServicioId, setSelectedServicioId] = useState<number>(0);
  const [selectedVeterinarioId, setSelectedVeterinarioId] = useState<number>(0);
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedHoraBlock, setSelectedHoraBlock] = useState<string>(''); // "yyyy-MM-ddTHH:mm"
  const [motivo, setMotivo] = useState('');
  
  // Search query for services
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [activeShift, setActiveShift] = useState<'Mañana' | 'Tarde'>('Mañana');
  const [selectedDoctorCategory, setSelectedDoctorCategory] = useState<'Todos' | 'Medicina Interna' | 'Cirugía' | 'Dermatología'>('Todos');

  // Temporizador y reserva temporal
  const [timer, setTimer] = useState(300); // 5 minutos (300 segundos)
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cargar catálogos básicos en el inicio
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar mascotas del cliente
        const resMascotas = await PortalClienteService.getMisMascotas();
        // Cargar servicios activos
        const resServicios = await PortalClienteService.getServiciosActivos();
        // Cargar veterinarios activos
        const resVeterinarios = await PortalClienteService.getVeterinariosActivos();

        const serviciosList = resServicios.data?.servicios || resServicios.data?.Servicios || resServicios.data || [];
        const rawVeterinariosList = resVeterinarios.data?.veterinarios || resVeterinarios.data?.Veterinarios || resVeterinarios.data || [];
        const veterinariosList = Array.isArray(rawVeterinariosList)
          ? rawVeterinariosList.map((v: any) => v.veterinario || v.Veterinario || v)
          : [];

        if (resMascotas.success) setMascotas(resMascotas.data || []);
        if (resServicios.success) setServicios(serviciosList);
        if (resVeterinarios.success) setVeterinarios(veterinariosList);
        
        // Autoseleccionar primera mascota, servicio y veterinario si existen
        if (resMascotas.success && resMascotas.data?.length > 0) setSelectedMascotaId(resMascotas.data[0].id);
        if (resServicios.success && serviciosList.length > 0) setSelectedServicioId(serviciosList[0].id);
        if (resVeterinarios.success && veterinariosList.length > 0) setSelectedVeterinarioId(veterinariosList[0].id);

        // Poner fecha de mañana por defecto
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        setSelectedFecha(tom.toISOString().split('T')[0]);

      } catch {
        setError('Error al cargar la información del formulario de citas.');
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  // Cargar bloques de horarios disponibles cuando cambia veterinario o fecha
  useEffect(() => {
    const loadHorarios = async () => {
      if (!selectedVeterinarioId || !selectedFecha) return;
      try {
        setLoadingHorarios(true);
        setHorarios([]);
        const res = await PortalClienteService.getHorariosDisponibles(selectedVeterinarioId, selectedFecha);
        if (res.success && res.data) {
          setHorarios(res.data);
        }
      } catch (err) {
        console.error('Error al cargar horarios disponibles:', err);
      } finally {
        setLoadingHorarios(false);
      }
    };

    loadHorarios();
  }, [selectedVeterinarioId, selectedFecha]);

  // Manejar el temporizador regresivo de 5 minutos
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      alert('La reserva temporal de tu cita ha expirado. Por favor, selecciona una nueva hora.');
      setStep(4); // Regresar al paso de hora
      setTimer(300);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Al ingresar al paso 5, creamos la reserva temporal en el backend
  const handleProceedToConfirmation = async () => {
    if (!selectedHoraBlock) return;
    try {
      setBookingError(null);
      setSubmitting(true);
      
      const payload = {
        mascotaId: selectedMascotaId,
        servicioId: selectedServicioId,
        fechaHora: selectedHoraBlock,
        veterinarioId: selectedVeterinarioId
      };
      
      const res = await PortalClienteService.reservarTemporalmente(payload);
      if (res.success) {
        setTimer(300);
        setTimerActive(true);
        setStep(5);
      } else {
        setBookingError(res.message || 'El horario seleccionado ya no está disponible.');
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Error de red al reservar el bloque.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCita = async () => {
    try {
      setSubmitting(true);
      setBookingError(null);
      
      const payload: SolicitarCitaPortalDto = {
        mascotaId: selectedMascotaId,
        servicioId: selectedServicioId,
        fechaHora: selectedHoraBlock,
        veterinarioId: selectedVeterinarioId,
        motivo: motivo.trim() || 'Control Rutinario'
      };
      
      const res = await PortalClienteService.solicitarCita(payload);
      if (res.success) {
        setTimerActive(false);
        setShowSuccessModal(true);
      } else {
        setBookingError(res.message || 'No se pudo confirmar tu cita.');
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Error al procesar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Citas desde mañana en adelante
    return today.toISOString().split('T')[0];
  };

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const filteredServicios = servicios.filter(s =>
    s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.descripcion && s.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getInitials = (nombre: string) => {
    return nombre.split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getPetImage = (nombre: string, especie: string) => {
    const esp = especie.toLowerCase();
    const name = nombre.toLowerCase();
    if (esp.includes('gato') || esp.includes('cat') || esp.includes('felin')) {
      return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop';
    }
    if (name.includes('rocky') || name.includes('bulldog')) {
      return 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop';
  };

  const getDoctorImage = (nombre: string) => {
    const name = nombre.toLowerCase();
    if (name.includes('sarah') || name.includes('jenkins')) {
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop';
    }
    if (name.includes('elena') || name.includes('rodriguez') || name.includes('ruiz')) {
      return 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=200&h=200&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop';
  };

  const getServiceIcon = (nombre: string) => {
    const name = nombre.toLowerCase();
    if (name.includes('consult') || name.includes('gener')) return 'stethoscope';
    if (name.includes('vacun') || name.includes('inmun')) return 'vaccines';
    if (name.includes('desparasit') || name.includes('bug')) return 'bug_report';
    if (name.includes('peluquer') || name.includes('corte') || name.includes('baño') || name.includes('estet')) return 'content_cut';
    return 'medical_services';
  };

  const getDoctorCategory = (nombre: string) => {
    const name = nombre.toLowerCase();
    if (name.includes('sarah') || name.includes('jenkins')) return 'Medicina Interna';
    if (name.includes('marcus') || name.includes('thorne')) return 'Cirugía';
    if (name.includes('elena') || name.includes('rodriguez') || name.includes('ruiz')) return 'Dermatología';
    return 'Medicina Interna';
  };

  const filteredVeterinarios = veterinarios.filter(v => {
    const matchesSearch = v.nombre.toLowerCase().includes(searchDoctorQuery.toLowerCase()) || 
      (v.especialidad && v.especialidad.toLowerCase().includes(searchDoctorQuery.toLowerCase()));
    
    if (selectedDoctorCategory === 'Todos') return matchesSearch;
    return matchesSearch && getDoctorCategory(v.nombre) === selectedDoctorCategory;
  });

  const renderCalendar = () => {
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 1);

    const baseDate = selectedFecha ? new Date(selectedFecha + 'T00:00:00') : minDate;
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const prevMonthDays = [];
    for (let i = 0; i < firstDayIndex; i++) {
      prevMonthDays.push(<div key={`prev-${i}`} className="p-3 text-outline opacity-20 text-[13px] font-medium cursor-default">-</div>);
    }

    const monthDays = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const targetDate = new Date(year, month, day);
      const isPast = targetDate < minDate && targetDate.toDateString() !== minDate.toDateString();
      const isSelected = selectedFecha === dayStr;

      monthDays.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => setSelectedFecha(dayStr)}
          className={`p-3 text-[13px] font-bold rounded-xl transition-all cursor-pointer ${
            isSelected
              ? 'bg-primary text-white shadow-md scale-105'
              : isPast
              ? 'text-outline opacity-25 cursor-not-allowed'
              : 'text-on-surface hover:bg-primary-container/10 hover:text-primary'
          }`}
        >
          {day}
        </button>
      );
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
      <div className="bg-white rounded-3xl border border-primary/10 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-primary uppercase tracking-wide">
            {monthNames[month]} {year}
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                const prevMonth = new Date(year, month - 1, 1);
                if (prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
                  setSelectedFecha(prevMonth.toISOString().split('T')[0]);
                }
              }}
              className="w-8 h-8 rounded-full border border-primary/15 flex items-center justify-center text-secondary hover:bg-surface-soft cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMonth = new Date(year, month + 1, 1);
                setSelectedFecha(nextMonth.toISOString().split('T')[0]);
              }}
              className="w-8 h-8 rounded-full border border-primary/15 flex items-center justify-center text-secondary hover:bg-surface-soft cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center gap-y-2">
          {weekdays.map((wd) => (
            <span key={wd} className="text-[10px] font-bold text-outline-variant uppercase tracking-wider mb-2">
              {wd}
            </span>
          ))}
          {prevMonthDays}
          {monthDays}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-10 bg-surface-card rounded-lg w-1/4"></div>
        <div className="h-96 bg-surface-card rounded-xl w-full mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Error al inicializar</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={() => navigate('/cliente/portal')}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10 relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[55%] h-[40%] rounded-full bg-primary/4 blur-[100px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute top-[40%] -right-[15%] w-[60%] h-[50%] rounded-full bg-[#5db872]/3 blur-[120px]" />
      </div>

      {/* Header */}
      <PageHeader
        title="Solicitar Nueva Cita"
        description="Completa los pasos para reservar un bloque de atención médica para tu mascota."
        backLink={{ to: '/cliente/mis-citas', label: 'Volver a Mis Citas' }}
        hasDivider={true}
      />

      {/* Wizard Container */}
      <div className="bg-canvas/80 backdrop-blur-md border border-hairline/60 rounded-3xl p-6 md:p-8 shadow-xl max-w-5xl w-full mx-auto relative overflow-hidden">
        
        {/* Barra de Progreso Unificada */}
        <div className="relative flex justify-between items-center mb-8 px-2 md:px-4 select-none">
          {/* Línea de fondo */}
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-surface-soft rounded-full -z-10"></div>
          {/* Línea activa con brillo */}
          <div 
            className="absolute left-6 top-4 h-0.5 bg-gradient-to-r from-primary to-accent-teal rounded-full -z-10 transition-all duration-500 shadow-[0_0_8px_rgba(143,72,47,0.4)]"
            style={{ width: `${(step - 1) * 23.5}%` }}
          ></div>

          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1.5 relative">
              <button
                type="button"
                disabled={step < s}
                onClick={() => {
                  if (s < 5) {
                    setTimerActive(false);
                    setStep(s);
                  }
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold border transition-all duration-300 shadow-sm outline-none ${
                  step === s
                    ? 'bg-primary text-on-primary border-primary scale-110 shadow-[0_0_12px_rgba(143,72,47,0.25)]'
                    : step > s
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300/40 hover:bg-emerald-100/50'
                    : 'bg-canvas text-body-muted border-hairline cursor-not-allowed'
                }`}
              >
                {step > s ? (
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                ) : (
                  s
                )}
              </button>
              <span
                className={`hidden md:inline text-[11px] font-bold tracking-wide uppercase ${
                  step === s ? 'text-primary' : 'text-body-muted'
                }`}
              >
                {s === 1 && 'Mascota'}
                {s === 2 && 'Servicio'}
                {s === 3 && 'Médico'}
                {s === 4 && 'Horario'}
                {s === 5 && 'Confirmar'}
              </span>
            </div>
          ))}
        </div>

        {/* Errors on wizard action */}
        {bookingError && (
          <div className="bg-error-container/85 backdrop-blur-sm border border-error/15 text-on-error-container p-4 rounded-xl text-body-sm flex items-center gap-2 mb-6 shadow-sm font-medium">
            <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
            <span>{bookingError}</span>
          </div>
        )}

        {/* Dynamic Step Content Wrapper */}
        <div className="min-h-[300px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {/* STEP 1: Mascota */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="border-b border-primary/10 pb-4 text-center">
                    <h3 className="font-bold text-lg text-on-surface mb-1 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">pets</span>
                      ¿A quién vamos a atender?
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">Selecciona a tu compañero para su próxima visita médica.</p>
                  </div>
                  
                  {mascotas.length === 0 ? (
                    <div className="border border-dashed border-primary/20 p-8 rounded-3xl text-center bg-white shadow-sm flex flex-col items-center">
                      <div className="bg-primary/5 p-4 rounded-full mb-3 text-primary">
                        <span className="material-symbols-outlined text-[32px]">pets</span>
                      </div>
                      <p className="font-bold text-sm text-on-surface">No tienes mascotas registradas.</p>
                      <p className="text-xs text-on-surface-variant mt-1 max-w-sm">Debes añadir primero a tu mascota en tu panel.</p>
                      <button
                        type="button"
                        onClick={() => navigate('/cliente/mis-mascotas?action=new')}
                        className="mt-4 bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-primary-active transition-all cursor-pointer shadow active:scale-95"
                      >
                        Registrar una Mascota primero
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                        {mascotas.map((m) => {
                          const isSelected = selectedMascotaId === m.id;
                          const petImg = getPetImage(m.nombre, m.especie);
                          return (
                            <div
                              key={m.id}
                              onClick={() => setSelectedMascotaId(m.id)}
                              className={`relative bg-white rounded-3xl p-6 border-2 flex flex-col items-center text-center cursor-pointer transition-all duration-300 group ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-md -translate-y-1'
                                  : 'border-primary/10 hover:border-primary-container hover:shadow-md'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-4 right-4 bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm">
                                  <span className="material-symbols-outlined text-xs font-bold">check</span>
                                </div>
                              )}
                              
                              <div className={`w-28 h-28 rounded-full overflow-hidden mb-4 p-1 bg-white border-2 transition-all ${isSelected ? 'border-primary shadow-sm' : 'border-transparent group-hover:border-primary-container'}`}>
                                <img
                                  className="w-full h-full object-cover rounded-full"
                                  alt={m.nombre}
                                  src={petImg}
                                />
                              </div>

                              <span className="bg-primary-container/20 text-primary px-3 py-0.5 rounded-full text-[10px] font-bold mb-2 uppercase tracking-wide">
                                {m.especie}
                              </span>
                              
                              <h4 className="font-bold text-base text-on-surface mb-0.5">{m.nombre}</h4>
                              <p className="text-xs text-on-surface-variant font-medium mb-3">{m.raza || 'Mestizo'} • {m.sexo || 'Macho'}</p>
                              
                              <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold mt-auto bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span>Plan Activo</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add New Pet (CTA Style) */}
                      <div className="flex justify-center mt-8">
                        <button
                          type="button"
                          onClick={() => navigate('/cliente/mis-mascotas?action=new')}
                          className="flex items-center gap-2 text-primary hover:text-primary-active transition-all group font-bold text-xs"
                        >
                          <span className="material-symbols-outlined text-[20px]">add_circle</span>
                          <span>Añadir otra mascota</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-8 border-t border-primary/10 pt-4">
                    <button
                      type="button"
                      disabled={mascotas.length === 0}
                      onClick={() => setStep(2)}
                      className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-white px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      Siguiente Paso
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Servicio */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div className="border-b border-primary/10 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="text-center md:text-left">
                      <h3 className="font-bold text-lg text-on-surface mb-1 flex items-center justify-center md:justify-start gap-2">
                        <span className="material-symbols-outlined text-primary text-[24px]">vaccines</span>
                        ¿Qué servicio necesita {mascotas.find(m => m.id === selectedMascotaId)?.nombre}?
                      </h3>
                      <p className="text-xs text-on-surface-variant font-medium">Selecciona el tipo de atención médica para tu mascota hoy.</p>
                    </div>
                    {/* Buscador de servicios */}
                    <div className="relative max-w-xs w-full mx-auto md:mx-0">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                      <input
                        type="text"
                        placeholder="Buscar servicio por nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/25 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredServicios.length === 0 ? (
                      <div className="col-span-full text-center py-10 text-xs font-bold text-on-surface-variant bg-white rounded-3xl border border-primary/10">
                        No se encontraron servicios que coincidan con la búsqueda.
                      </div>
                    ) : (
                      filteredServicios.map((s) => {
                        const isSelected = selectedServicioId === s.id;
                        const icon = getServiceIcon(s.nombre);
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedServicioId(s.id)}
                            className={`service-card cursor-pointer bg-white p-6 rounded-3xl border-2 flex flex-col items-center text-center transition-all duration-300 relative group hover:-translate-y-1 hover:shadow-md ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-primary/10'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-4 right-4 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                              </div>
                            )}

                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${
                              isSelected ? 'bg-primary text-white' : 'bg-primary-fixed-dim text-primary'
                            }`}>
                              <span className="material-symbols-outlined text-2xl">{icon}</span>
                            </div>

                            <h4 className="font-bold text-sm text-on-surface mb-1.5 leading-snug line-clamp-1">{s.nombre}</h4>
                            <p className="text-[11px] text-on-surface-variant font-medium mb-4 leading-relaxed line-clamp-2">
                              {s.descripcion || 'Tratamiento veterinario personalizado.'}
                            </p>

                            <div className="mt-auto pt-4 border-t border-primary/10 w-full flex justify-between items-center text-xs font-bold">
                              <div className="flex items-center gap-1 text-on-surface-variant">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span className="text-[10px]">{s.duracionMinutos} min</span>
                              </div>
                              <span className="text-primary font-bold text-sm">S/. {s.precio.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex justify-between mt-8 border-t border-primary/10 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-surface-container-low hover:bg-surface-variant text-on-surface px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-primary hover:bg-primary-active text-white px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      Siguiente Paso
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Veterinario */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="border-b border-primary/10 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="text-center md:text-left">
                      <h3 className="font-bold text-lg text-on-surface mb-1 flex items-center justify-center md:justify-start gap-2">
                        <span className="material-symbols-outlined text-primary text-[24px]">clinical_notes</span>
                        Elige a tu especialista de confianza
                      </h3>
                      <p className="text-xs text-on-surface-variant font-medium">Selecciona al profesional médico que atenderá a tu mascota hoy.</p>
                    </div>
                    {/* Buscador de veterinarios */}
                    <div className="relative max-w-xs w-full mx-auto md:mx-0">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                      <input
                        type="text"
                        placeholder="Buscar especialista..."
                        value={searchDoctorQuery}
                        onChange={(e) => setSearchDoctorQuery(e.target.value)}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/25 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Specialty filters toolbar */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {(['Todos', 'Medicina Interna', 'Cirugía', 'Dermatología'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedDoctorCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                          selectedDoctorCategory === cat
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-variant'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                    {filteredVeterinarios.length === 0 ? (
                      <div className="col-span-full text-center py-10 text-xs font-bold text-on-surface-variant bg-white rounded-3xl border border-primary/10">
                        No se encontraron especialistas en esta categoría.
                      </div>
                    ) : (
                      filteredVeterinarios.map((v) => {
                        const isSelected = selectedVeterinarioId === v.id;
                        const docImg = getDoctorImage(v.nombre);
                        const specialty = getDoctorCategory(v.nombre);
                        
                        return (
                          <div
                            key={v.id}
                            className={`doctor-card bg-white rounded-3xl p-6 transition-all duration-300 border-2 flex flex-col items-center text-center cursor-pointer group hover:-translate-y-1 hover:shadow-md ${
                              isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-primary/10'
                            }`}
                            onClick={() => setSelectedVeterinarioId(v.id)}
                          >
                            <div className="relative mb-4">
                              <img
                                className={`w-28 h-28 rounded-full object-cover border-4 transition-all ${isSelected ? 'border-primary shadow-sm' : 'border-primary-container/40 group-hover:border-primary-container'}`}
                                alt={v.nombre}
                                src={docImg}
                              />
                              <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-1 border-2 border-white flex items-center justify-center">
                                <span className="material-symbols-outlined text-[12px] block">verified</span>
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-base text-on-surface mb-1 leading-snug">{v.nombre}</h4>
                            <span className="bg-primary-container/20 text-primary px-3 py-0.5 rounded-full text-[9px] font-bold mb-4 uppercase tracking-wider">
                              {specialty}
                            </span>
                            
                            <div className="flex items-center gap-1.5 mb-5 text-amber-500 justify-center">
                              <span className="material-symbols-outlined fill-current text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span className="font-bold text-xs text-on-surface">4.9</span>
                              <span className="text-[10px] text-on-surface-variant font-medium">(100+ opiniones)</span>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-2.5 mb-5 text-left text-[11px] font-bold">
                              <div className="bg-surface-container-low p-2.5 rounded-2xl border border-primary/5">
                                <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Exp.</p>
                                <p className="text-on-surface text-xs font-bold">10+ años</p>
                              </div>
                              <div className="bg-surface-container-low p-2.5 rounded-2xl border border-primary/5">
                                <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Disp.</p>
                                <p className="text-primary text-xs font-bold">Hoy</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={`w-full py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                                isSelected
                                  ? 'bg-primary text-white shadow-sm'
                                  : 'bg-surface-container-low hover:bg-surface-variant text-on-surface font-semibold'
                              }`}
                            >
                              <span>{isSelected ? 'Seleccionado' : 'Seleccionar'}</span>
                              {isSelected && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex justify-between mt-8 border-t border-primary/10 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-surface-container-low hover:bg-surface-variant text-on-surface px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="bg-primary hover:bg-primary-active text-white px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      Siguiente Paso
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Fecha y Hora */}
              {step === 4 && (
                <div className="flex flex-col gap-6">
                  <div className="border-b border-primary/10 pb-4 text-center md:text-left">
                    <h3 className="font-bold text-lg text-on-surface mb-1 flex items-center justify-center md:justify-start gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">calendar_month</span>
                      Selecciona el mejor momento para la visita
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">Elige el día y la hora que mejor te convenga para la salud de tu mascota.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
                    
                    {/* Left Column: Calendar Card */}
                    <div className="lg:col-span-7">
                      {renderCalendar()}
                    </div>

                    {/* Right Column: Time Slots */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-primary/10 p-6 shadow-sm flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-6 text-primary">
                        <span className="material-symbols-outlined text-[20px]">schedule</span>
                        <h4 className="font-bold text-sm">Horarios disponibles</h4>
                      </div>

                      {/* Tabs Morning/Afternoon */}
                      <div className="flex p-1 bg-surface-container-low rounded-xl mb-6">
                        <button
                          type="button"
                          onClick={() => setActiveShift('Mañana')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            activeShift === 'Mañana'
                              ? 'bg-white text-primary shadow-sm'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          Mañana
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveShift('Tarde')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            activeShift === 'Tarde'
                              ? 'bg-white text-primary shadow-sm'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          Tarde
                        </button>
                      </div>

                      {/* Slots Grid */}
                      {loadingHorarios ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-xs text-on-surface-variant font-bold">
                          <span className="material-symbols-outlined animate-spin text-[24px] text-primary">sync</span>
                          <span>Buscando horarios libres...</span>
                        </div>
                      ) : (
                        <div>
                          {(() => {
                            const time = selectedHoraBlock ? selectedHoraBlock.split('T')[1] : '';
                            const slots = activeShift === 'Mañana' 
                              ? horarios.filter(h => parseInt(h.text.split(':')[0], 10) < 12)
                              : horarios.filter(h => parseInt(h.text.split(':')[0], 10) >= 12);
                            
                            if (slots.length === 0) {
                              return (
                                <div className="text-center py-10 text-xs font-bold text-on-surface-variant border border-dashed border-primary/10 rounded-2xl bg-surface-container-low/30">
                                  No hay bloques libres en este turno.
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                                {slots.map((h, idx) => {
                                  const isSelected = selectedHoraBlock === h.value;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedHoraBlock(h.value)}
                                      className={`py-3 px-2 border rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                        isSelected
                                          ? 'bg-primary border-primary text-white shadow-md'
                                          : 'border-primary/15 bg-white hover:bg-surface-soft hover:border-primary-container text-on-surface'
                                      }`}
                                    >
                                      {h.text}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                        <p className="text-[10px] text-primary font-bold leading-normal">
                          La duración estimada de la cita es de {servicios.find(s => s.id === selectedServicioId)?.duracionMinutos || 30} minutos.
                        </p>
                      </div>

                    </div>
                  </div>

                  <div className="flex justify-between mt-8 border-t border-primary/10 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-surface-container-low hover:bg-surface-variant text-on-surface px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={!selectedHoraBlock || submitting}
                      onClick={handleProceedToConfirmation}
                      className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-white px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      {submitting ? 'Reservando...' : 'Revisar Cita'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Confirmación */}
              {step === 5 && (
                <div className="flex flex-col gap-6">
                  <div className="border-b border-primary/10 pb-4 text-center md:text-left">
                    <h3 className="font-bold text-lg text-on-surface mb-1 flex items-center justify-center md:justify-start gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                      Confirmación de Solicitud
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">Revisa el desglose y confirma tu reserva temporal.</p>
                  </div>

                  {/* Timer Banner con barra regresiva */}
                  <div className="bg-amber-50/70 border border-amber-200/50 text-amber-800 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[24px] text-amber-600 animate-pulse">timer</span>
                      <div className="flex-grow">
                        <h4 className="font-bold text-xs leading-none">Bloque reservado por tiempo limitado</h4>
                        <p className="text-[10px] text-amber-700 mt-1">
                          Completa tu solicitud en los siguientes <strong className="font-bold text-xs text-primary">{formatTimer()} minutos</strong>.
                        </p>
                      </div>
                    </div>
                    {/* Barra de progreso de reserva */}
                    <div className="w-full h-1.5 bg-amber-200/40 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          timer > 120 ? 'bg-emerald-500' : timer > 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${(timer / 300) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Resumen Bento Grid del Ticket */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    
                    {/* Paciente y Servicio */}
                    <div className="flex items-start gap-4 p-4 rounded-3xl bg-surface-container-low/60 border border-primary/5 hover:bg-white transition-all shadow-sm">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container shrink-0">
                        <img 
                          className="w-full h-full object-cover" 
                          alt="Mascota"
                          src={getPetImage(
                            mascotas.find(m => m.id === selectedMascotaId)?.nombre || '', 
                            mascotas.find(m => m.id === selectedMascotaId)?.especie || ''
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-0.5">Paciente</p>
                        <h4 className="font-bold text-base text-primary leading-tight">
                          {mascotas.find(m => m.id === selectedMascotaId)?.nombre}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant font-semibold">
                          {mascotas.find(m => m.id === selectedMascotaId)?.raza || 'Mestizo'}
                        </p>
                      </div>
                    </div>

                    {/* Servicio */}
                    <div className="flex items-start gap-4 p-4 rounded-3xl bg-surface-container-low/60 border border-primary/5 hover:bg-white transition-all shadow-sm">
                      <div className="w-14 h-14 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">
                          {getServiceIcon(servicios.find(s => s.id === selectedServicioId)?.nombre || '')}
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-0.5">Servicio</p>
                        <h4 className="font-bold text-base text-on-surface leading-tight">
                          {servicios.find(s => s.id === selectedServicioId)?.nombre}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant font-semibold">
                          Duración: {servicios.find(s => s.id === selectedServicioId)?.duracionMinutos} min
                        </p>
                      </div>
                    </div>

                    {/* Médico */}
                    <div className="flex items-start gap-4 p-4 rounded-3xl bg-surface-container-low/60 border border-primary/5 hover:bg-white transition-all shadow-sm">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container shrink-0">
                        <img 
                          className="w-full h-full object-cover" 
                          alt="Veterinario"
                          src={getDoctorImage(veterinarios.find(v => v.id === selectedVeterinarioId)?.nombre || '')}
                        />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-0.5">Médico</p>
                        <h4 className="font-bold text-base text-on-surface leading-tight">
                          {veterinarios.find(v => v.id === selectedVeterinarioId)?.nombre}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant font-semibold">
                          {veterinarios.find(v => v.id === selectedVeterinarioId)?.especialidad || 'Veterinario General'}
                        </p>
                      </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="flex items-start gap-4 p-4 rounded-3xl bg-surface-container-low/60 border border-primary/5 hover:bg-white transition-all shadow-sm">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">calendar_today</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-0.5">Fecha y Hora</p>
                        <h4 className="font-bold text-base text-on-surface leading-tight">
                          {selectedFecha ? new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                        </h4>
                        <p className="text-[11px] text-primary font-bold">
                          a las {selectedHoraBlock ? selectedHoraBlock.split('T')[1] : ''}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Resumen Costo Ticket */}
                  <div className="bg-surface-soft border border-primary/10 rounded-3xl p-5 flex justify-between items-center mt-2 shadow-inner">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Costo sugerido de atención</span>
                    <span className="text-xl font-bold text-primary bg-white px-5 py-2 rounded-2xl border border-primary/10 shadow-sm">
                      S/. {servicios.find(s => s.id === selectedServicioId)?.precio.toFixed(2)}
                    </span>
                  </div>

                  {/* Motivo de la Cita */}
                  <div className="flex flex-col gap-2 mt-2 text-left">
                    <label htmlFor="booking-reason" className="text-xs font-bold text-on-surface">
                      Motivo de la consulta / Síntomas observados (Opcional)
                    </label>
                    <textarea
                      id="booking-reason"
                      rows={3}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Describe brevemente el motivo de la visita o algún síntoma que presente..."
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-between mt-6 border-t border-primary/10 pt-4">
                    <button
                      type="button"
                      onClick={() => { setTimerActive(false); setStep(4); }}
                      className="bg-surface-container-low hover:bg-surface-variant text-on-surface px-8 py-3 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmCita}
                      className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-white px-8 py-3 rounded-full text-xs font-bold cursor-pointer shadow-md font-bold transition-all active:scale-95"
                    >
                      {submitting ? 'Confirmando...' : 'Confirmar y Solicitar Cita'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Modal de Éxito Superpuesto Animado */}
      {showSuccessModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-[#141413]/55 backdrop-blur-md"></div>
          
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-canvas border border-hairline/60 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 p-6 md:p-8 text-center flex flex-col items-center"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-success to-accent-teal"></div>

            {/* Checkmark SVG Animado */}
            <div className="mb-6 mt-3">
              <svg className="success-checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ width: '60px', height: '60px' }}>
                <circle className="circle" cx="26" cy="26" r="25" fill="none" />
                <path className="check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>

            <h3 className="font-title-lg text-title-lg text-ink font-bold mb-2">
              ¡Solicitud Enviada!
            </h3>
            <p className="font-body-sm text-body-sm text-body-muted mb-6 px-1 leading-relaxed">
              Tu cita para <strong className="font-semibold text-ink">{mascotas.find(m => m.id === selectedMascotaId)?.nombre}</strong> ha sido solicitada con éxito. Revisaremos el bloque seleccionado y te confirmaremos a la brevedad.
            </p>

            {/* Resumen Compacto Ticket */}
            <div className="bg-surface-soft border border-hairline/60 rounded-2xl p-4 mb-6 text-left text-[13px] space-y-2 w-full font-medium">
              <div className="flex justify-between items-center">
                <span className="text-body-muted">Servicio:</span>
                <span className="font-bold text-ink">{servicios.find(s => s.id === selectedServicioId)?.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-muted">Médico:</span>
                <span className="font-bold text-ink">{veterinarios.find(v => v.id === selectedVeterinarioId)?.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-muted">Fecha y Hora:</span>
                <span className="font-bold text-primary">
                  {selectedFecha ? new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} - {selectedHoraBlock ? selectedHoraBlock.split('T')[1] : ''}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/cliente/mis-citas');
              }}
              className="w-full bg-primary hover:bg-primary-active text-on-primary font-bold py-3.5 rounded-full font-button text-button transition-all cursor-pointer shadow-md active:scale-95"
            >
              Entendido
            </button>
          </motion.div>
        </div>,
        document.body
      )}

    </div>
  );
}
