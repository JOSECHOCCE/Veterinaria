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

  // Handle pet inactivation (soft delete)
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
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM8pZR065mBN_zRsT0K-9h3W-ByY0dCkx1tJr6a_KXTKD63fcCW5FzMmFTzmcaQigIIqG5xFDGqXOQq0JWvRnTCq13J_DBfqi4QunaYKGRE_MqRX0DivSZ-mN9D_htDVybloxprk1_R1fFGlPD17YrWlt0_hwENNtVIaygWOCZ94AMIJnF7ZlEGmciyOTyS5OrBnA9vRzUw-nHhbN3CafZ-NxbGJNMglUBngYtJ7mo1oskzaYx3B6aoBIErCd0BxF692CDhzyjxZ8';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuADiZUuDOMsyo4M1wr15dg3fsL80rExV4tuKhka1NyJjHWVWLimgnT9wQsjQr8_z23jhtb7SlqFPuCp44eCRnKKZQ06tqmkTYPWibResnGBfH25z7mbfCkavRFdwIZBit8JTNFZcCBpO5k-6zKZHsK3WQP1gLKHSuIWd0CnTSc3wHEu4qXuEj0S3VP0RG_a0KFGMwEZw77fbutpjCXcTFhJs8POZ_CGRMzwVeiFkdXY9Top7gLGWkK9vmUQRl9Kbxy8J9jI4X9UToA';
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

  // Find the next future appointment
  const nextCita = citas
    .filter((c) => {
      const date = new Date(c.fechaHora);
      return date > new Date() && (c.estado === 'Confirmada' || c.estado === 'PendienteConfirmacion' || c.estado === 'EnEspera');
    })
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())[0];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="flex-1 p-lg">
        <ErrorMessage
          message={error || 'La mascota especificada no existe.'}
          onRetry={loadDetails}
        />
      </div>
    );
  }

  const hasCriticalAlerts =
    alertas &&
    (alertas.alergias !== 'Ninguna registrada' ||
      alertas.condicionCronica !== 'Ninguna identificada');

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-xs text-body-sm text-body-muted mb-lg select-none">
        <Link
          to={isStaff ? '/admin/mascotas' : '/cliente/mis-mascotas'}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          {isStaff ? 'Expedientes' : 'Mis Mascotas'}
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-ink font-semibold">{mascota.nombre}</span>
      </div>

      {/* Header Section: 360 View */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-xl mb-xl border-b border-hairline pb-xl">
        <div className="flex items-center gap-lg">
          <div className="relative">
            <img
              src={mascota.fotoUrl || getPetImageFallback(mascota.especie)}
              alt={mascota.nombre}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-surface-card shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getPetImageFallback(mascota.especie);
              }}
            />
            <div
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-canvas ${
                mascota.activo ? 'bg-success' : 'bg-secondary'
              }`}
              title={mascota.activo ? 'Activa' : 'Inactiva'}
            />
          </div>
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <h1 className="font-display-lg text-display-lg text-ink font-normal tracking-tight">{mascota.nombre}</h1>
              {mascota.sexo && (
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {mascota.sexo.toLowerCase() === 'macho' ? 'male' : 'female'}
                </span>
              )}
            </div>
            <p className="font-body-md text-body-md text-secondary mb-sm">
              {mascota.especie} • {mascota.raza || 'Sin raza'} • {getPetAge(mascota.fechaNacimiento)}
            </p>
            <div className="flex items-center gap-xs text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-body-muted">person</span>
              <span className="text-body-muted">Responsable:</span>
              {isStaff ? (
                <Link
                  to={`/admin/clientes/${mascota.usuarioId}`}
                  className="text-primary hover:underline font-medium"
                >
                  {mascota.usuarioNombre || 'Ver Dueño'}
                </Link>
              ) : (
                <span className="font-medium text-ink">{mascota.usuarioNombre || 'Tú'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions based on role */}
        <div className="flex flex-wrap items-center gap-sm">
          {isStaff ? (
            <>
              <button
                onClick={() => navigate(`/admin/mascotas/${mascota.id}/editar`)}
                className="bg-canvas border border-ink text-ink font-button text-button py-2.5 px-5 rounded hover:bg-surface-soft transition-colors flex items-center gap-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </button>
              <button
                onClick={() => navigate(`/admin/mascotas/${mascota.id}/cambiar-responsable`)}
                className="bg-canvas border border-ink text-ink font-button text-button py-2.5 px-5 rounded hover:bg-surface-soft transition-colors flex items-center gap-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                Cambio Resp.
              </button>
              {mascota.activo && (
                <button
                  onClick={() => setShowInactivarModal(true)}
                  className="bg-canvas border border-error text-error font-button text-button py-2.5 px-5 rounded hover:bg-error-container/10 transition-colors flex items-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  Inactivar
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate('/cliente/nueva-cita')}
              className="bg-primary text-on-primary font-button text-button py-2.5 px-5 rounded hover:bg-primary-container transition-colors flex items-center gap-xs cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Agendar Control
            </button>
          )}
        </div>
      </section>

      {/* Critical Medical Alerts */}
      {hasCriticalAlerts && (
        <section className="bg-error-container border border-error/20 rounded-lg p-md mb-xl flex items-start gap-md">
          <span className="material-symbols-outlined text-error mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div>
            <h3 className="font-title-sm text-title-sm text-on-error-container font-semibold mb-xxs">Alertas Médicas Críticas</h3>
            <ul className="list-disc list-inside font-body-sm text-body-sm text-on-error-container/80 space-y-1">
              {alertas.alergias !== 'Ninguna registrada' && (
                <li>
                  <strong className="font-semibold">Alergias:</strong> {alertas.alergias}
                </li>
              )}
              {alertas.condicionCronica !== 'Ninguna identificada' && (
                <li>
                  <strong className="font-semibold">Condición Crónica:</strong> {alertas.condicionCronica}
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Column 1: Summary & Biometrics */}
        <div className="lg:col-span-1 flex flex-col gap-lg">
          {/* Executive Summary */}
          <div className="bg-surface-card rounded-xl p-lg border border-hairline shadow-sm">
            <h2 className="font-title-md text-title-md text-ink mb-md border-b border-hairline-soft pb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Resumen Clínico
            </h2>
            <p className="font-body-sm text-body-sm text-body-strong leading-relaxed mb-md whitespace-pre-wrap">
              {mascota.observacionesGenerales || 'No se han registrado observaciones o notas adicionales sobre el paciente.'}
            </p>
            <div className="flex flex-wrap gap-xs">
              <span className="bg-surface-dim text-ink font-caption-caps text-caption-caps px-3 py-1 rounded-full border border-hairline">
                Peso: {mascota.peso ? `${mascota.peso} kg` : 'N/A'}
              </span>
              <span className="bg-surface-dim text-ink font-caption-caps text-caption-caps px-3 py-1 rounded-full border border-hairline">
                Especie: {mascota.especie}
              </span>
              {alertas?.ultimaVacuna !== 'Ninguna registrada' && (
                <span className="bg-success/10 text-tertiary-container font-caption-caps text-caption-caps px-3 py-1 rounded-full border border-success/20">
                  Vacuna: {alertas?.ultimaVacuna}
                </span>
              )}
            </div>
          </div>

          {/* Biometrics */}
          <div className="bg-canvas border border-hairline rounded-xl p-lg">
            <h2 className="font-title-sm text-title-sm text-ink mb-md">Datos Generales</h2>
            <ul className="space-y-sm font-body-sm text-body-sm">
              <li className="flex justify-between border-b border-hairline pb-xs">
                <span className="text-body-muted">Especie</span>
                <span className="text-ink font-medium">{mascota.especie}</span>
              </li>
              <li className="flex justify-between border-b border-hairline pb-xs">
                <span className="text-body-muted">Raza</span>
                <span className="text-ink font-medium">{mascota.raza || 'Sin raza definida'}</span>
              </li>
              <li className="flex justify-between border-b border-hairline pb-xs">
                <span className="text-body-muted">Fecha Nacimiento</span>
                <span className="text-ink font-medium">
                  {mascota.fechaNacimiento ? formatDate(mascota.fechaNacimiento) : 'No registrada'}
                </span>
              </li>
              <li className="flex justify-between border-b border-hairline pb-xs">
                <span className="text-body-muted">Color</span>
                <span className="text-ink font-medium">{mascota.color || 'No registrado'}</span>
              </li>
              <li className="flex justify-between border-b border-hairline pb-xs">
                <span className="text-body-muted">Sexo</span>
                <span className="text-ink font-medium">{mascota.sexo || 'No registrado'}</span>
              </li>
              <li className="flex justify-between pb-xs">
                <span className="text-body-muted">Identificador</span>
                <span className="font-code text-code text-ink font-semibold">#PAC-{mascota.id}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Column 2 & 3: Next Appointment & Clinical History */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          {/* Next Appointment */}
          {nextCita ? (
            <div className="bg-surface-soft rounded-xl p-lg border border-hairline flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-md">
                <div className="bg-primary-container/20 p-sm rounded-lg text-primary text-center min-w-[70px]">
                  <span className="block font-caption-caps text-caption-caps mb-[-4px]">
                    {new Date(nextCita.fechaHora)
                      .toLocaleDateString('es-ES', { month: 'short' })
                      .toUpperCase()}
                  </span>
                  <span className="font-title-lg text-title-lg font-bold">
                    {new Date(nextCita.fechaHora).getDate()}
                  </span>
                </div>
                <div>
                  <h3 className="font-title-sm text-title-sm text-ink font-medium">{nextCita.servicio?.nombre || 'Consulta'}</h3>
                  <p className="font-body-sm text-body-sm text-body-muted flex items-center gap-xs mt-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {new Date(nextCita.fechaHora).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    con {nextCita.veterinario?.nombre || 'Veterinario'}
                  </p>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-caption text-caption px-3 py-1 rounded-full border border-primary-fixed-dim">
                Próxima Cita
              </span>
            </div>
          ) : (
            <div className="bg-surface-soft/40 rounded-xl p-md border border-hairline text-center text-body-muted font-body-sm">
              No hay citas programadas para el paciente.
            </div>
          )}

          {/* Historial de Consultas */}
          <div className="bg-canvas border border-hairline rounded-xl p-lg flex-grow shadow-sm">
            <div className="flex items-center justify-between mb-lg border-b border-hairline pb-sm">
              <h2 className="font-title-md text-title-md text-ink flex items-center gap-xs font-semibold">
                <span className="material-symbols-outlined text-secondary">history</span>
                Historial de Consultas
              </h2>
              {historiales.length > 0 && (
                <Link
                  to={isStaff ? `/admin/mascotas/${mascota.id}/historial` : `/cliente/mascotas/${mascota.id}/historial`}
                  className="font-button text-button text-primary hover:text-primary-active font-semibold flex items-center gap-xxs"
                >
                  Ver Todo
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              )}
            </div>

            {historiales.length === 0 ? (
              <div className="border border-dashed border-hairline rounded-xl flex flex-col items-center justify-center p-10 bg-canvas/30 text-center">
                <span className="material-symbols-outlined text-[48px] text-body-muted mb-2">clinical_notes</span>
                <p className="font-title-md text-title-md font-bold text-ink">Sin atenciones registradas</p>
                <p className="font-body-sm text-body-sm text-body-muted mt-1 max-w-sm">
                  Las consultas y atenciones médicas aparecerán documentadas cronológicamente en esta sección.
                </p>
              </div>
            ) : (
              <div className="relative pl-xs">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-2 bottom-0 w-px bg-hairline"></div>

                <div className="space-y-6">
                  {historiales.slice(0, 3).map((h) => (
                    <div key={h.id} className="relative pl-xl group">
                      <div className="absolute left-0 top-1 w-10 h-10 bg-surface rounded-full border border-hairline flex items-center justify-center z-10 group-hover:border-primary transition-colors">
                        <span className="material-symbols-outlined text-secondary text-[20px] group-hover:text-primary">
                          vaccines
                        </span>
                      </div>
                      <div className="bg-surface-soft rounded-lg p-md border border-hairline group-hover:border-outline-variant transition-colors">
                        <div className="flex justify-between items-start mb-xs gap-sm flex-wrap">
                          <h4 className="font-title-sm text-title-sm text-ink font-semibold">{h.servicioNombre}</h4>
                          <span className="font-caption text-caption text-body-muted">{formatDate(h.fechaRegistro)}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-body-strong mb-sm mt-xs">
                          {h.diagnostico && (
                            <>
                              <strong className="text-ink">Diagnóstico:</strong> {h.diagnostico}
                            </>
                          )}
                          {!h.diagnostico && h.tratamiento && (
                            <>
                              <strong className="text-ink">Tratamiento:</strong> {h.tratamiento}
                            </>
                          )}
                        </p>
                        {h.medicamentos && (
                          <div className="bg-canvas border border-hairline/60 rounded px-3 py-1.5 font-code text-code text-ink my-sm">
                            <span className="font-semibold text-body-muted block text-[11px] uppercase tracking-wide">Medicamentos:</span>
                            {h.medicamentos}
                          </div>
                        )}
                        {h.recomendaciones && (
                          <p className="text-body-sm text-body-muted italic mt-xs">
                            * {h.recomendaciones}
                          </p>
                        )}
                        <div className="flex items-center gap-xs mt-sm pt-xs border-t border-hairline/40">
                          <span className="font-caption text-caption text-secondary">
                            Atendido por: <strong className="font-semibold text-ink">{h.veterinarioNombre}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {historiales.length > 3 && (
                    <div className="pt-md flex justify-center">
                      <Link
                        to={isStaff ? `/admin/mascotas/${mascota.id}/historial` : `/cliente/mascotas/${mascota.id}/historial`}
                        className="bg-surface-soft border border-hairline text-secondary hover:text-ink font-button text-button px-6 py-2.5 rounded-full hover:bg-surface-variant transition-all text-center"
                      >
                        Ver Historial Completo ({historiales.length} registros)
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Soft-delete (Inactivar) Confirmation Modal */}
      <AnimatePresence>
        {showInactivarModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-canvas border border-hairline rounded-xl max-w-md w-full p-xl shadow-lg"
            >
              <div className="flex items-start gap-md mb-md">
                <span className="material-symbols-outlined text-error text-[32px]">warning</span>
                <div>
                  <h3 className="font-title-lg text-title-lg text-ink font-semibold">¿Inactivar Mascota?</h3>
                  <p className="font-body-sm text-body-sm text-body-muted mt-sm leading-relaxed">
                    Esta acción marcará a <strong className="text-ink">{mascota.nombre}</strong> como inactiva en el sistema.
                  </p>
                  <p className="font-body-sm text-body-sm text-error font-medium mt-sm bg-error-container/10 p-sm rounded border border-error/15">
                    <strong>¡Atención!</strong> Se cancelarán de forma automática todas las citas programadas a futuro para este paciente.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-sm mt-lg pt-md border-t border-hairline">
                <button
                  onClick={() => setShowInactivarModal(false)}
                  disabled={deleting}
                  className="px-lg py-2.5 rounded font-button text-button text-ink bg-transparent hover:bg-surface-soft transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInactivar}
                  disabled={deleting}
                  className="px-lg py-2.5 rounded font-button text-button text-on-error bg-error hover:bg-opacity-90 transition-all cursor-pointer flex items-center gap-xs"
                >
                  {deleting ? 'Inactivando...' : 'Confirmar Inactivación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
