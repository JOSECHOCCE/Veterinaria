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
      <div className="bg-canvas/80 backdrop-blur-md border border-hairline/60 rounded-3xl p-6 md:p-8 shadow-xl max-w-3xl w-full mx-auto relative overflow-hidden">
        
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
                <div className="flex flex-col gap-4">
                  <div className="border-b border-hairline/60 pb-3">
                    <h3 className="font-title-lg text-title-lg text-ink font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">pets</span>
                      ¿A quién vamos a atender?
                    </h3>
                    <p className="font-body-sm text-body-sm text-body-muted mt-1">Selecciona a la mascota que recibirá el servicio médico.</p>
                  </div>
                  
                  {mascotas.length === 0 ? (
                    <div className="border border-dashed border-hairline p-8 rounded-2xl text-center bg-canvas/30 backdrop-blur-sm shadow-sm flex flex-col items-center">
                      <div className="bg-surface-card p-3 rounded-full border border-hairline mb-3 text-body-muted">
                        <span className="material-symbols-outlined text-[32px]">pets</span>
                      </div>
                      <p className="font-title-md text-title-md text-ink font-bold">No tienes mascotas registradas.</p>
                      <p className="text-body-sm text-body-muted mt-1 max-w-sm">Debes añadir primero a tu mascota en tu panel.</p>
                      <button
                        type="button"
                        onClick={() => navigate('/cliente/mis-mascotas?action=new')}
                        className="mt-4 bg-primary text-on-primary px-6 py-2.5 rounded-full font-button text-button hover:bg-primary-active transition-all cursor-pointer shadow active:scale-95"
                      >
                        Registrar una Mascota primero
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {mascotas.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMascotaId(m.id)}
                          className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all duration-300 relative overflow-hidden ${
                            selectedMascotaId === m.id
                              ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                              : 'border-hairline bg-canvas/40 backdrop-blur-sm hover:bg-surface-soft/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${selectedMascotaId === m.id ? 'bg-primary text-on-primary' : 'bg-surface-soft text-primary'}`}>
                              <span className="material-symbols-outlined text-[24px]">pets</span>
                            </div>
                            <div>
                              <h4 className="font-title-md text-title-md text-ink font-bold">{m.nombre}</h4>
                              <p className="text-body-sm text-body-muted mt-0.5">{m.especie}</p>
                            </div>
                          </div>
                          {selectedMascotaId === m.id && (
                            <div className="bg-primary text-on-primary p-1 rounded-full flex items-center justify-center shrink-0 shadow-sm animate-scale-in">
                              <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end mt-8 border-t border-hairline/60 pt-4">
                    <button
                      type="button"
                      disabled={mascotas.length === 0}
                      onClick={() => setStep(2)}
                      className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer transition-all active:scale-95 shadow-sm font-bold"
                    >
                      Siguiente Paso
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Servicio */}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-hairline/60 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="font-title-lg text-title-lg text-ink font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[24px]">vaccines</span>
                        Selecciona el Servicio
                      </h3>
                      <p className="font-body-sm text-body-sm text-body-muted mt-1">Elige el procedimiento médico o control preventivo requerido.</p>
                    </div>
                    {/* Buscador de servicios */}
                    <div className="relative max-w-xs w-full">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-[18px]">search</span>
                      <input
                        type="text"
                        placeholder="Buscar servicio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-card border border-hairline rounded-xl pl-9 pr-4 py-2 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredServicios.length === 0 ? (
                      <div className="text-center py-8 text-body-muted font-medium bg-canvas/30 rounded-xl border border-hairline/40">
                        No se encontraron servicios que coincidan con la búsqueda.
                      </div>
                    ) : (
                      filteredServicios.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedServicioId(s.id)}
                          className={`p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer transition-all duration-300 ${
                            selectedServicioId === s.id
                              ? 'border-primary bg-primary/5 shadow-sm scale-[1.005]'
                              : 'border-hairline bg-canvas/40 backdrop-blur-sm hover:bg-surface-soft/80'
                          }`}
                        >
                          <div className="flex-1 pr-4">
                            <h4 className="font-title-md text-title-md text-ink font-bold">{s.nombre}</h4>
                            <p className="text-body-sm text-body-muted mt-1 font-medium flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-accent-teal">schedule</span>
                              <span>Duración: {s.duracionMinutos} min</span>
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className="font-title-lg text-title-lg text-primary font-bold bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                              S/. {s.precio.toFixed(2)}
                            </span>
                            {selectedServicioId === s.id && (
                              <div className="bg-primary text-on-primary p-1 rounded-full flex items-center justify-center shrink-0 shadow-sm animate-scale-in">
                                <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-between mt-8 border-t border-hairline/60 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-surface-card border border-hairline hover:bg-surface-soft hover:border-outline-variant text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer font-bold shadow-sm"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-primary hover:bg-primary-active text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer transition-all active:scale-95 shadow-sm font-bold"
                    >
                      Siguiente Paso
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Veterinario */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-hairline/60 pb-3">
                    <h3 className="font-title-lg text-title-lg text-ink font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">clinical_notes</span>
                      Selecciona el Veterinario
                    </h3>
                    <p className="font-body-sm text-body-sm text-body-muted mt-1">Elige un médico especialista, o el médico asignado por defecto.</p>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-2">
                    {veterinarios.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVeterinarioId(v.id)}
                        className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all duration-300 ${
                          selectedVeterinarioId === v.id
                            ? 'border-primary bg-primary/5 shadow-sm scale-[1.005]'
                            : 'border-hairline bg-canvas/40 backdrop-blur-sm hover:bg-surface-soft/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Circular initial avatar con gradiente */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                            selectedVeterinarioId === v.id
                              ? 'bg-gradient-to-tr from-primary to-[#b86d5c] text-on-primary'
                              : 'bg-gradient-to-tr from-surface-soft to-hairline/60 text-primary'
                          }`}>
                            {getInitials(v.nombre)}
                          </div>
                          <div>
                            <h4 className="font-title-md text-title-md text-ink font-bold">{v.nombre}</h4>
                            <p className="text-body-sm text-body-muted mt-0.5 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal"></span>
                              {v.especialidad || 'Médico Veterinario General'}
                            </p>
                          </div>
                        </div>
                        {selectedVeterinarioId === v.id && (
                          <div className="bg-primary text-on-primary p-1.5 rounded-full flex items-center justify-center shrink-0 shadow-sm animate-scale-in">
                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8 border-t border-hairline/60 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-surface-card border border-hairline hover:bg-surface-soft hover:border-outline-variant text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer font-bold shadow-sm"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="bg-primary hover:bg-primary-active text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer transition-all active:scale-95 shadow-sm font-bold"
                    >
                      Siguiente Paso
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Fecha y Hora */}
              {step === 4 && (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-hairline/60 pb-3">
                    <h3 className="font-title-lg text-title-lg text-ink font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">calendar_month</span>
                      Selecciona Fecha y Hora
                    </h3>
                    <p className="font-body-sm text-body-sm text-body-muted mt-1">Las citas deben solicitarse desde mañana en adelante.</p>
                  </div>
                  
                  {/* Dos columnas en Desktop para optimización espacial */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    {/* Fecha Picker */}
                    <div className="flex flex-col gap-2">
                      <label className="font-label-sm text-ink font-bold text-[12px] uppercase tracking-wide">1. Seleccionar Fecha</label>
                      <input
                        type="date"
                        min={getMinDate()}
                        value={selectedFecha}
                        onChange={(e) => setSelectedFecha(e.target.value)}
                        className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer font-medium"
                      />
                    </div>

                    {/* Hora Picker (Slots en grilla compacta de 3 columnas) */}
                    <div className="flex flex-col gap-2">
                      <label className="font-label-sm text-ink font-bold text-[12px] uppercase tracking-wide">2. Horarios Disponibles</label>
                      
                      {loadingHorarios ? (
                        <div className="flex items-center justify-center gap-2 text-body-sm text-body-muted py-8 bg-canvas/30 rounded-xl border border-hairline/40">
                          <span className="material-symbols-outlined animate-spin text-[20px] text-primary">sync</span>
                          <span>Buscando bloques libres...</span>
                        </div>
                      ) : horarios.length === 0 ? (
                        <div className="text-body-sm text-body-muted py-8 px-4 border border-dashed border-hairline rounded-xl bg-canvas/30 text-center font-medium">
                          No hay bloques libres para este médico en la fecha elegida.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                          {horarios.map((h, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedHoraBlock(h.value)}
                              className={`py-2.5 px-2 border rounded-xl text-[13px] font-bold transition-all cursor-pointer active:scale-95 ${
                                selectedHoraBlock === h.value
                                  ? 'bg-primary border-primary text-on-primary shadow-md shadow-primary/15'
                                  : 'border-hairline bg-canvas/50 hover:bg-surface-soft hover:border-outline-variant text-ink'
                              }`}
                            >
                              {h.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between mt-8 border-t border-hairline/60 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-surface-card border border-hairline hover:bg-surface-soft hover:border-outline-variant text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer font-bold shadow-sm"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={!selectedHoraBlock || submitting}
                      onClick={handleProceedToConfirmation}
                      className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer transition-all active:scale-95 shadow-sm font-bold"
                    >
                      {submitting ? 'Reservando...' : 'Revisar Cita'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Confirmación y Temporizador (Diseño Ticket Troquelado) */}
              {step === 5 && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-hairline/60 pb-3">
                    <h3 className="font-title-lg text-title-lg text-ink font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                      Confirmación de Solicitud
                    </h3>
                    <p className="font-body-sm text-body-sm text-body-muted mt-1">Revisa el desglose de tu reserva temporal.</p>
                  </div>
                  
                  {/* Timer Banner con barra regresiva */}
                  <div className="bg-amber-50/70 border border-amber-200/50 text-amber-800 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[24px] text-amber-600 animate-pulse">timer</span>
                      <div className="flex-grow">
                        <h4 className="font-bold text-body-sm leading-none">Bloque reservado por tiempo limitado</h4>
                        <p className="text-[11px] text-amber-700 mt-1">
                          Completa tu solicitud en los siguientes <strong className="font-bold text-[13px] text-primary">{formatTimer()} minutos</strong>.
                        </p>
                      </div>
                    </div>
                    {/* Barra de progreso de reserva */}
                    <div className="w-full h-1.5 bg-amber-200/40 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          timer > 120 ? 'bg-success' : timer > 60 ? 'bg-amber-500' : 'bg-error'
                        }`}
                        style={{ width: `${(timer / 300) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Resumen Card estilo TICKET TROQUELADO */}
                  <div className="bg-canvas border border-hairline/60 rounded-2xl relative overflow-hidden shadow-inner p-5 space-y-4">
                    <div className="flex justify-between items-center text-body-sm font-medium">
                      <span className="text-body-muted">Paciente a atender:</span>
                      <span className="text-ink font-bold">{mascotas.find(m => m.id === selectedMascotaId)?.nombre}</span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm font-medium">
                      <span className="text-body-muted">Servicio solicitado:</span>
                      <span className="text-ink font-bold">{servicios.find(s => s.id === selectedServicioId)?.nombre}</span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm font-medium">
                      <span className="text-body-muted">Médico Veterinario:</span>
                      <span className="text-ink font-bold">{veterinarios.find(v => v.id === selectedVeterinarioId)?.nombre}</span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm font-medium">
                      <span className="text-body-muted">Fecha y Hora de la cita:</span>
                      <span className="text-ink font-bold">
                        {selectedFecha ? new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''} a las {selectedHoraBlock ? selectedHoraBlock.split('T')[1] : ''}
                      </span>
                    </div>

                    {/* Dotted separator line */}
                    <div className="border-t-2 border-dashed border-hairline/60 my-2 relative">
                      {/* Circular punch-outs on both edges */}
                      <div className="absolute -left-7 -top-2 w-4 h-4 bg-surface-card rounded-full border border-hairline/60 shadow-inner"></div>
                      <div className="absolute -right-7 -top-2 w-4 h-4 bg-surface-card rounded-full border border-hairline/60 shadow-inner"></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-body-muted text-body-sm font-bold uppercase tracking-wider">Costo sugerido</span>
                      <span className="text-primary font-bold text-[20px] bg-primary/5 px-4 py-1.5 rounded-xl border border-primary/10">
                        S/. {servicios.find(s => s.id === selectedServicioId)?.precio.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Motivo de la Cita */}
                  <div className="flex flex-col gap-2 mt-1">
                    <label htmlFor="booking-reason" className="font-label-sm text-ink font-bold text-[12px]">
                      Motivo de la consulta / Observación (Opcional)
                    </label>
                    <textarea
                      id="booking-reason"
                      rows={3}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ej. Control de oreja inflamada, vacuna anual, etc."
                      className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none font-medium"
                    ></textarea>
                  </div>

                  <div className="flex justify-between mt-6 border-t border-hairline/60 pt-4">
                    <button
                      type="button"
                      onClick={() => { setTimerActive(false); setStep(4); }}
                      className="bg-surface-card border border-hairline hover:bg-surface-soft hover:border-outline-variant text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer font-bold shadow-sm"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmCita}
                      className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer shadow-md font-bold transition-all active:scale-95"
                    >
                      {submitting ? 'Confirmando...' : 'Confirmar y Enviar'}
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
