import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PageHeader from '../../components/common/PageHeader';
import CitasService from '../../services/citas.service';
import type { CitaDto } from '../../services/citas.service';
import ClientesService from '../../services/clientes.service';
import type { Cliente } from '../../services/clientes.service';
import ServiciosService from '../../services/servicios.service';
import type { Servicio } from '../../services/servicios.service';
import VeterinariosService from '../../services/veterinarios.service';
import type { Veterinario } from '../../services/veterinarios.service';
import Spinner from '../../components/common/Spinner';

interface SuggestedPet {
  id: number;
  nombre: string;
  especie: string;
  raza?: string;
  propietarioId: number;
  propietarioNombre: string;
  propietarioTelefono: string;
}

export default function NuevaCita() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route pre-populates
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialTime = searchParams.get('time') || '';

  // Form Fields State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SuggestedPet[]>([]);
  const [selectedPet, setSelectedPet] = useState<SuggestedPet | null>(null);

  const [category, setCategory] = useState<string>('Consulta General');
  const [services, setServices] = useState<Servicio[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(0);
  const [motivo, setMotivo] = useState<string>('');

  const [date, setDate] = useState<string>(initialDate);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<number>(0);

  const [availableSlots, setAvailableSlots] = useState<{ value: string; text: string }[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(initialTime);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Reservation & Timer State
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        // Load services
        const servRes = await ServiciosService.getServicios('', false);
        if (servRes.success && servRes.data?.servicios) {
          setServices(servRes.data.servicios);
          // Set initial service
          const activeSvs = servRes.data.servicios.filter((s: Servicio) => s.activo);
          if (activeSvs.length > 0) {
            setSelectedServiceId(activeSvs[0].id);
          }
        }

        // Load vets
        const vetRes = await VeterinariosService.getVeterinarios();
        if (vetRes.success && vetRes.data?.veterinarios) {
          const list = vetRes.data.veterinarios.map((v: any) => v.veterinario);
          setVeterinarios(list);
          if (list.length > 0) {
            setSelectedVetId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error in initialization:', err);
        toast.error('Error al inicializar formulario.');
      }
    };
    init();
  }, []);

  // Search clients & pets
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = await ClientesService.getClientes(searchTerm);
        if (query.success && query.data?.usuarios) {
          const list: SuggestedPet[] = [];
          query.data.usuarios.forEach((cli: Cliente) => {
            if (cli.mascotas && cli.mascotas.length > 0) {
              cli.mascotas.forEach((masc) => {
                if (masc.activo) {
                  list.push({
                    id: masc.id,
                    nombre: masc.nombre,
                    especie: masc.especie,
                    raza: masc.raza,
                    propietarioId: cli.id,
                    propietarioNombre: cli.nombre,
                    propietarioTelefono: cli.telefono,
                  });
                }
              });
            }
          });
          setSuggestions(list);
        }
      } catch (err) {
        console.error('Error searching pets:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Load slots when date/vet changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!date || !selectedVetId) return;
      setLoadingSlots(true);
      try {
        const slots = await CitasService.getHorariosDisponibles(selectedVetId, date);
        setAvailableSlots(slots || []);
        // Reset selected time if not in the new slots
        if (initialTime && slots.some((s) => s.text === initialTime)) {
          setSelectedTimeSlot(initialTime);
        } else {
          setSelectedTimeSlot('');
        }
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [date, selectedVetId, initialTime]);

  const handleExpiredReservation = useCallback(async () => {
    if (!reservationId) return;
    toast.warning('La reserva de tiempo ha expirado. Por favor, seleccione un horario nuevo.');
    try {
      await CitasService.cambiarEstado(reservationId, 'Libre');
    } catch (err) {
      console.error('Error freeing expired slot:', err);
    }
    setReservationId(null);
    setSelectedTimeSlot('');
    setTimerSeconds(0);
  }, [reservationId]);

  // Timer logic for Reservation
  useEffect(() => {
    if (timerSeconds <= 0) {
      if (reservationId) {
        handleExpiredReservation();
      }
      return;
    }
    timerRef.current = setTimeout(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerSeconds, reservationId, handleExpiredReservation]);

  const handleSelectSlot = async (slotTime: string) => {
    // If there is an active reservation, release it first
    if (reservationId) {
      try {
        await CitasService.cambiarEstado(reservationId, 'Libre');
      } catch (err) {
        console.error('Error releasing previous slot:', err);
      }
      setReservationId(null);
    }

    if (!selectedPet) {
      toast.error('Debe seleccionar un paciente antes de reservar el horario.');
      return;
    }

    if (!selectedServiceId) {
      toast.error('Debe seleccionar un servicio.');
      return;
    }

    setSelectedTimeSlot(slotTime);
    
    // Call ReservaTemporal
    try {
      const fechaHora = `${date}T${slotTime}:00`;
      const dto: CitaDto = {
        fechaHora,
        mascotaId: selectedPet.id,
        veterinarioId: selectedVetId,
        servicioId: selectedServiceId,
        motivo: motivo || 'Cita operativa',
      };

      const res = await CitasService.reservaTemporal(dto);
      if (res && res.citaId) {
        setReservationId(res.citaId);
        setTimerSeconds(300); // 5 minutes countdown
        toast.info('Horario reservado temporalmente por 5 minutos para completar el registro.');
      }
    } catch (err: any) {
      console.error('Error booking temporary slot:', err);
      toast.error(err.response?.data?.message || 'El horario seleccionado ya no está disponible.');
      setSelectedTimeSlot('');
    }
  };

  const handleConfirmCita = async (e: React.FormEvent, makeConfirmed: boolean) => {
    e.preventDefault();
    if (!selectedPet) {
      toast.error('Debe seleccionar un paciente.');
      return;
    }
    if (!selectedTimeSlot) {
      toast.error('Debe seleccionar un bloque horario.');
      return;
    }
    if (!reservationId) {
      toast.error('No se ha completado la reserva temporal del bloque.');
      return;
    }

    try {
      // Transition ReservaTemporal -> PendienteConfirmacion
      await CitasService.cambiarEstado(reservationId, 'PendienteConfirmacion');

      if (makeConfirmed) {
        // Recepcionist confirms the appointment directly
        await CitasService.cambiarEstado(reservationId, 'Confirmada');
        toast.success('Cita programada y confirmada exitosamente.');
      } else {
        toast.success('Cita guardada como solicitud pendiente.');
      }

      // Clear timer and redirects
      if (timerRef.current) clearTimeout(timerRef.current);
      setReservationId(null);
      navigate('/admin/agenda');
    } catch (err: any) {
      console.error('Error finalizing appointment confirmation:', err);
      toast.error(err.response?.data?.message || 'Error al confirmar la cita.');
    }
  };

  const handleCancel = async () => {
    if (reservationId) {
      try {
        await CitasService.cambiarEstado(reservationId, 'Libre');
      } catch (err) {
        console.error('Error freeing slot on cancel:', err);
      }
    }
    navigate('/admin/agenda');
  };

  // Filter services by category
  const filteredServices = services.filter(
    (s) => s.activo && (category === 'Especialidad' ? s.especialidadRequerida : true)
  );

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none">
      {/* Page Header */}
      <PageHeader
        title="Programar Cita"
        description="Complete los detalles para agendar una nueva consulta o procedimiento médico a un paciente."
        onBack={handleCancel}
        actions={<div className="font-title-sm text-title-sm text-ink font-semibold">Modo Operativo Recepción</div>}
      />

      {/* Timer Banner */}
      <AnimatePresence>
        {reservationId && timerSeconds > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-accent-amber text-ink p-3 rounded-lg mb-lg flex justify-between items-center shadow-xs font-semibold"
          >
            <span className="flex items-center gap-xs">
              <span className="material-symbols-outlined animate-spin text-[20px]">hourglass_top</span>
              Bloque reservado temporalmente. Complete el registro.
            </span>
            <span className="font-code text-headline-sm font-bold bg-canvas/30 px-3 py-1 rounded">
              {formatTimer()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Grid */}
      <form onSubmit={(e) => handleConfirmCita(e, true)} className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left: Patient & Service */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          {/* Patient Selector */}
          <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">pets</span>
              Paciente
            </h2>

            {selectedPet ? (
              <div className="flex items-center justify-between p-3 bg-surface-soft border border-hairline rounded-lg shadow-inner">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                    {selectedPet.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-title-sm text-title-sm text-ink font-bold leading-tight">
                      {selectedPet.nombre}
                    </h4>
                    <p className="font-body-sm text-body-sm text-secondary">
                      Propietario: {selectedPet.propietarioNombre} ({selectedPet.especie})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPet(null);
                    setSelectedTimeSlot('');
                    if (reservationId) {
                      CitasService.cambiarEstado(reservationId, 'Libre');
                      setReservationId(null);
                    }
                  }}
                  className="text-secondary hover:text-error transition-colors p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ) : (
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg py-2.5 pl-10 pr-4 font-body-sm text-body-sm text-ink placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Nombre de mascota, propietario o teléfono..."
                />

                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <ul className="absolute w-full mt-2 bg-surface-container-lowest border border-hairline rounded-lg shadow-lg overflow-hidden z-30 max-h-56 overflow-y-auto divide-y divide-hairline">
                    {suggestions.map((p) => (
                      <li
                        key={`${p.id}-${p.propietarioId}`}
                        onClick={() => {
                          setSelectedPet(p);
                          setSearchTerm('');
                          setSuggestions([]);
                        }}
                        className="p-3 hover:bg-surface-soft transition-colors cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <span className="font-body-sm text-ink font-semibold">{p.nombre}</span>
                          <span className="text-secondary text-[12px] ml-2">({p.especie} {p.raza ? `• ${p.raza}` : ''})</span>
                          <div className="text-[12px] text-body-muted font-medium mt-0.5">
                            Dueño: {p.propietarioNombre}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-secondary text-[18px]">add</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Service Selector */}
          <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">medical_services</span>
              Servicio Requerido
            </h2>

            <div className="flex flex-col gap-md">
              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="Consulta General">Consulta General</option>
                  <option value="Vacunación">Vacunación</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Peluquería / Estética">Peluquería / Estética</option>
                  <option value="Especialidad">Especialidad</option>
                </select>
              </div>

              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Servicio Específico</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(Number(e.target.value));
                    setSelectedTimeSlot('');
                    if (reservationId) {
                      CitasService.cambiarEstado(reservationId, 'Libre');
                      setReservationId(null);
                    }
                  }}
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {filteredServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} (${s.precio.toFixed(2)} - {s.duracionMinutos} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">
                  Motivo de Consulta (Interno)
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 font-body-sm text-body-sm text-ink placeholder:text-secondary focus:outline-none focus:border-primary resize-none transition-colors"
                  placeholder="Síntomas reportados, notas para el veterinario..."
                  rows={3}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right: Scheduling & Assignment */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Scheduling Card */}
          <section className="bg-surface-card rounded-xl p-lg border border-transparent shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Programación
            </h2>

            <div>
              <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedTimeSlot('');
                  if (reservationId) {
                    CitasService.cambiarEstado(reservationId, 'Libre');
                    setReservationId(null);
                  }
                }}
                className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-caption-caps text-caption-caps text-secondary">Horarios Disponibles</label>
                {availableSlots.length > 0 && (
                  <span className="font-caption text-caption text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span> Alta disponibilidad
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="py-4 flex justify-center">
                  <Spinner size="sm" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-sm mt-2">
                  {availableSlots.map((slot) => {
                    const isActive = selectedTimeSlot === slot.text;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => handleSelectSlot(slot.text)}
                        className={`py-2 text-center border rounded-md font-body-sm text-body-sm cursor-pointer transition-colors ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-hairline bg-canvas text-secondary hover:border-primary hover:text-primary'
                        }`}
                      >
                        {slot.text}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="font-body-sm text-body-sm text-error mt-2">
                  No hay horarios laborables/disponibles para la fecha y profesional seleccionados.
                </p>
              )}
            </div>
          </section>

          {/* Professional Selection */}
          <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">badge</span>
              Veterinario Asignado
            </h2>

            <div className="flex flex-col gap-sm">
              {veterinarios.map((v) => {
                const isChecked = selectedVetId === v.id;
                return (
                  <label
                    key={v.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors relative ${
                      isChecked ? 'border-primary bg-primary/5' : 'border-hairline bg-canvas hover:bg-surface-soft'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vet"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedVetId(v.id);
                        setSelectedTimeSlot('');
                        if (reservationId) {
                          CitasService.cambiarEstado(reservationId, 'Libre');
                          setReservationId(null);
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold mr-3 shrink-0">
                      {v.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-title-sm text-title-sm text-ink font-bold leading-tight">{v.nombre}</div>
                      <div className="font-caption text-caption text-secondary mt-0.5">{v.especialidad}</div>
                    </div>
                    {isChecked && (
                      <span className="material-symbols-outlined text-primary absolute right-3 top-1/2 -translate-y-1/2 text-[18px]">
                        check_circle
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="lg:col-span-12 mt-lg flex flex-col sm:flex-row justify-end items-center gap-md pt-lg border-t border-hairline">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-lg py-2.5 rounded-lg font-button text-button border border-ink text-ink hover:bg-surface-soft transition-colors cursor-pointer text-center"
          >
            Cancelar y Volver
          </button>
          
          <button
            type="button"
            disabled={!reservationId}
            onClick={(e) => handleConfirmCita(e, false)}
            className="w-full sm:w-auto px-lg py-2.5 rounded-lg font-button text-button border border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer text-center disabled:opacity-50"
          >
            Guardar como Pendiente
          </button>

          <button
            type="submit"
            disabled={!reservationId}
            className="w-full sm:w-auto px-xl py-2.5 rounded-lg font-button text-button bg-primary text-on-primary hover:bg-primary-active transition-colors cursor-pointer text-center shadow-sm disabled:opacity-50"
          >
            Confirmar Cita Directa
          </button>
        </div>
      </form>
    </div>
  );
}
