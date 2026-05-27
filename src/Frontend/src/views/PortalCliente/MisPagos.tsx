import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Pago {
  id: number;
  citaId: number;
  monto: number;
  metodoPago: string;
  tipoPago: string;
  referencia: string;
  ultimosDigitosTarjeta?: string;
  fechaPago: string;
  mascotaNombre?: string;
  servicioNombre?: string;
  fechaCita?: string;
}

const MisPagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadMyPayments() {
      try {
        const response = await api.get('/api/Pagos/mis-pagos');
        if (response.data.success) {
          setPagos(response.data.data || []);
        }
      } catch (error) {
        console.error('Error al cargar pagos:', error);
        toast.error('No se pudo cargar tu historial de pagos.');
      } finally {
        setLoading(false);
      }
    }

    loadMyPayments();
  }, []);

  const formatFecha = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownloadComprobante = async (pagoId: number, referencia: string) => {
    setDownloadingId(pagoId);
    try {
      const response = await api.get(`/api/PagoCita/DescargarComprobante/${pagoId}`);
      if (response.data.success) {
        const { fileBase64, fileName, contentType } = response.data.data;
        
        // Convertir Base64 a Blob y descargar
        const byteCharacters = atob(fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType || 'application/pdf' });
        
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName || `Comprobante_Pago_${referencia}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('¡Comprobante PDF descargado exitosamente!');
      } else {
        toast.error(response.data.message || 'No se pudo generar el comprobante.');
      }
    } catch (error) {
      console.error('Error al descargar comprobante:', error);
      toast.error('Ocurrió un error al generar el PDF del comprobante.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getMetodoPagoBadge = (metodo: string) => {
    switch (metodo) {
      case 'Tarjeta':
        return 'bg-primary-container text-on-primary-container border-primary/20';
      case 'Efectivo':
        return 'bg-secondary-container text-on-secondary-container border-secondary/20';
      case 'Transferencia':
        return 'bg-surface-variant text-on-surface-variant border-outline-variant';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-sm">Cargando tu historial de pagos...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="flex-grow w-full bg-background min-h-screen pt-24 pb-margin"
    >
      <main className="flex-grow w-full max-w-5xl mx-auto px-margin flex flex-col gap-md">
        
        {/* Cabecera */}
        <section className="flex flex-col sm:flex-row items-center justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md gap-sm">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[32px]">payments</span>
            </div>
            <div className="flex flex-col text-left">
              <h2 className="font-headline-xl text-headline-xl text-on-surface">Mis Pagos & Cobros</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Consulta y descarga los comprobantes de tus transacciones realizadas en VetCare Pro.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-label-sm text-[11px] text-outline-variant uppercase tracking-wider block">Total Recaudado</span>
            <span className="font-headline-xl text-2xl font-extrabold text-primary">
              S/. {pagos.reduce((acc, p) => acc + (p.tipoPago !== 'Anulado' ? p.monto : 0), 0).toFixed(2)}
            </span>
          </div>
        </section>

        {/* Listado / Tabla */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          {pagos.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center opacity-65">
              <span className="material-symbols-outlined text-[56px] text-outline">receipt_long</span>
              <h3 className="font-headline-md text-lg text-on-surface mt-xs font-bold">Sin pagos registrados</h3>
              <p className="font-body-md text-body-md mt-2">Aún no registras transacciones financieras en la plataforma.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[13px] text-on-surface-variant font-bold">
                    <th className="p-md">Referencia</th>
                    <th className="p-md">Mascota 🐾</th>
                    <th className="p-md">Servicio / Atención</th>
                    <th className="p-md">Fecha de Pago</th>
                    <th className="p-md">Método</th>
                    <th className="p-md text-right">Monto</th>
                    <th className="p-md text-center">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-body-md text-on-surface font-medium">
                  <AnimatePresence>
                    {pagos.map((pago, index) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        key={pago.id}
                        className={`hover:bg-surface transition-colors ${pago.tipoPago === 'Anulado' ? 'opacity-60 bg-error-container/5' : ''}`}
                      >
                        <td className="p-md font-mono text-[12px] text-outline">
                          {pago.referencia}
                          {pago.tipoPago === 'Anulado' && (
                            <span className="block text-[10px] text-error font-bold tracking-wide uppercase mt-1">Anulado</span>
                          )}
                        </td>
                        <td className="p-md font-bold text-primary flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">pets</span>
                          {pago.mascotaNombre || 'Mascota'}
                        </td>
                        <td className="p-md text-[13px]">
                          {pago.servicioNombre || 'Atención Clínica'}
                          <span className="block text-[11px] text-on-surface-variant font-normal">Cita: {pago.fechaCita ? formatFecha(pago.fechaCita) : ''}</span>
                        </td>
                        <td className="p-md text-[13px] text-on-surface-variant">
                          {formatFecha(pago.fechaPago)}
                        </td>
                        <td className="p-md">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getMetodoPagoBadge(pago.metodoPago)}`}>
                            {pago.metodoPago} {pago.ultimosDigitosTarjeta ? `(*${pago.ultimosDigitosTarjeta})` : ''}
                          </span>
                        </td>
                        <td className="p-md text-right font-bold text-on-surface text-[15px]">
                          S/. {pago.monto.toFixed(2)}
                        </td>
                        <td className="p-md text-center">
                          {pago.tipoPago === 'Anulado' ? (
                            <span className="text-[11px] text-error font-bold">Comprobante Anulado</span>
                          ) : (
                            <button
                              onClick={() => handleDownloadComprobante(pago.id, pago.referencia)}
                              disabled={downloadingId !== null}
                              className={`p-xs rounded-lg border border-primary/20 text-primary bg-primary/5 hover:bg-primary hover:text-on-primary transition-all cursor-pointer inline-flex items-center justify-center ${downloadingId === pago.id ? 'animate-pulse' : ''}`}
                              title="Descargar Comprobante PDF"
                            >
                              {downloadingId === pago.id ? (
                                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                              ) : (
                                <span className="material-symbols-outlined text-[18px] font-bold">picture_as_pdf</span>
                              )}
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </motion.div>
  );
};

export default MisPagos;
