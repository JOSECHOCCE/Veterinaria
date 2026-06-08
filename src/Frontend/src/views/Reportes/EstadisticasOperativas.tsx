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
      
      // Cargar datos consolidados de dashboard y reporte de nuevos clientes
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

  // Derivar valores máximos para las escalas proporcionales
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
    <div className="flex flex-col gap-8">
      
      {/* Date Filters & Controls */}
      <div className="bg-surface-card rounded-xl p-6 border border-hairline shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="font-title-sm text-title-sm text-ink font-bold">Rango de Análisis Analítico</h3>
          <p className="font-body-sm text-body-sm text-body-muted mt-0.5">Define el período temporal para auditar el rendimiento.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-surface border border-hairline p-1 rounded-full shadow-inner select-none">
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
                className="bg-surface border border-hairline rounded-lg px-3 py-1.5 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <span className="text-body-muted font-bold">—</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-surface border border-hairline rounded-lg px-3 py-1.5 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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

      {/* Analytics Bento Grid */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Servicios más Solicitados (Horizontal Progress Bars) */}
          <div className="bg-surface-card rounded-xl p-6 border border-hairline shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-title-md text-title-md text-ink font-bold border-b border-hairline pb-2 mb-4">
                Ranking de Servicios Solicitados
              </h3>
              
              {dbData?.serviciosMasSolicitados && dbData.serviciosMasSolicitados.length > 0 ? (
                <div className="space-y-4">
                  {dbData.serviciosMasSolicitados.map((item, index) => {
                    const pct = (item.cantidadCitas / maxCitasServicio) * 100;
                    return (
                      <div key={item.nombre} className="space-y-1">
                        <div className="flex justify-between text-body-sm font-semibold">
                          <span className="text-ink">
                            {index + 1}. {item.nombre}
                          </span>
                          <span className="text-primary">{item.cantidadCitas} citas</span>
                        </div>
                        <div className="w-full bg-surface-soft h-3 rounded-full overflow-hidden border border-hairline/40">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {item.ingresos > 0 && (
                          <p className="text-[11px] text-body-muted text-right">
                            Recaudado: ${item.ingresos.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
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
            <div className="mt-6 pt-4 border-t border-hairline flex justify-between items-center text-[12px] text-body-muted">
              <span>Datos agregados en tiempo real</span>
              <span className="material-symbols-outlined text-[16px]">info</span>
            </div>
          </div>

          {/* Card 2: Carga Operativa por Veterinario */}
          <div className="bg-surface-card rounded-xl p-6 border border-hairline shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-title-md text-title-md text-ink font-bold border-b border-hairline pb-2 mb-4">
                Carga Operativa Médica
              </h3>
              
              {dbData?.veterinariosMasOcupados && dbData.veterinariosMasOcupados.length > 0 ? (
                <div className="space-y-5">
                  {dbData.veterinariosMasOcupados.map((vet) => {
                    const pct = (vet.citasMes / maxCitasVeterinario) * 100;
                    return (
                      <div key={vet.nombre} className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="font-semibold text-ink text-body-sm block">{vet.nombre}</span>
                            <span className="text-[10px] text-body-muted uppercase tracking-wider font-bold">
                              {vet.especialidad}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-primary font-bold text-body-sm block">{vet.citasMes} atenciones</span>
                            <span className="text-[11px] text-body-muted">
                              Semana: {vet.citasSemana}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-surface-soft h-3 rounded-full overflow-hidden border border-hairline/40">
                          <div
                            className="bg-tertiary h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-10 text-body-muted text-body-sm">Sin registros de médicos ocupados.</p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-hairline text-right">
              <span className="text-[11px] text-body-muted italic">Volumen de atenciones mensuales</span>
            </div>
          </div>

          {/* Card 3: Distribución de Pacientes por Especie */}
          <div className="bg-surface-card rounded-xl p-6 border border-hairline shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-title-md text-title-md text-ink font-bold border-b border-hairline pb-2 mb-4">
                Distribución por Especie
              </h3>
              
              {dbData?.mascotasPorEspecie && dbData.mascotasPorEspecie.length > 0 ? (
                <div className="space-y-4">
                  {dbData.mascotasPorEspecie.map((item) => {
                    const pct = totalMascotasEspecie > 0 ? (item.cantidad / totalMascotasEspecie) * 100 : 0;
                    return (
                      <div key={item.especie} className="space-y-1">
                        <div className="flex justify-between text-body-sm font-semibold">
                          <span className="text-ink">{item.especie}</span>
                          <span className="text-body-muted">
                            {item.cantidad} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-soft h-2.5 rounded-full overflow-hidden border border-hairline/40">
                          <div
                            className="bg-accent-teal h-full rounded-full"
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
              <div className="mt-6 pt-4 border-t border-hairline flex justify-between items-center text-[12px] text-body-muted font-semibold">
                <span>Pacientes Totales Activos</span>
                <span className="text-ink font-bold">{dbData.totalMascotas} mascotas</span>
              </div>
            ) : null}
          </div>

          {/* Card 4: Captación de Clientes y Propietarios */}
          <div className="bg-surface-card rounded-xl p-6 border border-hairline shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-title-md text-title-md text-ink font-bold border-b border-hairline pb-2 mb-4">
                Tendencia de Registro de Clientes
              </h3>
              
              {clientesData ? (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-soft p-3 rounded-lg border border-hairline text-center shadow-xs">
                      <p className="text-[10px] font-bold text-body-muted uppercase tracking-wider">Nuevos Clientes</p>
                      <p className="text-[28px] font-bold text-primary mt-1">
                        {clientesData.totalNuevosClientes}
                      </p>
                    </div>
                    <div className="bg-surface-soft p-3 rounded-lg border border-hairline text-center shadow-xs">
                      <p className="text-[10px] font-bold text-body-muted uppercase tracking-wider">Nuevas Mascotas</p>
                      <p className="text-[28px] font-bold text-tertiary mt-1">
                        {clientesData.totalNuevasMascotas}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-body-muted uppercase tracking-wider mb-2">
                      Registros Recientes
                    </h4>
                    
                    {clientesData.detalle && clientesData.detalle.length > 0 ? (
                      <div className="max-h-28 overflow-y-auto divide-y divide-hairline border border-hairline rounded-lg">
                        {clientesData.detalle.map((c) => {
                          const regDate = new Date(c.fechaRegistro).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short'
                          });
                          return (
                            <div key={c.clienteId} className="flex justify-between items-center px-3 py-1.5 text-[12px] bg-canvas">
                              <div>
                                <span className="font-semibold text-ink block">{c.nombre}</span>
                                <span className="text-[10px] text-body-muted">Ingreso: {regDate}</span>
                              </div>
                              <span className="bg-surface-soft px-2 py-0.5 rounded-full border border-hairline font-semibold text-body-muted">
                                {c.cantidadMascotas} {c.cantidadMascotas === 1 ? 'mascota' : 'mascotas'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center py-6 text-[12px] text-body-muted italic">Sin nuevos clientes en el rango.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center py-10 text-body-muted text-body-sm">Sin datos de tendencia.</p>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-hairline text-left text-[11px] text-body-muted italic">
              Periodo: {fechaInicio} al {fechaFin}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
