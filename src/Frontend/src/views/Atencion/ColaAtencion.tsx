import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import AtencionService from '../../services/atencion.service';
import type { TriageDto, PendienteTriageDto } from '../../services/atencion.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';

const NIVEL_COLORS: Record<string, { bg: string; border: string; text: string; label: string; dot: string }> = {
  N1: { bg: 'bg-error/10', border: 'border-error/20', text: 'text-error', label: 'N1 - Emergencia', dot: 'bg-error animate-ping' },
  N2: { bg: 'bg-accent-amber/10', border: 'border-accent-amber/20', text: 'text-accent-amber', label: 'N2 - Urgente', dot: 'bg-accent-amber' },
  N3: { bg: 'bg-success/15', border: 'border-success/20', text: 'text-success', label: 'N3 - No Urgente', dot: 'bg-success' },
};

export default function ColaAtencion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [triages, setTriages] = useState<TriageDto[]>([]);
  const [pendientesTriage, setPendientesTriage] = useState<PendienteTriageDto[]>([]);
  const [totalWaiting, setTotalWaiting] = useState<number>(0);
  const [totalEmergencies, setTotalEmergencies] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [buscar, setBuscar] = useState<string>('');
  const [selectedNivel, setSelectedNivel] = useState<string>('all');

  const fetchCola = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AtencionService.getColaTriage();
      if (res) {
        setTriages(res.triages || []);
        setTotalWaiting(res.totalEsperando || 0);
        setTotalEmergencies(res.totalEmergencias || 0);
        setPendientesTriage(res.pendientesTriage || []);
      }
    } catch (err: any) {
      console.error('Error fetching triage queue:', err);
      setError('No pudimos conectar con el servidor. Compruebe su conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCola();
  }, [fetchCola]);

  const handleIniciarConsulta = async (triage: TriageDto) => {
    if (!triage.id) return;
    if (!triage.citaId) {
      toast.error('Este paciente no tiene una cita agendada vinculada. Cree una cita antes de iniciar.');
      return;
    }

    try {
      // Transition triage status to EnAtencion
      await AtencionService.cambiarEstadoTriage(triage.id, 'EnAtencion');
      toast.success('Atención iniciada. Redirigiendo a expediente SOAP...');
      navigate(`/admin/atencion/${triage.citaId}`, { state: { triage } });
    } catch (err: any) {
      console.error('Error starting consult:', err);
      toast.error(err.response?.data?.message || 'Error al iniciar la atención.');
    }
  };

  const handleMarcarAtendido = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas marcar a este paciente como atendido y retirarlo de la cola?')) {
      return;
    }
    try {
      await AtencionService.cambiarEstadoTriage(id, 'Atendido');
      toast.success('Paciente retirado de la cola de espera.');
      fetchCola();
    } catch (err: any) {
      console.error('Error marking as attended:', err);
      toast.error('Error al actualizar estado.');
    }
  };

  const getFilteredTriages = () => {
    return triages.filter((t) => {
      // Filter out attended ones from queue display
      if (t.estado === 'Atendido') return false;

      // Urgency filter
      if (selectedNivel !== 'all' && t.nivel !== selectedNivel) return false;

      // Text search (pet name or owner name)
      if (buscar.trim()) {
        const search = buscar.toLowerCase();
        const petMatch = t.mascotaNombre?.toLowerCase().includes(search);
        const ownerMatch = t.propietarioNombre?.toLowerCase().includes(search);
        return petMatch || ownerMatch;
      }

      return true;
    });
  };

  const filteredTriages = getFilteredTriages();

  if (loading && triages.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow p-lg">
        <ErrorMessage message={error} onRetry={fetchCola} />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none">
      {/* Header */}
      <PageHeader
        title="Cola de Atención"
        description="Gestión y priorización de pacientes en sala de espera antes del ingreso a consulta."
        actions={
          <button
            onClick={() => navigate('/admin/triage')}
            className="bg-primary text-on-primary hover:bg-primary-active px-6 py-2.5 rounded-lg font-button text-button transition-colors flex items-center gap-xs cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">emergency</span>
            Registrar Triage
          </button>
        }
        hasDivider={true}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-xs flex justify-between items-center">
          <div>
            <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Esperando en Sala</span>
            <span className="font-display-sm text-display-sm text-ink font-bold mt-1">{totalWaiting}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">hail</span>
          </div>
        </div>

        <div className="bg-error/5 rounded-xl p-lg border border-error/15 shadow-xs flex justify-between items-center">
          <div>
            <span className="block font-caption text-caption text-error uppercase tracking-wider">Emergencias Activas</span>
            <span className="font-display-sm text-display-sm text-error font-bold mt-1">{totalEmergencies}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">emergency</span>
          </div>
        </div>

        <div className="bg-accent-teal/5 rounded-xl p-lg border border-accent-teal/15 shadow-xs flex justify-between items-center">
          <div>
            <span className="block font-caption text-caption text-accent-teal uppercase tracking-wider">En Consulta Médica</span>
            <span className="font-display-sm text-display-sm text-accent-teal font-bold mt-1">
              {triages.filter(t => t.estado === 'EnAtencion').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-teal/10 text-accent-teal flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">stethoscope</span>
          </div>
        </div>
      </div>

      {/* Pacientes en Espera de Triaje */}
      {pendientesTriage.length > 0 && (user?.role === 'Recepcionista' || user?.role === 'Admin') && (
        <div className="bg-[#fef7e0]/60 border border-[#b06000]/15 backdrop-blur-md rounded-xl p-lg mb-lg shadow-xs">
          <div className="flex items-center gap-2 mb-md">
            <span className="material-symbols-outlined text-[#b06000] animate-pulse">notifications_active</span>
            <h3 className="font-title-md text-title-md text-[#b06000] font-bold">
              Pacientes Recién Llegados - Pendientes de Triaje ({pendientesTriage.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#b06000]/10 text-[#b06000] font-caption-uppercase text-caption-uppercase">
                  <th className="py-2 px-md font-semibold">Mascota</th>
                  <th className="py-2 px-md font-semibold">Responsable</th>
                  <th className="py-2 px-md font-semibold">Motivo Consulta</th>
                  <th className="py-2 px-md font-semibold">Veterinario Asignado</th>
                  <th className="py-2 px-md text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b06000]/10 text-ink">
                {pendientesTriage.map((p) => (
                  <tr key={p.citaId} className="hover:bg-[#fef7e0]/30 transition-colors">
                    <td className="py-3 px-md font-bold">{p.mascotaNombre}</td>
                    <td className="py-3 px-md font-medium text-body-sm">{p.propietarioNombre}</td>
                    <td className="py-3 px-md text-secondary text-xs italic">{p.motivoConsulta || 'Sin especificar'}</td>
                    <td className="py-3 px-md font-medium text-body-sm">{p.veterinarioNombre}</td>
                    <td className="py-3 px-md text-right">
                      <button
                        onClick={() => navigate('/admin/triage', {
                          state: {
                            citaId: p.citaId,
                            mascotaId: p.mascotaId,
                            mascotaNombre: p.mascotaNombre,
                            motivo: p.motivoConsulta
                          }
                        })}
                        className="bg-[#b06000] hover:bg-[#904e00] text-white font-button text-xs py-1.5 px-4 rounded-lg transition-colors cursor-pointer shadow-xs font-bold inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">edit_note</span>
                        Realizar Triaje
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="bg-surface-card rounded-xl border border-hairline shadow-sm overflow-hidden flex flex-col">
        <div className="p-lg border-b border-hairline bg-surface-soft/40 flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar mascota o dueño..."
              className="w-full pl-9 pr-4 py-2 bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-md">
            {/* Urgency select filter */}
            <div className="relative">
              <select
                value={selectedNivel}
                onChange={(e) => setSelectedNivel(e.target.value)}
                className="bg-canvas border border-hairline rounded-lg pl-3 pr-8 py-2 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none min-w-[180px]"
              >
                <option value="all">Prioridad: Todos</option>
                <option value="N1">N1 - Emergencia (Rojo)</option>
                <option value="N2">N2 - Urgente (Naranja)</option>
                <option value="N3">N3 - No Urgente (Verde)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>

            <div className="text-caption text-secondary font-caption">
              Total en Cola: {filteredTriages.length}
            </div>
          </div>
        </div>

        {/* Data List */}
        {filteredTriages.length === 0 ? (
          <EmptyState
            title="Cola de espera vacía"
            description={buscar ? 'No hay pacientes en espera que coincidan con la búsqueda.' : 'No hay pacientes registrados en el triage actualmente.'}
            actionLabel="Registrar Primer Triage"
            onAction={() => navigate('/admin/triage')}
          />
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline">
                  <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider w-40">Prioridad</th>
                  <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Mascota / Paciente</th>
                  <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Responsable</th>
                  <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Síntomas / Motivo</th>
                  <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider w-40">Espera Est.</th>
                  <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider w-36">Consultorio</th>
                  <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider text-right w-48">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <AnimatePresence mode="popLayout">
                  {filteredTriages.map((t) => {
                    const colors = NIVEL_COLORS[t.nivel] || { bg: 'bg-surface-dim', border: 'border-hairline', text: 'text-secondary', label: t.nivel, dot: 'bg-secondary' };
                    
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`hover:bg-surface-soft/30 transition-colors group ${t.estado === 'EnAtencion' ? 'bg-accent-teal/5 opacity-80' : ''}`}
                      >
                        <td className="py-sm px-md">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-caption font-caption font-semibold ${colors.bg} ${colors.text} ${colors.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                            {colors.label}
                          </span>
                        </td>
                        <td className="py-sm px-md">
                          <div className="font-body-md text-ink font-bold">{t.mascotaNombre}</div>
                          <div className="font-caption text-caption text-secondary mt-0.5">ID Mascota: {t.mascotaId}</div>
                        </td>
                        <td className="py-sm px-md font-body-sm text-body-strong font-medium">
                          {t.propietarioNombre}
                        </td>
                        <td className="py-sm px-md font-body-sm text-secondary max-w-xs truncate">
                          {t.sintomas || t.motivoConsulta || 'Sin observaciones'}
                        </td>
                        <td className="py-sm px-md">
                          {t.estado === 'EnAtencion' ? (
                            <span className="font-body-sm text-accent-teal font-semibold">Atendiendo</span>
                          ) : (
                            <div className="flex items-center gap-1 font-body-sm text-ink font-semibold">
                              <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                              {t.tiempoEsperaEstimadoMin} min
                            </div>
                          )}
                        </td>
                        <td className="py-sm px-md font-body-sm text-body-strong font-semibold">
                          {t.consultorio || 'Sin asignar'}
                        </td>
                        <td className="py-sm px-md text-right">
                          <div className="flex justify-end gap-sm">
                            {t.estado === 'EnEspera' ? (
                              <>
                                <button
                                  onClick={() => handleMarcarAtendido(t.id!)}
                                  title="Marcar Atendido"
                                  className="w-9 h-9 flex items-center justify-center border border-hairline rounded hover:bg-surface-soft text-secondary hover:text-ink transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[18px]">done</span>
                                </button>
                                <button
                                  onClick={() => handleIniciarConsulta(t)}
                                  disabled={!t.citaId}
                                  title={t.citaId ? 'Iniciar evolución clínica' : 'Falta cita médica asignada'}
                                  className="px-4 py-1.5 bg-primary hover:bg-primary-active text-on-primary font-button text-button rounded-lg transition-colors flex items-center gap-xs cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">stethoscope</span>
                                  Atender
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => navigate(`/admin/atencion/${t.citaId}`, { state: { triage: t } })}
                                className="px-4 py-1.5 bg-surface-soft hover:bg-surface-soft-active border border-hairline text-accent-teal font-button text-button rounded-lg transition-colors flex items-center gap-xs cursor-pointer shadow-xs font-semibold"
                                title="Retomar evolución clínica"
                              >
                                <span className="material-symbols-outlined text-sm">lock_open</span>
                                En evolución
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
  );
}
