import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dashboardService, { type DashboardViewModelDto } from '../../services/dashboard.service';
import PageHeader from '../../components/common/PageHeader';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardViewModelDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getDashboardData();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Error al obtener los datos del dashboard.');
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completada':
        return 'bg-emerald-100 text-emerald-800';
      case 'Cancelada':
      case 'Rechazada':
        return 'bg-rose-100 text-rose-800';
      case 'Confirmada':
        return 'bg-teal-100 text-teal-800';
      case 'EnAtencion':
      case 'EnProceso':
        return 'bg-blue-100 text-blue-800';
      case 'PendienteConfirmacion':
      case 'PendienteAsignacion':
      case 'Pendiente':
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'Completada': return 'Completada';
      case 'Cancelada': return 'Cancelada';
      case 'Rechazada': return 'Rechazada';
      case 'Confirmada': return 'Confirmada';
      case 'EnAtencion': return 'En Atención';
      case 'EnProceso': return 'En Proceso';
      case 'PendienteConfirmacion': return 'Pendiente Confirmación';
      case 'PendienteAsignacion': return 'Pendiente Asignación';
      case 'Pendiente': return 'Pendiente';
      default: return status;
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isRecepcionista = user?.role === 'Recepcionista';
  const showFinancials = isAdmin; // Restricción de negocio: Solo Admin ve financiero global

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse max-w-6xl mx-auto p-4 select-none">
        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <div className="h-10 bg-surface-card rounded-md w-64"></div>
            <div className="h-4 bg-surface-card rounded w-96"></div>
          </div>
          <div className="h-12 bg-surface-card rounded w-36"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="h-44 bg-surface-card rounded-xl"></div>
          <div className="h-44 bg-surface-card rounded-xl"></div>
          <div className="h-44 bg-surface-card rounded-xl"></div>
        </div>
        <div className="h-32 bg-surface-card rounded-xl w-full mt-6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-8 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center max-w-2xl mx-auto my-12">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Error al cargar dashboard</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer shadow-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-8 pb-12 select-none">
      
      {/* Header */}
      <PageHeader
        title="Resumen Operativo"
        description="Métricas clave y estado de la clínica veterinaria para hoy."
        actions={
          <div className="text-left md:text-right shrink-0">
            <p className="font-caption-caps text-caption-caps text-primary tracking-widest uppercase text-[11px] font-semibold">
              Fecha de Hoy
            </p>
            <p className="font-title-md text-title-md text-ink mt-0.5">{formattedDate}</p>
          </div>
        }
        hasDivider={true}
      />

      {/* Bento Grid: Métricas Clave */}
      <div className={`grid grid-cols-1 ${showFinancials ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        
        {/* Citas Programadas */}
        <div
          onClick={() => navigate('/admin/agenda')}
          className="bg-surface-card rounded-xl p-md flex flex-col justify-between h-40 border border-surface-soft hover:border-outline-variant hover:shadow-md transition-all duration-200 cursor-pointer shadow-sm"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-title-sm text-title-sm text-body-muted font-bold">Citas Programadas</h3>
            <span className="material-symbols-outlined text-primary bg-primary-fixed p-2.5 rounded-xl text-[20px]">
              calendar_month
            </span>
          </div>
          <div>
            <span className="font-display-xl text-[44px] leading-none text-ink font-bold">
              {data?.citasHoyTotal || 0}
            </span>
            <p className="text-[12px] text-body-muted mt-2 font-medium">
              Citas agendadas para el día de hoy
            </p>
          </div>
        </div>

        {/* Recaudación Total (Admin Exclusive) */}
        {showFinancials && (
          <div
            onClick={() => navigate('/admin/reportes')}
            className="bg-ink rounded-xl p-md flex flex-col justify-between h-40 shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-surface-variant opacity-10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <h3 className="font-title-sm text-title-sm text-surface-soft font-bold">Recaudación (Mes)</h3>
              <span className="material-symbols-outlined text-surface bg-inverse-surface p-2.5 rounded-xl text-[20px]">
                account_balance_wallet
              </span>
            </div>
            <div className="relative z-10">
              <span className="font-display-xl text-[44px] leading-none text-surface font-bold">
                ${(data?.ingresosMes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-surface-dim mt-2 tracking-wide font-semibold">
                Ingresos confirmados acumulados
              </p>
            </div>
          </div>
        )}

        {/* Cobros Pendientes */}
        <div
          onClick={() => (isAdmin || isRecepcionista) ? navigate('/admin/pagos') : undefined}
          className={`bg-surface-card rounded-xl p-md flex flex-col justify-between h-40 border border-surface-soft shadow-sm ${
            (isAdmin || isRecepcionista) ? 'hover:border-outline-variant hover:shadow-md cursor-pointer transition-all duration-200' : 'cursor-default'
          }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-title-sm text-title-sm text-body-muted font-bold">Cobros Pendientes</h3>
            <span className="material-symbols-outlined text-accent-amber bg-[#fdf2e8] p-2.5 rounded-xl text-[20px]">
              receipt_long
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-xl text-[44px] leading-none text-ink font-bold">
                {data?.pagosPendientesCount || 0}
              </span>
              {showFinancials && data?.pagosPendientesTotal ? (
                <span className="text-body-muted text-body-sm font-semibold">
                  (${data.pagosPendientesTotal.toLocaleString()})
                </span>
              ) : null}
            </div>
            <p className={`text-[12px] mt-2 font-semibold ${data?.pagosPendientesCount && data.pagosPendientesCount > 0 ? 'text-error' : 'text-body-muted'}`}>
              {data?.pagosPendientesCount && data.pagosPendientesCount > 0 ? '⚠️ Requiere regularización' : 'No hay cobros retenidos'}
            </p>
          </div>
        </div>

      </div>

      {/* Desglose de Estados */}
      <div>
        <div className="flex justify-between items-center mb-4 border-b border-hairline pb-2">
          <h2 className="font-display-sm text-display-sm text-ink font-bold">Estados de Citas de Hoy</h2>
          <button
            onClick={() => navigate('/admin/agenda')}
            className="font-button text-button text-primary hover:text-primary-active flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver Agenda Completa</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* Pendientes */}
          <div className="bg-surface-soft rounded-xl p-4 border-l-4 border-accent-amber shadow-sm">
            <p className="text-[12px] font-bold text-body-muted uppercase tracking-wider mb-1">Pendientes</p>
            <p className="font-title-lg text-title-lg text-ink font-bold">{data?.citasHoyPendientes || 0}</p>
          </div>
          {/* Confirmadas */}
          <div className="bg-surface-soft rounded-xl p-4 border-l-4 border-tertiary shadow-sm">
            <p className="text-[12px] font-bold text-body-muted uppercase tracking-wider mb-1">Confirmadas</p>
            <p className="font-title-lg text-title-lg text-ink font-bold">{data?.citasHoyConfirmadas || 0}</p>
          </div>
          {/* En Proceso */}
          <div className="bg-surface-soft rounded-xl p-4 border-l-4 border-blue-500 shadow-sm">
            <p className="text-[12px] font-bold text-body-muted uppercase tracking-wider mb-1">En Proceso</p>
            <p className="font-title-lg text-title-lg text-ink font-bold">{data?.citasHoyEnProceso || 0}</p>
          </div>
          {/* Completadas */}
          <div className="bg-surface-soft rounded-xl p-4 border-l-4 border-success shadow-sm">
            <p className="text-[12px] font-bold text-body-muted uppercase tracking-wider mb-1">Completadas</p>
            <p className="font-title-lg text-title-lg text-ink font-bold">{data?.citasHoyCompletadas || 0}</p>
          </div>
          {/* Canceladas */}
          <div className="bg-surface-soft rounded-xl p-4 border-l-4 border-error shadow-sm">
            <p className="text-[12px] font-bold text-body-muted uppercase tracking-wider mb-1">Canceladas</p>
            <p className="font-title-lg text-title-lg text-ink font-bold">{data?.citasHoyCanceladas || 0}</p>
          </div>
        </div>
      </div>

      {/* Próximas Citas */}
      <div className="mt-2">
        <h2 className="font-display-sm text-display-sm text-ink font-bold mb-4">Próximas Citas (Siguientes horas)</h2>
        <div className="bg-surface-card rounded-xl overflow-hidden border border-hairline shadow-sm">
          {data?.proximasCitas && data.proximasCitas.length > 0 ? (
            <div className="divide-y divide-hairline">
              {data.proximasCitas.map((cita) => {
                const isUrgent = cita.estado === 'EnAtencion';
                const time = new Date(cita.fechaHora).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });

                return (
                  <div
                    key={cita.id}
                    onClick={() => navigate(user?.role === 'Veterinario' ? '/admin/mi-agenda' : `/admin/agenda`)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-surface-soft transition-colors cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full border border-hairline flex items-center justify-center shrink-0 ${
                        isUrgent ? 'bg-error-container text-error' : 'bg-surface text-primary'
                      }`}>
                        <span className="material-symbols-outlined">
                          {isUrgent ? 'emergency' : 'pets'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-title-md text-title-md text-ink font-bold">{cita.mascotaNombre}</h4>
                        <p className="font-body-sm text-body-sm text-body-muted mt-0.5">
                          Propietario: <span className="font-semibold text-ink">{cita.propietarioNombre}</span> • Servicio: <span className="font-semibold text-ink">{cita.servicioNombre}</span>
                        </p>
                        <p className="font-body-sm text-body-sm text-body-muted">
                          Veterinario: <span className="font-semibold">{cita.veterinarioNombre}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 self-stretch sm:self-auto">
                      <div className="text-left sm:text-right shrink-0">
                        <p className="font-title-sm text-title-sm text-ink font-bold">{time}</p>
                        <span className={`inline-block px-3 py-0.5 rounded-full font-caption text-[11px] font-bold mt-1 shadow-sm ${getStatusBadgeClass(cita.estado)}`}>
                          {translateStatus(cita.estado)}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-body-muted">chevron_right</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface-soft/20 text-body-muted flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[48px] text-secondary">calendar_today</span>
              <p className="font-body-md font-semibold">No hay citas programadas para las siguientes horas.</p>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="p-4 text-center bg-surface-soft/60 border-t border-hairline flex flex-wrap justify-center gap-4">
            {(isAdmin || isRecepcionista) && (
              <button
                onClick={() => navigate('/admin/agenda/nueva')}
                className="bg-primary hover:bg-primary-active text-on-primary font-button text-button px-5 py-2 rounded-full transition-all shadow-sm cursor-pointer"
              >
                Nueva Cita
              </button>
            )}
            <button
              onClick={() => navigate(user?.role === 'Veterinario' ? '/admin/mi-agenda' : '/admin/agenda')}
              className="bg-transparent border border-outline text-ink hover:bg-surface-card font-button text-button px-5 py-2 rounded-full transition-all cursor-pointer"
            >
              Ver Todas las Citas
            </button>
            {(isAdmin || isRecepcionista) && (
              <button
                onClick={() => navigate('/admin/triage')}
                className="bg-error/10 hover:bg-error/20 text-error font-button text-button px-5 py-2 rounded-full transition-all cursor-pointer border border-error/20"
              >
                Triage / Emergencia
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
