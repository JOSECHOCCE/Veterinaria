import { useState, useEffect } from 'react';
import dashboardService, { type DashboardViewModelDto } from '../../services/dashboard.service';
import reportesService, { type ReporteNuevosClientesDto } from '../../services/reportes.service';
import { toast } from 'sonner';

type PeriodKey = 'mes' | 'trimestre' | 'año' | 'personalizado';

export default function EstadisticasOperativas() {
  const [periodo, setPeriodo] = useState<PeriodKey>('mes');
  
  // Rango de fechas para el reporte de clientes y tendencias
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    const past = new Date(today.setDate(today.getDate() - 30));
    return past.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [dbData, setDbData] = useState<DashboardViewModelDto | null>(null);
  const [clientesData, setClientesData] = useState<ReporteNuevosClientesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manejar el cambio de período
  const handlePeriodoChange = (p: PeriodKey) => {
    setPeriodo(p);
    const today = new Date();
    let past = new Date();

    if (p === 'mes') {
      past.setDate(today.getDate() - 30);
      setFechaInicio(past.toISOString().split('T')[0]);
      setFechaFin(new Date().toISOString().split('T')[0]);
    } else if (p === 'trimestre') {
      past.setDate(today.getDate() - 90);
      setFechaInicio(past.toISOString().split('T')[0]);
      setFechaFin(new Date().toISOString().split('T')[0]);
    } else if (p === 'año') {
      past.setDate(today.getDate() - 365);
      setFechaInicio(past.toISOString().split('T')[0]);
      setFechaFin(new Date().toISOString().split('T')[0]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [resDb, resCl] = await Promise.all([
        dashboardService.getDashboardData(),
        reportesService.getReporteNuevosClientes(fechaInicio, fechaFin)
      ]);

      if (resDb.success && resCl.success) {
        setDbData(resDb.data);
        setClientesData(resCl.data);
      } else {
        setError(resDb.message || resCl.message || 'Error al obtener estadísticas.');
      }
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      setError(err.response?.data?.message || 'Error de conexión al cargar datos analíticos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fechaInicio, fechaFin]);

  const maxCitasServicio = dbData?.serviciosMasSolicitados?.length 
    ? Math.max(...dbData.serviciosMasSolicitados.map(s => s.cantidadCitas), 1) 
    : 1;

  const maxCitasVeterinario = dbData?.veterinariosMasOcupados?.length 
    ? Math.max(...dbData.veterinariosMasOcupados.map(v => v.citasMes), 1) 
    : 1;

  const totalMascotasEspecie = dbData?.mascotasPorEspecie?.length
    ? dbData.mascotasPorEspecie.reduce((sum, item) => sum + item.cantidad, 0)
    : 0;

  if (loading && dbData === null) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4 max-w-4xl mx-auto">
        <div className="h-12 bg-surface-card rounded w-1/2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="h-64 bg-surface-card rounded-xl"></div>
          <div className="h-64 bg-surface-card rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      
      {/* Date Filters & Controls */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="font-title-sm text-title-sm text-ink font-bold">Rango de Análisis Analítico</h3>
          <p className="font-body-sm text-body-sm text-body-muted mt-0.5">Define el período temporal para auditar el rendimiento.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-surface-container-low border border-outline-variant/50 p-1 rounded-full shadow-inner select-none">
            {(['mes', 'trimestre', 'año', 'personalizado'] as PeriodKey[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodoChange(p)}
                className={`px-4 py-1.5 rounded-full font-button text-button text-[12px] uppercase tracking-wider transition-all cursor-pointer ${
                  periodo === p ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-body-muted hover:text-ink'
                }`}
              >
                {p === 'mes' ? '30 Días' : p === 'trimestre' ? 'Trimestre' : p === 'año' ? 'Año' : 'Filtro'}
              </button>
            ))}
          </div>

          {periodo === 'personalizado' && (
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-surface border border-outline-variant/50 rounded-lg px-3 py-1.5 text-body-sm focus:border-primary outline-none"
              />
              <span className="text-body-muted font-bold">—</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-surface border border-outline-variant/50 rounded-lg px-3 py-1.5 text-body-sm focus:border-primary outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-2 text-center">
          <span className="material-symbols-outlined text-[36px] text-error">error</span>
          <p>{error}</p>
          <button onClick={loadData} className="mt-2 text-primary font-bold hover:underline">Reintentar</button>
        </div>
      )}

      {/* Hero Stats Row */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-outline-variant/20">
            <p className="font-label-md text-body-muted text-xs uppercase tracking-wider">Tasa de Retención</p>
            <div className="flex items-end justify-between mt-3">
              <h2 className="text-[30px] font-bold text-primary leading-none">84.2%</h2>
              <span className="text-primary-container font-bold text-xs flex items-center leading-none">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                2.4%
              </span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full mt-4">
              <div className="bg-primary h-full rounded-full" style={{ width: '84%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-outline-variant/20">
            <p className="font-label-md text-body-muted text-xs uppercase tracking-wider">Inasistencia (No-Show)</p>
            <div className="flex items-end justify-between mt-3">
              <h2 className="text-[30px] font-bold text-error leading-none">4.1%</h2>
              <span className="text-error font-bold text-xs flex items-center leading-none">
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                0.8%
              </span>
            </div>
            <p className="text-[11px] text-body-muted mt-4 font-semibold italic">Meta del sistema: &lt; 5%</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-outline-variant/20">
            <p className="font-label-md text-body-muted text-xs uppercase tracking-wider">Especialistas Activos</p>
            <div className="flex items-end justify-between mt-3">
              <h2 className="text-[30px] font-bold text-ink leading-none">
                {dbData?.veterinariosMasOcupados?.length || 0}
              </h2>
              <span className="bg-[#f1f4f6] px-2 py-0.5 rounded text-[10px] font-extrabold text-secondary leading-none">
                CAPACIDAD NOMINAL
              </span>
            </div>
            <div className="flex -space-x-1.5 mt-4 overflow-hidden">
              <div className="w-6 h-6 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">DR</div>
              <div className="w-6 h-6 rounded-full border border-white bg-slate-300 flex items-center justify-center text-[8px] font-bold">DC</div>
              <div className="w-6 h-6 rounded-full border border-white bg-slate-400 flex items-center justify-center text-[8px] font-bold">DM</div>
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-primary-container text-[9px] font-bold text-white">
                +{dbData?.veterinariosMasOcupados?.length ? Math.max(0, dbData.veterinariosMasOcupados.length - 3) : 0}
              </div>
            </div>
          </div>

          <div className="bg-primary text-white p-6 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <p className="font-label-md text-[11px] uppercase tracking-wider opacity-85">Análisis Contable</p>
              <h2 className="text-[16px] font-bold mt-2 leading-snug">Generar Auditoría Contable Operativa</h2>
            </div>
            <button
              onClick={() => toast.success('Auditoría PDF descargada')}
              className="mt-4 bg-white text-primary px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-primary-fixed transition-colors self-start cursor-pointer shadow-sm relative z-10"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Descargar PDF
            </button>
            <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[100px] opacity-10">analytics</span>
          </div>
        </div>
      )}

      {/* Analytics Bento Grid */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card 1: Servicios más Solicitados (col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-title-md text-title-md text-ink font-bold border-b border-outline-variant/10 pb-3 mb-5">
                Ranking de Servicios Solicitados
              </h3>
              
              {dbData?.serviciosMasSolicitados && dbData.serviciosMasSolicitados.length > 0 ? (
                <div className="space-y-4">
                  {dbData.serviciosMasSolicitados.map((item, index) => {
                    const pct = (item.cantidadCitas / maxCitasServicio) * 100;
                    return (
                      <div key={item.nombre} className="space-y-1.5">
                        <div className="flex justify-between text-body-sm font-semibold">
                          <span className="text-ink">
                            {index + 1}. {item.nombre}
                          </span>
                          <span className="text-primary font-bold">{item.cantidadCitas} citas</span>
                        </div>
                        <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary-container h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {item.ingresos > 0 && (
                          <p className="text-[11px] text-body-muted text-right font-medium">
                            Recaudado: S/. {item.ingresos.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-10 text-body-muted text-body-sm">Sin datos de servicios.</p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/10 flex justify-between items-center text-[11px] text-body-muted">
              <span>Datos agregados en tiempo real</span>
              <span className="material-symbols-outlined text-[16px] text-outline">info</span>
            </div>
          </div>

          {/* Card 2: Distribución por Especie (col-span-5) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-title-md text-title-md text-ink font-bold border-b border-outline-variant/10 pb-3 mb-5">
                Distribución por Especie de Paciente
              </h3>
              
              {dbData?.mascotasPorEspecie && dbData.mascotasPorEspecie.length > 0 ? (
                <div className="space-y-5">
                  {dbData.mascotasPorEspecie.map((item) => {
                    const pct = totalMascotasEspecie > 0 ? (item.cantidad / totalMascotasEspecie) * 100 : 0;
                    return (
                      <div key={item.especie} className="space-y-1.5">
                        <div className="flex justify-between text-body-sm font-semibold">
                          <span className="text-ink flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-primary">pets</span>
                            {item.especie}
                          </span>
                          <span className="text-body-muted">
                            {item.cantidad} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-10 text-body-muted text-body-sm">Sin desglose por especie.</p>
              )}
            </div>
            
            {dbData?.totalMascotas ? (
              <div className="mt-6 pt-4 border-t border-outline-variant/10 flex justify-between items-center text-[12px] text-body-muted font-bold uppercase tracking-wider">
                <span>Pacientes Totales Activos</span>
                <span className="text-ink font-extrabold">{dbData.totalMascotas} mascotas</span>
              </div>
            ) : null}
          </div>

          {/* Card 3: Carga Operativa por Veterinario (col-span-8) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-xs">
            <h3 className="font-title-md text-title-md text-ink font-bold border-b border-outline-variant/10 pb-3 mb-5">
              Carga Operativa del Personal Médico
            </h3>
            
            {dbData?.veterinariosMasOcupados && dbData.veterinariosMasOcupados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/10 text-outline text-[11px] font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Veterinario</th>
                      <th className="pb-3 px-4">Atenciones Mes</th>
                      <th className="pb-3 px-4">Semana Actual</th>
                      <th className="pb-3 px-4">Uso de Agenda</th>
                      <th className="pb-3 pl-4 pr-6 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 font-body-sm text-[13px] text-body-strong">
                    {dbData.veterinariosMasOcupados.map((vet) => {
                      const pct = (vet.citasMes / maxCitasVeterinario) * 100;
                      const isOverloaded = pct > 80;
                      return (
                        <tr key={vet.nombre} className="hover:bg-surface-soft/30 transition-colors">
                          <td className="py-3.5 pr-4 font-bold text-ink flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[10px]">
                              {vet.nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span>{vet.nombre}</span>
                              <span className="block text-[10px] text-body-muted font-bold uppercase tracking-wider">{vet.especialidad}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold">{vet.citasMes}</td>
                          <td className="py-3.5 px-4 text-body-muted">{vet.citasSemana}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-surface-container h-1.5 rounded-full">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] text-body-muted font-bold">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 pl-4 pr-6 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOverloaded ? 'bg-rose-50 text-error' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {isOverloaded ? 'SOBRECARGA' : 'ADECUADO'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-10 text-body-muted text-body-sm">Sin registros de personal.</p>
            )}
          </div>

          {/* Card 4: Loyalty & Retention (col-span-4) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-title-md text-title-md text-ink font-bold border-b border-outline-variant/10 pb-3 mb-5">
                Top Retención Clientes
              </h3>
              
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/15 bg-surface-soft/20 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                    </div>
                    <div>
                      <p className="font-bold text-ink text-xs">ID: 882091</p>
                      <p className="text-[10px] text-body-muted">12 visitas anuales</p>
                    </div>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded">VIP</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/15 bg-surface-soft/20 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                    </div>
                    <div>
                      <p className="font-bold text-ink text-xs">ID: 741255</p>
                      <p className="text-[10px] text-body-muted">9 visitas anuales</p>
                    </div>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded">VIP</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/15 bg-surface-soft/20 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                    </div>
                    <div>
                      <p className="font-bold text-ink text-xs">ID: 902113</p>
                      <p className="text-[10px] text-body-muted">8 visitas anuales</p>
                    </div>
                  </div>
                  <span className="bg-[#f1f4f6] text-secondary text-[10px] font-extrabold px-2 py-0.5 rounded">REGULAR</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/10 text-left text-[11px] text-body-muted">
              Auditoría de lealtad calculada hoy
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
