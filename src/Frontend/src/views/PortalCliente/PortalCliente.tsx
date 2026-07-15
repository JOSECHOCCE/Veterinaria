import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalClienteService from '../../services/portalCliente.service';
import PageHeader from '../../components/common/PageHeader';
import { motion } from 'framer-motion';
import { notificacionesService } from '../../services/notificaciones.service';
import { toast } from 'sonner';

interface MascotaInfo {
  id: number;
  nombre: string;
  especie: string;
  raza?: string;
  fechaNacimiento?: string;
}

interface CitaInfo {
  id: number;
  fechaHora: string;
  mascotaNombre: string;
  servicioNombre: string;
  veterinarioNombre: string;
  estado: string;
}

interface AlertaInfo {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  fechaCreacion: string;
}

const getAlertStyle = (tipo: string) => {
  const t = tipo?.toLowerCase();
  if (t === 'success') {
    return {
      container: 'bg-[#e6f4ea]/90 text-[#137333] border-[#137333]/15',
      iconBg: 'bg-[#137333]/10 text-[#137333]',
      icon: 'check_circle',
      buttonPrimary: 'bg-[#137333] hover:bg-[#0f6229] text-white',
    };
  } else if (t === 'warning') {
    return {
      container: 'bg-[#fef7e0]/90 text-[#b06000] border-[#b06000]/15',
      iconBg: 'bg-[#b06000]/10 text-[#b06000]',
      icon: 'info',
      buttonPrimary: 'bg-[#b06000] hover:bg-[#904e00] text-white',
    };
  } else { // error / default
    return {
      container: 'bg-[#fce8e6]/90 text-[#c5221f] border-[#c5221f]/15',
      iconBg: 'bg-[#c5221f]/10 text-[#c5221f]',
      icon: 'warning',
      buttonPrimary: 'bg-[#c5221f] hover:bg-[#a51b19] text-white',
    };
  }
};

export default function PortalCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mascotas, setMascotas] = useState<MascotaInfo[]>([]);
  const [citas, setCitas] = useState<CitaInfo[]>([]);
  const [alertas, setAlertas] = useState<AlertaInfo[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PortalClienteService.getDashboard();
      if (res.success && res.data) {
        setMascotas(res.data.mascotas || []);
        setCitas(res.data.proximasCitas || []);
        setAlertas(res.data.alertas || []);
      } else {
        setError(res.message || 'Error al cargar los datos del dashboard.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleAceptarAlerta = async (id: number) => {
    try {
      await notificacionesService.marcarLeida(id);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
      toast.success('Notificación archivada');
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Error al archivar la notificación');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-14 bg-surface-card rounded-lg w-full"></div>
        <div className="h-24 bg-surface-card rounded-lg w-2/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-8 h-96 bg-surface-card rounded-xl"></div>
          <div className="lg:col-span-4 h-96 bg-surface-card rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Ocurrió un error</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const getPetImage = (especie: string) => {
    const esp = especie.toLowerCase();
    if (esp.includes('perro') || esp.includes('dog')) {
      return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';
    }
    return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600';
  };

  const getPetAge = (fechaNac: string | undefined) => {
    if (!fechaNac) return 'Edad desconocida';
    const birth = new Date(fechaNac);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age === 1 ? '1 año' : age <= 0 ? 'Cachorro' : `${age} años`;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto w-full relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[30%] -right-[15%] w-[60%] h-[50%] rounded-full bg-accent-teal/5 blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Alertas / Notificaciones activas */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {alertas.map((alerta) => {
            const style = getAlertStyle(alerta.tipo);
            return (
              <motion.div
                key={alerta.id}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`backdrop-blur-md p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-sm transition-all ${style.container}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${style.iconBg}`}>
                    <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm block sm:inline">{alerta.titulo}:</span>
                    <span className="text-xs sm:ml-2 block sm:inline">{alerta.mensaje}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center ml-auto">
                  <button
                    onClick={() => handleAceptarAlerta(alerta.id)}
                    className="bg-white/80 hover:bg-white text-on-surface border border-outline/25 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => navigate('/cliente/notificaciones')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap ${style.buttonPrimary}`}
                  >
                    Detalles
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Hero Welcome Panel (Glassmorphism Style) */}
      <section className="mb-8">
        <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
          {/* Abstract patterns */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-accent-teal/10 rounded-full blur-[60px]" />
          
          <div className="relative z-10 flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Portal de Cliente Premium
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-on-surface mb-3 leading-tight">
              Bienvenido de nuevo, <span className="text-primary">{user?.nombreCompleto?.split(' ')[0] || 'Cliente'}</span>.
            </h2>
            <p className="text-sm font-medium text-on-surface-variant max-w-xl leading-relaxed">
              Tu familia está en buenas manos. Tus compañeros tienen sus cuidados al día, ¡gracias por confiar en VetCarePro!
            </p>
          </div>
          
          <div className="relative z-10 shrink-0">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-primary-container/10 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="w-36 h-36 rounded-[2rem] bg-primary-container/20 text-primary flex items-center justify-center font-bold text-4xl shadow-md border-4 border-white rotate-3 group-hover:rotate-0 transition-transform duration-500">
                {user?.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl shadow-md border border-outline-variant/30 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">verified</span>
                </div>
                <div>
                  <p className="text-[8px] uppercase font-bold text-on-surface-variant tracking-wider leading-none">Miembro</p>
                  <p className="text-xs font-bold text-on-surface leading-normal">Premium</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-2">
        
        {/* Left Column (Companions & Action Center) */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          {/* Companions Section */}
          <section>
            <div className="flex items-center justify-between mb-6 border-b border-surface-variant/40 pb-3">
              <div>
                <h3 className="font-bold text-lg text-on-surface">Mis Compañeros</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Gestión de mascotas registradas bajo tu cuidado</p>
              </div>
              <Link
                to="/cliente/mis-mascotas"
                className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              >
                Ver Todas <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {mascotas.length === 0 ? (
              <div className="border border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-sm min-h-[220px] shadow-sm">
                <div className="bg-surface-container-low p-4 rounded-full border border-outline-variant mb-3 text-primary">
                  <span className="material-symbols-outlined text-[32px]">pets</span>
                </div>
                <h3 className="font-bold text-sm text-on-surface">¿Aún no tienes mascotas registradas?</h3>
                <p className="text-xs text-on-surface-variant text-center mt-1 max-w-sm">
                  Registra a tu primer compañero de vida para comenzar a gestionar sus citas y vacunas.
                </p>
                <button
                  onClick={() => navigate('/cliente/mis-mascotas?action=new')}
                  className="mt-4 bg-primary text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-primary-active transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Registrar Mascota
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mascotas.slice(0, 4).map((mascota) => (
                  <div
                    key={mascota.id}
                    onClick={() => navigate(`/cliente/mis-mascotas`)}
                    className="bg-white border border-primary/10 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-primary-container/40 transition-all duration-300 shadow-sm"
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 -mr-10 -mt-10 rounded-full transition-transform group-hover:scale-125 duration-500" />
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            className="w-20 h-20 rounded-xl object-cover shadow-sm border-2 border-white"
                            src={getPetImage(mascota.especie)}
                            alt={mascota.nombre}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                            {mascota.nombre}
                          </h4>
                          <p className="text-xs font-medium text-on-surface-variant mt-0.5">
                            {mascota.especie} {mascota.raza ? `· ${mascota.raza}` : ''}
                          </p>
                          <div className="mt-2.5 flex gap-1.5">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[9px] font-bold uppercase tracking-wider border border-green-100">
                              Sano
                            </span>
                            <span className="px-2 py-0.5 bg-slate-50 text-on-surface-variant rounded text-[9px] font-bold uppercase tracking-wider">
                              {getPetAge(mascota.fechaNacimiento)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">
                        info
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Center Section */}
          <section>
            <h3 className="font-bold text-lg text-on-surface mb-6 border-b border-surface-variant/40 pb-3">Centro de Acciones</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/cliente/nueva-cita')}
                className="bg-white border border-primary/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center group cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-primary-container/40 transition-all duration-300 shadow-sm"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-xl">calendar_add_on</span>
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">Agendar Cita</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Solicitar visita</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/cliente/mis-pagos')}
                className="bg-white border border-primary/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center group cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-primary-container/40 transition-all duration-300 shadow-sm"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">Mis Facturas</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Pagos y cobros</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/cliente/mis-citas')}
                className="bg-white border border-primary/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center group cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-primary-container/40 transition-all duration-300 shadow-sm"
              >
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-xl">medical_information</span>
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">Historial</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Consultas previas</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/cliente/mis-mascotas')}
                className="bg-white border border-primary/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center group cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-primary-container/40 transition-all duration-300 shadow-sm"
              >
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-xl">qr_code_2</span>
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">Tarjetas ID</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Credenciales digitales</p>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column (Timeline of Scheduled Appointments) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <section className="bg-white border border-primary/10 rounded-3xl p-6 shadow-sm sticky top-6 flex flex-col min-h-[420px] justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-surface-variant/40">
                <h3 className="font-bold text-base text-on-surface">Próximas Citas</h3>
                <button
                  onClick={() => navigate('/cliente/mis-citas')}
                  className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">more_horiz</span>
                </button>
              </div>

              {citas.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 min-h-[220px]">
                  <div className="bg-surface-container-low p-3 rounded-full border border-outline-variant mb-2 text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-[28px]">event_available</span>
                  </div>
                  <p className="text-xs font-bold text-on-surface">No tienes citas programadas</p>
                  <p className="text-[11px] text-on-surface-variant mt-1 max-w-[200px]">Cuando agendes una cita aparecerá aquí.</p>
                  <button
                    onClick={() => navigate('/cliente/nueva-cita')}
                    className="mt-4 bg-transparent border border-outline-variant hover:border-primary hover:text-primary hover:bg-primary/5 text-on-surface px-4 py-2 rounded-lg font-semibold text-xs transition-all w-full cursor-pointer shadow-sm"
                  >
                    Agendar Cita
                  </button>
                </div>
              ) : (
                <div className="space-y-6 relative pl-6 border-l-2 border-primary/30 ml-2 mt-4">
                  {citas.map((cita) => {
                    const dateObj = new Date(cita.fechaHora);
                    const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
                    const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

                    return (
                      <div key={cita.id} className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute left-[-31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase tracking-wider">
                              {dateStr} - {timeStr}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-on-surface mt-1 leading-snug">
                            {cita.servicioNombre} · {cita.mascotaNombre}
                          </h4>
                          
                          {/* Doctor info card */}
                          <div className="mt-3 flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                            <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold text-[10px]">
                              {cita.veterinarioNombre ? cita.veterinarioNombre.split(' ').slice(0, 2).map(n => n[0]).join('') : 'Dr'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-on-surface">{cita.veterinarioNombre}</p>
                              <p className="text-[9px] text-on-surface-variant font-medium">Especialista Asignado</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Promo/Feature Section */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-primary to-primary-active text-white relative overflow-hidden shadow-sm">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">health_metrics</span>
              </div>
              <h5 className="font-bold text-sm">Monitoreo Clínico</h5>
              <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed font-medium">
                Accede a las analíticas completas de tus mascotas integradas en tiempo real por nuestros especialistas.
              </p>
              <button 
                onClick={() => navigate('/cliente/mis-mascotas')}
                className="mt-3.5 px-4 py-2 bg-white text-primary text-[10px] font-bold rounded-lg shadow cursor-pointer active:scale-95 transition-all"
              >
                Explorar Ficha
              </button>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
