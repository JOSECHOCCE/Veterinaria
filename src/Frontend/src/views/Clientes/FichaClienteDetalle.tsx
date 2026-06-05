import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { ClienteDetalle } from '../../services/clientes.service';

export default function FichaClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClienteDetalle | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        setError('El ID de cliente provisto no es válido.');
        setLoading(false);
        return;
      }
      const response = await ClientesService.getClienteDetails(parsedId);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Error al obtener los detalles del cliente.');
      }
    } catch (err: any) {
      console.error(err);
      setError('No se pudo conectar con el servidor para obtener los detalles del cliente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleToggleStatus = async () => {
    if (!data?.usuario) return;
    setTogglingStatus(true);
    try {
      const response = await ClientesService.toggleActivo(data.usuario.id);
      if (response.success) {
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            usuario: {
              ...prev.usuario,
              activo: !prev.usuario.activo,
            },
          };
        });
        toast.success(
          `Cliente ${data.usuario.nombre} ${
            data.usuario.activo ? 'inactivado' : 'activado'
          } exitosamente.`
        );
      } else {
        toast.error(response.message || 'No se pudo cambiar el estado del cliente.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar el estado del cliente.');
    } finally {
      setTogglingStatus(false);
      setShowConfirmModal(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return '';
    const birth = new Date(birthDateString);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (years === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  };

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-body-md text-body-muted animate-pulse">Cargando expediente del cliente...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-gutter" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-title-lg text-ink mb-2">Error al cargar información</h3>
          <p className="text-body-sm text-body-muted mb-6">{error || 'El cliente no pudo ser encontrado.'}</p>
          <button
            onClick={() => navigate('/admin/clientes')}
            className="px-6 py-2 bg-primary text-white rounded-lg font-button text-button hover:bg-[#75331c] transition-colors cursor-pointer"
          >
            Volver al Directorio
          </button>
        </div>
      </div>
    );
  }

  const { usuario, citas, totalGastado, pagosPendientes } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col gap-8 px-gutter md:px-xl py-8"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Context & Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between w-full">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate('/admin/clientes')}
              className="text-body-muted hover:text-ink flex items-center gap-1 font-caption text-caption uppercase tracking-wider bg-transparent border-none cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Directorio
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-soft border border-hairline text-ink font-caption text-caption shadow-sm">
              <span className={`w-2 h-2 rounded-full ${usuario.activo ? 'bg-success' : 'bg-secondary'}`} />
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <h2 className="font-display-lg text-display-lg text-ink m-0 p-0 leading-none">
            {usuario.nombre}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
            <div className="flex items-center gap-2 text-body-muted">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              <span className="text-body-md">{usuario.telefono}</span>
            </div>
            <div className="flex items-center gap-2 text-body-muted">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <span className="text-body-md">{usuario.email || 'Sin correo electrónico'}</span>
            </div>
            <div className="flex items-center gap-2 text-body-muted w-full md:w-auto">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span className="text-body-md">{usuario.direccion || 'Sin dirección registrada'}</span>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => navigate(`/admin/clientes/${usuario.id}/editar`)}
            className="px-4 py-2 border border-ink text-ink font-button text-button rounded-lg hover:bg-surface-soft transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar Ficha
          </button>
          
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 border border-transparent text-error hover:bg-error-container/30 font-button text-button rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {usuario.activo ? 'Inactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {/* Bento Layout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          
          {/* Mascotas Block */}
          <section>
            <div className="flex items-end justify-between mb-6 border-b border-hairline pb-2">
              <h3 className="font-display-sm text-display-sm text-ink">Mis Mascotas</h3>
              <button
                onClick={() => navigate('/admin/mascotas')}
                className="text-primary hover:text-[#75331c] font-button text-button flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ver Mascotas
              </button>
            </div>
            
            {usuario.mascotas && usuario.mascotas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usuario.mascotas.map((mascota) => (
                  <div
                    key={mascota.id}
                    onClick={() => navigate(`/admin/mascotas/${mascota.id}`)}
                    className="group bg-surface-card rounded-xl p-5 flex flex-col gap-4 transition-all hover:bg-surface-soft relative overflow-hidden cursor-pointer border border-hairline"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-surface-variant/40 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
                    
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-surface-soft flex items-center justify-center">
                        {mascota.fotoUrl ? (
                          <img
                            alt={mascota.nombre}
                            className="w-full h-full object-cover"
                            src={mascota.fotoUrl}
                          />
                        ) : (
                          <svg className="w-8 h-8 text-body-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.5c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2-1.5.895-1.5 2 .672 2 1.5 2Zm-5.5 2c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2-1.5.895-1.5 2 .672 2 1.5 2Zm11 0c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2-1.5.895-1.5 2 .672 2 1.5 2Zm-5.5 8c2.485 0 4.5-1.79 4.5-4 0-1.657-1.12-3-2.5-3-.552 0-1 .448-1 1s-.448 1-1 1-1-.448-1-1-.448-1-1-1c-1.38 0-2.5 1.343-2.5 3 0 2.21 2.015 4 4.5 4Z" />
                          </svg>
                        )}
                      </div>
                      
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-caption ${
                        mascota.activo
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-stone-50 border border-stone-200 text-stone-600'
                      }`}>
                        {mascota.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-title-lg text-ink group-hover:text-primary transition-colors">
                        {mascota.nombre}
                      </h4>
                      <p className="text-body-sm text-body-muted mt-1">
                        {mascota.especie} {mascota.raza ? `· ${mascota.raza}` : ''}{' '}
                        {mascota.fechaNacimiento ? `· ${calculateAge(mascota.fechaNacimiento)}` : ''}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-hairline flex gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-caption text-secondary">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Expediente clínico listo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-surface-card rounded-xl border border-hairline">
                <p className="text-body-sm text-body-muted italic">Sin mascotas registradas para este propietario.</p>
              </div>
            )}
          </section>

          {/* Historial de Citas Block */}
          <section>
            <div className="flex items-end justify-between mb-6 border-b border-hairline pb-2">
              <h3 className="font-display-sm text-display-sm text-ink">Historial de Citas</h3>
            </div>
            
            {citas && citas.length > 0 ? (
              <div className="relative pl-6 border-l border-hairline flex flex-col gap-6 ml-1.5">
                {citas.map((cita) => {
                  const isCompleted = cita.estado.toLowerCase() === 'completada';
                  const isCancelled = cita.estado.toLowerCase() === 'cancelada';
                  return (
                    <div key={cita.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-canvas border-2 z-10 ${
                        isCompleted ? 'border-success' : isCancelled ? 'border-error' : 'border-accent-amber'
                      }`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                        <span className="font-caption-uppercase text-body-muted w-28 flex-shrink-0">
                          {formatDate(cita.fechaHora)}
                        </span>
                        
                        <div className="bg-surface-card rounded-xl p-5 flex-1 border border-hairline hover:bg-surface-soft/40 transition-colors shadow-sm">
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h5 className="font-title-sm text-ink">
                              {cita.motivo}{' '}
                              {cita.mascota ? (
                                <span className="text-body-muted font-normal">
                                  ({cita.mascota.nombre})
                                </span>
                              ) : null}
                            </h5>
                            
                            <span className={`text-xs font-caption px-2.5 py-0.5 rounded-md border ${
                              isCompleted
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : isCancelled
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                              {cita.estado}
                            </span>
                          </div>
                          
                          {cita.servicio && (
                            <p className="text-body-sm text-body-muted mb-3">
                              Servicio: {cita.servicio.nombre} · Costo:{' '}
                              {formatCurrency(cita.montoTotal)}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-hairline/60">
                            {cita.veterinario && (
                              <div className="flex items-center gap-1.5 text-xs font-caption text-secondary">
                                <svg className="w-3.5 h-3.5 text-body-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                                Dr. {cita.veterinario.nombre}
                              </div>
                            )}
                            
                            <span className={`text-xs font-caption px-2 py-0.5 rounded ${
                              cita.estadoPago.toLowerCase() === 'pagado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Pago: {cita.estadoPago}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-surface-card rounded-xl border border-hairline">
                <p className="text-body-sm text-body-muted italic">Sin historial de citas médicas registradas.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Sidebar metrics/actions) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Call to Action Card */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-hairline flex flex-col gap-4 text-center items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h3 className="font-display-sm text-ink leading-tight">Planificar visita</h3>
            <p className="text-body-sm text-body-muted">
              Agenda la próxima revisión o consulta para cualquiera de las mascotas asociadas.
            </p>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full mt-2 bg-primary text-white font-button text-button py-3 rounded-lg hover:bg-[#75331c] transition-colors shadow-sm cursor-pointer"
            >
              Crear cita
            </button>
          </div>

          {/* Financial Summary */}
          <div className="bg-surface-card rounded-xl p-6 border border-hairline flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-hairline pb-3">
              <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5m-18 0A1.5 1.5 0 0 1 3.75 3h16.5a1.5 1.5 0 0 1 1.5 1.5m-18 0v11.25A2.25 2.25 0 0 0 3.75 18h16.5a2.25 2.25 0 0 0 2.25-2.25V4.5m-3.75 9.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg>
              <h3 className="font-title-md text-ink">Resumen Financiero</h3>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-caption text-caption text-body-muted uppercase tracking-wide">
                Deuda Pendiente
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-display-md text-ink">
                  {formatCurrency(pagosPendientes)}
                </span>
                {pagosPendientes > 0 && (
                  <span className="inline-flex items-center text-xs font-caption text-error bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    Facturas pendientes
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-hairline flex justify-between items-center text-body-sm">
              <span className="text-body-muted">Facturación Total:</span>
              <span className="font-title-sm text-ink">{formatCurrency(totalGastado)}</span>
            </div>
            
            <button
              onClick={() => toast.info('Módulo de Facturación en desarrollo')}
              className="mt-2 w-full border border-ink text-ink font-button text-button py-2 rounded-lg hover:bg-surface-soft transition-colors cursor-pointer"
            >
              Ver Facturación
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Toggle Active Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-canvas border border-hairline rounded-xl p-6 shadow-xl max-w-sm w-full z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-title-lg text-ink mb-2">
                ¿Confirmar cambio de estado?
              </h3>
              <p className="text-body-sm text-body-muted mb-6">
                Está a punto de {usuario.activo ? 'inactivar' : 'activar'} la ficha del cliente{' '}
                <strong>{usuario.nombre}</strong>.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-hairline rounded-lg text-body-sm hover:bg-surface-soft cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={togglingStatus}
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 text-white rounded-lg text-body-sm font-semibold transition-colors cursor-pointer ${
                    usuario.activo
                      ? 'bg-error hover:bg-[#a63434]'
                      : 'bg-success hover:bg-emerald-600'
                  }`}
                >
                  {togglingStatus ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
