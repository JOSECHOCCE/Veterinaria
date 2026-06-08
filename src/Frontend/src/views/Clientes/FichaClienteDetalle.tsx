import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { ClienteDetalle } from '../../services/clientes.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function FichaClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);

  // States
  const [detalle, setDetalle] = useState<ClienteDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load client details
  const loadDetails = useCallback(async () => {
    if (isNaN(clientId)) {
      setError('Identificador de cliente no válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await ClientesService.getClienteDetails(clientId);
      if (response.success && response.data) {
        setDetalle(response.data);
      } else {
        setError(response.message || 'No se pudieron cargar los detalles del cliente.');
      }
    } catch (err: any) {
      console.error('Error fetching client details:', err);
      setError('Error al conectar con el servidor para obtener los datos del propietario.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Toggle active/inactive status
  const handleToggleActivo = async () => {
    if (!detalle) return;
    const currentStatus = detalle.usuario?.activo;
    try {
      await ClientesService.toggleActivo(clientId);
      toast.success(`Cliente ${currentStatus ? 'inactivado' : 'activado'} correctamente`);
      loadDetails(); // Reload data
    } catch (err: any) {
      console.error('Error toggling client status:', err);
      toast.error('Ocurrió un error al cambiar el estado del cliente.');
    }
  };

  // Get state badge class for appointments
  const getEstadoBadgeClass = (estado: string) => {
    const map: Record<string, string> = {
      PendienteConfirmacion: 'bg-accent-amber/10 border border-accent-amber/30 text-accent-amber',
      Confirmada: 'bg-success/10 border border-success/30 text-success',
      EnEspera: 'bg-accent-teal/10 border border-accent-teal/30 text-accent-teal',
      EnAtencion: 'bg-primary/10 border border-primary/30 text-primary',
      Completada: 'bg-secondary-container border border-secondary/30 text-secondary',
      Cancelada: 'bg-error-container/20 border border-error-container text-error',
      Rechazada: 'bg-error-container/20 border border-error-container text-error',
      NoAsistio: 'bg-orange-500/10 border border-orange-500/30 text-orange-500',
      Reprogramada: 'bg-blue-300/10 border border-blue-400/30 text-blue-500',
    };
    return map[estado] || 'bg-surface-card border border-hairline text-ink';
  };

  const getEstadoLabel = (estado: string) => {
    const map: Record<string, string> = {
      PendienteConfirmacion: 'Pendiente',
      Confirmada: 'Confirmada',
      EnEspera: 'En Espera',
      EnAtencion: 'En Atención',
      Completada: 'Completada',
      Cancelada: 'Cancelada',
      Rechazada: 'Rechazada',
      NoAsistio: 'No Asistió',
      Reprogramada: 'Reprogramada',
    };
    return map[estado] || estado;
  };

  // Format date to local string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (loading) {
    return <Spinner message="Cargando perfil completo del propietario..." />;
  }

  if (error || !detalle) {
    return <ErrorMessage title="Error al cargar la ficha" message={error || 'No se encontró el propietario'} onRetry={loadDetails} />;
  }

  const { usuario, citas, totalGastado, pagosPendientes } = detalle;

  return (
    <div className="flex-1 flex flex-col gap-lg pb-xxl">
      {/* Context & Header */}
      <div className="flex flex-col gap-lg md:flex-row md:items-start md:justify-between w-full">
        <div className="flex flex-col gap-sm max-w-2xl">
          <div className="flex items-center gap-md mb-xs">
            <Link
              to="/admin/clientes"
              className="text-body-muted hover:text-ink flex items-center gap-xxs font-caption text-caption uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Directorio
            </Link>
            <span
              className={`inline-flex items-center gap-xxs px-3 py-1 rounded-full border font-caption text-caption ${
                usuario?.activo
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-surface-soft border-hairline text-body-muted'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${usuario?.activo ? 'bg-success' : 'bg-secondary'}`} />
              {usuario?.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <h2 className="font-display-lg text-display-lg text-ink m-0 p-0 leading-none">
            {usuario?.nombre}
          </h2>
          <div className="flex flex-wrap gap-x-xl gap-y-sm mt-md select-text">
            <div className="flex items-center gap-sm text-body-muted">
              <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
              <span className="font-body-md text-body-md">{usuario?.telefono}</span>
            </div>
            <div className="flex items-center gap-sm text-body-muted">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span className="font-body-md text-body-md">{usuario?.email || 'Sin correo electrónico'}</span>
            </div>
            {usuario?.direccion && (
              <div className="flex items-center gap-sm text-body-muted w-full md:w-auto">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="font-body-md text-body-md">{usuario.direccion}</span>
              </div>
            )}
            {usuario?.dni && (
              <div className="flex items-center gap-sm text-body-muted w-full md:w-auto border-t md:border-t-0 md:border-l border-hairline pt-xxs md:pt-0 md:pl-md">
                <span className="font-caption text-caption uppercase mr-xxs">DNI:</span>
                <span className="font-code text-code text-ink">{usuario.dni}</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-sm mt-md md:mt-0">
          <Link to={`/admin/clientes/${clientId}/editar`}>
            <motion.button
              className="px-4 py-2 border border-ink text-ink font-button text-button rounded-lg hover:bg-surface-soft transition-colors flex items-center gap-sm cursor-pointer shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar Ficha
            </motion.button>
          </Link>
          <motion.button
            onClick={handleToggleActivo}
            className={`px-4 py-2 border border-transparent font-button text-button rounded-lg transition-colors flex items-center gap-sm cursor-pointer ${
              usuario?.activo
                ? 'text-error hover:bg-error-container/30'
                : 'text-success hover:bg-success/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="material-symbols-outlined text-[18px]">
              {usuario?.activo ? 'block' : 'check_circle'}
            </span>
            {usuario?.activo ? 'Inactivar' : 'Activar Cuenta'}
          </motion.button>
        </div>
      </div>

      {/* Bento Layout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Left Column (Mascotas & Citas) */}
        <div className="lg:col-span-8 flex flex-col gap-xxl">
          
          {/* Mascotas Section */}
          <section className="bg-canvas">
            <div className="flex items-end justify-between mb-lg border-b border-hairline pb-sm">
              <h3 className="font-display-sm text-display-sm text-ink">Mis Mascotas</h3>
              <Link to={`/admin/mascotas?new=true&clienteId=${clientId}`}>
                <motion.button
                  className="text-primary hover:text-primary-active font-button text-button flex items-center gap-xxs transition-colors cursor-pointer"
                  whileHover={{ x: 1 }}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Registrar nueva
                </motion.button>
              </Link>
            </div>

            {usuario?.mascotas && usuario.mascotas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {usuario.mascotas.map((mascota) => (
                  <motion.div
                    key={mascota.id}
                    className="group bg-surface-card rounded-xl p-lg flex flex-col gap-md transition-all hover:bg-surface-soft relative overflow-hidden border border-hairline shadow-sm"
                    whileHover={{ y: -2 }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container-high rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
                    
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-canvas bg-surface-soft flex items-center justify-center shrink-0">
                        {mascota.fotoUrl ? (
                          <img
                            src={mascota.fotoUrl}
                            alt={mascota.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-primary/40 text-[28px]">
                            pets
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/admin/mascotas/${mascota.id}`}
                        className="text-body-muted hover:text-ink p-xxs hover:bg-surface-variant/40 rounded-full transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </Link>
                    </div>

                    <div>
                      <h4 className="font-title-lg text-title-lg text-ink font-semibold">
                        {mascota.nombre}
                      </h4>
                      <p className="font-body-sm text-body-sm text-body-muted mt-1">
                        {mascota.especie} {mascota.raza ? `· ${mascota.raza}` : ''}{' '}
                        {mascota.sexo ? `· ${mascota.sexo}` : ''}
                      </p>
                    </div>

                    <div className="mt-auto pt-sm border-t border-hairline flex gap-sm">
                      <span className="inline-flex items-center gap-1 text-xs font-caption text-secondary">
                        <span className="material-symbols-outlined text-[14px]">
                          {mascota.activo ? 'check_circle' : 'cancel'}
                        </span>{' '}
                        {mascota.activo ? 'Ficha Activa' : 'Ficha Inactiva'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-xl bg-surface-card rounded-xl border border-hairline text-center">
                <span className="material-symbols-outlined text-body-muted/40 text-[48px] mb-xs">
                  pets
                </span>
                <p className="font-body-md text-body-md text-body-muted">
                  Este propietario aún no tiene mascotas registradas.
                </p>
              </div>
            )}
          </section>

          {/* Historial de Citas Section */}
          <section className="bg-canvas">
            <div className="flex items-end justify-between mb-lg border-b border-hairline pb-sm">
              <h3 className="font-display-sm text-display-sm text-ink">Historial de Citas</h3>
            </div>

            {citas && citas.length > 0 ? (
              <div className="relative pl-6 border-l border-hairline flex flex-col gap-lg ml-xs">
                {citas.map((cita) => (
                  <motion.div
                    key={cita.id}
                    className="relative"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-canvas border-2 border-primary z-10" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-xs sm:gap-md">
                      <span className="font-caption-uppercase text-caption-uppercase text-body-muted w-28 flex-shrink-0">
                        {formatDate(cita.fechaHora)}
                      </span>
                      <div className="bg-surface-card rounded-lg p-4 flex-1 border border-hairline hover:shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-sm gap-xs">
                          <h5 className="font-title-sm text-title-sm text-ink font-semibold">
                            {cita.servicio?.nombre || 'Consulta Médica'}{' '}
                            {cita.mascota ? `(${cita.mascota.nombre})` : ''}
                          </h5>
                          <span
                            className={`text-[11px] font-caption px-2 py-0.5 rounded-sm uppercase tracking-wide border ${getEstadoBadgeClass(
                              cita.estado
                            )}`}
                          >
                            {getEstadoLabel(cita.estado)}
                          </span>
                        </div>
                        {cita.motivo && (
                          <p className="font-body-sm text-body-sm text-body-muted mb-md italic">
                            Motivo: "{cita.motivo}"
                          </p>
                        )}
                        <div className="mt-md flex flex-wrap gap-x-lg gap-y-xs justify-between items-center text-xs font-caption text-secondary border-t border-hairline/40 pt-sm">
                          {cita.veterinario && (
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-[14px]">person</span>
                              Dr/a: {cita.veterinario.nombre}
                            </span>
                          )}
                          <span className="font-semibold text-ink">
                            Total: {formatCurrency(cita.montoTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-xl bg-surface-card rounded-xl border border-hairline text-center">
                <span className="material-symbols-outlined text-body-muted/40 text-[48px] mb-xs">
                  calendar_today
                </span>
                <p className="font-body-md text-body-md text-body-muted">
                  No se registran visitas previas en el historial.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Sidebar Action Cards) */}
        <div className="lg:col-span-4 flex flex-col gap-xl">
          {/* Planificar Visita (Bento Card CTA) */}
          <div className="bg-surface-container-low rounded-xl p-xl border border-hairline flex flex-col gap-md text-center items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-xs">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
            <h3 className="font-display-sm text-display-sm text-ink leading-tight font-semibold">
              Planificar visita
            </h3>
            <p className="font-body-sm text-body-sm text-body-muted">
              Agenda la próxima revisión o consulta para cualquiera de las mascotas asociadas.
            </p>
            <Link
              to={`/admin/agenda?clienteId=${clientId}`}
              className="w-full mt-sm"
              onClick={(e) => {
                if (!usuario?.activo) {
                  e.preventDefault();
                  toast.error('No se pueden agendar citas para clientes inactivos.');
                }
              }}
            >
              <button
                disabled={!usuario?.activo}
                className="w-full bg-primary hover:bg-primary-active text-on-primary font-button text-button py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Crear cita
              </button>
            </Link>
          </div>

          {/* Resumen Financiero Card */}
          <div className="bg-surface-card rounded-xl p-lg flex flex-col gap-md border border-hairline">
            <div className="flex items-center gap-sm border-b border-hairline pb-sm mb-xs">
              <span className="material-symbols-outlined text-ink">account_balance_wallet</span>
              <h3 className="font-title-md text-title-md text-ink font-semibold">Resumen Financiero</h3>
            </div>
            
            <div className="flex flex-col gap-xs">
              <span className="font-caption text-caption text-body-muted uppercase tracking-wide">
                Deuda Pendiente
              </span>
              <div className="flex items-baseline gap-sm">
                <span className="font-display-md text-display-md text-ink font-bold">
                  {formatCurrency(pagosPendientes || 0)}
                </span>
                {(pagosPendientes || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-caption text-error bg-error/10 border border-error/20 px-2 py-0.5 rounded">
                    Pagos pendientes
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-body-muted mt-1">
                Total histórico facturado: <strong className="text-ink">{formatCurrency(totalGastado || 0)}</strong>
              </p>
            </div>
            
            <Link to={`/admin/pagos?clienteId=${clientId}`} className="w-full mt-sm">
              <button className="w-full border border-ink text-ink font-button text-button py-2 rounded-lg hover:bg-surface-soft transition-colors cursor-pointer">
                Ver Facturación
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
