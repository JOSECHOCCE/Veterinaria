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

  const [services, setServices] = useState<Servicio[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(0);
  const [originChannel, setOriginChannel] = useState<string>('phone');
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
        toast.info('Horario reservado temporalmente por 5 minutos.');
      }
    } catch (err: any) {
      console.error('Error booking temporary slot:', err);
      toast.error(err.response?.data?.message || 'El horario seleccionado no está disponible.');
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
      await CitasService.cambiarEstado(reservationId, 'PendienteConfirmacion');
      if (makeConfirmed) {
        await CitasService.cambiarEstado(reservationId, 'Confirmada');
        toast.success('Cita programada y confirmada exitosamente.');
      } else {
        toast.success('Cita guardada como solicitud pendiente.');
      }

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

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedVet = veterinarios.find((v) => v.id === selectedVetId);

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none p-gutter">
      {/* Page Header */}
      <PageHeader
        title="Crear Cita Operativa"
        description="Agenda una nueva visita para un paciente, asigna un especialista y confirma los detalles."
        onBack={handleCancel}
        actions={
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={handleCancel}
              className="px-lg py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors duration-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={(e) => handleConfirmCita(e, true)}
              disabled={!reservationId}
              className="px-lg py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-active shadow-sm transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              Confirmar Cita
            </button>
          </div>
        }
        hasDivider={true}
      />

      {/* Timer Banner */}
      <AnimatePresence>
        {reservationId && timerSeconds > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-accent-amber/20 border border-accent-amber/40 text-on-tertiary-container p-3 rounded-lg mb-lg flex justify-between items-center shadow-xs font-semibold"
          >
            <span className="flex items-center gap-xs">
              <span className="material-symbols-outlined animate-spin text-[20px]">hourglass_top</span>
              Bloque reservado temporalmente. Complete la confirmación de la cita.
            </span>
            <span className="font-code text-title-md font-bold bg-canvas/30 px-3 py-1 rounded">
              {formatTimer()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Form Content (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          {/* Patient Details */}
          <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-sm relative overflow-hidden flex flex-col gap-md">
            <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_search</span>
              Detalles del Paciente y Cliente
            </h3>

            {selectedPet ? (
              <div className="bg-surface-container-low rounded-lg p-md flex items-center justify-between border border-outline-variant/40">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold">
                    {selectedPet.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-title-sm text-title-sm text-ink font-bold">{selectedPet.nombre}</h4>
                    <p className="font-body-sm text-body-sm text-secondary">
                      {selectedPet.especie} {selectedPet.raza && `• ${selectedPet.raza}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-lg">
                  <div className="text-right">
                    <p className="font-label-md text-label-md text-ink">{selectedPet.propietarioNombre}</p>
                    <p className="font-body-sm text-body-sm text-secondary">{selectedPet.propietarioTelefono}</p>
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
                    className="text-secondary hover:text-error transition-colors p-1.5 cursor-pointer rounded-full hover:bg-surface-soft"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <label className="block text-caption font-caption text-secondary mb-1">Buscar Mascota o Dueño</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g., Bella (Golden Retriever) o Juan Perez"
                    className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {searchTerm.trim() !== '' && !isSearching && (
                  <div className="absolute w-full mt-2 bg-surface-container-lowest border border-hairline rounded-lg shadow-lg overflow-hidden z-30 max-h-56 overflow-y-auto">
                    {suggestions.length > 0 ? (
                      <ul className="divide-y divide-hairline">
                        {suggestions.map((p) => (
                          <li
                            key={p.id}
                            onClick={() => {
                              setSelectedPet(p);
                              setSearchTerm('');
                              setSuggestions([]);
                            }}
                            className="p-3 hover:bg-surface-soft transition-colors cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="font-body-sm text-ink font-semibold">{p.nombre}</span>
                              <span className="text-secondary text-[12px] ml-2">({p.especie})</span>
                              <div className="text-[12px] text-body-muted font-medium mt-0.5">
                                Propietario: {p.propietarioNombre}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-secondary text-[18px]">add</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-secondary">No se encontraron pacientes.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service & Reason */}
          <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-sm flex flex-col gap-md">
            <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">medical_services</span>
              Servicio y Canal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block text-caption font-caption text-secondary mb-1">Servicio</label>
                <div className="relative">
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
                    className="w-full pl-3 pr-10 py-2.5 appearance-none bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} (${s.precio.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-caption font-caption text-secondary mb-1">Canal de Origen</label>
                <div className="relative">
                  <select
                    value={originChannel}
                    onChange={(e) => setOriginChannel(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 appearance-none bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="phone">Llamada Telefónica</option>
                    <option value="in_person">Presencial / Mostrador</option>
                    <option value="online">Reserva Online</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-caption font-caption text-secondary mb-1">Motivo de la Cita</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describe brevemente el síntoma o motivo de la visita médica..."
                rows={3}
                className="w-full p-3 bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary resize-none placeholder:text-secondary"
              ></textarea>
            </div>
          </div>

          {/* Date, Time & Specialist */}
          <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-sm flex flex-col gap-md">
            <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">event_available</span>
              Horario y Especialista
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="block text-caption font-caption text-secondary mb-2">Seleccionar Fecha</label>
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
                  className="w-full bg-canvas border border-hairline rounded-lg py-2.5 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-md">
                <div>
                  <label className="block text-caption font-caption text-secondary mb-1">Asignar Veterinario</label>
                  <div className="relative">
                    <select
                      value={selectedVetId}
                      onChange={(e) => {
                        setSelectedVetId(Number(e.target.value));
                        setSelectedTimeSlot('');
                        if (reservationId) {
                          CitasService.cambiarEstado(reservationId, 'Libre');
                          setReservationId(null);
                        }
                      }}
                      className="w-full pl-3 pr-10 py-2.5 appearance-none bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {veterinarios.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre} ({v.especialidad})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div>
                  <label className="block text-caption font-caption text-secondary mb-2">Bloques de Horas Disponibles</label>
                  {loadingSlots ? (
                    <div className="py-2"><Spinner size="sm" /></div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-sm">
                      {availableSlots.map((slot) => {
                        const isActive = selectedTimeSlot === slot.text;
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => handleSelectSlot(slot.text)}
                            className={`py-2 text-center border rounded font-body-sm text-body-sm cursor-pointer transition-colors ${
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
                    <p className="text-[12px] text-error">No hay bloques disponibles para esta fecha.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary Panel (4 cols) */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-sm flex flex-col gap-md">
            <h3 className="font-title-md text-title-md text-ink font-bold border-b border-hairline pb-3 mb-xs">
              Resumen de la Cita
            </h3>
            
            <div className="space-y-sm">
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">pets</span>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Paciente</p>
                  <p className="font-title-sm text-title-sm text-ink font-semibold">
                    {selectedPet ? selectedPet.nombre : 'No seleccionado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">vaccines</span>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Servicio</p>
                  <p className="font-title-sm text-title-sm text-ink font-semibold">
                    {selectedService ? selectedService.nombre : 'No seleccionado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">event</span>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Fecha y Hora</p>
                  <p className="font-title-sm text-title-sm text-ink font-semibold">
                    {date} {selectedTimeSlot && `at ${selectedTimeSlot}`}
                  </p>
                  {selectedService && (
                    <p className="text-[11px] text-body-muted font-medium mt-0.5">Duración: ~{selectedService.duracionMinutos} mins</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">badge</span>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Especialista</p>
                  <p className="font-title-sm text-title-sm text-ink font-semibold">
                    {selectedVet ? selectedVet.nombre : 'No asignado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-hairline/80 pt-md mt-sm">
              <div className="flex justify-between items-center text-body-sm font-semibold mb-1">
                <span className="text-secondary">Costo Estimado</span>
                <span className="text-ink font-bold text-body-lg">
                  ${selectedService ? selectedService.precio.toFixed(2) : '0.00'}
                </span>
              </div>
              <p className="text-[10px] text-body-muted text-right">*El precio final puede variar según la consulta.</p>
            </div>

            <div className="bg-secondary-container/20 border border-secondary-container/40 rounded-lg p-3 text-[12px] text-on-secondary-container leading-relaxed flex items-start gap-2 mt-xs font-medium">
              <span className="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">info</span>
              Se enviará una notificación SMS recordatoria automática al dueño antes de la cita confirmada.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
