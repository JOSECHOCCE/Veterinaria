import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

interface CitaProxima {
  id: number;
  fechaHora: string;
  mascotaNombre: string;
  propietarioNombre: string;
  veterinarioNombre: string;
  servicioNombre: string;
  estado: string;
}

interface DashboardData {
  citasHoyTotal: number;
  citasHoyPendientes: number;
  citasHoyConfirmadas: number;
  citasHoyEnProceso: number;
  citasHoyCompletadas: number;
  citasHoyCanceladas: number;
  totalMascotas: number;
  totalVeterinarios: number;
  totalUsuarios: number;
  totalServicios: number;
  pagosPendientesCount: number;
  pagosPendientesTotal: number;
  proximasCitas: CitaProxima[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar datos de la API
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await api.get('/api/Dashboard');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          toast.error('Error al cargar datos del Dashboard');
        }
      } catch (error) {
        console.error('Error de conexión:', error);
        toast.error('No se pudo establecer conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const handleEmergencyClick = () => {
    toast.error('Se ha iniciado el protocolo de Emergencia Crítica', {
      description: 'El consultorio de Triage y el equipo médico han sido notificados.',
    });
  };

  // Formatear hora de la cita
  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateTimeStr;
    }
  };

  // Badge de Estado Elegante
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'EnProceso':
        return (
          <span className="font-label-sm text-[10px] text-tertiary bg-tertiary-container/30 border border-tertiary/20 px-sm py-[3px] rounded-full uppercase font-bold animate-pulse">
            En Consulta
          </span>
        );
      case 'Confirmada':
        return (
          <span className="font-label-sm text-[10px] text-secondary bg-secondary-container/20 border border-secondary/20 px-sm py-[3px] rounded-full uppercase font-bold">
            Confirmada
          </span>
        );
      case 'Completada':
        return (
          <span className="font-label-sm text-[10px] text-primary bg-primary/10 border border-primary/20 px-sm py-[3px] rounded-full uppercase font-bold">
            Atendido
          </span>
        );
      default: // Pendiente
        return (
          <span className="font-label-sm text-[10px] text-on-surface-variant bg-surface-container-high/40 border border-outline-variant/30 px-sm py-[3px] rounded-full uppercase font-bold">
            Pendiente
          </span>
        );
    }
  };

  // Animaciones Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="space-y-lg">
        {/* Skeleton Header */}
        <div className="h-12 w-64 bg-surface-container-high/30 rounded-xl animate-pulse" />
        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-surface-container-high/30 rounded-2xl border border-outline-variant/10 animate-pulse" />
          ))}
        </div>
        {/* Skeleton Table */}
        <div className="h-64 bg-surface-container-high/30 rounded-2xl border border-outline-variant/10 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-lg text-left"
    >
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-xs">
        <div>
          <h2 className="text-headline-xl font-headline-xl font-extrabold text-on-surface tracking-tight leading-none mb-2">
            Resumen del Día
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant font-medium">
            Cola de atención actual y estadísticas de actividad en la clínica.
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleEmergencyClick}
          className="flex items-center gap-sm bg-error hover:bg-error/90 text-on-error px-md py-sm rounded-xl font-label-md text-label-md font-bold shadow-md shadow-error/25 cursor-pointer transition-all"
        >
          <span className="material-symbols-outlined font-semibold text-[20px]">local_hospital</span>
          Nueva Emergencia
        </motion.button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Metric 1: Citas del día */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="bg-surface-container-lowest/60 backdrop-blur-md p-md rounded-2xl border border-outline-variant/20 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/15 shadow-inner">
              <span className="material-symbols-outlined text-[28px] font-semibold">calendar_month</span>
            </div>
            <span className="font-label-sm text-[10px] text-secondary bg-secondary-container/20 border border-secondary/20 px-sm py-[2px] rounded-full uppercase font-bold">
              Hoy
            </span>
          </div>
          <div className="mt-sm">
            <h3 className="font-headline-xl text-[36px] font-extrabold text-on-surface leading-tight">
              {data?.citasHoyTotal || 0}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant font-semibold">Citas Agendadas</p>
            <div className="mt-xs text-[11px] text-outline-variant font-bold flex gap-xs">
              <span className="text-secondary">{data?.citasHoyConfirmadas || 0} Confirmadas</span>
              <span>•</span>
              <span className="text-tertiary">{data?.citasHoyEnProceso || 0} En Proceso</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Total Mascotas */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="bg-surface-container-lowest/60 backdrop-blur-md p-md rounded-2xl border border-outline-variant/20 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/15 shadow-inner">
              <span className="material-symbols-outlined text-[28px] font-semibold">pets</span>
            </div>
            <span className="font-label-sm text-[10px] text-secondary bg-secondary-container/20 border border-secondary/20 px-sm py-[2px] rounded-full uppercase font-bold">
              Clínica
            </span>
          </div>
          <div className="mt-sm">
            <h3 className="font-headline-xl text-[36px] font-extrabold text-on-surface leading-tight">
              {data?.totalMascotas || 0}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant font-semibold">Pacientes Totales</p>
            <div className="mt-xs text-[11px] text-outline-variant font-bold">
              Asociados a {data?.totalUsuarios || 0} dueños registrados
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Pagos Pendientes */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="bg-surface-container-lowest/60 backdrop-blur-md p-md rounded-2xl border border-outline-variant/20 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/15 shadow-inner">
              <span className="material-symbols-outlined text-[28px] font-semibold">payments</span>
            </div>
            {data && data.pagosPendientesCount > 0 ? (
              <span className="font-label-sm text-[10px] text-error bg-error-container/30 border border-error/20 px-sm py-[2px] rounded-full uppercase font-bold animate-pulse">
                Por Cobrar
              </span>
            ) : (
              <span className="font-label-sm text-[10px] text-secondary bg-secondary-container/20 border border-secondary/20 px-sm py-[2px] rounded-full uppercase font-bold">
                Al Día
              </span>
            )}
          </div>
          <div className="mt-sm">
            <h3 className="font-headline-xl text-[36px] font-extrabold text-on-surface leading-tight">
              S/. {data?.pagosPendientesTotal.toFixed(2) || '0.00'}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant font-semibold">Pagos por Regularizar</p>
            <div className="mt-xs text-[11px] text-outline-variant font-bold">
              {data?.pagosPendientesCount || 0} comprobantes pendientes
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cola de Atención Actual */}
      <motion.div variants={cardVariants} className="space-y-md">
        <div className="flex justify-between items-center px-sm">
          <h3 className="text-headline-md font-headline-md font-extrabold text-on-surface">
            Cola de Atención / Citas Próximas
          </h3>
          <Link to="/admin/agenda" className="font-label-md text-label-md text-primary font-bold hover:underline cursor-pointer">
            Ver Agenda Completa
          </Link>
        </div>
        
        <div className="bg-surface-container-lowest/60 backdrop-blur-md rounded-2xl border border-outline-variant/20 shadow-lg overflow-hidden">
          {data && data.proximasCitas.length > 0 ? (
            <div className="divide-y divide-outline-variant/15">
              {data.proximasCitas.map((cita) => (
                <div 
                  key={cita.id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-md gap-md hover:bg-surface-container-low/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-md text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/10 to-primary-container/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">pets</span>
                    </div>
                    <div>
                      <h4 className="font-headline-md text-headline-md font-extrabold text-on-surface mb-[2px]">
                        {cita.mascotaNombre}
                      </h4>
                      <p className="font-body-md text-body-md text-on-surface-variant font-semibold">
                        Dueño: {cita.propietarioNombre} • <span className="text-primary/80 font-bold">{cita.servicioNombre}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-sm text-left sm:text-right">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                      <p className="font-body-md text-body-md text-on-surface font-bold">
                        {formatTime(cita.fechaHora)}
                      </p>
                    </div>
                    <div className="flex items-center gap-sm">
                      <p className="font-body-md text-body-md text-on-surface-variant font-semibold hidden sm:block">
                        {cita.veterinarioNombre}
                      </p>
                      {getStatusBadge(cita.estado)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-xl text-center space-y-sm flex flex-col items-center">
              <span className="material-symbols-outlined text-[48px] text-outline-variant animate-bounce">emoji_nature</span>
              <div>
                <h4 className="font-headline-md text-headline-md font-bold text-on-surface">No hay citas registradas para hoy</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">Todas las colas están vacías y al día.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
