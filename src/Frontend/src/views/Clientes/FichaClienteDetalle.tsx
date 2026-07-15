import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { ClienteDetalle } from '../../services/clientes.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';

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

  const getInitials = (nombre: string) => {
    if (!nombre) return 'U';
    return nombre
      .split(' ')
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const getInitialsBg = (nombre: string) => {
    if (!nombre) return 'bg-secondary-container text-on-secondary-container';
    const char = nombre.trim().charAt(0).toUpperCase();
    if (char >= 'A' && char <= 'H') {
      return 'bg-secondary-container text-on-secondary-container';
    } else if (char >= 'I' && char <= 'P') {
      return 'bg-tertiary-container text-on-tertiary-container';
    } else {
      return 'bg-primary-container/20 text-on-primary-container';
    }
  };

  const { usuario, citas, totalGastado, pagosPendientes } = detalle;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto w-full">
      {/* Context & Header */}
      <PageHeader
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 select-text">
            <span className="font-bold text-on-surface">{usuario?.nombre}</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                usuario?.activo
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-surface-soft border-hairline text-body-muted'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${usuario?.activo ? 'bg-success' : 'bg-secondary'}`} />
              {usuario?.activo ? 'Cliente Activo' : 'Inactivo'}
            </span>
          </div>
        }
        backLink={{ to: '/admin/clientes', label: 'Volver a Clientes' }}
        actions={
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleToggleActivo}
              className={`h-10 px-4 border rounded-lg font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                usuario?.activo
                  ? 'border-error text-error hover:bg-error-container/20'
                  : 'border-success text-success hover:bg-green-50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="material-symbols-outlined text-[18px]">
                {usuario?.activo ? 'block' : 'check_circle'}
              </span>
              {usuario?.activo ? 'Inactivar Cuenta' : 'Activar Cuenta'}
            </motion.button>
            <Link to={`/admin/clientes/${clientId}/editar`}>
              <motion.button
                className="h-10 px-4 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary-active transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar Perfil
              </motion.button>
            </Link>
          </div>
        }
      />

      {/* Bento Layout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Client Identity Card (Col-span-2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-variant p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden shadow-sm">
          {/* Decorative radial gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl shrink-0 ${getInitialsBg(usuario?.nombre || '')}`}>
            {getInitials(usuario?.nombre || '')}
          </div>
          
          <div className="flex-1 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-2xl text-on-surface">{usuario?.nombre}</h3>
                <p className="font-medium text-sm text-on-surface-variant flex items-center gap-2 mt-1 select-text">
                  <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                  {usuario?.direccion || 'Sin dirección registrada'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Teléfono</p>
                  <p className="text-sm font-semibold text-on-surface select-text">{usuario?.telefono}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Email</p>
                  <p className="text-sm font-semibold text-on-surface select-text">{usuario?.email || 'Sin email registrado'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Cliente desde</p>
                  <p className="text-sm font-semibold text-on-surface">OCT 15, 2021</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">DNI / ID</p>
                  <p className="text-sm font-code text-on-surface select-text">{usuario?.dni || 'Sin DNI registrado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-surface-variant/40 pb-3">
            <h3 className="font-semibold text-base text-on-surface">Estado Financiero</h3>
            <span className="material-symbols-outlined text-on-surface-variant">account_balance_wallet</span>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-surface-container-low flex justify-between items-center border border-outline-variant">
              <span className="text-sm font-medium text-on-surface-variant">Total Facturado</span>
              <span className="font-bold text-lg text-on-surface">{formatCurrency(totalGastado || 0)}</span>
            </div>
            
            <div className={`p-4 rounded-lg border flex flex-col gap-1 ${
              (pagosPendientes || 0) > 0 
                ? 'bg-error-container/20 border-error'
                : 'bg-surface-container-low border-outline-variant'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-on-surface-variant">Deuda Pendiente</span>
                <span className={`font-bold text-lg ${(pagosPendientes || 0) > 0 ? 'text-error' : 'text-on-surface'}`}>
                  {formatCurrency(pagosPendientes || 0)}
                </span>
              </div>
              {(pagosPendientes || 0) > 0 && (
                <p className="text-[10px] font-semibold text-error-container bg-error/15 px-2 py-0.5 rounded self-start mt-1 uppercase tracking-wide">
                  Pago pendiente de cobro
                </p>
              )}
            </div>
          </div>
          
          <Link to={`/admin/pagos?clienteId=${clientId}`} className="mt-4">
            <button className="w-full h-10 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-semibold text-sm cursor-pointer">
              Ver Historial de Pagos
            </button>
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Pets & Appointment Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Associated Pets Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-surface-variant/40 pb-3">
            <h3 className="font-bold text-base text-on-surface">Mascotas Asociadas</h3>
            <Link to={`/admin/mascotas?new=true&clienteId=${clientId}`}>
              <button className="h-8 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors flex items-center gap-1 cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Añadir Mascota
              </button>
            </Link>
          </div>
          
          <div className="space-y-3 flex-1">
            {usuario?.mascotas && usuario.mascotas.length > 0 ? (
              usuario.mascotas.map((mascota) => (
                <Link
                  key={mascota.id}
                  to={`/admin/mascotas/${mascota.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-surface-variant/60 hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-container/20 text-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">pets</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                        {mascota.nombre}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                        {mascota.especie === 'Perro' ? 'Perro' : mascota.especie === 'Gato' ? 'Gato' : mascota.especie}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {mascota.raza || 'Raza no especificada'} • {mascota.sexo || 'Sexo no especificado'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                    chevron_right
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[48px] mb-2">pets</span>
                <p className="text-sm font-medium text-on-surface-variant">Este propietario aún no tiene mascotas asociadas.</p>
              </div>
            )}
          </div>
        </div>

        {/* Appointment Timeline Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-surface-variant/40 pb-3">
            <h3 className="font-bold text-base text-on-surface">Historial de Citas</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            {citas && citas.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-surface-variant ml-2 space-y-4">
                {citas.slice(0, 3).map((cita) => (
                  <div key={cita.id} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[31px] top-1.5 border-2 border-surface-container-lowest" />
                    
                    <div className="bg-surface-container-low p-3.5 rounded-lg border border-outline-variant hover:shadow-sm transition-all flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                          {formatDate(cita.fechaHora)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide border ${getEstadoBadgeClass(cita.estado)}`}>
                          {getEstadoLabel(cita.estado)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-bold text-sm text-on-surface">
                          {cita.servicio?.nombre || 'Consulta Médica'}
                        </h4>
                        {cita.mascota && (
                          <span className="text-[11px] font-bold text-on-surface-variant">
                            Paciente: {cita.mascota.nombre}
                          </span>
                        )}
                      </div>
                      
                      {cita.motivo && (
                        <p className="text-xs text-on-surface-variant italic">
                          "{cita.motivo}"
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-[10px] font-semibold text-on-surface-variant border-t border-outline-variant/40 pt-2 mt-1">
                        {cita.veterinario && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">person</span>
                            Dr/a: {cita.veterinario.nombre}
                          </span>
                        )}
                        <span className="font-bold text-on-surface">
                          Monto: {formatCurrency(cita.montoTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[48px] mb-2">calendar_today</span>
                <p className="text-sm font-medium text-on-surface-variant">No se registran visitas previas en el historial.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
