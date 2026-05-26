import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Pago {
  id: number;
  monto: number;
  metodoPago: string;
  tipoPago: string;
  fechaPago: string;
  referencia: string;
  mascotaNombre: string;
  propietarioNombre: string;
  veterinarioNombre: string;
  servicioNombre: string;
  fechaCita: string;
}

interface PagosResponse {
  pagos: Pago[];
  totalTarjeta: number;
  totalEfectivo: number;
  totalGeneral: number;
  totalPagos: number;
}

const GestionPagos: React.FC = () => {
  const [data, setData] = useState<PagosResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPagos() {
      try {
        const response = await api.get('/api/Pagos');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          toast.error(response.data.message || 'Error al cargar los pagos');
        }
      } catch (error) {
        console.error('Error fetching pagos:', error);
        toast.error('No se pudo conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    }
    fetchPagos();
  }, []);

  const formatCurrency = (amount: number) => {
    return `$ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto p-md lg:p-margin bg-background">
      <div className="max-w-7xl mx-auto space-y-md">
        {/* Page Header */}
        <div className="flex justify-between items-end border-b border-outline-variant pb-sm">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface">Facturación y Pagos</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Resumen general de todos los pagos registrados</p>
          </div>
          <div className="bg-surface-container px-sm py-xs rounded-lg border border-outline-variant flex items-center space-x-xs">
            <span className="material-symbols-outlined text-outline text-sm">receipt_long</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {loading ? '...' : `${data?.totalPagos ?? 0} pagos registrados`}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] animate-pulse">
                <div className="h-4 bg-surface-variant rounded w-1/2 mb-sm"></div>
                <div className="h-8 bg-surface-variant rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Total Recaudado */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-xs mb-sm">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Total Recaudado</span>
              </div>
              <span className="font-headline-xl text-headline-xl text-primary font-bold">{formatCurrency(data?.totalGeneral ?? 0)}</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">{data?.totalPagos ?? 0} pagos en total</p>
            </div>

            {/* Pagos Tarjeta */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-xs mb-sm">
                <span className="material-symbols-outlined text-secondary">credit_card</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Pagos con Tarjeta</span>
              </div>
              <span className="font-headline-xl text-headline-xl text-secondary font-bold">{formatCurrency(data?.totalTarjeta ?? 0)}</span>
            </div>

            {/* Pagos Efectivo */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-xs mb-sm">
                <span className="material-symbols-outlined text-tertiary">payments</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Pagos en Efectivo</span>
              </div>
              <span className="font-headline-xl text-headline-xl text-tertiary font-bold">{formatCurrency(data?.totalEfectivo ?? 0)}</span>
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-sm flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">list_alt</span> Historial de Pagos
          </h3>
          <div className="border border-outline-variant rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="font-label-md text-label-md text-on-surface-variant py-sm px-sm font-semibold">Fecha</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-sm px-sm font-semibold">Paciente</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-sm px-sm font-semibold">Propietario</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-sm px-sm font-semibold">Servicio</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-sm px-sm font-semibold">Método</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-sm px-sm font-semibold">Referencia</th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-sm px-sm font-semibold text-right w-32">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-sm px-sm"><div className="h-4 bg-surface-variant rounded w-20"></div></td>
                      <td className="py-sm px-sm"><div className="h-4 bg-surface-variant rounded w-16"></div></td>
                      <td className="py-sm px-sm"><div className="h-4 bg-surface-variant rounded w-24"></div></td>
                      <td className="py-sm px-sm"><div className="h-4 bg-surface-variant rounded w-28"></div></td>
                      <td className="py-sm px-sm"><div className="h-4 bg-surface-variant rounded w-16"></div></td>
                      <td className="py-sm px-sm"><div className="h-4 bg-surface-variant rounded w-20"></div></td>
                      <td className="py-sm px-sm text-right"><div className="h-4 bg-surface-variant rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : data?.pagos && data.pagos.length > 0 ? (
                  data.pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-surface-bright transition-colors">
                      <td className="py-sm px-sm font-body-md text-body-md text-on-surface-variant">{formatDate(pago.fechaPago)}</td>
                      <td className="py-sm px-sm font-body-md text-body-md text-on-surface">{pago.mascotaNombre}</td>
                      <td className="py-sm px-sm font-body-md text-body-md text-on-surface">{pago.propietarioNombre}</td>
                      <td className="py-sm px-sm font-body-md text-body-md text-on-surface">{pago.servicioNombre}</td>
                      <td className="py-sm px-sm">
                        <span className="inline-flex items-center px-sm py-xs rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant">
                          {pago.metodoPago}
                        </span>
                      </td>
                      <td className="py-sm px-sm font-body-md text-body-md text-on-surface-variant">{pago.referencia || '—'}</td>
                      <td className="py-sm px-sm font-body-md text-body-md text-on-surface text-right font-medium">{formatCurrency(pago.monto)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-lg text-center font-body-md text-body-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl text-outline mb-sm block">receipt_long</span>
                      No hay pagos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        {!loading && data && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Resumen Financiero</h3>
            <div className="space-y-sm">
              <div className="flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface-variant">Total Tarjeta</span>
                <span className="font-body-md text-body-md text-on-surface">{formatCurrency(data.totalTarjeta)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface-variant">Total Efectivo</span>
                <span className="font-body-md text-body-md text-on-surface">{formatCurrency(data.totalEfectivo)}</span>
              </div>
              <div className="border-t border-outline-variant pt-sm mt-sm flex justify-between items-center">
                <span className="font-headline-lg text-headline-lg text-on-surface">Total General</span>
                <span className="font-headline-xl text-headline-xl text-primary font-bold">{formatCurrency(data.totalGeneral)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GestionPagos;
