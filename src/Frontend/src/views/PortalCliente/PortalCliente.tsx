import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalClienteService from '../../services/portalCliente.service';

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

  // Helper de fotos predeterminadas por especie para mantener la estética premium
  const getPetImage = (especie: string) => {
    const esp = especie.toLowerCase();
    if (esp.includes('perro') || esp.includes('dog')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM8pZR065mBN_zRsT0K-9h3W-ByY0dCkx1tJr6a_KXTKD63fcCW5FzMmFTzmcaQigIIqG5xFDGqXOQq0JWvRnTCq13J_DBfqi4QunaYKGRE_MqRX0DivSZ-mN9D_htDVybloxprk1_R1fFGlPD17YrWlt0_hwENNtVIaygWOCZ94AMIJnF7ZlEGmciyOTyS5OrBnA9vRzUw-nHhbN3CafZ-NxbGJNMglUBngYtJ7mo1oskzaYx3B6aoBIErCd0BxF692CDhzyjxZ8';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuADiZUuDOMsyo4M1wr15dg3fsL80rExV4tuKhka1NyJjHWVWLimgnT9wQsjQr8_z23jhtb7SlqFPuCp44eCRnKKZQ06tqmkTYPWibResnGBfH25z7mbfCkavRFdwIZBit8JTNFZcCBpO5k-6zKZHsK3WQP1gLKHSuIWd0CnTSc3wHEu4qXuEj0S3VP0RG_a0KFGMwEZw77fbutpjCXcTFhJs8POZ_CGRMzwVeiFkdXY9Top7gLGWkK9vmUQRl9Kbxy8J9jI4X9UToA';
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
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Alertas / Notificaciones activas */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-3">
          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className="bg-error-container text-on-error-container p-4 rounded-xl flex items-start sm:items-center gap-3 border border-[#ffb4ab] shadow-sm"
            >
              <span className="material-symbols-outlined text-error shrink-0">warning</span>
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
                className="bg-error text-on-error px-4 py-1.5 rounded-full font-button text-[12px] hover:opacity-90 transition-opacity ml-auto whitespace-nowrap hidden sm:block cursor-pointer"
              >
                Atender Alerta
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bloque de Bienvenida y Acciones Rápidas */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start mt-2">
        <div className="max-w-2xl">
          <h1 className="font-display-md text-display-md text-ink">
            Hola, {user?.nombreCompleto?.split(' ')[0] || 'Cliente'}
          </h1>
          <p className="font-body-md text-body-md text-body-muted mt-2">
            Bienvenido de nuevo a tu portal. Aquí tienes el resumen y estado de salud de tus mascotas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 xl:mt-0 w-full xl:w-auto">
          <button
            onClick={() => navigate('/cliente/nueva-cita')}
            className="bg-primary hover:bg-primary-active text-on-primary px-6 py-3 rounded-full font-button text-button transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Solicitar Nueva Cita
          </button>
          <button
            onClick={() => navigate('/cliente/mis-pagos')}
            className="bg-surface-card border border-hairline text-ink px-6 py-3 rounded-full font-button text-button hover:bg-surface-soft transition-colors cursor-pointer w-full sm:w-auto"
          >
            Mis Pagos
          </button>
          <button
            onClick={() => navigate('/cliente/mis-mascotas')}
            className="bg-surface-card border border-hairline text-ink px-6 py-3 rounded-full font-button text-button hover:bg-surface-soft transition-colors cursor-pointer w-full sm:w-auto"
          >
            Historial Clínico
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        
        {/* Mis Mascotas Section (Spans 8 columns) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <h2 className="font-display-sm text-display-sm text-ink">Mis Mascotas</h2>
            <Link
              to="/cliente/mis-mascotas"
              className="text-primary font-bold hover:underline font-label-md text-label-md flex items-center gap-1"
            >
              Ver todas
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {mascotas.length === 0 ? (
            <div className="border border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-8 bg-canvas min-h-[300px]">
              <span className="material-symbols-outlined text-[48px] text-body-muted mb-3">pets</span>
              <h3 className="font-title-md text-title-md text-ink text-center font-bold">¿Aún no tienes mascotas registradas?</h3>
              <p className="font-body-sm text-body-sm text-body-muted text-center mt-2 max-w-sm">
                Registra a tu primer compañero de vida para comenzar a gestionar sus citas y vacunas.
              </p>
              <button
                onClick={() => navigate('/cliente/mis-mascotas?action=new')}
                className="mt-4 bg-primary text-on-primary px-6 py-2.5 rounded-full font-button text-button hover:bg-primary-active transition-colors cursor-pointer"
              >
                Registrar Mascota
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mascotas.map((mascota) => (
                <div
                  key={mascota.id}
                  onClick={() => navigate(`/cliente/mascotas/${mascota.id}`)}
                  className="bg-surface-card rounded-xl p-3.5 flex flex-col border border-transparent hover:border-hairline hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div
                    className="w-full h-44 bg-cover bg-center rounded-lg mb-3 overflow-hidden group-hover:scale-[1.01] transition-transform duration-300"
                    style={{ backgroundImage: `url(${getPetImage(mascota.especie)})` }}
                  ></div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-title-lg text-title-lg text-ink font-bold">{mascota.nombre}</h3>
                      <p className="font-body-sm text-body-sm text-body-muted mt-1">
                        {mascota.especie} {mascota.raza ? `• ${mascota.raza}` : ''} • {getPetAge(mascota.fechaNacimiento)}
                      </p>
                    </div>
                    <div className="bg-surface-soft p-1.5 rounded-full shrink-0 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">pets</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximas Citas Section (Spans 4 columns) */}
        <section className="lg:col-span-4 bg-surface-soft rounded-xl border border-hairline p-5 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-hairline">
            <h2 className="font-display-sm text-[20px] font-bold text-ink">Próximas Citas</h2>
            <button
              onClick={() => navigate('/cliente/mis-citas')}
              className="text-primary hover:text-primary-active transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>

          {citas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <span className="material-symbols-outlined text-[40px] text-body-muted mb-2">calendar_today</span>
              <p className="font-body-sm text-body-sm text-body-muted font-semibold">No tienes citas programadas</p>
              <p className="text-[12px] text-body-muted mt-1">Cuando agendes una cita aparecerá aquí.</p>
              <button
                onClick={() => navigate('/cliente/nueva-cita')}
                className="mt-4 bg-transparent border border-outline text-ink hover:bg-surface-card px-4 py-2 rounded-full font-button text-button transition-colors w-full cursor-pointer"
              >
                Solicitar Cita
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1">
              <ul className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                {citas.map((cita) => {
                  const dateObj = new Date(cita.fechaHora);
                  const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                  const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
                  
                  return (
                    <li
                      key={cita.id}
                      onClick={() => navigate('/cliente/mis-citas')}
                      className="bg-canvas p-3.5 rounded-lg border border-hairline shadow-sm relative overflow-hidden cursor-pointer hover:shadow transition-shadow"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-caption-uppercase text-[10px] text-primary tracking-widest font-bold uppercase">
                          {dateStr}
                        </span>
                        <span className="font-title-sm text-title-sm font-bold text-ink">{timeStr}</span>
                      </div>
                      <h4 className="font-title-md text-title-md text-ink font-semibold">{cita.servicioNombre}</h4>
                      <div className="flex flex-col gap-0.5 mt-2 text-body-muted text-body-sm">
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">pets</span>
                          {cita.mascotaNombre}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">person</span>
                          {cita.veterinarioNombre}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto pt-4 border-t border-hairline">
                <button
                  onClick={() => navigate('/cliente/mis-citas')}
                  className="w-full bg-transparent border border-outline text-ink py-2.5 rounded-full font-button text-button hover:bg-surface-card transition-colors cursor-pointer"
                >
                  Ver Historial de Citas
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
