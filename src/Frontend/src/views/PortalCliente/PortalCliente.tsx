import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalClienteService from '../../services/portalCliente.service';
import PageHeader from '../../components/common/PageHeader';
import { motion } from 'framer-motion';

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
    <div className="flex flex-col gap-8 w-full pb-12 relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/4 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[30%] -right-[15%] w-[60%] h-[50%] rounded-full bg-accent-teal/4 blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Alertas / Notificaciones activas */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-3">
          {alertas.map((alerta) => (
            <motion.div
              key={alerta.id}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-error-container/85 backdrop-blur-md text-on-error-container p-4 rounded-xl flex items-start sm:items-center gap-3 border border-error/15 shadow-md transition-all hover:shadow-lg"
            >
              <div className="bg-error/10 p-2 rounded-lg shrink-0 flex items-center justify-center text-error animate-bounce">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="flex-1">
                <span className="font-title-sm text-title-sm block sm:inline font-bold">
                  {alerta.titulo}:
                </span>
                <span className="font-body-sm text-body-sm sm:ml-2 block sm:inline">
                  {alerta.mensaje}
                </span>
              </div>
              <button
                onClick={() => navigate('/cliente/nueva-cita')}
                className="bg-error text-on-error px-5 py-2 rounded-full font-button text-[12px] font-bold hover:bg-opacity-90 transition-all ml-auto whitespace-nowrap hidden sm:block cursor-pointer shadow-sm active:scale-95"
              >
                Atender Alerta
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bloque de Bienvenida y Acciones Rápidas */}
      <PageHeader
        title={
          <span className="bg-gradient-to-r from-primary via-primary-active to-[#b86d5c] bg-clip-text text-transparent">
            Hola, {user?.nombreCompleto?.split(' ')[0] || 'Cliente'}
          </span>
        }
        description="Bienvenido de nuevo a tu portal. Aquí tienes el resumen y estado de salud de tus mascotas."
        actions={
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/cliente/nueva-cita')}
              className="bg-gradient-to-r from-primary to-primary-active hover:shadow-lg hover:shadow-primary/20 text-on-primary px-6 py-3 rounded-full font-button text-button transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer w-full sm:w-auto active:scale-95 animate-fade-in"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Solicitar Cita
            </button>
            <button
              onClick={() => navigate('/cliente/mis-pagos')}
              className="bg-canvas/60 backdrop-blur-sm border border-hairline text-ink px-6 py-3 rounded-full font-button text-button hover:bg-surface-soft hover:border-outline-variant hover:shadow-sm transition-all cursor-pointer w-full sm:w-auto"
            >
              Mis Pagos
            </button>
            <button
              onClick={() => navigate('/cliente/mis-mascotas')}
              className="bg-canvas/60 backdrop-blur-sm border border-hairline text-ink px-6 py-3 rounded-full font-button text-button hover:bg-surface-soft hover:border-outline-variant hover:shadow-sm transition-all cursor-pointer w-full sm:w-auto"
            >
              Mis Mascotas
            </button>
          </div>
        }
        hasDivider={true}
      />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* Mis Mascotas Section (Spans 8 columns) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <h2 className="font-display-sm text-display-sm text-ink font-bold">Mis Mascotas</h2>
            <Link
              to="/cliente/mis-mascotas"
              className="text-primary font-bold hover:text-primary-active hover:underline font-label-md text-label-md flex items-center gap-1 transition-colors"
            >
              Ver todas
              <span className="material-symbols-outlined text-[18px] translate-y-[1px]">arrow_forward</span>
            </Link>
          </div>

          {mascotas.length === 0 ? (
            <div className="border border-dashed border-hairline rounded-2xl flex flex-col items-center justify-center p-8 bg-canvas/40 backdrop-blur-sm min-h-[300px] shadow-sm">
              <div className="bg-surface-card p-4 rounded-full border border-hairline mb-3 text-primary">
                <span className="material-symbols-outlined text-[40px]">pets</span>
              </div>
              <h3 className="font-title-md text-title-md text-ink text-center font-bold">¿Aún no tienes mascotas registradas?</h3>
              <p className="font-body-sm text-body-sm text-body-muted text-center mt-2 max-w-sm">
                Registra a tu primer compañero de vida para comenzar a gestionar sus citas y vacunas.
              </p>
              <button
                onClick={() => navigate('/cliente/mis-mascotas?action=new')}
                className="mt-4 bg-primary text-on-primary px-6 py-2.5 rounded-full font-button text-button hover:bg-primary-active transition-all cursor-pointer shadow active:scale-95"
              >
                Registrar Mascota
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {mascotas.slice(0, 4).map((mascota) => (
                <div
                  key={mascota.id}
                  onClick={() => navigate(`/cliente/mascotas/${mascota.id}`)}
                  className="bg-canvas/60 backdrop-blur-sm rounded-2xl p-4 flex flex-col border border-hairline/40 hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer group shadow-sm relative overflow-hidden"
                >
                  {/* Card Image con zoom suave */}
                  <div className="w-full h-44 rounded-xl mb-4 overflow-hidden relative shadow-inner">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-[1.03] transition-transform duration-500"
                      style={{ backgroundImage: `url(${getPetImage(mascota.especie)})` }}
                    ></div>
                    {/* Al día status ring overlay */}
                    <div className="absolute top-3 right-3 bg-canvas/90 backdrop-blur-sm px-3 py-1 rounded-full border border-hairline/75 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      <span className="font-caption-caps text-[9px] text-ink font-bold uppercase tracking-wider">Al día</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-title-lg text-title-lg text-ink font-bold group-hover:text-primary transition-colors leading-tight">
                        {mascota.nombre}
                      </h3>
                      <p className="font-body-sm text-body-sm text-body-muted mt-1 flex items-center gap-1">
                        <span className="font-semibold text-secondary-container px-2 py-0.5 rounded bg-surface-soft text-[11px] font-sans">
                          {mascota.especie}
                        </span>
                        {mascota.raza && <span className="text-[12px] truncate max-w-[100px]">• {mascota.raza}</span>} 
                        <span className="text-[12px]">• {getPetAge(mascota.fechaNacimiento)}</span>
                      </p>
                    </div>
                    <div className="bg-primary/10 group-hover:bg-primary group-hover:text-on-primary transition-all p-2 rounded-full shrink-0 flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">pets</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximas Citas Section (Spans 4 columns) */}
        <section className="lg:col-span-4 bg-canvas/80 backdrop-blur-md rounded-2xl border border-hairline/50 p-6 flex flex-col min-h-[420px] shadow-md relative overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-hairline/60">
            <h2 className="font-display-sm text-[20px] font-bold text-ink">Próximas Citas</h2>
            <button
              onClick={() => navigate('/cliente/mis-citas')}
              className="text-primary hover:text-primary-active transition-all cursor-pointer p-1 rounded-full hover:bg-primary/5 shrink-0"
            >
              <span className="material-symbols-outlined text-[20px] translate-y-[2px]">arrow_forward</span>
            </button>
          </div>

          {citas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <div className="bg-surface-card p-3 rounded-full border border-hairline mb-2 text-body-muted">
                <span className="material-symbols-outlined text-[32px]">calendar_today</span>
              </div>
              <p className="font-body-sm text-body-sm text-body-muted font-bold">No tienes citas programadas</p>
              <p className="text-[12px] text-body-muted mt-1 max-w-[200px]">Cuando agendes una cita aparecerá aquí.</p>
              <button
                onClick={() => navigate('/cliente/nueva-cita')}
                className="mt-5 bg-transparent border border-outline hover:border-primary hover:text-primary hover:bg-primary/5 text-ink px-4 py-2.5 rounded-full font-button text-button transition-all w-full cursor-pointer shadow-sm"
              >
                Solicitar Cita
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1">
              <ul className="flex flex-col gap-4 overflow-y-auto max-h-[310px] pr-1 scrollbar-thin">
                {citas.map((cita) => {
                  const dateObj = new Date(cita.fechaHora);
                  const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                  const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
                  
                  return (
                    <li
                      key={cita.id}
                      onClick={() => navigate('/cliente/mis-citas')}
                      className="bg-canvas/50 p-4 rounded-xl border border-hairline/60 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group"
                    >
                      {/* Borde izquierdo dinámico */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-1.5 transition-all"></div>
                      
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-caption-caps text-[10px] text-primary tracking-wider font-bold uppercase">
                          {dateStr}
                        </span>
                        <span className="font-title-sm text-title-sm font-bold text-ink bg-surface-soft px-2 py-0.5 rounded text-[11px] font-sans shadow-sm">
                          {timeStr}
                        </span>
                      </div>
                      
                      <h4 className="font-title-md text-title-md text-ink font-bold group-hover:text-primary transition-colors mt-1.5 leading-tight">
                        {cita.servicioNombre}
                      </h4>
                      
                      <div className="flex flex-col gap-1 mt-3 text-body-muted text-body-sm font-medium">
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-primary">pets</span>
                          <span>Paciente: <strong className="text-ink">{cita.mascotaNombre}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5 mt-0.5">
                          <span className="material-symbols-outlined text-[15px] text-accent-teal">person</span>
                          <span>Médico: <strong className="text-ink">{cita.veterinarioNombre}</strong></span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto pt-4 border-t border-hairline/60">
                <button
                  onClick={() => navigate('/cliente/mis-citas')}
                  className="w-full bg-surface-card border border-hairline hover:border-outline-variant hover:bg-surface-soft text-ink py-2.5 rounded-full font-button text-button transition-colors cursor-pointer font-bold shadow-sm"
                >
                  Ver Historial Completo
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
