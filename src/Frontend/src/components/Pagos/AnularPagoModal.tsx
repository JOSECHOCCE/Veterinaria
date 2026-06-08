import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnularPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: {
    id: number;
    referencia?: string;
    monto: number;
    propietarioNombre?: string;
    mascotaNombre?: string;
    fechaPago: string;
  } | null;
  onConfirm: (motivo: string) => Promise<void>;
}

export default function AnularPagoModal({ isOpen, onClose, pago, onConfirm }: AnularPagoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !pago) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 5) {
      setError('Por favor, proporcione un motivo de al menos 5 caracteres.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onConfirm(motivo.trim());
      setMotivo('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al anular el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-surface-container-lowest rounded-xl border border-hairline shadow-xl overflow-hidden z-10"
        >
          {/* Header warning bar */}
          <div className="w-full h-1.5 bg-error" />

          <div className="p-lg">
            {/* Context title */}
            <div className="flex items-center gap-sm mb-lg">
              <button
                onClick={onClose}
                className="text-secondary hover:text-ink transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-soft"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex flex-col">
                <span className="font-caption text-caption text-secondary">Pagos y Cobros / Auditoría</span>
                <h3 className="font-title-lg text-title-lg text-ink font-bold leading-none mt-1">Anular Pago</h3>
              </div>
            </div>

            {/* Warning Message Box */}
            <div className="bg-error/5 border border-error/20 p-md rounded-xl flex gap-md items-start mb-lg">
              <span className="material-symbols-outlined text-error shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <div>
                <h4 className="font-title-sm text-title-sm text-error font-bold mb-xs">Atención: Acción Irreversible</h4>
                <p className="font-body-sm text-body-sm text-secondary leading-relaxed">
                  Estás a punto de anular permanentemente esta transacción. Los saldos pendientes de la cita asociada se incrementarán y no se podrá deshacer.
                </p>
              </div>
            </div>

            {/* Payment Info Card */}
            <div className="bg-canvas border border-hairline rounded-lg p-md mb-lg grid grid-cols-2 gap-y-md gap-x-sm font-body-sm text-body-sm">
              <div>
                <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Referencia</span>
                <span className="font-code text-code text-ink font-semibold">{pago.referencia || `#${pago.id}`}</span>
              </div>
              <div>
                <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Fecha Pago</span>
                <span className="text-ink font-medium">
                  {new Date(pago.fechaPago).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="col-span-2 border-t border-hairline pt-sm">
                <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Cliente / Paciente</span>
                <span className="text-ink font-semibold">
                  {pago.propietarioNombre || 'Dueño'} {pago.mascotaNombre ? `(${pago.mascotaNombre})` : ''}
                </span>
              </div>
              <div className="col-span-2 border-t border-hairline pt-sm">
                <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Monto a Revertir</span>
                <span className="font-title-md text-title-md text-error font-bold">
                  S/. {pago.monto.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Reason Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
              <div className="flex flex-col gap-xs">
                <label className="font-title-sm text-title-sm text-ink font-semibold" htmlFor="reason">
                  Motivo de la Anulación <span className="text-error font-bold">*</span>
                </label>
                <p className="font-caption text-caption text-secondary mb-1">
                  Detalla la razón operativa o administrativa de la anulación para los registros de auditoría.
                </p>
                <textarea
                  id="reason"
                  rows={3}
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    if (e.target.value.trim().length >= 5) setError(null);
                  }}
                  required
                  placeholder="Ej. Error en el monto ingresado, cliente solicitó reembolso..."
                  className={`w-full bg-canvas border rounded-lg p-sm font-body-sm text-ink focus:outline-none transition-colors resize-none placeholder:text-secondary-fixed-dim ${
                    error ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
                  }`}
                />
                {error && <span className="text-error text-caption font-caption mt-1">{error}</span>}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-md pt-md border-t border-hairline">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-md py-2.5 rounded-lg font-button text-button text-ink bg-transparent border border-outline-variant hover:bg-surface-soft transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-md py-2.5 rounded-lg font-button text-button text-on-error bg-error hover:bg-opacity-95 transition-colors flex items-center gap-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-hairline border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  )}
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
