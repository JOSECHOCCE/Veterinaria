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

  return (
    <div className="flex flex-col gap-6">
      
      {/* Filters Form */}
      <div className="bg-surface-card rounded-xl p-4 border border-hairline shadow-sm">
        <h3 className="font-title-sm text-title-sm text-ink font-bold mb-4">Filtros Financieros</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pago-fecha-inicio" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Fecha Inicio</label>
            <input
              id="pago-fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pago-fecha-fin" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Fecha Fin</label>
            <input
              id="pago-fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-metodo" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Método de Pago</label>
            <select
              id="filter-metodo"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
              <option value="Transferencia">Transferencia Bancaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Row */}
      {reporteData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total Revenues */}
          <div className="bg-ink text-surface rounded-xl p-4 border border-hairline shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-28 h-28 bg-surface-variant opacity-10 rounded-full blur-2xl"></div>
            <p className="text-[11px] font-bold text-surface-soft uppercase tracking-wider">Monto Total Recaudado</p>
            <p className="font-display-xl text-[36px] font-bold mt-2 text-surface">
              ${reporteData.totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {/* Total Cash */}
          <div className="bg-surface-soft p-4 rounded-xl border border-hairline shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Total Efectivo</p>
            <p className="font-title-lg text-[26px] text-ink font-bold mt-2">
              ${reporteData.totalEfectivo.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {/* Total Card */}
          <div className="bg-surface-soft p-4 rounded-xl border border-hairline shadow-sm border-l-4 border-l-blue-500">
            <p className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Total Tarjeta</p>
            <p className="font-title-lg text-[26px] text-ink font-bold mt-2">
              ${reporteData.totalTarjeta.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-surface-card rounded-xl border border-hairline shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Action Bar */}
        <div className="p-4 bg-surface-soft/60 border-b border-hairline flex flex-col sm:flex-row justify-between items-center gap-4">
          <h4 className="font-title-sm text-title-sm text-ink font-bold">Registro Contable de Transacciones</h4>
          
          {reporteData && reporteData.detalle.length > 0 && (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                disabled={exporting !== null}
                onClick={() => handleExport('csv')}
                className="flex-1 sm:flex-initial bg-transparent border border-outline text-ink hover:bg-surface-card font-button text-button px-4 py-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                {exporting === 'csv' ? 'Exportando...' : 'Exportar CSV'}
              </button>
              <button
                disabled={exporting !== null}
                onClick={() => handleExport('pdf')}
                className="flex-1 sm:flex-initial bg-primary hover:bg-primary-active text-on-primary font-button text-button px-4 py-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
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
                <tr className="bg-surface-soft/40 border-b border-hairline text-ink font-bold text-[12px] uppercase tracking-wider">
                  <th className="py-2.5 pl-6 pr-4">ID Transacción</th>
                  <th className="py-2.5 px-4">Fecha Pago</th>
                  <th className="py-2.5 px-4">Concepto / Servicio</th>
                  <th className="py-2.5 px-4 text-center">Método de Pago</th>
                  <th className="py-2.5 pl-4 pr-6 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
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
                      <td className="py-2.5 pl-6 pr-4 font-semibold select-all text-body-muted">TX-#{item.pagoId}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold">{dateStr}</span>
                        <span className="text-body-muted ml-1.5">{timeStr}</span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-ink">{item.concepto}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${getMethodBadgeClass(item.metodoPago)}`}>
                          {item.metodoPago}
                        </span>
                      </td>
                      <td className="py-2.5 pl-4 pr-6 text-right font-bold text-ink">${item.monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
