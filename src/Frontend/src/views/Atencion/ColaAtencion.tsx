import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface TriageEntry {
  id: number;
  citaId?: number;
  mascotaId: number;
  mascotaNombre: string;
  propietarioNombre: string;
  nivel: string;
  prioridadColor: string;
  estado: string;
  motivoConsulta: string;
  temperatura: number;
  frecuenciaCardiaca: number;
  peso: number;
  tiempoEsperaEstimadoMin: number;
  consultorio: string;
  fechaRegistro: string;
}


interface ColaData {
  triages: TriageEntry[];
  totalEsperando: number;
  totalEmergencias: number;
}

function getNivelConfig(nivel: string) {
  switch (nivel) {
    case 'N1':
      return {
        label: 'N1 - Crítico',
        icon: 'emergency',
        badgeClasses: 'bg-error text-on-error',
        timerIcon: 'timer',
        timerTextClass: 'text-error font-medium',
        rowBg: 'bg-error-container/20 hover:bg-error-container/30',
        showDot: true,
      };
    case 'N2':
      return {
        label: 'N2 - Urgente',
        icon: 'warning',
        badgeClasses: 'bg-tertiary-container text-on-tertiary-container',
        timerIcon: 'schedule',
        timerTextClass: 'text-on-surface',
        rowBg: 'hover:bg-surface-container-low bg-surface-container-lowest',
        showDot: false,
      };
    case 'N3':
    default:
      return {
        label: 'N3 - Estándar',
        icon: 'info',
        badgeClasses: 'bg-surface-variant text-on-surface-variant border border-outline-variant',
        timerIcon: 'schedule',
        timerTextClass: 'text-on-surface',
        rowBg: 'hover:bg-surface-container-low bg-surface-container-lowest',
        showDot: false,
      };
  }
}

export default function ColaAtencion() {
  const navigate = useNavigate();
  const [colaData, setColaData] = useState<ColaData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchCola() {
    try {
      const response = await api.get('/api/Triage/Cola');
      if (response.data.success) {
        setColaData(response.data.data);
      } else {
        toast.error(response.data.message || 'Error al cargar la cola de atención');
      }
    } catch (error) {
      console.error('Error fetching cola:', error);
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCola();
  }, []);

  async function handleCambiarEstado(id: number) {
    try {
      const response = await api.post(`/api/Triage/CambiarEstado/${id}?nuevoEstado=EnAtencion`);
      if (response.data.success) {
        toast.success('Paciente enviado a atención.');
        fetchCola();
      } else {
        toast.error(response.data.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('No se pudo cambiar el estado del paciente.');
    }
  }

  if (loading) {
    return (
      <motion.div
        className="pt-16 md:pl-64 min-h-screen flex flex-col bg-background"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-gutter max-w-7xl mx-auto w-full flex-1 flex flex-col gap-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm mb-sm">
            <div>
              <div className="h-8 w-64 bg-surface-container-low rounded-lg animate-pulse"></div>
              <div className="h-4 w-96 bg-surface-container-low rounded-lg animate-pulse mt-xs"></div>
            </div>
            <div className="flex items-center gap-sm">
              <div className="h-9 w-32 bg-surface-container-low rounded-xl animate-pulse"></div>
              <div className="h-9 w-32 bg-surface-container-low rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-md py-sm border-b border-outline-variant last:border-b-0">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low animate-pulse"></div>
                  <div className="flex flex-col gap-xs flex-1">
                    <div className="h-4 w-24 bg-surface-container-low rounded animate-pulse"></div>
                    <div className="h-3 w-40 bg-surface-container-low rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-24 bg-surface-container-low rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const triages = colaData?.triages ?? [];
  const totalEsperando = colaData?.totalEsperando ?? 0;
  const totalEmergencias = colaData?.totalEmergencias ?? 0;

  return (
    <motion.div
      className="pt-16 md:pl-64 min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-gutter max-w-7xl mx-auto w-full flex-1 flex flex-col gap-md">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm mb-sm">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface">Cola de Atención</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Gestión en tiempo real de pacientes en espera.</p>
          </div>
          <div className="flex items-center gap-sm">
            <div className="bg-surface border border-outline-variant rounded-xl px-sm py-xs flex items-center gap-xs shadow-sm">
              <span className="material-symbols-outlined text-on-surface-variant" data-icon="group">group</span>
              <span className="font-label-md text-label-md text-on-surface">{totalEsperando} Esperando</span>
            </div>
            <div className="bg-error-container border border-error rounded-xl px-sm py-xs flex items-center gap-xs shadow-sm">
              <span className="material-symbols-outlined text-error" data-icon="warning">warning</span>
              <span className="font-label-md text-label-md text-on-error-container">{totalEmergencias} Emergencia{totalEmergencias !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Queue List / Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          {/* Table Header (Hidden on small mobile) */}
          <div className="hidden sm:grid grid-cols-[60px_1fr_140px_120px_160px_100px] gap-sm px-md py-sm bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            <div className="text-center">Pos</div>
            <div>Paciente</div>
            <div>Triage</div>
            <div>Espera</div>
            <div>Consultorio</div>
            <div className="text-right">Acciones</div>
          </div>

          {/* List Items */}
          <div className="flex flex-col divide-y divide-outline-variant">
            {triages.length === 0 ? (
              <div className="px-md py-lg text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[48px] mb-sm block">hourglass_empty</span>
                <p className="font-body-lg text-body-lg text-on-surface-variant">No hay pacientes en cola.</p>
              </div>
            ) : (
              triages.map((triage, index) => {
                const config = getNivelConfig(triage.nivel);
                return (
                  <div
                    key={triage.id}
                    className={`grid sm:grid-cols-[60px_1fr_140px_120px_160px_100px] gap-y-sm sm:gap-sm px-md py-sm items-center transition-colors ${config.rowBg}`}
                  >
                    <div className={`font-headline-md text-headline-md text-center hidden sm:block ${triage.nivel === 'N1' ? 'text-error' : 'text-on-surface-variant'}`}>
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center shrink-0 border border-outline-variant shadow-sm relative">
                        <span className="material-symbols-outlined text-on-surface-variant" data-icon="pets">pets</span>
                        {config.showDot && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-surface-container-lowest"></div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">{triage.mascotaNombre}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{triage.propietarioNombre}</span>
                      </div>
                    </div>
                    <div>
                      <div className={`inline-flex items-center gap-xs px-2 py-1 rounded-lg font-label-sm text-label-sm shadow-sm ${config.badgeClasses}`}>
                        <span className="material-symbols-outlined text-[14px]" data-icon={config.icon} style={{ fontVariationSettings: "'FILL' 1" }}>{config.icon}</span>
                        {config.label}
                      </div>
                    </div>
                    <div className={`font-body-md text-body-md flex items-center gap-xs ${config.timerTextClass}`}>
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant" data-icon={config.timerIcon}>{config.timerIcon}</span>
                      {triage.tiempoEsperaEstimadoMin} min
                    </div>
                    <div className="font-body-md text-body-md text-on-surface flex items-center gap-xs">
                      {triage.consultorio ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant" data-icon="meeting_room">meeting_room</span>
                          {triage.consultorio}
                        </>
                      ) : (
                        <span className="text-on-surface-variant italic flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[18px]" data-icon="hourglass_empty">hourglass_empty</span>
                          En Espera
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end gap-xs">
                      {triage.estado === 'EnAtencion' && (
                        <button
                          className="p-2 text-primary hover:text-on-primary-container hover:bg-primary-container rounded-lg transition-colors"
                          title="Registrar SOAP"
                          onClick={() => {
                            const path = `/historia-clinica?citaId=${triage.citaId || ''}&triageId=${triage.id}&temp=${triage.temperatura || ''}&fc=${triage.frecuenciaCardiaca || ''}&peso=${triage.peso || ''}&motivo=${encodeURIComponent(triage.motivoConsulta || '')}&paciente=${encodeURIComponent(triage.mascotaNombre || '')}&propietario=${encodeURIComponent(triage.propietarioNombre || '')}`;
                            navigate(path);
                          }}
                        >
                          <span className="material-symbols-outlined" data-icon="edit_note">edit_note</span>
                        </button>
                      )}
                      <button
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-lg transition-colors"
                        title="Editar Triage"
                      >
                        <span className="material-symbols-outlined" data-icon="edit">edit</span>
                      </button>
                      <button
                        className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary-container rounded-lg transition-colors"
                        title="Llamar Paciente"
                        onClick={() => handleCambiarEstado(triage.id)}
                      >
                        <span className="material-symbols-outlined" data-icon="campaign">campaign</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
