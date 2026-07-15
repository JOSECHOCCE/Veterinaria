import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MascotasService from '../../services/mascotas.service';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  peso?: number | null;
  color?: string | null;
  fechaNacimiento?: string | null;
  usuarioId: number;
  usuarioNombre?: string | null;
  activo: boolean;
  fotoUrl?: string | null;
  sexo?: string | null;
  observacionesGenerales?: string | null;
  alergiasConocidas?: string | null;
}

interface Cita {
  id: number;
  fechaHora: string;
  estado: string;
  motivo: string;
  servicio?: {
    id: number;
    nombre: string;
  } | null;
  veterinario?: {
    id: number;
    nombre: string;
  } | null;
}

interface Historial {
  id: number;
  fechaRegistro: string;
  servicioNombre: string;
  veterinarioNombre: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamentos?: string;
  recomendaciones?: string;
  proximoControl?: string;
}

interface Alertas {
  alergias: string;
  condicionCronica: string;
  ultimaVacuna: string;
}

export default function DetalleMascota() {
  const { id } = useParams<{ id: string }>();
  const petId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaff = user?.role === 'Admin' || user?.role === 'Recepcionista' || user?.role === 'Veterinario';
  const canSchedule = user?.role === 'Admin' || user?.role === 'Recepcionista';

  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [alertas, setAlertas] = useState<Alertas | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactivarModal, setShowInactivarModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadDetails = useCallback(async () => {
    if (isNaN(petId)) {
      setError('Identificador de mascota no válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await MascotasService.getMascotaDetails(petId);
      if (res.success && res.data) {
        setMascota(res.data.mascota);
        setCitas(res.data.citas || []);
        setHistoriales(res.data.historiales || []);
        setAlertas(res.data.alertas || null);
      } else {
        setError(res.message || 'No se pudieron obtener los detalles de la mascota.');
      }
    } catch (err: any) {
      console.error('Error fetching pet details:', err);
      setError('Error al conectar con el servidor para obtener la ficha de la mascota.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleInactivar = async () => {
    setDeleting(true);
    try {
      const res = await MascotasService.deleteMascota(petId);
      if (res.success) {
        toast.success('La mascota ha sido dada de baja y sus citas futuras se han cancelado.');
        setShowInactivarModal(false);
        if (isStaff) {
          navigate('/admin/mascotas');
        } else {
          navigate('/cliente/mis-mascotas');
        }
      } else {
        toast.error(res.message || 'Ocurrió un error al dar de baja a la mascota.');
      }
    } catch (err: any) {
      console.error('Error inactivating pet:', err);
      toast.error('Error al conectar con el servidor.');
    } finally {
      setDeleting(false);
    }
  };

  const getPetImageFallback = (esp: string) => {
    const species = esp.toLowerCase();
    if (species.includes('perro') || species.includes('canin') || species.includes('dog')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGLkyijdSwLz9sNJLIq6dXqSMLg7m059hATtoS8THg7KxR8B6reUjzOpGqTkxJyOU5D_Sx7fiCC8mojqsJy5Kv2inZGbezLKYxbg7Vqkxov7ZoTAX89CIO3_mpq_qDfTILJXaOSYeVdd6hm4SypuUBxzsdTzscYqhpktl61dAOxHWXDT7ZROF74Qpvd9jni4x4giQtJS1CPYXFwFrQL7S8AHa-YxX5t_GnmkNOR5DyfG08aFzYvaM5xg';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDASZYKUqOKnwyluB3xWyt7baBCtBuSw9BETDSt_dlgtD4GVmhbo5EvvrMteSdZGFSmqAMo4-t-uR7T_L5RNL0hh77brXif0AnV-VRntWmxCfJPhUS1zczqZO8RI0NOeCytiVRMAunB6Y-V-uZQtzlRxOpjXgzVvmsTqWlRwVw2OqHENFLi6AKM-LVDDUOKu3w2LbW8kzjKomZYT5jwJjlo7xqnGQ6_x_g7T4RluhFremQGwMJMs5xEJQ';
  };

  const getPetAge = (dobString: string | null | undefined) => {
    if (!dobString) return 'Edad no registrada';
    const birth = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return months === 1 ? '1 mes' : `${months} meses`;
    }
    
    return `${years} años` + (months > 0 ? `, ${months} ${months === 1 ? 'mes' : 'meses'}` : '');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const nextCita = citas
    .filter((c) => {
      const date = new Date(c.fechaHora);
      return date > new Date() && (c.estado === 'Confirmada' || c.estado === 'PendienteConfirmacion' || c.estado === 'EnEspera');
    })
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())[0];

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="flex-grow p-6">
        <ErrorMessage message={error || 'La mascota especificada no existe.'} onRetry={loadDetails} />
      </div>
    );
  }

  const hasCriticalAlerts =
    mascota.alergiasConocidas && mascota.alergiasConocidas.trim().toLowerCase() !== 'ninguna' && mascota.alergiasConocidas.trim().toLowerCase() !== 'ninguna registrada';

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fadeIn">
      
      {/* Breadcrumb Header */}
      <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
        <div>
          <nav className="flex items-center gap-2 text-body-muted font-bold text-xs mb-2">
            <button
              onClick={() => navigate(isStaff ? '/admin/mascotas' : '/cliente/mis-mascotas')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {isStaff ? 'Pacientes' : 'Mis Mascotas'}
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-ink">Expediente Clínico</span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg text-ink">Ficha Médica 360°</h1>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Lateral Profile Card (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Identity Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs p-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-bright relative shadow-sm mb-4">
              <img
                src={mascota.fotoUrl || getPetImageFallback(mascota.especie)}
                alt={mascota.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getPetImageFallback(mascota.especie);
                }}
              />
              <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-1 border-2 border-white flex items-center justify-center h-8 w-8 shadow-sm">
                <span className="material-symbols-outlined text-sm font-bold">
                  {mascota.sexo?.toLowerCase() === 'macho' ? 'male' : 'female'}
                </span>
              </div>
            </div>

            <h2 className="font-headline-lg text-[22px] font-bold text-ink leading-tight mb-1">{mascota.nombre}</h2>
            <span className="bg-[#e6fffa] text-primary px-3.5 py-1 rounded-full font-bold text-xs border border-primary-container/20">
              {mascota.raza || 'Sin raza definida'}
            </span>

            <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-outline-variant/15 pt-4 mt-6 text-xs">
              <div>
                <p className="font-bold text-body-muted uppercase tracking-wider mb-0.5">Edad</p>
                <p className="font-semibold text-ink">{getPetAge(mascota.fechaNacimiento)}</p>
              </div>
              <div>
                <p className="font-bold text-body-muted uppercase tracking-wider mb-0.5">Peso</p>
                <p className="font-semibold text-ink">{mascota.peso ? `${mascota.peso} kg` : 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-body-muted uppercase tracking-wider mb-0.5">Especie</p>
                <p className="font-semibold text-ink">{mascota.especie}</p>
              </div>
              <div>
                <p className="font-bold text-body-muted uppercase tracking-wider mb-0.5">Estado</p>
                <p className="font-semibold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {mascota.activo ? 'Activa' : 'Inactiva'}
                </p>
              </div>
            </div>

            <div className="w-full mt-6 space-y-3">
              {isStaff ? (
                <>
                  {canSchedule && (
                    <button
                      onClick={() => navigate('/admin/agenda/nueva', { state: { mascotaId: mascota.id, clienteId: mascota.usuarioId } })}
                      className="w-full bg-primary hover:bg-primary-container text-white font-bold text-xs py-3 rounded-xl transition-all shadow-xs flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      Agendar Cita
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/admin/mascotas/${mascota.id}/editar`)}
                      className="w-full border border-outline-variant hover:bg-surface-container-low text-ink font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    {mascota.activo && (
                      <button
                        onClick={() => setShowInactivarModal(true)}
                        className="w-full border border-error text-error hover:bg-rose-50 font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Inactivar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate('/cliente/nueva-cita')}
                  className="w-full bg-primary hover:bg-primary-container text-white font-bold text-xs py-3 rounded-xl transition-all shadow-xs flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  Agendar Control
                </button>
              )}
            </div>
          </div>

          {/* Owner Info Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/10">
              <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
                Tutor Responsable
              </h3>
              {isStaff && (
                <Link
                  to={`/admin/clientes/${mascota.usuarioId}`}
                  className="text-primary hover:bg-secondary-container rounded-full p-1.5 transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                {mascota.usuarioNombre?.slice(0, 2).toUpperCase() || 'TR'}
              </div>
              <div>
                <p className="font-bold text-ink text-xs">{mascota.usuarioNombre || 'No asignado'}</p>
                <p className="text-[10px] text-body-muted font-bold uppercase tracking-wider mt-0.5">Propietario del Expediente</p>
              </div>
            </div>
          </div>

        </div>

        {/* Central Cards (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* High Visibility Alerts */}
          {hasCriticalAlerts && (
            <div className="bg-error-container rounded-2xl p-5 border-l-4 border-error flex items-start gap-4 shadow-xs">
              <span className="material-symbols-outlined text-error text-[28px] mt-0.5">warning</span>
              <div>
                <h3 className="font-title-sm text-title-sm font-bold text-on-error-container mb-1">Alertas Médicas Críticas</h3>
                <p className="font-body-sm text-body-sm text-on-error-container/90">
                  <strong>Alergias Conocidas:</strong> {mascota.alergiasConocidas}
                </p>
              </div>
            </div>
          )}

          {/* Vitals & Next Appointment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Upcoming Appointment */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col justify-between shadow-xs">
              <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-1.5 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]">event_upcoming</span>
                Próxima Cita
              </h3>
              {nextCita ? (
                <div className="bg-surface-bright border border-outline-variant/15 rounded-xl p-4 flex gap-4 items-center">
                  <div className="bg-secondary-container text-on-secondary-container rounded-lg p-2.5 text-center min-w-[65px] shadow-sm">
                    <span className="block text-[10px] font-bold uppercase tracking-wider leading-none">
                      {new Date(nextCita.fechaHora).toLocaleDateString('es-ES', { month: 'short' }).slice(0, 3)}
                    </span>
                    <span className="block text-title-lg font-bold mt-1 leading-none">
                      {new Date(nextCita.fechaHora).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink text-xs truncate">{nextCita.servicio?.nombre || 'Consulta'}</p>
                    <p className="text-[11px] text-body-muted flex items-center gap-1 mt-1 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {new Date(nextCita.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-body-muted italic py-3">No hay citas programadas.</p>
              )}
            </div>

            {/* Quick Summary / Vitals */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col justify-between shadow-xs">
              <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-1.5 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]">monitor_heart</span>
                Últimos Datos Clínicos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-bright rounded-xl p-3 border border-outline-variant/15 text-center">
                  <span className="text-[10px] font-bold text-body-muted block mb-1 uppercase tracking-wider">Peso Ficha</span>
                  <span className="font-bold text-sm text-ink">
                    {mascota.peso ? `${mascota.peso} kg` : 'N/A'}
                  </span>
                </div>
                <div className="bg-surface-bright rounded-xl p-3 border border-outline-variant/15 text-center">
                  <span className="text-[10px] font-bold text-body-muted block mb-1 uppercase tracking-wider">Vacunas</span>
                  <span className="font-bold text-sm text-ink truncate block" title={alertas?.ultimaVacuna || 'N/A'}>
                    {alertas?.ultimaVacuna || 'Ninguna'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* History of consultations */}
          <div className="bg-white border border-outline-variant/20 rounded-2xl flex flex-col shadow-xs overflow-hidden">
            <div className="p-6 border-b border-outline-variant/15 flex justify-between items-center">
              <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                Historial de Consultas
              </h3>
              {historiales.length > 0 && (
                <Link
                  to={isStaff ? `/admin/mascotas/${mascota.id}/historial` : `/cliente/mascotas/${mascota.id}/historial`}
                  className="font-bold text-xs text-primary hover:underline flex items-center gap-0.5"
                >
                  Ver Historial Completo
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              )}
            </div>

            {historiales.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-bright">
                <span className="material-symbols-outlined text-[48px] text-body-muted mb-2">clinical_notes</span>
                <p className="font-bold text-ink text-sm">Sin atenciones registradas</p>
                <p className="text-xs text-body-muted mt-1 max-w-sm">
                  Las consultas y prescripciones médicas aparecerán documentadas aquí de forma cronológica.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {historiales.slice(0, 3).map((h) => (
                  <div key={h.id} className="p-6 hover:bg-surface-bright/30 transition-colors flex gap-4 items-start">
                    <div className="bg-surface-container-high rounded-full p-2 text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">medical_services</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-ink text-sm">{h.servicioNombre}</h4>
                        <span className="text-[10px] font-bold text-body-muted">{formatDate(h.fechaRegistro)}</span>
                      </div>
                      <p className="text-body-sm text-body-strong mt-2">
                        {h.diagnostico && (
                          <span>
                            <strong className="font-bold text-ink">Diagnóstico:</strong> {h.diagnostico}
                          </span>
                        )}
                        {!h.diagnostico && h.tratamiento && (
                          <span>
                            <strong className="font-bold text-ink">Tratamiento:</strong> {h.tratamiento}
                          </span>
                        )}
                      </p>
                      {h.medicamentos && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xxs">
                            <span className="material-symbols-outlined text-[12px]">prescriptions</span>
                            {h.medicamentos}
                          </span>
                        </div>
                      )}
                      <p className="text-[11px] text-body-muted font-bold uppercase tracking-wider mt-3">
                        Atendido por: <span className="text-ink">{h.veterinarioNombre}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observations card */}
          <div className="bg-white border border-outline-variant/20 rounded-2xl p-6 shadow-xs">
            <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-1.5 border-b border-outline-variant/10 pb-3 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">chat</span>
              Observaciones del Expediente
            </h3>
            <p className="text-body-sm text-body-strong leading-relaxed whitespace-pre-wrap">
              {mascota.observacionesGenerales || 'No se han registrado observaciones adicionales sobre el temperamento o conducta del paciente.'}
            </p>
          </div>

        </div>

      </div>

      {/* Inactivar Modal */}
      <AnimatePresence>
        {showInactivarModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-outline-variant/30 rounded-2xl max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="material-symbols-outlined text-error text-[32px] shrink-0">warning</span>
                <div>
                  <h3 className="font-title-md text-title-md text-ink font-bold">¿Dar de baja mascota?</h3>
                  <p className="text-body-sm text-body-muted mt-2 leading-relaxed">
                    Marcar a <strong className="text-ink">{mascota.nombre}</strong> como inactiva inhabilitará su registro en el panel activo.
                  </p>
                  <p className="text-xs text-error font-semibold mt-3 bg-rose-50 border border-error/25 p-3 rounded-xl leading-normal">
                    <strong>¡Acción Crítica!</strong> Se cancelarán de forma automática todas las citas agendadas a futuro para este paciente.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/10">
                <button
                  onClick={() => setShowInactivarModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-secondary hover:bg-surface-soft transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInactivar}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-error hover:bg-red-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  {deleting ? 'Procesando...' : 'Confirmar Inactivación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
