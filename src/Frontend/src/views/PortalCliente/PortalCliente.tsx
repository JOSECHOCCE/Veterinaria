import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  fotoUrl?: string;
  peso?: number;
}

interface Cita {
  id: number;
  fechaHora: string;
  estado: string;
  motivo: string;
  mascotaNombre: string;
  veterinarioNombre: string;
  servicioNombre: string;
  precioServicio: number;
}

const PortalCliente: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [totalMascotas, setTotalMascotas] = useState(0);

  // Load client's pets and appointments
  useEffect(() => {
    async function loadPortalData() {
      try {
        // 1. Fetch user's pets
        const petsResponse = await api.get('/api/Mascotas');
        if (petsResponse.data.success) {
          const petsResult = petsResponse.data.data;
          setMascotas(petsResult.data || []);
          setTotalMascotas(petsResult.total || 0);
        }

        // 2. Fetch user's appointments
        const appointmentsResponse = await api.get('/api/Citas');
        if (appointmentsResponse.data.success) {
          const citasResult = appointmentsResponse.data.data;
          setCitas(citasResult.citas || []);
        }
      } catch (error) {
        console.error('Error loading client portal data:', error);
        toast.error('No se pudo cargar la información de tu portal.');
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, []);

  const formatFecha = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatHora = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'Confirmada':
        return 'bg-primary-container text-on-primary-container border-primary/20';
      case 'Pendiente':
        return 'bg-surface-variant text-on-surface-variant border-outline-variant';
      case 'EnProceso':
        return 'bg-secondary-container text-on-secondary-container border-secondary/20';
      case 'Completada':
        return 'bg-secondary text-white border-transparent';
      case 'Cancelada':
        return 'bg-error-container text-on-error-container border-error/20';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-sm">Cargando tu portal personalizado...</p>
      </div>
    );
  }

  // Filter upcoming appointments (not Cancelled or Completed, and date is future/today)
  const proximasCitas = citas.filter(c => 
    c.estado !== 'Cancelada' && c.estado !== 'Completada'
  ).slice(0, 3); // Max 3

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="flex-grow w-full bg-background min-h-screen"
    >
      <main className="flex-grow w-full max-w-7xl mx-auto px-margin py-lg flex flex-col gap-margin pt-24">
        {/* Hero Section */}
        <section className="w-full bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col md:flex-row items-center">
          <div className="p-lg md:w-1/2 flex flex-col gap-md">
            <div className="inline-flex items-center gap-xs px-sm py-xs bg-primary/10 text-primary rounded-full w-fit border border-primary/20">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="font-label-md text-label-md">Portal del Propietario</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">
              ¡Hola, {user?.nombreCompleto || 'Propietario'}!
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Te damos la bienvenida a tu centro de salud veterinaria. Desde aquí puedes gestionar las consultas médicas, ver recetas, revisar tus consentimientos firmados y programar nuevas atenciones para tus engreídos.
            </p>
            <div className="flex flex-col sm:flex-row gap-sm mt-sm">
              <button 
                onClick={() => navigate('/cliente/nueva-cita')}
                className="bg-primary text-on-primary px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-tint transition-colors shadow-sm cursor-pointer h-[48px]"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                Solicitar Nueva Cita
              </button>
              <button 
                onClick={() => navigate('/cliente/mis-mascotas')}
                className="bg-transparent border border-primary text-primary px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-primary/5 transition-colors cursor-pointer h-[48px]"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Ver Mis Mascotas
              </button>
            </div>
          </div>
          <div className="md:w-1/2 h-64 md:h-full min-h-[320px] w-full relative bg-surface-container-high">
            <img 
              alt="Perro feliz en la clínica veterinaria" 
              className="absolute inset-0 w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=800&q=80" 
            />
          </div>
        </section>

        {/* Bento Grid Content */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Upcoming Appointments (Span 2 cols on Desktop) */}
          <div className="md:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm">
            <div className="flex justify-between items-center mb-xs border-b border-surface-variant pb-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">event</span>
                Próximas Citas Programadas
              </h3>
              <button 
                onClick={() => navigate('/cliente/mis-citas')}
                className="font-label-md text-label-md text-primary hover:underline cursor-pointer"
              >
                Ver Agenda
              </button>
            </div>
            
            <div className="flex flex-col gap-sm flex-grow">
              {proximasCitas.length === 0 ? (
                <div className="text-center py-lg flex flex-col items-center justify-center opacity-65 flex-grow">
                  <span className="material-symbols-outlined text-[40px] text-outline">calendar_today</span>
                  <p className="font-body-md text-body-md mt-xs">No tienes citas próximas agendadas.</p>
                  <button 
                    onClick={() => navigate('/cliente/mis-citas')}
                    className="text-primary font-semibold hover:underline mt-xs"
                  >
                    Reserva una cita ahora
                  </button>
                </div>
              ) : (
                proximasCitas.map((cita) => (
                  <div 
                    key={cita.id} 
                    className="bg-surface rounded-lg p-sm border border-outline-variant flex items-center justify-between hover:border-primary transition-all group cursor-pointer shadow-sm"
                    onClick={() => navigate('/cliente/mis-citas')}
                  >
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <span className="material-symbols-outlined font-semibold">pets</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
                          {cita.mascotaNombre}
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getEstadoBadgeClass(cita.estado)}`}>
                            {cita.estado}
                          </span>
                        </span>
                        <span className="font-body-md text-body-md text-on-surface-variant">
                          {cita.servicioNombre} • {cita.veterinarioNombre}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="font-label-md text-label-md text-primary font-semibold">
                        {formatFecha(cita.fechaHora)}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface-variant font-medium">
                        {formatHora(cita.fechaHora)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Pets Summary */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm">
            <div className="flex justify-between items-center mb-xs border-b border-surface-variant pb-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">pets</span>
                Mis Mascotas
              </h3>
            </div>
            
            <div className="flex-grow flex flex-col gap-sm justify-center">
              {mascotas.length === 0 ? (
                <div className="text-center py-lg opacity-60">
                  <span className="material-symbols-outlined text-[32px]">pets</span>
                  <p className="font-body-sm text-body-sm mt-xs">No tienes mascotas registradas.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-xs">
                  {mascotas.slice(0, 3).map((pet) => (
                    <div 
                      key={pet.id} 
                      onClick={() => navigate('/cliente/mis-mascotas')}
                      className="flex items-center gap-sm p-xs rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer border border-transparent hover:border-outline-variant"
                    >
                      <img 
                        src={pet.fotoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=64&h=64&q=80'} 
                        alt={pet.nombre} 
                        className="w-10 h-10 rounded-full object-cover border border-outline-variant shadow-sm"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">{pet.nombre}</span>
                        <span className="font-label-sm text-[11px] text-on-surface-variant">{pet.especie} • {pet.raza || 'Mestizo'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-center mt-sm pt-xs border-t border-surface-variant/40">
                <span className="font-headline-xl text-headline-xl text-primary font-bold block">{totalMascotas}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Mascotas registradas</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/cliente/mis-mascotas')}
              className="w-full bg-primary/10 text-primary border border-primary/25 py-xs rounded-lg font-label-sm text-label-sm hover:bg-primary/20 transition-all font-semibold cursor-pointer mt-auto"
            >
              Gestionar Mascotas
            </button>
          </div>

          {/* Quick Actions / Info Cards */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div 
              onClick={() => navigate('/cliente/historial')}
              className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex items-center gap-sm hover:shadow-md hover:border-primary transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors border border-primary/20 shadow-sm">
                <span className="material-symbols-outlined font-semibold">history</span>
              </div>
              <div>
                <h4 className="font-headline-md text-[16px] text-on-surface font-semibold">Historial Médico</h4>
                <p className="font-body-md text-[12px] text-on-surface-variant">Revisar consultas anteriores y vacunas</p>
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/cliente/historial')}
              className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex items-center gap-sm hover:shadow-md hover:border-primary transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors border border-primary/20 shadow-sm">
                <span className="material-symbols-outlined font-semibold">prescriptions</span>
              </div>
              <div>
                <h4 className="font-headline-md text-[16px] text-on-surface font-semibold">Recetas Clínicas</h4>
                <p className="font-body-md text-[12px] text-on-surface-variant">Ver medicamentos y posologías activas</p>
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/cliente/consentimiento')}
              className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex items-center gap-sm hover:shadow-md hover:border-primary transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors border border-primary/20 shadow-sm">
                <span className="material-symbols-outlined font-semibold">gavel</span>
              </div>
              <div>
                <h4 className="font-headline-md text-[16px] text-on-surface font-semibold">Consentimientos</h4>
                <p className="font-body-md text-[12px] text-on-surface-variant">Firmar términos y documentos legales</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
};

export default PortalCliente;
