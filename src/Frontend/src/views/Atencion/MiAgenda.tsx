import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import VeterinariosService from '../../services/veterinarios.service';
import AtencionService from '../../services/atencion.service';
import CitasService from '../../services/citas.service';
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

export default function MiAgenda() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vetsList, setVetsList] = useState<any[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<number | null>(null);
  
  // Appointments state
  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);
  const [activeTab, setActiveTab] = useState<'morning' | 'afternoon' | 'completed'>('morning');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Find the veterinarian ID corresponding to the logged-in email
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load all veterinarians
      const res = await VeterinariosService.getVeterinarios();
      const list = res.data?.veterinarios || [];
      setVetsList(list);

      // 2. Try to find logged-in veterinarian matching email
      const matched = list.find(
        (v: any) => v.veterinario.email?.toLowerCase() === user?.email?.toLowerCase()
      );

      if (matched) {
        setSelectedVetId(matched.veterinario.id);
      } else if (list.length > 0) {
        // Fallback for admin or unlinked user: select first vet
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

      // Combine CitasEstaSemana and CitasProximas to filter for today
      const allCitas: Cita[] = [
        ...(data.citasEstaSemana || []),
        ...(data.citasProximas || [])
      ];

      // Remove duplicates by ID
      const uniqueCitas = allCitas.reduce((acc: Cita[], current: Cita) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      // Filter for today's appointments
      const todayStr = new Date().toDateString();
      const filteredToday = uniqueCitas.filter(c => {
        const citaDate = new Date(c.fechaHora).toDateString();
        return citaDate === todayStr && c.estado !== 'Cancelada' && c.estado !== 'Rechazada';
      });

      // Sort chronologically
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
      // 1. Verify if the appointment already has a triage registered in the queue
      const queueRes = await AtencionService.getColaTriage();
      const triage = (queueRes.triages || []).find((t) => t.citaId === cita.id);

      if (!triage) {
        toast.error(
          `Esta cita no cuenta con un triage registrado. Por favor, registre el triage antes de iniciar la consulta.`
        );
        // Navigate to Triage form with state to auto-fill
        navigate('/admin/triage', { 
          state: { 
            citaId: cita.id, 
            mascotaId: cita.mascotaId,
            mascotaNombre: cita.mascotaNombre,
            motivo: cita.motivo 
          } 
        });
        return;
      }

      // 2. If it is already EnAtencion and the appointment is in process, just continue, otherwise transition
      if (triage.estado !== 'EnAtencion' || (cita.estado !== 'EnAtencion' && cita.estado !== 'EnProceso')) {
        await AtencionService.cambiarEstadoTriage(triage.id!, 'EnAtencion');
      }

      toast.success('Abriendo expediente clínico...');
      navigate(`/admin/atencion/${cita.id}`, { state: { triage } });
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

  // Filter and segment logic
  const getFilteredCitas = () => {
    let result = citasHoy;

    // Search filter
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

    // Segment filter
    return result.filter(c => {
      const date = new Date(c.fechaHora);
      const isCompleted = c.estado === 'Completada';

      if (activeTab === 'completed') {
        return isCompleted;
      }

      if (isCompleted) return false;

      const hour = date.getHours();
      if (activeTab === 'morning') {
        return hour < 13; // Morning is before 1:00 PM
      } else {
        return hour >= 13; // Afternoon is 1:00 PM onwards
      }
    });
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
    <div className="flex-grow flex flex-col min-w-0 select-none pb-section" style={{ fontFamily: 'Inter, sans-serif' }}>
      
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

      {/* Metrics Card Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-xs flex justify-between items-center">
          <div>
            <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Por Atender Hoy</span>
            <span className="font-display-sm text-display-sm text-ink font-bold mt-1">
              {citasHoy.filter(c => c.estado !== 'Completada').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
          </div>
        </div>

        <div className="bg-accent-amber/5 rounded-xl p-lg border border-accent-amber/15 shadow-xs flex justify-between items-center">
          <div>
            <span className="block font-caption text-caption text-accent-amber uppercase tracking-wider">Pacientes en Espera</span>
            <span className="font-display-sm text-display-sm text-accent-amber font-bold mt-1">
              {citasHoy.filter(c => c.estado === 'EnEspera').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-amber/10 text-accent-amber flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">hail</span>
          </div>
        </div>

        <div className="bg-success/5 rounded-xl p-lg border border-success/15 shadow-xs flex justify-between items-center">
          <div>
            <span className="block font-caption text-caption text-success uppercase tracking-wider">Atenciones Completadas</span>
            <span className="font-display-sm text-display-sm text-success font-bold mt-1">
              {citasHoy.filter(c => c.estado === 'Completada').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
        </div>
      </div>

      {/* Main Workspace (Bento container) */}
      <div className="bg-surface-container-lowest border border-hairline rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar: Search and Turn Tabs */}
        <div className="p-lg border-b border-hairline bg-surface-soft/40 flex flex-col md:flex-row md:items-center justify-between gap-md">
          {/* Tab segments */}
          <div className="flex gap-sm border-b border-hairline-soft md:border-b-0 pb-xs md:pb-0">
            <button
              onClick={() => setActiveTab('morning')}
              className={`font-title-sm text-title-sm pb-2 px-2 transition-colors cursor-pointer relative ${
                activeTab === 'morning' ? 'text-primary font-bold border-b-2 border-primary' : 'text-secondary hover:text-ink'
              }`}
            >
              Turno Mañana (&lt;13:00)
            </button>
            <button
              onClick={() => setActiveTab('afternoon')}
              className={`font-title-sm text-title-sm pb-2 px-2 transition-colors cursor-pointer relative ${
                activeTab === 'afternoon' ? 'text-primary font-bold border-b-2 border-primary' : 'text-secondary hover:text-ink'
              }`}
            >
              Turno Tarde (≥13:00)
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`font-title-sm text-title-sm pb-2 px-2 transition-colors cursor-pointer relative ${
                activeTab === 'completed' ? 'text-primary font-bold border-b-2 border-primary' : 'text-secondary hover:text-ink'
              }`}
            >
              Completadas ({citasHoy.filter(c => c.estado === 'Completada').length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
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

        {/* List Columns Header */}
        <div className="grid grid-cols-12 gap-md px-lg py-sm text-secondary font-caption-uppercase text-caption-uppercase border-b border-hairline-soft bg-surface-soft/20 text-xs">
          <div className="col-span-2">Hora y Estado</div>
          <div className="col-span-4">Paciente &amp; Responsable</div>
          <div className="col-span-3">Motivo / Servicio</div>
          <div className="col-span-3 text-right">Acciones</div>
        </div>

        {/* Appointments Feed */}
        {loading ? (
          <div className="p-xl flex items-center justify-center">
            <Spinner size="md" message="Actualizando citas..." />
          </div>
        ) : filteredCitas.length === 0 ? (
          <EmptyState
            title="Sin citas agendadas"
            description={
              searchTerm
                ? 'No se encontraron citas que coincidan con la búsqueda.'
                : activeTab === 'completed'
                ? 'Aún no has completado ninguna consulta el día de hoy.'
                : 'No tienes citas programadas para este turno hoy.'
            }
          />
        ) : (
          <div className="flex flex-col divide-y divide-hairline">
            <AnimatePresence mode="popLayout">
              {filteredCitas.map((cita) => {
                const isCompleted = cita.estado === 'Completada';
                const isEnAtencion = cita.estado === 'EnAtencion' || cita.estado === 'EnProceso';
                const isEnEspera = cita.estado === 'EnEspera';

                // Display info fallbacks
                const petName = cita.mascotaNombre || cita.mascota?.nombre || 'Paciente';
                const petSpecies = cita.mascota?.especie || 'Mascota';
                const petBreed = cita.mascota?.raza || 'Sin raza';
                const ownerName = cita.propietarioNombre || cita.mascota?.usuario?.nombre || 'Responsable';
                const serviceName = cita.servicioNombre || cita.servicio?.nombre || 'Consulta General';
                const photoUrl = cita.mascota?.fotoUrl;

                return (
                  <motion.article
                    key={cita.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`px-lg py-md grid grid-cols-12 gap-md items-center transition-colors hover:bg-surface-soft/20 ${
                      isEnAtencion ? 'bg-primary/5 border-l-4 border-primary' : ''
                    }`}
                  >
                    {/* Time & State Indicator */}
                    <div className="col-span-2 flex flex-col">
                      <span className="font-title-md text-title-md text-ink font-bold">
                        {formatTime(cita.fechaHora)}
                      </span>
                      <span className="mt-1">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20 text-[11px] font-semibold uppercase tracking-wider">
                            Atendido
                          </span>
                        ) : isEnAtencion ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                            En curso
                          </span>
                        ) : isEnEspera ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20 text-[11px] font-semibold uppercase tracking-wider">
                            En Sala
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-variant text-secondary border border-hairline text-[11px] font-semibold uppercase tracking-wider">
                            Agendado
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Patient & Owner */}
                    <div className="col-span-4 flex items-center gap-md">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface border border-hairline flex-shrink-0">
                        <img
                          src={photoUrl || getPetImageFallback(petSpecies)}
                          alt={petName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getPetImageFallback(petSpecies);
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-title-sm text-title-sm text-ink font-bold">{petName}</h3>
                        <p className="font-body-sm text-body-sm text-secondary">
                          {petSpecies}, {petBreed} • <span className="font-medium text-ink">{ownerName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Reason & Service */}
                    <div className="col-span-3 flex flex-col justify-center">
                      <span className="font-body-md text-body-md text-ink font-medium leading-tight">
                        {cita.motivo || 'Consulta Médica'}
                      </span>
                      <span className="font-caption text-caption text-secondary mt-1">
                        {serviceName}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex justify-end items-center gap-sm">
                      <button
                        onClick={() => navigate(`/admin/mascotas/${cita.mascotaId}/historial`)}
                        title="Ver Expediente Médico"
                        className="text-secondary hover:text-primary transition-colors flex items-center gap-1 font-button text-button px-3 py-2 rounded hover:bg-surface-soft cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                        <span className="hidden xl:inline">Ver Historia</span>
                      </button>

                      {!isCompleted && (
                        <button
                          onClick={() => handleIniciarConsulta(cita)}
                          className={`font-button text-button px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer ${
                            isEnAtencion
                              ? 'bg-canvas border border-primary text-primary hover:bg-primary/5'
                              : 'bg-primary text-on-primary hover:bg-primary-active'
                          }`}
                        >
                          {isEnAtencion ? 'Continuar' : 'Atender'}
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
