import { useState, useEffect } from 'react';
import reportesService, { type ReporteIngresosDto } from '../../services/reportes.service';
import { toast } from 'sonner';

export default function ReportePagos() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [metodoPago, setMetodoPago] = useState<string>('');

  const [reporteData, setReporteData] = useState<ReporteIngresosDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const loadReporte = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportesService.getReporteIngresos(
        fechaInicio,
        fechaFin,
        metodoPago || null
      );
      if (res.success && res.data) {
        setReporteData(res.data);
      } else {
        setError(res.message || 'Error al cargar el reporte financiero.');
      }
    } catch (err: any) {
      console.error('Error fetching payments report:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReporte();
  }, [fechaInicio, fechaFin, metodoPago]);

  const handleExport = async (formato: 'csv' | 'pdf') => {
    try {
      setExporting(formato);
      const res = await reportesService.exportarReporteIngresos(
        fechaInicio,
        fechaFin,
        formato,
        metodoPago || null
      );

      const contentTypeHeader = res.headers['content-type'];
      const contentType = typeof contentTypeHeader === 'string' ? contentTypeHeader : (formato === 'pdf' ? 'application/pdf' : 'text/csv');
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      link.setAttribute('download', `ReporteFinanciero_${timestamp}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Reporte exportado exitosamente en formato ${formato.toUpperCase()}`);
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error('Ocurrió un error al descargar el archivo de reporte.');
    } finally {
      setExporting(null);
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'Tarjeta':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Transferencia':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Efectivo':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  // Cálculos consolidados y desgloses
  const totalIngresos = reporteData?.totalIngresos || 0;
  const totalEfectivo = reporteData?.totalEfectivo || 0;
  const totalTarjeta = reporteData?.totalTarjeta || 0;
  const totalTransferencia = Math.max(0, totalIngresos - totalEfectivo - totalTarjeta);

  const pctTarjeta = totalIngresos ? Math.round((totalTarjeta / totalIngresos) * 100) : 0;
  const pctEfectivo = totalIngresos ? Math.round((totalEfectivo / totalIngresos) * 100) : 0;
  const pctTransferencia = totalIngresos ? Math.max(0, 100 - pctTarjeta - pctEfectivo) : 0;

  // Donut path dashes
  const dashTransferencia = `${pctTransferencia}, 100`;
  const dashTarjeta = `${pctTarjeta}, 100`;
  const offsetTarjeta = -pctTransferencia;
  const dashEfectivo = `${pctEfectivo}, 100`;
  const offsetEfectivo = -(pctTransferencia + pctTarjeta);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* Filters Form */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-xs">
        <h3 className="font-title-sm text-title-sm text-ink font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">filter_alt</span>
          Filtros Financieros
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pago-fecha-inicio" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Fecha Inicio</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">calendar_month</span>
              <input
                id="pago-fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-surface border border-outline-variant/60 rounded-lg pl-9 pr-3 py-2 text-body-sm focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pago-fecha-fin" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Fecha Fin</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">calendar_month</span>
              <input
                id="pago-fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-surface border border-outline-variant/60 rounded-lg pl-9 pr-3 py-2 text-body-sm focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-metodo" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Método de Pago</label>
            <select
              id="filter-metodo"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full bg-surface border border-outline-variant/60 rounded-lg px-3 py-2 text-body-sm focus:border-primary outline-none transition-colors"
            >
              <option value="">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
              <option value="Transferencia">Transferencia Bancaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consolidated Indicators Section */}
      {reporteData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Total Collected Card (col-span-4) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-outline-variant/20 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined p-3 bg-primary/10 text-primary rounded-xl">account_balance_wallet</span>
                <span className="text-primary-container font-semibold text-[13px] bg-primary/10 px-2 py-1 rounded-md shadow-inner">+12.5%</span>
              </div>
              <h3 className="text-[11px] font-bold text-body-muted uppercase tracking-wider mb-1 leading-none">Total Recaudado</h3>
              <div className="text-[28px] font-bold text-on-surface leading-none mt-1">S/. {totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            {/* Sparkline visualization mockup */}
            <div className="mt-6 pt-4 border-t border-outline-variant/10 flex gap-1 h-10 items-end">
              <div className="bg-primary/20 w-full h-1/4 rounded-xs"></div>
              <div className="bg-primary/20 w-full h-2/4 rounded-xs"></div>
              <div className="bg-primary/40 w-full h-3/4 rounded-xs"></div>
              <div className="bg-primary/20 w-full h-2/4 rounded-xs"></div>
              <div className="bg-primary/60 w-full h-full rounded-xs"></div>
              <div className="bg-primary w-full h-4/5 rounded-xs"></div>
            </div>
          </div>

          {/* Breakdown by Method (col-span-5) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-xs">
            <h3 className="text-[11px] font-bold text-body-muted uppercase tracking-wider mb-4 leading-none">Desglose por Método</h3>
            <div className="flex items-center gap-6">
              {/* Dynamic SVG Donut Chart */}
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f4f6" strokeWidth="3" />
                  
                  {/* Transferencia */}
                  {pctTransferencia > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#006a63"
                      strokeWidth="3.2"
                      strokeDasharray={dashTransferencia}
                      strokeDashoffset="0"
                    />
                  )}

                  {/* Tarjeta */}
                  {pctTarjeta > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#4fd1c5"
                      strokeWidth="3.2"
                      strokeDasharray={dashTarjeta}
                      strokeDashoffset={offsetTarjeta}
                    />
                  )}

                  {/* Efectivo */}
                  {pctEfectivo > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#ffab67"
                      strokeWidth="3.2"
                      strokeDasharray={dashEfectivo}
                      strokeDashoffset={offsetEfectivo}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
                  <span className="text-[10px] text-body-muted font-bold uppercase">Total</span>
                  <span className="text-[14px] font-extrabold text-ink mt-1">100%</span>
                </div>
              </div>
              
              <div className="flex-grow flex flex-col gap-2 font-body-sm text-body-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                    <span className="text-body-strong font-medium">Transferencia</span>
                  </div>
                  <span className="font-bold text-ink">{pctTransferencia}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4fd1c5] inline-block"></span>
                    <span className="text-body-strong font-medium">Tarjeta</span>
                  </div>
                  <span className="font-bold text-ink">{pctTarjeta}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffab67] inline-block"></span>
                    <span className="text-body-strong font-medium">Efectivo</span>
                  </div>
                  <span className="font-bold text-ink">{pctEfectivo}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Box Widget (col-span-3) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined p-2.5 bg-error-container text-error rounded-xl text-[20px] inline-block mb-3">
                pending_actions
              </span>
              <h3 className="text-[11px] font-bold text-body-muted uppercase tracking-wider mb-1 leading-none">Total Efectivo</h3>
              <div className="text-[24px] font-bold text-ink mt-1">S/. {totalEfectivo.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="text-body-muted text-[11px] mt-4 font-semibold">
              Cierre parcial en efectivo registrado
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs overflow-hidden flex flex-col">
        
        {/* Table Action Bar */}
        <div className="p-4 bg-surface-soft/60 border-b border-outline-variant/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h4 className="font-title-sm text-title-sm text-ink font-bold">Registro Contable de Transacciones</h4>
          
          {reporteData && reporteData.detalle.length > 0 && (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                disabled={exporting !== null}
                onClick={() => handleExport('csv')}
                className="flex-1 sm:flex-initial bg-transparent border border-outline text-ink hover:bg-surface-card font-button text-button px-4 py-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                {exporting === 'csv' ? 'Exportando...' : 'Exportar CSV'}
              </button>
              <button
                disabled={exporting !== null}
                onClick={() => handleExport('pdf')}
                className="flex-1 sm:flex-initial bg-primary hover:bg-primary-active text-on-primary font-button text-button px-4 py-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                {exporting === 'pdf' ? 'Generando...' : 'Exportar PDF'}
              </button>
            </div>
          )}
        </div>

        {/* Loading / Error / Content */}
        {loading && reporteData === null ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse gap-3 text-body-muted">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-body-sm">Cargando transacciones contables...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-error flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[40px]">error</span>
            <p>{error}</p>
            <button onClick={loadReporte} className="mt-2 text-primary font-bold hover:underline">Reintentar</button>
          </div>
        ) : reporteData?.detalle && reporteData.detalle.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-soft/40 border-b border-outline-variant/10 text-ink font-bold text-[12px] uppercase tracking-wider">
                  <th className="py-3 pl-6 pr-4">ID Transacción</th>
                  <th className="py-3 px-4">Fecha Pago</th>
                  <th className="py-3 px-4">Concepto / Servicio</th>
                  <th className="py-3 px-4 text-center">Método de Pago</th>
                  <th className="py-3 pl-4 pr-6 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {reporteData.detalle.map((item) => {
                  const dateStr = new Date(item.fechaPago).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                  const timeStr = new Date(item.fechaPago).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr key={item.pagoId} className="hover:bg-surface-soft/30 transition-all font-body-sm text-[13px] text-body-strong">
                      <td className="py-3 pl-6 pr-4 font-semibold select-all text-body-muted">TX-#{item.pagoId}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{dateStr}</span>
                        <span className="text-body-muted ml-1.5">{timeStr}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-ink">{item.concepto}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${getMethodBadgeClass(item.metodoPago)}`}>
                          {item.metodoPago}
                        </span>
                      </td>
                      <td className="py-3 pl-4 pr-6 text-right font-bold text-ink">S/. {item.monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-body-muted flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[48px]">receipt_long</span>
            <p className="font-body-md font-semibold">No se encontraron pagos en el período especificado.</p>
          </div>
        )}

      </div>

    </div>
  );
}
