import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dashboardService, { type DashboardViewModelDto } from '../../services/dashboard.service';
import KpiCard from '../../components/dashboard/KpiCard';
import SalesTrendChart from '../../components/dashboard/SalesTrendChart';
import CategoryDistributionChart from '../../components/dashboard/CategoryDistributionChart';
import LowStockAlertBanner from '../../components/dashboard/LowStockAlertBanner';
import TopServicesBarChart from '../../components/dashboard/TopServicesBarChart';
import RevenueByServiceChart from '../../components/dashboard/RevenueByServiceChart';
import VetRankingTable from '../../components/dashboard/VetRankingTable';
import SpeciesDistributionChart from '../../components/dashboard/SpeciesDistributionChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardViewModelDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('mes');

  const fetchDashboardData = async (selectedPeriodo: 'hoy' | 'semana' | 'mes' = periodo) => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getDashboardData(selectedPeriodo);
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
    fetchDashboardData(periodo);
  }, [periodo]);

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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
  const showFinancials = isAdmin;

  const pctCompletado = data?.citasHoyTotal ? Math.round((data.citasHoyCompletadas / data.citasHoyTotal) * 100) : 0;
  const strokeDashoffset = 264 - (264 * pctCompletado) / 100;

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse max-w-7xl mx-auto p-4 select-none">
        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <div className="h-10 bg-slate-200 rounded-md w-64"></div>
            <div className="h-4 bg-slate-200 rounded w-96"></div>
          </div>
          <div className="h-12 bg-slate-200 rounded-xl w-36"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="h-36 bg-slate-200 rounded-2xl"></div>
          <div className="h-36 bg-slate-200 rounded-2xl"></div>
          <div className="h-36 bg-slate-200 rounded-2xl"></div>
          <div className="h-36 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl w-full mt-6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 text-rose-900 p-8 rounded-2xl border border-rose-200 flex flex-col items-center gap-4 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-rose-600">error</span>
        <div>
          <h3 className="text-xl font-bold">Error al cargar el panel de control</h3>
          <p className="text-sm text-rose-700 mt-1">{error}</p>
        </div>
        <button
          onClick={() => fetchDashboardData(periodo)}
          className="bg-rose-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col gap-8 pb-12 select-none animate-fadeIn">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <h2 className="text-2xl md:text-3xl text-slate-900 font-black tracking-tight leading-tight">
              ¡Hola, {user?.nombreCompleto || 'Administrador'}!
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 capitalize">
            Resumen de actividad de tu negocio • {formattedDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Period Filter Toggle Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setPeriodo('hoy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodo === 'hoy'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodo === 'semana'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodo === 'mes'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
          </div>

          <button
            onClick={() => navigate('/admin/reportes')}
            className="flex-1 md:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span> Exportar
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      <LowStockAlertBanner lowStockCount={3} />

      {/* Primary Commercial KPI Grid (Pastel Tint Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          title="Recaudación Mes"
          amount={`S/ ${(data?.ingresosMes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          subtitle="Total acumulado"
          badgeText="Julio"
          variant="orange"
          icon={<span className="material-symbols-outlined text-[22px]">payments</span>}
          onClick={() => navigate('/admin/reportes')}
        />

        <KpiCard
          title="Citas de Hoy"
          amount={`${data?.citasHoyTotal || 0}`}
          subtitle={`${data?.citasHoyConfirmadas || 0} confirmadas`}
          badgeText="Hoy"
          variant="blue"
          icon={<span className="material-symbols-outlined text-[22px]">event_note</span>}
          onClick={() => navigate('/admin/agenda')}
        />

        <KpiCard
          title="Pagos Pendientes"
          amount={`S/ ${(data?.pagosPendientesTotal || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          subtitle={`${data?.pagosPendientesCount || 0} facturas por cobrar`}
          badgeText="Caja"
          variant="rose"
          icon={<span className="material-symbols-outlined text-[22px]">pending_actions</span>}
          onClick={() => navigate('/admin/pagos')}
        />

        <KpiCard
          title="Consultas Completadas"
          amount={`${data?.citasHoyCompletadas || 0}`}
          subtitle={`Meta: ${pctCompletado}% completado`}
          badgeText="Rendimiento"
          variant="green"
          icon={<span className="material-symbols-outlined text-[22px]">task_alt</span>}
          onClick={() => navigate('/admin/agenda')}
        />
      </section>

      {/* Visual Analytics Block (Charts Section) */}
      {showFinancials && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <SalesTrendChart />
          </div>
          <div className="lg:col-span-5">
            <CategoryDistributionChart />
          </div>
        </section>
      )}

      {/* Secondary Analytics: Bar Charts + Rankings */}
      {showFinancials && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6">
            <TopServicesBarChart data={data?.serviciosMasSolicitados || []} />
          </div>
          <div className="lg:col-span-6">
            <RevenueByServiceChart data={data?.serviciosMasSolicitados || []} />
          </div>
        </section>
      )}

      {/* Tertiary Analytics: Vet Ranking + Species Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <VetRankingTable data={data?.veterinariosMasOcupados || []} />
        </div>
        <div className="lg:col-span-5">
          <SpeciesDistributionChart data={data?.mascotasPorEspecie || []} />
        </div>
      </section>

      {/* Bottom Section: Operations & Recent Appointments Table */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Upcoming Appointments Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <h4 className="font-extrabold text-slate-800 text-base">Próximas Atenciones</h4>
              <span className="bg-amber-100 text-amber-900 px-3 py-0.5 rounded-full text-xs font-bold border border-amber-200">
                {data?.proximasCitas?.length || 0} Total
              </span>
            </div>
            <button
              onClick={() => navigate(user?.role === 'Veterinario' ? '/admin/mi-agenda' : '/admin/agenda')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
            >
              Ver agenda completa
            </button>
          </div>

          <div className="overflow-x-auto">
            {data?.proximasCitas && data.proximasCitas.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Paciente</th>
                    <th className="py-3 px-6">Servicio</th>
                    <th className="py-3 px-6">Veterinario</th>
                    <th className="py-3 px-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {data.proximasCitas.map((cita) => {
                    const time = new Date(cita.fechaHora).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <tr
                        key={cita.id}
                        onClick={() => navigate(user?.role === 'Veterinario' ? '/admin/mi-agenda' : `/admin/agenda`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60 font-bold">
                              <span className="material-symbols-outlined text-[18px]">pets</span>
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm">{cita.mascotaNombre}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">Prop: {cita.propietarioNombre}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{cita.servicioNombre}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{time}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">
                          {cita.veterinarioNombre}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${getStatusBadgeClass(cita.estado)}`}>
                            {translateStatus(cita.estado)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-slate-300">calendar_today</span>
                <p className="font-semibold text-xs">No hay citas programadas para las siguientes horas.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Performance Gauge & Operational Tip */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Daily Goal Performance Gauge */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col items-center text-center">
            <div className="flex justify-between items-center w-full mb-4 pb-3 border-b border-slate-100">
              <h5 className="font-extrabold text-sm text-slate-800">Desempeño Diario</h5>
              <span className="material-symbols-outlined text-[18px] text-amber-600">analytics</span>
            </div>

            <div className="relative mb-4">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-slate-100" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
                <circle
                  className="text-amber-600 transition-all duration-1000 ease-out"
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
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {pctCompletado}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Completado</span>
              </div>
            </div>

            <div className="w-full">
              <h5 className="font-extrabold text-slate-800 text-sm">Meta de Hoy</h5>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Se han atendido <span className="font-bold text-amber-700">{data?.citasHoyCompletadas || 0}</span> de <span className="font-bold">{data?.citasHoyTotal || 0}</span> consultas.
              </p>
            </div>
          </div>

          {/* Operational Tip Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform -rotate-12">
              <span className="material-symbols-outlined text-[90px]">lightbulb</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                  <span className="material-symbols-outlined text-amber-400 text-[18px]">bolt</span>
                </div>
                <h5 className="font-extrabold text-xs tracking-wider text-amber-400 uppercase">TIP OPERATIVO</h5>
              </div>
              <p className="text-xs leading-relaxed font-medium text-slate-300">
                "El inventario de vacunas quíntuples e insumos está en su nivel mínimo sugerido. Revisa las solicitudes antes del cierre."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
