import { useState, useEffect } from 'react';
import reportesService, { type ReporteCitasDto } from '../../services/reportes.service';
import VeterinariosService, { type Veterinario } from '../../services/veterinarios.service';
import { toast } from 'sonner';

export default function ReporteCitas() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [estado, setEstado] = useState<string>('');
  const [veterinarioId, setVeterinarioId] = useState<string>('');

  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [reporteData, setReporteData] = useState<ReporteCitasDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  // Cargar veterinarios para el selector
  useEffect(() => {
    const loadVeterinarios = async () => {
      try {
        const res = await VeterinariosService.getVeterinarios();
        if (res.success && res.data?.veterinarios) {
          const list = res.data.veterinarios.map((v: any) => v.veterinario);
          setVeterinarios(list);
        }
      } catch (err) {
        console.error('Error al cargar veterinarios:', err);
      }
    };
    loadVeterinarios();
  }, []);

  // Cargar el reporte
  const loadReporte = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportesService.getReporteCitas(
        fechaInicio,
        fechaFin,
        estado || null,
        veterinarioId ? Number(veterinarioId) : null
      );
      if (res.success && res.data) {
        setReporteData(res.data);
      } else {
        setError(res.message || 'Error al cargar el reporte de citas.');
      }
    } catch (err: any) {
      console.error('Error fetching appointments report:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReporte();
  }, [fechaInicio, fechaFin, estado, veterinarioId]);

  const handleExport = async (formato: 'csv' | 'pdf') => {
    try {
      setExporting(formato);
      const res = await reportesService.exportarReporteCitas(
        fechaInicio,
        fechaFin,
        formato,
        estado || null,
        veterinarioId ? Number(veterinarioId) : null
      );

      const contentTypeHeader = res.headers['content-type'];
      const contentType = typeof contentTypeHeader === 'string' ? contentTypeHeader : (formato === 'pdf' ? 'application/pdf' : 'text/csv');
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      link.setAttribute('download', `ReporteCitas_${timestamp}.${formato}`);
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelada':
      case 'Rechazada':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Confirmada':
        return 'bg-teal-100 text-teal-800 border-teal-200';
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

  return (
    <div className="flex flex-col gap-6">
      
      {/* Filters Form */}
      <div className="bg-surface-card rounded-xl p-4 border border-hairline shadow-sm">
        <h3 className="font-title-sm text-title-sm text-ink font-bold mb-4">Filtros de Búsqueda</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha-inicio" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Fecha Inicio</label>
            <input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha-fin" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Fecha Fin</label>
            <input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-estado" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Estado de Cita</label>
            <select
              id="filter-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="PendienteConfirmacion">Pendientes Confirmación</option>
              <option value="PendienteAsignacion">Pendientes Asignación</option>
              <option value="Confirmada">Confirmadas</option>
              <option value="EnAtencion">En Atención / En Proceso</option>
              <option value="Completada">Completadas</option>
              <option value="Cancelada">Canceladas</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-vet" className="font-label-sm text-body-muted font-bold text-[11px] uppercase tracking-wider">Veterinario</label>
            <select
              id="filter-vet"
              value={veterinarioId}
              onChange={(e) => setVeterinarioId(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Todos los veterinarios</option>
              {veterinarios.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} ({v.especialidad})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      {reporteData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-soft p-4 rounded-xl border border-hairline shadow-sm">
            <p className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Citas Totales</p>
            <p className="font-title-lg text-title-lg text-ink font-bold mt-1">{reporteData.totalCitas}</p>
          </div>
          <div className="bg-surface-soft p-4 rounded-xl border border-hairline shadow-sm border-l-4 border-l-success">
            <p className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Completadas</p>
            <p className="font-title-lg text-title-lg text-success font-bold mt-1">{reporteData.completadas}</p>
          </div>
          <div className="bg-surface-soft p-4 rounded-xl border border-hairline shadow-sm border-l-4 border-l-error">
            <p className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Canceladas</p>
            <p className="font-title-lg text-title-lg text-error font-bold mt-1">{reporteData.canceladas}</p>
          </div>
          <div className="bg-surface-soft p-4 rounded-xl border border-hairline shadow-sm border-l-4 border-l-accent-amber">
            <p className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Pendientes</p>
            <p className="font-title-lg text-title-lg text-accent-amber font-bold mt-1">{reporteData.pendientes}</p>
          </div>
        </div>
      )}

      {/* Main Report Container */}
      <div className="bg-surface-card rounded-xl border border-hairline shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Action Bar */}
        <div className="p-4 bg-surface-soft/60 border-b border-hairline flex flex-col sm:flex-row justify-between items-center gap-4">
          <h4 className="font-title-sm text-title-sm text-ink font-bold">Listado Detallado de Citas</h4>
          
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
            <p className="font-body-sm">Cargando reporte de citas...</p>
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
                  <th className="py-2.5 pl-6 pr-4">ID Cita</th>
                  <th className="py-2.5 px-4">Fecha y Hora</th>
                  <th className="py-2.5 px-4">Mascota</th>
                  <th className="py-2.5 px-4">Servicio</th>
                  <th className="py-2.5 px-4">Veterinario</th>
                  <th className="py-2.5 pl-4 pr-4 text-right">Monto</th>
                  <th className="py-2.5 pl-4 pr-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {reporteData.detalle.map((item) => {
                  const dateStr = new Date(item.fechaHora).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                  const timeStr = new Date(item.fechaHora).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr key={item.citaId} className="hover:bg-surface-soft/30 transition-all font-body-sm text-[13px] text-body-strong">
                      <td className="py-2.5 pl-6 pr-4 font-semibold select-all text-body-muted">#{item.citaId}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold">{dateStr}</span>
                        <span className="text-body-muted ml-1.5">{timeStr}</span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-ink">{item.mascota}</td>
                      <td className="py-2.5 px-4 font-medium">{item.servicio}</td>
                      <td className="py-2.5 px-4 text-body-muted">{item.veterinario}</td>
                      <td className="py-2.5 pl-4 pr-4 text-right font-semibold">${item.montoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 pl-4 pr-6 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${getStatusBadgeClass(item.estado)}`}>
                          {translateStatus(item.estado)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-body-muted flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[48px]">calendar_today</span>
            <p className="font-body-md font-semibold">No se encontraron citas bajo los criterios seleccionados.</p>
          </div>
        )}

      </div>

    </div>
  );
}
