import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import VeterinariosService from '../../services/veterinarios.service';
import AtencionService from '../../services/atencion.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

interface Cita {
  id: number;
  fechaHora: string;
  estado: string;
  motivo?: string | null;
  mascotaId: number;
  mascotaNombre?: string;
  propietarioNombre?: string;
  servicioNombre?: string;
  servicio?: {
    id: number;
    nombre: string;
    duracionMinutos: number;
  } | null;
  mascota?: {
    id: number;
    nombre: string;
    especie: string;
    raza?: string | null;
    fotoUrl?: string | null;
    usuario?: {
      nombre: string;
    } | null;
  } | null;
}

const ESTADO_BADGES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  Confirmada: { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success', label: 'Confirmada' },
  EnEspera: { bg: 'bg-accent-amber/5', border: 'border-accent-amber/20', text: 'text-accent-amber', label: 'En Sala' },
  EnAtencion: { bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary', label: 'En Consulta' },
  Completada: { bg: 'bg-surface-soft', border: 'border-hairline', text: 'text-secondary', label: 'Completada' },
};

export default function MiAgenda() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vetsList, setVetsList] = useState<any[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<number | null>(null);
  
  // Appointments state
  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'pendientes' | 'completadas' | 'todas'>('pendientes');

  // Find the veterinarian ID corresponding to the logged-in email
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await VeterinariosService.getVeterinarios();
      const list = res.data?.veterinarios || [];
      setVetsList(list);

      const matched = list.find(
        (v: any) => v.veterinario.email?.toLowerCase() === user?.email?.toLowerCase()
      );

      if (matched) {
        setSelectedVetId(matched.veterinario.id);
      } else if (list.length > 0) {
        setSelectedVetId(list[0].veterinario.id);
      } else {
        setError('No se encontraron médicos veterinarios registrados en el sistema.');
      }
    } catch (err) {
      console.error('Error loading initial agenda data:', err);
      setError('No pudimos conectar con el servidor para obtener los médicos veterinarios.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load appointments for selected veterinarian
  const loadAppointments = useCallback(async (vetId: number) => {
    setLoading(true);
    setError(null);
    try {
      const detailsRes = await VeterinariosService.getVeterinarioDetails(vetId);
      const data = detailsRes.data;

      const allCitas: Cita[] = [
        ...(data.citasEstaSemana || []),
        ...(data.citasProximas || [])
      ];

      const uniqueCitas = allCitas.reduce((acc: Cita[], current: Cita) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      const todayStr = new Date().toDateString();
      const filteredToday = uniqueCitas.filter(c => {
        const citaDate = new Date(c.fechaHora).toDateString();
        const validStates = ['Confirmada', 'EnEspera', 'EnAtencion', 'Completada', 'Reprogramada'];
        return citaDate === todayStr && validStates.includes(c.estado);
      });

      filteredToday.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
      setCitasHoy(filteredToday);
    } catch (err) {
      console.error('Error loading veterinarian appointments:', err);
      setError('No pudimos cargar la agenda de citas del médico seleccionado.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedVetId) {
      loadAppointments(selectedVetId);
    }
  }, [selectedVetId, loadAppointments]);

  // Action handlers
  const handleIniciarConsulta = async (cita: Cita) => {
    try {
      const queueRes = await AtencionService.getColaTriage();
      const triage = (queueRes.triages || []).find((t) => t.citaId === cita.id);

      // Si la cita ya está en consulta o en proceso, permitir ingresar directo sin bloquear al veterinario
      if (cita.estado === 'EnAtencion' || cita.estado === 'EnProceso') {
        toast.success('Retomando expediente clínico...');
        navigate(`/admin/atencion/${cita.id}`, { state: { triage, from: '/admin/mi-agenda' } });
        return;
      }

      if (!triage) {
        toast.error(
          `Esta cita no cuenta con un triage registrado. Por favor, registre el triage antes de iniciar la consulta.`
        );
        navigate('/admin/triage', { 
          state: { 
            citaId: cita.id, 
            mascotaId: cita.mascotaId,
            mascotaNombre: cita.mascotaNombre,
            motivo: cita.motivo,
            from: '/admin/mi-agenda'
          } 
        });
        return;
      }

      try {
        await AtencionService.cambiarEstadoTriage(triage.id!, 'EnAtencion');
      } catch (transitionErr: any) {
        console.warn('Advertencia de transición al cambiar estado de triage:', transitionErr);
        // Si falló por regla de transición pero el triage ya existe, procedemos al expediente
      }

      toast.success('Abriendo expediente clínico...');
      navigate(`/admin/atencion/${cita.id}`, { state: { triage, from: '/admin/mi-agenda' } });
    } catch (err: any) {
      console.error('Error starting consult from agenda:', err);
      toast.error('Error al iniciar la consulta médica.');
    }
  };

  const getPetImageFallback = (esp: string) => {
    const species = esp.toLowerCase();
    if (species.includes('perro') || species.includes('canin') || species.includes('dog')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM8pZR065mBN_zRsT0K-9h3W-ByY0dCkx1tJr6a_KXTKD63fcCW5FzMmFTzmcaQigIIqG5xFDGqXOQq0JWvRnTCq13J_DBfqi4QunaYKGRE_MqRX0DivSZ-mN9D_htDVybloxprk1_R1fFGlPD17YrWlt0_hwENNtVIaygWOCZ94AMIJnF7ZlEGmciyOTyS5OrBnA9vRzUw-nHhbN3CafZ-NxbGJNMglUBngYtJ7mo1oskzaYx3B6aoBIErCd0BxF692CDhzyjxZ8';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuADiZUuDOMsyo4M1wr15dg3fsL80rExV4tuKhka1NyJjHWVWLimgnT9wQsjQr8_z23jhtb7SlqFPuCp44eCRnKKZQ06tqmkTYPWibResnGBfH25z7mbfCkavRFdwIZBit8JTNFZcCBpO5k-6zKZHsK3WQP1gLKHSuIWd0CnTSc3wHEu4qXuEj0S3VP0RG_a0KFGMwEZw77fbutpjCXcTFhJs8POZ_CGRMzwVeiFkdXY9Top7gLGWkK9vmUQRl9Kbxy8J9jI4X9UToA';
  };

  // Calculations for Left Column Split layout
  const getNextPatient = () => {
    // 1st priority: Checked-in (EnEspera)
    const checkedIn = citasHoy.filter(c => c.estado === 'EnEspera');
    if (checkedIn.length > 0) return checkedIn[0];
    
    // 2nd priority: Confirmed and upcoming today
    const confirmed = citasHoy.filter(c => c.estado === 'Confirmada');
    if (confirmed.length > 0) return confirmed[0];

    // 3rd priority: EnAtencion
    const enAtencion = citasHoy.filter(c => c.estado === 'EnAtencion');
    if (enAtencion.length > 0) return enAtencion[0];

    return null;
  };

  const nextPatient = getNextPatient();
  const waitingRoomList = citasHoy.filter(c => c.estado === 'EnEspera');

  // Search and status filtering
  const getFilteredCitas = () => {
    let result = citasHoy;
    if (filterMode === 'pendientes') {
      result = result.filter(
        c => c.estado !== 'Completada' && c.estado !== 'Cancelada' && c.estado !== 'Rechazada' && c.estado !== 'NoAsistio'
      );
    } else if (filterMode === 'completadas') {
      result = result.filter(c => c.estado === 'Completada');
    }
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        c =>
          c.mascotaNombre?.toLowerCase().includes(query) ||
          c.mascota?.nombre?.toLowerCase().includes(query) ||
          c.propietarioNombre?.toLowerCase().includes(query) ||
          c.mascota?.usuario?.nombre?.toLowerCase().includes(query)
      );
    }
    return result;
  };

  const filteredCitas = getFilteredCitas();

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (loading && vetsList.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" message="Cargando agenda médica..." />
      </div>
    );
  }

  if (error && vetsList.length === 0) {
    return (
      <div className="flex-grow p-lg">
        <ErrorMessage message={error} onRetry={loadInitialData} title="Error al cargar agenda" />
      </div>
    );
  }

  const selectedVet = vetsList.find(v => v.veterinario.id === selectedVetId)?.veterinario;
  const isVetUser = user?.role === 'Veterinario';

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none p-gutter">
      {/* Header and Doctor Switcher */}
      <PageHeader
        title="Mi Agenda de Hoy"
        description={
          <>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {selectedVet && ` • Dr(a). ${selectedVet.nombre}`}
          </>
        }
        actions={
          !isVetUser && vetsList.length > 1 ? (
            <div className="flex items-center gap-2">
              <label className="font-caption text-caption text-secondary font-medium">Médico:</label>
              <div className="relative">
                <select
                  value={selectedVetId || ''}
                  onChange={(e) => setSelectedVetId(Number(e.target.value))}
                  className="bg-canvas border border-hairline rounded-lg pl-3 pr-8 py-2 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none min-w-[200px]"
                >
                  {vetsList.map((v) => (
                    <option key={v.veterinario.id} value={v.veterinario.id}>
                      {v.veterinario.nombre}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          ) : undefined
        }
        hasDivider={true}
      />

      {/* Bento Grid Layout (1:3 split) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start flex-grow min-h-0">
        
        {/* Left Column: Siguiente Paciente & Sala de Espera (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-gutter shrink-0">
          
          {/* Priority Patient Card */}
          <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-sm relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            
            <div className="flex items-center justify-between mb-md">
              <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[15px]">priority_high</span> 
                Siguiente Paciente
              </span>
              {nextPatient && (
                <span className="font-title-sm text-title-sm text-secondary font-bold">
                  {formatTime(nextPatient.fechaHora)}
                </span>
              )}
            </div>

            {nextPatient ? (
              <div className="flex flex-col items-center text-center mb-md">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-soft mb-sm shadow-sm bg-surface-soft flex items-center justify-center">
                  <img
                    alt={nextPatient.mascotaNombre}
                    className="w-full h-full object-cover"
                    src={nextPatient.mascota?.fotoUrl || getPetImageFallback(nextPatient.mascota?.especie || '')}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getPetImageFallback(nextPatient.mascota?.especie || '');
                    }}
                  />
                </div>
                <h3 className="font-display-sm text-display-sm text-ink font-bold leading-tight">
                  {nextPatient.mascotaNombre}
                </h3>
                <p className="font-body-sm text-body-sm text-secondary mt-1">
                  {nextPatient.mascota?.especie} {nextPatient.mascota?.raza && `• ${nextPatient.mascota?.raza}`}
                </p>
                <span className="mt-3 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-label-sm text-label-sm font-semibold">
                  {nextPatient.servicioNombre || 'Consulta General'}
                </span>
                
                <div className="w-full flex flex-col gap-2 mt-lg">
                  {nextPatient.estado !== 'Completada' && (
                    <button
                      onClick={() => handleIniciarConsulta(nextPatient)}
                      className="w-full bg-primary text-on-primary font-button text-button h-11 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-active transition-colors cursor-pointer shadow-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                      Iniciar Consulta SOAP
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/mascotas/${nextPatient.mascotaId}/historial`)}
                    className="w-full bg-surface-soft hover:bg-surface-soft-active border border-hairline text-ink font-button text-button h-11 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                    Ver Expediente Médico
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-secondary italic font-medium">
                Sin pacientes programados para hoy.
              </div>
            )}
          </div>

          {/* Waiting Room Feed */}
          <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-sm flex flex-col gap-md flex-grow">
            <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-2 border-b border-hairline pb-2">
              <span className="material-symbols-outlined text-primary">meeting_room</span>
              Sala de Espera (Checked-In)
            </h3>
            
            {waitingRoomList.length === 0 ? (
              <p className="font-body-sm text-body-sm text-secondary italic text-center py-4">
                No hay pacientes en sala de espera.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline">
                {waitingRoomList.map((w) => (
                  <li
                    key={w.id}
                    onClick={() => handleIniciarConsulta(w)}
                    className="flex items-center gap-md py-3 hover:bg-surface-soft/40 cursor-pointer p-2 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-soft flex-shrink-0">
                      <img
                        alt={w.mascotaNombre}
                        className="w-full h-full object-cover"
                        src={w.mascota?.fotoUrl || getPetImageFallback(w.mascota?.especie || '')}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getPetImageFallback(w.mascota?.especie || '');
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-title-sm text-title-sm text-ink font-bold group-hover:text-primary transition-colors leading-tight">
                        {w.mascotaNombre}
                      </h4>
                      <p className="font-caption text-caption text-secondary mt-0.5 truncate">
                        Responsable: {w.propietarioNombre}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-title-sm text-title-sm text-primary font-bold">
                        {formatTime(w.fechaHora)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Confirmed Appointments Table (8 cols) */}
        <div className="xl:col-span-8 bg-surface-card rounded-xl border border-hairline shadow-sm overflow-hidden flex flex-col">
          <div className="p-lg border-b border-hairline bg-surface-soft/20 flex flex-col xl:flex-row xl:items-center justify-between gap-md">
            <div className="flex flex-col sm:flex-row sm:items-center gap-md flex-wrap">
              <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_available</span>
                Citas del Día
              </h3>

              {/* Status Tabs Pill */}
              <div className="flex bg-canvas border border-hairline p-1 rounded-lg text-xs font-bold flex-wrap gap-1">
                <button
                  onClick={() => setFilterMode('pendientes')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    filterMode === 'pendientes'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-secondary hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">pending_actions</span>
                  Pendientes ({citasHoy.filter(c => c.estado !== 'Completada' && c.estado !== 'Cancelada' && c.estado !== 'Rechazada' && c.estado !== 'NoAsistio').length})
                </button>
                <button
                  onClick={() => setFilterMode('completadas')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    filterMode === 'completadas'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-secondary hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Completadas ({citasHoy.filter(c => c.estado === 'Completada').length})
                </button>
                <button
                  onClick={() => setFilterMode('todas')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    filterMode === 'todas'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-secondary hover:text-ink'
                  }`}
                >
                  Todas ({citasHoy.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full xl:w-72 shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar mascota o dueño..."
                className="w-full pl-9 pr-4 py-2 bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {filteredCitas.length === 0 ? (
            <EmptyState
              title="Sin citas agendadas"
              description={
                searchTerm
                  ? 'No se encontraron citas que coincidan con la búsqueda.'
                  : 'No tienes citas programadas para el día de hoy.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="bg-surface-soft border-b border-hairline">
                    <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider w-32">Hora</th>
                    <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Mascota / Paciente</th>
                    <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Responsable</th>
                    <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Servicio</th>
                    <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider w-36">Estado</th>
                    <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider text-right w-36">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  <AnimatePresence mode="popLayout">
                    {filteredCitas.map((c) => {
                      const badge = ESTADO_BADGES[c.estado] || {
                        bg: 'bg-surface-soft',
                        border: 'border-hairline',
                        text: 'text-secondary',
                        label: c.estado,
                      };

                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`hover:bg-surface-soft/20 transition-colors group ${
                            c.estado === 'EnAtencion' ? 'bg-primary/5' : ''
                          }`}
                        >
                          <td className="py-md px-lg whitespace-nowrap">
                            <span className="font-title-sm text-title-sm text-ink font-bold">
                              {formatTime(c.fechaHora)}
                            </span>
                          </td>
                          <td className="py-md px-lg whitespace-nowrap">
                            <div className="flex items-center gap-md">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-soft shrink-0">
                                <img
                                  src={c.mascota?.fotoUrl || getPetImageFallback(c.mascota?.especie || '')}
                                  alt={c.mascotaNombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getPetImageFallback(c.mascota?.especie || '');
                                  }}
                                />
                              </div>
                              <span className="font-title-sm text-title-sm text-ink font-semibold">
                                {c.mascotaNombre}
                              </span>
                            </div>
                          </td>
                          <td className="py-md px-lg whitespace-nowrap font-body-sm text-secondary">
                            {c.propietarioNombre}
                          </td>
                          <td className="py-md px-lg whitespace-nowrap font-body-sm text-secondary">
                            {c.servicioNombre || 'Consulta General'}
                          </td>
                          <td className="py-md px-lg whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-caption font-caption font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-md px-lg whitespace-nowrap text-right">
                            <div className="flex justify-end gap-xs">
                              <button
                                onClick={() => navigate(`/admin/mascotas/${c.mascotaId}/historial`, { state: { from: '/admin/mi-agenda' } })}
                                title="Ver Expediente Médico"
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-soft text-secondary hover:text-ink transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                              </button>
                              {c.estado !== 'Completada' && (
                                <button
                                  onClick={() => handleIniciarConsulta(c)}
                                  className="px-3 py-1 bg-primary hover:bg-primary-active text-on-primary font-button text-button rounded-lg transition-colors cursor-pointer"
                                >
                                  {c.estado === 'EnAtencion' ? 'Retomar' : 'Atender'}
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
