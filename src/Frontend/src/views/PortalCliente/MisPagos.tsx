import { useState, useEffect } from 'react';
import PortalClienteService from '../../services/portalCliente.service';

interface Pago {
  id: number;
  fechaPago: string;
  montoCobrado: number;
  metodoPago: string;
  numeroOperacion?: string;
  estado: string; // Estado de pago (ej. Pagado, Pendiente)
  servicioNombre: string;
  citaFecha: string;
}

export default function MisPagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PortalClienteService.getMisPagos();
      if (res.success && res.data) {
        setPagos(res.data);
      } else {
        setError(res.message || 'Error al obtener la lista de pagos.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleDownloadPdf = (pagoId: number) => {
    // En una integración real, esto abriría el endpoint del PDF del backend (ej: /api/pagos/pdf/1)
    window.open(`/api/pagos/pdf/${pagoId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-20 bg-surface-card rounded-lg w-full"></div>
        <div className="h-44 bg-surface-card rounded-xl w-full mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Error de facturación</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={fetchPagos}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Total acumulado pagado
  const totalPagado = pagos.reduce((sum, pago) => sum + (pago.montoCobrado || 0), 0);

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="font-display-lg text-display-lg text-ink">Mis Pagos</h2>
          <p className="font-body-md text-body-md text-body-muted mt-1 max-w-2xl">
            Historial de cobros y facturación. Consulta tus pagos realizados, descarga comprobantes y revisa tus saldos.
          </p>
        </div>
        <div className="bg-surface-soft border border-hairline px-6 py-3.5 rounded-xl flex items-center gap-4 shadow-inner">
          <span className="material-symbols-outlined text-primary text-[28px]">payments</span>
          <div>
            <p className="font-caption text-caption text-body-muted uppercase tracking-wider leading-none">Total Invertido</p>
            <p className="font-display-sm text-display-sm font-bold text-ink mt-1">S/. {totalPagado.toFixed(2)}</p>
          </div>
        </div>
      </header>

      {/* Tabla / Lista de Pagos */}
      {pagos.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-xl flex flex-col items-center justify-center p-12 bg-canvas/30 text-center">
          <span className="material-symbols-outlined text-[48px] text-body-muted mb-3">receipt_long</span>
          <h3 className="font-title-md text-title-md font-bold text-ink">Sin transacciones registradas</h3>
          <p className="font-body-sm text-body-sm text-body-muted mt-1 max-w-sm">
            No tienes recibos ni pagos registrados en tu cuenta en este momento. Las facturas completadas aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas/50 border-b border-hairline font-caption-caps text-caption-caps text-body-muted">
                  <th className="p-4 pl-6 font-bold">Fecha de Pago</th>
                  <th className="p-4 font-bold">Servicio / Cita</th>
                  <th className="p-4 font-bold text-center">Método</th>
                  <th className="p-4 font-bold text-center">Operación</th>
                  <th className="p-4 font-bold text-right">Monto</th>
                  <th className="p-4 font-bold text-center">Estado</th>
                  <th className="p-4 pr-6 font-bold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-body-sm text-ink">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-surface-soft/40 transition-colors">
                    {/* Fecha */}
                    <td className="p-4 pl-6 font-medium">
                      {formatDate(pago.fechaPago)}
                    </td>
                    
                    {/* Cita */}
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-ink leading-tight">{pago.servicioNombre}</p>
                        <p className="text-[12px] text-body-muted mt-0.5">
                          Cita: {new Date(pago.citaFecha).toLocaleDateString('es-ES')} a las {new Date(pago.citaFecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </td>

                    {/* Método */}
                    <td className="p-4 text-center font-medium">
                      {pago.metodoPago || 'No especificado'}
                    </td>

                    {/* Operación */}
                    <td className="p-4 text-center text-body-muted font-code text-code">
                      {pago.numeroOperacion || '—'}
                    </td>

                    {/* Monto */}
                    <td className="p-4 text-right font-bold text-ink">
                      S/. {pago.montoCobrado.toFixed(2)}
                    </td>

                    {/* Estado */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        pago.estado === 'Pagado' || pago.estado === 'Completada' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {pago.estado || 'Pagado'}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleDownloadPdf(pago.id)}
                        className="text-primary hover:text-primary-active font-button text-[12px] font-bold flex items-center gap-1 mx-auto hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Recibo PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
