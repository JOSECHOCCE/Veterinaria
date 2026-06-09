import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import PortalClienteService from '../../services/portalCliente.service';
import type { SolicitarCitaPortalDto } from '../../services/portalCliente.service';
import PageHeader from '../../components/common/PageHeader';

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
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Header */}
      <PageHeader
        title="Solicitar Nueva Cita"
        description="Completa los pasos para reservar un bloque de atención médica para tu mascota."
        backLink={{ to: '/cliente/mis-citas', label: 'Volver a Mis Citas' }}
        hasDivider={true}
      />

      {/* Wizard Container */}
      <div className="bg-surface-card border border-hairline rounded-xl p-6 shadow-sm max-w-3xl w-full mx-auto">
        
        {/* Step Indicator Bullets */}
        <div className="flex justify-between items-center mb-8 px-4 select-none">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition-colors ${
                  step === s
                    ? 'bg-primary text-on-primary border-primary'
                    : step > s
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-canvas text-body-muted border-hairline'
                }`}
              >
                {step > s ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  s
                )}
              </div>
              <span
                className={`hidden md:inline text-[13px] font-semibold ${
                  step === s ? 'text-primary' : 'text-body-muted'
                }`}
              >
                {s === 1 && 'Mascota'}
                {s === 2 && 'Servicio'}
                {s === 3 && 'Médico'}
                {s === 4 && 'Fecha y Hora'}
                {s === 5 && 'Confirmación'}
              </span>
              {s < 5 && <div className="hidden md:block w-8 h-px bg-hairline"></div>}
            </div>
          ))}
        </div>

        {/* Errors on wizard action */}
        {bookingError && (
          <div className="bg-error-container border border-error/15 text-on-error-container p-4 rounded-lg text-body-sm flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {bookingError}
          </div>
        )}

        {/* STEP 1: Mascota */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-title-lg text-title-lg text-ink font-bold">Paso 1: ¿A quién vamos a atender?</h3>
            <p className="font-body-sm text-body-sm text-body-muted">Selecciona a la mascota que recibirá el servicio médico.</p>
            
            {mascotas.length === 0 ? (
              <div className="border border-dashed border-hairline p-6 rounded-lg text-center bg-canvas">
                <p className="font-body-md text-body-md text-body-muted">No tienes mascotas registradas.</p>
                <button
                  type="button"
                  onClick={() => navigate('/cliente/mis-mascotas?action=new')}
                  className="mt-3 bg-primary text-on-primary px-4 py-2 rounded-full font-button text-button hover:bg-primary-active"
                >
                  Registrar una Mascota primero
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 mt-2">
                {mascotas.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMascotaId(m.id)}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 cursor-pointer transition-colors ${
                      selectedMascotaId === m.id
                        ? 'border-primary bg-primary/5'
                        : 'border-hairline bg-surface hover:bg-surface-soft'
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary text-[28px]">pets</span>
                    <div>
                      <h4 className="font-title-md text-title-md text-ink font-bold">{m.nombre}</h4>
                      <p className="text-body-sm text-body-muted">{m.especie}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                type="button"
                disabled={mascotas.length === 0}
                onClick={() => setStep(2)}
                className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer"
              >
                Siguiente Paso
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Servicio */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-title-lg text-title-lg text-ink font-bold">Paso 2: Selecciona el Servicio</h3>
            <p className="font-body-sm text-body-sm text-body-muted">Elige el procedimiento médico o control preventivo requerido.</p>
            
            <div className="flex flex-col gap-2.5 mt-2 max-h-[300px] overflow-y-auto pr-1">
              {servicios.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedServicioId(s.id)}
                  className={`p-4 rounded-lg border-2 flex justify-between items-center cursor-pointer transition-colors ${
                    selectedServicioId === s.id
                      ? 'border-primary bg-primary/5'
                      : 'border-hairline bg-surface hover:bg-surface-soft'
                  }`}
                >
                  <div>
                    <h4 className="font-title-md text-title-md text-ink font-bold">{s.nombre}</h4>
                    <p className="text-body-sm text-body-muted mt-0.5">Duración: {s.duracionMinutos} min</p>
                  </div>
                  <span className="font-title-md text-title-md text-primary font-bold">S/. {s.precio.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-surface-card border border-hairline hover:bg-surface-soft text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-primary hover:bg-primary-active text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer"
              >
                Siguiente Paso
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Veterinario */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-title-lg text-title-lg text-ink font-bold">Paso 3: Selecciona el Veterinario</h3>
            <p className="font-body-sm text-body-sm text-body-muted">Elige un médico especialista, o el médico asignado por defecto.</p>
            
            <div className="flex flex-col gap-2.5 mt-2">
              {veterinarios.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVeterinarioId(v.id)}
                  className={`p-4 rounded-lg border-2 flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedVeterinarioId === v.id
                      ? 'border-primary bg-primary/5'
                      : 'border-hairline bg-surface hover:bg-surface-soft'
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px] text-body-muted">person</span>
                  <div>
                    <h4 className="font-title-md text-title-md text-ink font-bold">{v.nombre}</h4>
                    <p className="text-body-sm text-body-muted">{v.especialidad || 'Médico Veterinario General'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-surface-card border border-hairline hover:bg-surface-soft text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="bg-primary hover:bg-primary-active text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer"
              >
                Siguiente Paso
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Fecha y Hora */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-title-lg text-title-lg text-ink font-bold">Paso 4: Selecciona Fecha y Hora</h3>
            <p className="font-body-sm text-body-sm text-body-muted">Las citas deben solicitarse desde mañana en adelante.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {/* Fecha Picker */}
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-ink font-semibold">Seleccionar Fecha</label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={selectedFecha}
                  onChange={(e) => setSelectedFecha(e.target.value)}
                  className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary outline-none transition-all cursor-pointer"
                />
              </div>

              {/* Hora Picker (Slots) */}
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-ink font-semibold">Horas Disponibles</label>
                
                {loadingHorarios ? (
                  <div className="flex items-center gap-2 text-body-sm text-body-muted mt-2">
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    Cargando horarios...
                  </div>
                ) : horarios.length === 0 ? (
                  <div className="text-body-sm text-body-muted mt-2 border border-hairline p-3 rounded-lg bg-canvas text-center">
                    No hay bloques libres para este médico en la fecha elegida.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {horarios.map((h, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedHoraBlock(h.value)}
                        className={`py-2 px-3 border rounded text-body-sm font-semibold transition-all cursor-pointer ${
                          selectedHoraBlock === h.value
                            ? 'bg-primary border-primary text-on-primary font-bold shadow'
                            : 'border-hairline bg-surface hover:bg-surface-soft text-ink'
                        }`}
                      >
                        {h.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-surface-card border border-hairline hover:bg-surface-soft text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={!selectedHoraBlock || submitting}
                onClick={handleProceedToConfirmation}
                className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer shadow-sm"
              >
                {submitting ? 'Reservando...' : 'Revisar Cita'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmación y Temporizador */}
        {step === 5 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-title-lg text-title-lg text-ink font-bold">Paso 5: Confirmación de Solicitud</h3>
            
            {/* Timer Banner */}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px] text-amber-600 animate-pulse">timer</span>
              <div className="flex-grow">
                <h4 className="font-semibold text-body-sm leading-none">Tu bloque horario está reservado temporalmente</h4>
                <p className="text-[12px] text-amber-700 mt-1">
                  Completa tu solicitud en los siguientes <strong className="font-bold text-[14px] text-primary">{formatTimer()} minutos</strong>.
                </p>
              </div>
            </div>

            {/* Resumen Card */}
            <div className="bg-canvas border border-hairline p-5 rounded-xl shadow-inner mt-2 space-y-3">
              <div className="flex justify-between border-b border-hairline/60 pb-2">
                <span className="text-body-muted text-body-sm font-semibold">Mascota a atender:</span>
                <span className="text-ink font-bold">{mascotas.find(m => m.id === selectedMascotaId)?.nombre}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/60 pb-2">
                <span className="text-body-muted text-body-sm font-semibold">Servicio solicitado:</span>
                <span className="text-ink font-bold">{servicios.find(s => s.id === selectedServicioId)?.nombre}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/60 pb-2">
                <span className="text-body-muted text-body-sm font-semibold">Médico Veterinario:</span>
                <span className="text-ink font-bold">{veterinarios.find(v => v.id === selectedVeterinarioId)?.nombre}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/60 pb-2">
                <span className="text-body-muted text-body-sm font-semibold">Fecha y Hora de la cita:</span>
                <span className="text-ink font-bold">
                  {selectedFecha ? new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''} a las {selectedHoraBlock ? selectedHoraBlock.split('T')[1] : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-muted text-body-sm font-semibold">Costo sugerido:</span>
                <span className="text-primary font-bold text-[18px]">
                  S/. {servicios.find(s => s.id === selectedServicioId)?.precio.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Motivo de la Cita */}
            <div className="flex flex-col gap-2 mt-2">
              <label htmlFor="booking-reason" className="font-label-sm text-ink font-semibold">
                Motivo de la consulta / Observación (Opcional)
              </label>
              <textarea
                id="booking-reason"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Control de oreja inflamada, vacuna anual, etc."
                className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => { setTimerActive(false); setStep(4); }}
                className="bg-surface-card border border-hairline hover:bg-surface-soft text-ink px-8 py-2.5 rounded-full font-button text-button cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmCita}
                className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary px-8 py-2.5 rounded-full font-button text-button cursor-pointer shadow-sm font-bold"
              >
                {submitting ? 'Confirmando...' : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Éxito Superpuesto Animado */}
      {showSuccessModal && createPortal(
        <div className="premium-modal-overlay animate-modal-fade-in">
          <div className="premium-modal-card animate-modal-scale-in">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>

            {/* Checkmark SVG Animado */}
            <div className="mb-5 mt-2">
              <svg className="success-checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="circle" cx="26" cy="26" r="25" fill="none" />
                <path className="check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>

            <h3 className="font-title-lg text-title-lg text-ink font-bold mb-1">
              ¡Solicitud Enviada!
            </h3>
            <p className="font-body-sm text-body-sm text-body-muted mb-5 px-1">
              Tu cita para <strong className="font-semibold text-ink">{mascotas.find(m => m.id === selectedMascotaId)?.nombre}</strong> ha sido solicitada. El personal revisará los detalles y confirmará el bloque.
            </p>

            {/* Resumen Compacto */}
            <div className="bg-surface-soft border border-hairline/60 rounded-xl p-4 mb-6 text-left text-body-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-body-muted font-medium">Servicio:</span>
                <span className="font-semibold text-ink">{servicios.find(s => s.id === selectedServicioId)?.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-muted font-medium">Médico:</span>
                <span className="font-semibold text-ink">{veterinarios.find(v => v.id === selectedVeterinarioId)?.nombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-muted font-medium">Fecha y Hora:</span>
                <span className="font-semibold text-primary">
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
              className="w-full bg-primary hover:bg-primary-active text-on-primary font-bold py-3 rounded-full font-button text-button transition-all cursor-pointer shadow-md"
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
