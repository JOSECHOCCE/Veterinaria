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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelada':
      case 'Rechazada':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Confirmada':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'EnAtencion':
      case 'EnProceso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PendienteConfirmacion':
      case 'PendienteAsignacion':
      case 'Pendiente':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
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

  const pctCompletado = data?.citasHoyTotal ? Math.round((data.citasHoyCompletadas / data.citasHoyTotal) * 100) : 0;
  const strokeDashoffset = 264 - (264 * pctCompletado) / 100;

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
    <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col gap-8 pb-12 select-none animate-fadeIn">
      {/* Page Welcome / Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] md:text-[38px] text-ink font-extrabold tracking-tight leading-tight">Diario Operativo</h2>
          <div className="flex items-center gap-2 mt-2 text-body-muted font-medium">
            <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
            <p className="font-body-md text-[15px] capitalize">
              {formattedDate} <span className="mx-2 text-outline-variant">•</span> <span className="font-bold text-primary">Hospital Central</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/admin/reportes')}
            className="flex-1 md:flex-initial px-5 py-3 bg-white text-secondary border border-outline-variant/30 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-xs hover:bg-surface hover:text-primary transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span> Exportar Reporte
          </button>
          {(isAdmin || isRecepcionista) && (
            <button
              onClick={() => navigate('/admin/agenda/nueva')}
              className="flex-1 md:flex-initial px-5 py-3 bg-primary text-on-primary rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm hover:bg-surface-tint transition-all duration-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span> Nueva Cita
            </button>
          )}
        </div>
      </div>

      {/* High Impact Admin Section (Only visible to Admin role) */}
      {showFinancials && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Financial Hero (2/3 width on large screens) */}
          <div
            onClick={() => navigate('/admin/reportes')}
            className="md:col-span-2 bg-gradient-to-br from-primary to-[#004d48] rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-primary-container/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-black/20 rounded-full blur-[80px]"></div>
            <div className="absolute top-8 right-8 opacity-[0.08] transform rotate-12 transition-transform group-hover:rotate-0 duration-700 ease-out hidden sm:block">
              <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                analytics
              </span>
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-extrabold tracking-[0.08em] uppercase border border-white/20">
                    Solo Administración
                  </span>
                  <div className="flex items-center gap-1.5 bg-black/15 backdrop-blur-sm px-3.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse"></div>
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">En tiempo real</span>
                  </div>
                </div>
                <h3 className="font-headline-md text-[26px] md:text-[30px] text-white font-extrabold mb-1 tracking-tight">Recaudación Total del Mes</h3>
                <p className="text-white/80 font-body-sm max-w-md text-[14px]">Flujo contable consolidado acumulado para la clínica.</p>
              </div>
              <div className="mt-8 flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider mb-1">Total Procesado</span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-headline-lg text-[42px] md:text-[52px] text-white font-extrabold leading-none tracking-tight">
                      S/. {(data?.ingresosMes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="flex items-center gap-1 text-primary-fixed font-bold bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[12px] border border-white/15">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span> +12.5%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Payments Widget (1/3 width) */}
          <div
            onClick={() => navigate('/admin/pagos')}
            className="bg-white rounded-[2rem] p-8 border border-outline-variant/30 hover:border-primary-container hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-6 right-6">
              <span className="bg-error/10 text-error px-3.5 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 border border-error/15">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span> Crítico
              </span>
            </div>
            <div>
              <div className="bg-tertiary-container/10 w-14 h-14 rounded-2xl flex items-center justify-center text-tertiary mb-5 border border-tertiary-container/20 group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pending_actions
                </span>
              </div>
              <h3 className="font-headline-md text-[24px] text-ink font-extrabold leading-tight">Pagos Pendientes</h3>
              <p className="text-body-muted font-medium text-[14px] mt-1.5">
                {data?.pagosPendientesCount || 0} facturas requieren cierre inmediato
              </p>
            </div>
            <div className="mt-8">
              <div className="flex items-end justify-between mb-3">
                <span className="font-headline-lg text-[32px] text-tertiary font-extrabold leading-none">
                  S/. {(data?.pagosPendientesTotal || 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-extrabold text-body-muted uppercase tracking-wider">Monto estimado</span>
              </div>
              <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-tertiary-container to-tertiary h-full rounded-full w-[65%]" />
              </div>
              <p className="text-[12px] font-bold text-body-muted mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-tertiary">info</span>
                Regularización requerida en caja
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Operations Overview Grid (Widgets) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Total Appts */}
        <div
          onClick={() => navigate('/admin/agenda')}
          className="bg-white p-6 rounded-[1.5rem] border border-outline-variant/20 hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <p className="font-label-md text-label-md text-body-muted uppercase tracking-wider">Citas Programadas</p>
            <span className="material-symbols-outlined text-secondary text-[22px]">event_note</span>
          </div>
          <div>
            <p className="font-headline-lg text-[36px] text-ink font-extrabold leading-none">{data?.citasHoyTotal || 0}</p>
            <p className="text-label-sm text-label-sm text-body-muted mt-1 font-semibold">Hoy</p>
          </div>
        </div>
        {/* Confirmed */}
        <div
          onClick={() => navigate('/admin/agenda')}
          className="bg-white p-6 rounded-[1.5rem] border border-outline-variant/20 hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <p className="font-label-md text-label-md text-body-muted uppercase tracking-wider">Confirmadas</p>
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />
          </div>
          <div>
            <p className="font-headline-lg text-[36px] text-primary font-extrabold leading-none">{data?.citasHoyConfirmadas || 0}</p>
            <p className="text-label-sm text-label-sm text-body-muted mt-1 font-semibold">Listas para consulta</p>
          </div>
        </div>
        {/* Pending */}
        <div
          onClick={() => navigate('/admin/agenda')}
          className="bg-white p-6 rounded-[1.5rem] border border-outline-variant/20 hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <p className="font-label-md text-label-md text-body-muted uppercase tracking-wider">En Espera</p>
            <span className="material-symbols-outlined text-tertiary text-[22px]">hourglass_top</span>
          </div>
          <div>
            <p className="font-headline-lg text-[36px] text-tertiary font-extrabold leading-none">{data?.citasHoyPendientes || 0}</p>
            <p className="text-label-sm text-label-sm text-body-muted mt-1 font-semibold">Esperando triage</p>
          </div>
        </div>
        {/* Completed */}
        <div
          onClick={() => navigate('/admin/agenda')}
          className="bg-white p-6 rounded-[1.5rem] border border-outline-variant/20 hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <p className="font-label-md text-label-md text-body-muted uppercase tracking-wider">Completadas</p>
            <span className="material-symbols-outlined text-outline text-[22px]">task_alt</span>
          </div>
          <div>
            <p className="font-headline-lg text-[36px] text-body-muted font-extrabold leading-none">{data?.citasHoyCompletadas || 0}</p>
            <p className="text-label-sm text-label-sm text-body-muted mt-1 font-semibold">Cerradas y facturadas</p>
          </div>
        </div>
      </section>

      {/* Main Bottom Section: Bento Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Bento: Agenda Próxima List Table */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-outline-variant/20 shadow-xs flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-soft/20">
            <div className="flex items-center gap-3">
              <h4 className="font-headline-md text-[20px] text-ink font-extrabold tracking-tight">Agenda Próxima</h4>
              <span className="bg-primary/10 text-primary px-3.5 py-1 rounded-full text-[12px] font-extrabold border border-primary/20">
                {data?.proximasCitas?.length || 0} Total
              </span>
            </div>
            <button
              onClick={() => navigate(user?.role === 'Veterinario' ? '/admin/mi-agenda' : '/admin/agenda')}
              className="text-[12px] font-bold text-primary hover:underline cursor-pointer"
            >
              Ver agenda completa
            </button>
          </div>

          <div className="overflow-x-auto">
            {data?.proximasCitas && data.proximasCitas.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-soft/40 border-b border-outline-variant/10 font-bold text-[11px] text-outline uppercase tracking-wider">
                    <th className="py-3 px-6">Paciente</th>
                    <th className="py-3 px-6">Servicio</th>
                    <th className="py-3 px-6">Veterinario</th>
                    <th className="py-3 px-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-body-sm text-[13px] text-body-strong">
                  {data.proximasCitas.map((cita) => {
                    const time = new Date(cita.fechaHora).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });

                    return (
                      <tr
                        key={cita.id}
                        onClick={() => navigate(user?.role === 'Veterinario' ? '/admin/mi-agenda' : `/admin/agenda`)}
                        className="hover:bg-surface-soft/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15 shadow-inner">
                              <span className="material-symbols-outlined text-[20px]">pets</span>
                            </div>
                            <div>
                              <div className="font-bold text-ink text-[14px]">{cita.mascotaNombre}</div>
                              <div className="text-[11px] text-body-muted mt-0.5">Prop: {cita.propietarioNombre}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium">
                          <div>{cita.servicioNombre}</div>
                          <div className="text-[11px] text-body-muted mt-0.5">{time}</div>
                        </td>
                        <td className="py-4 px-6 text-body-muted font-medium">
                          {cita.veterinarioNombre}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${getStatusBadgeClass(cita.estado)}`}>
                            {translateStatus(cita.estado)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16 text-body-muted flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[44px]">calendar_today</span>
                <p className="font-body-md font-semibold">No hay citas programadas para las siguientes horas.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Strategic Performance Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Gauge Performance Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/20 shadow-xs flex flex-col items-center text-center">
            <div className="flex justify-between items-center w-full mb-6 pb-2 border-b border-hairline">
              <h5 className="font-extrabold text-[15px] text-ink">Desempeño Diario</h5>
              <span className="material-symbols-outlined text-[20px] text-primary">analytics</span>
            </div>
            <div className="relative mb-6">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-container-high" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
                <circle
                  className="text-primary transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline-lg text-[36px] text-ink font-extrabold leading-none tracking-tight">
                  {pctCompletado}%
                </span>
                <span className="text-[10px] font-extrabold text-body-muted uppercase tracking-wider mt-1">Completado</span>
              </div>
            </div>
            <div className="w-full">
              <h5 className="font-bold text-ink text-[16px]">Meta de Hoy</h5>
              <p className="text-[13px] text-body-muted mt-1.5 font-medium">
                Se han completado <span className="font-bold text-primary">{data?.citasHoyCompletadas || 0}</span> de <span className="font-bold">{data?.citasHoyTotal || 0}</span> consultas.
              </p>
            </div>
          </div>

          {/* Operational Tip Card */}
          <div className="bg-[#1a2b29] rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-md">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-700 ease-out">
              <span className="material-symbols-outlined text-[100px]">lightbulb</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/30">
                  <span className="material-symbols-outlined text-primary-fixed text-[20px]">bolt</span>
                </div>
                <h5 className="font-extrabold text-[12px] tracking-wider text-primary-fixed-dim uppercase">TIP OPERATIVO</h5>
              </div>
              <p className="text-[15px] leading-relaxed font-medium text-white/90">
                "El inventario de vacunas quíntuples está en su nivel mínimo sugerido. Considera realizar un pedido antes del cierre de hoy."
              </p>
              <div className="mt-8 flex items-center justify-between pt-5 border-t border-white/10 text-[12px] text-white/40 font-extrabold uppercase tracking-wider">
                <span>Prioridad: Media</span>
                {(isAdmin || isRecepcionista) && (
                  <button
                    onClick={() => navigate('/admin/reportes')}
                    className="text-[#4fd1c5] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Gestionar <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
