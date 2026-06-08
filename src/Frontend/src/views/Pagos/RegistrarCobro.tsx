import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PagosService from '../../services/pagos.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

interface UsuarioInfo {
  id: number;
  nombre: string;
  telefono?: string | null;
  documento?: string | null;
}

interface MascotaInfo {
  id: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  usuario?: UsuarioInfo | null;
}

interface ServicioInfo {
  id: number;
  nombre: string;
  precio: number;
}

interface VeterinarioInfo {
  id: number;
  nombre: string;
}

interface PagoItem {
  id: number;
  monto: number;
  metodoPago: string;
  tipoPago: string;
  referencia?: string | null;
  fechaPago: string;
}

interface CitaDetail {
  id: number;
  fechaHora: string;
  estado: string;
  estadoPago: string;
  montoTotal: number;
  montoPagado: number;
  motivo?: string | null;
  mascota?: MascotaInfo | null;
  servicio?: ServicioInfo | null;
  veterinario?: VeterinarioInfo | null;
  pagos?: PagoItem[] | null;
}

export default function RegistrarCobro() {
  const { citaId } = useParams<{ citaId: string }>();
  const citaIdNum = Number(citaId);
  const navigate = useNavigate();

  // Loaders
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cita Data
  const [cita, setCita] = useState<CitaDetail | null>(null);

  // Form Fields State
  const [montoTotalAjustado, setMontoTotalAjustado] = useState<string>('');
  const [montoAbonado, setMontoAbonado] = useState<string>('');
  const [tipoPagoSelection, setTipoPagoSelection] = useState<'Completo' | 'Parcial'>('Completo');
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
  const [referenciaOpcional, setReferenciaOpcional] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');

  // Validation errors
  const [formErrors, setFormErrors] = useState<{
    montoTotalAjustado?: string;
    montoAbonado?: string;
    observacion?: string;
  }>({});

  // Success Confirmation State
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    pagoId: number;
    referencia?: string;
    montoPagado: number;
    saldoRestante: number;
  } | null>(null);

  // Load Cita Billing Details
  const loadCitaDetails = useCallback(async () => {
    if (isNaN(citaIdNum)) {
      setError('Identificador de cita no válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await PagosService.getDetailsByCita(citaIdNum);
      if (res && res.cita) {
        const c: CitaDetail = res.cita;
        setCita(c);

        // Prepopulate amounts
        const baseMonto = c.montoTotal > 0 ? c.montoTotal : c.servicio?.precio ?? 0;
        setMontoTotalAjustado(baseMonto.toString());

        // Default abonado to remaining balance
        const remaining = baseMonto - c.montoPagado;
        setMontoAbonado(remaining.toString());
      } else {
        setError('No se pudieron obtener los detalles de cobro de esta cita.');
      }
    } catch (err: any) {
      console.error('Error loading billing details:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor para obtener los datos de cobro.');
    } finally {
      setLoading(false);
    }
  }, [citaIdNum]);

  useEffect(() => {
    loadCitaDetails();
  }, [loadCitaDetails]);

  // Recalculate Abonado when adjusted total or payment type changes
  useEffect(() => {
    if (!cita) return;
    const adjusted = parseFloat(montoTotalAjustado) || 0;
    const remaining = Math.max(0, adjusted - cita.montoPagado);

    if (tipoPagoSelection === 'Completo') {
      setMontoAbonado(remaining.toFixed(2));
    }
  }, [montoTotalAjustado, tipoPagoSelection, cita]);

  // Form Validation
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    const adjusted = parseFloat(montoTotalAjustado) || 0;
    const abonar = parseFloat(montoAbonado) || 0;
    const pagado = cita?.montoPagado || 0;
    const originalPrecio = cita?.servicio?.precio ?? 0;

    if (adjusted <= 0) {
      errors.montoTotalAjustado = 'El monto total ajustado debe ser mayor a cero.';
    }

    if (abonar <= 0) {
      errors.montoAbonado = 'El monto a abonar debe ser mayor a cero.';
    } else if (abonar > (adjusted - pagado)) {
      errors.montoAbonado = `El monto a abonar no puede exceder el saldo restante disponible (S/. ${(adjusted - pagado).toFixed(2)}).`;
    }

    // Pricing deviation rule: if adjusted total !== suggested price, observation is required
    if (adjusted !== originalPrecio && !observacion.trim()) {
      errors.observacion = 'Debe detallar una observación obligatoria que justifique el cambio en el precio sugerido.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Process manual collection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija las validaciones del formulario.');
      return;
    }

    if (!cita) return;

    // Regla de Negocio: La cita debe estar Completada
    if (cita.estado !== 'Completada') {
      toast.error('No se puede registrar cobro si la atención clínica no está finalizada (estado Completada).');
      return;
    }

    setSaving(true);
    try {
      const dto = {
        citaId: citaIdNum,
        montoTotalAjustado: parseFloat(montoTotalAjustado),
        montoAbonado: parseFloat(montoAbonado),
        metodoPago,
        referenciaOpcional: referenciaOpcional.trim() || undefined,
        observacion: observacion.trim() || undefined,
      };

      const res = await PagosService.registrarCobro(dto);
      
      const newPaid = parseFloat(montoAbonado);
      const remaining = Math.max(0, parseFloat(montoTotalAjustado) - (cita.montoPagado + newPaid));

      toast.success(res.message || 'Pago registrado exitosamente.');
      
      // Update success state to render confirmation screen
      setSuccessInfo({
        message: res.message || 'Pago registrado con éxito.',
        pagoId: res.pagoId,
        referencia: referenciaOpcional.trim() || `PAG-${res.pagoId}`,
        montoPagado: newPaid,
        saldoRestante: remaining
      });
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      toast.error(err.response?.data?.message || 'Error al registrar el cobro en caja.');
    } finally {
      setSaving(false);
    }
  };

  // PDF Receipt Download Trigger
  const handleDescargarPDF = async () => {
    if (!successInfo) return;
    setDownloading(true);
    try {
      toast.loading('Generando comprobante de pago PDF...');
      const res = await PagosService.descargarComprobante(successInfo.pagoId);
      
      if (res && res.fileBase64) {
        // Decode Base64 and trigger download
        const byteCharacters = atob(res.fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: res.contentType || 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = res.fileName || `Comprobante_Pago_${successInfo.referencia || successInfo.pagoId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Comprobante descargado correctamente.');
      } else {
        toast.dismiss();
        toast.error('No se pudo generar el archivo PDF.');
      }
    } catch (err) {
      toast.dismiss();
      console.error('Error downloading invoice:', err);
      toast.error('Error al descargar el comprobante en PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" message="Cargando datos de facturación de la cita..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow p-lg">
        <ErrorMessage message={error} onRetry={loadCitaDetails} title="Error al abrir caja" />
      </div>
    );
  }

  // RENDER SUCCESS SCREEN
  if (successInfo) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center p-xl max-w-2xl mx-auto my-xl bg-canvas border border-hairline rounded-2xl shadow-lg select-none text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-lg shadow-sm">
          <span className="material-symbols-outlined text-[36px]">check_circle</span>
        </div>
        
        <h2 className="font-display-md text-display-md text-ink mb-xs">¡Cobro Registrado!</h2>
        <p className="font-body-md text-body-md text-secondary mb-xl">
          El abono se ha registrado correctamente en el balance de la cita.
        </p>

        {/* Transaction Summary Card */}
        <div className="bg-surface-soft border border-hairline rounded-xl p-lg w-full mb-xl text-left grid grid-cols-2 gap-y-md gap-x-sm font-body-sm text-body-sm">
          <div>
            <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Transacción ID</span>
            <span className="font-code text-code text-ink font-semibold">#{successInfo.pagoId}</span>
          </div>
          <div>
            <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Referencia Caja</span>
            <span className="font-code text-code text-ink font-semibold">{successInfo.referencia}</span>
          </div>
          <div className="col-span-2 border-t border-hairline pt-sm">
            <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Mascota / Dueño</span>
            <span className="text-ink font-semibold">
              {cita?.mascota?.nombre} • Responsable: {cita?.mascota?.usuario?.nombre}
            </span>
          </div>
          <div className="border-t border-hairline pt-sm">
            <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Monto Cobrado</span>
            <span className="font-title-sm text-title-sm text-emerald-800 font-bold">
              S/. {successInfo.montoPagado.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-hairline pt-sm">
            <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Saldo Pendiente Restante</span>
            <span className="font-title-sm text-title-sm text-error font-bold">
              S/. {successInfo.saldoRestante.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-md w-full justify-center">
          <button
            onClick={() => navigate('/admin/pagos')}
            className="px-6 py-3 border border-outline-variant bg-transparent text-ink hover:bg-surface-soft font-button text-button rounded-lg transition-colors cursor-pointer"
          >
            Volver a Pagos
          </button>
          
          <button
            onClick={handleDescargarPDF}
            disabled={downloading}
            className="px-6 py-3 bg-primary hover:bg-primary-active text-on-primary font-button text-button rounded-lg transition-colors flex items-center gap-xs cursor-pointer shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Descargar Comprobante PDF
          </button>
        </div>
      </div>
    );
  }

  const remainingBalance = cita 
    ? (parseFloat(montoTotalAjustado) || 0) - cita.montoPagado 
    : 0;

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none">
      {/* Header */}
      <header className="flex justify-between items-center pb-md border-b border-hairline mb-xl">
        <button
          onClick={() => navigate('/admin/pagos')}
          className="flex items-center gap-xs text-secondary hover:text-ink transition-colors font-button text-button group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Volver a Caja
        </button>
        <div className="font-title-sm text-title-sm text-ink font-semibold">Registro de Cobro Manual</div>
      </header>

      <div className="mb-lg">
        <h1 className="font-display-md text-display-md text-ink">Registrar Cobro</h1>
        <p className="font-body-md text-body-md text-secondary max-w-2xl mt-1">
          Ingrese los detalles del cobro presencial recibido. Verifique las deudas previas y emita el comprobante correspondiente.
        </p>
      </div>

      {cita && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
          
          {/* Left Column: Cita Details Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-lg">
            <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-md">
              <h2 className="font-title-md text-title-md text-ink font-bold border-b border-hairline pb-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">receipt</span>
                Resumen de Cita
              </h2>

              <div className="flex flex-col gap-md font-body-sm text-body-sm">
                <div>
                  <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Cliente Responsable</span>
                  <span className="text-ink font-semibold block text-body-md mt-xxs">
                    {cita.mascota?.usuario?.nombre || 'Sin registrar'}
                  </span>
                  {cita.mascota?.usuario?.documento && (
                    <span className="text-body-muted text-caption block font-caption mt-xxs">
                      Doc. Identidad: {cita.mascota.usuario.documento}
                    </span>
                  )}
                </div>

                <div className="border-t border-hairline pt-sm">
                  <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Paciente / Mascota</span>
                  <span className="text-ink font-medium block mt-xxs flex items-center gap-xxs">
                    <span className="material-symbols-outlined text-secondary text-[16px]">pets</span>
                    {cita.mascota?.nombre} ({cita.mascota?.especie})
                    {cita.mascota?.raza ? ` • ${cita.mascota.raza}` : ''}
                  </span>
                </div>

                <div className="border-t border-hairline pt-sm">
                  <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Servicio Prestado</span>
                  <span className="text-ink font-medium block mt-xxs">
                    {cita.servicio?.nombre || 'Consulta General'}
                  </span>
                  <span className="text-body-muted text-caption block font-caption mt-xxs">
                    Precio Sugerido Catálogo: S/. {(cita.servicio?.precio ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-hairline pt-sm">
                  <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Atendido Por</span>
                  <span className="text-ink font-medium block mt-xxs">
                    Dr(a). {cita.veterinario?.nombre || 'No asignado'}
                  </span>
                </div>

                <div className="border-t border-hairline pt-sm">
                  <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Fecha / Hora de Cita</span>
                  <span className="text-ink font-medium block mt-xxs">
                    {new Date(cita.fechaHora).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="border-t border-hairline pt-sm bg-surface-soft/30 p-sm rounded-lg border border-hairline">
                  <div className="flex justify-between items-center py-xxs">
                    <span className="text-secondary font-caption text-caption uppercase tracking-wider">Total Acumulado Cita</span>
                    <span className="text-ink font-semibold">S/. {cita.montoTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-xxs">
                    <span className="text-secondary font-caption text-caption uppercase tracking-wider">Pagos Previos Asentados</span>
                    <span className="text-emerald-800 font-semibold">S/. {cita.montoPagado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-xxs border-t border-hairline mt-xxs pt-xxs">
                    <span className="text-error font-bold font-caption text-caption uppercase tracking-wider">Saldo Pendiente</span>
                    <span className="text-error font-bold text-body-md">S/. {(cita.montoTotal - cita.montoPagado).toFixed(2)}</span>
                  </div>
                </div>

                {cita.estado !== 'Completada' && (
                  <div className="bg-error/5 border border-error/15 text-error rounded-lg p-sm mt-xs flex gap-xs items-start">
                    <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                    <span className="font-caption text-caption">
                      Atención: La cita está en estado <strong>{cita.estado}</strong>. Debería estar <strong>Completada</strong> para facturar.
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Billing Form (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-lg bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs">
            <h2 className="font-title-md text-title-md text-ink font-bold border-b border-hairline pb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">point_of_sale</span>
              Detalle de Recaudación
            </h2>

            <div className="flex flex-col gap-lg">
              
              {/* Form Input: Monto Total Ajustado */}
              <div className="flex flex-col gap-xs">
                <label className="font-title-sm text-title-sm text-ink font-semibold">
                  Monto Total Ajustado (S/.) <span className="text-error font-bold">*</span>
                </label>
                <p className="font-caption text-caption text-secondary">
                  Modifique este campo si desea aplicar algún recargo, descuento o ajustar el valor del servicio en caja.
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={montoTotalAjustado}
                  onChange={(e) => {
                    setMontoTotalAjustado(e.target.value);
                    if (parseFloat(e.target.value) > 0) {
                      setFormErrors((prev) => ({ ...prev, montoTotalAjustado: undefined }));
                    }
                  }}
                  className={`bg-canvas border rounded-lg px-md py-sm font-body-sm text-ink focus:outline-none focus:ring-1 transition-colors ${
                    formErrors.montoTotalAjustado 
                      ? 'border-error focus:border-error focus:ring-error' 
                      : 'border-hairline focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="Ej. 80.00"
                />
                {formErrors.montoTotalAjustado && (
                  <span className="text-error text-caption font-caption">{formErrors.montoTotalAjustado}</span>
                )}
              </div>

              {/* Form Select: Tipo de Cobro */}
              <div className="flex flex-col gap-xs">
                <label className="font-title-sm text-title-sm text-ink font-semibold">Tipo de Cobro</label>
                <div className="grid grid-cols-2 gap-sm mt-xxs">
                  <button
                    type="button"
                    onClick={() => setTipoPagoSelection('Completo')}
                    className={`px-md py-3 rounded-lg border font-button text-button transition-all cursor-pointer text-center ${
                      tipoPagoSelection === 'Completo'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-canvas text-secondary border-hairline hover:bg-surface-soft'
                    }`}
                  >
                    Pago Completo (S/. {remainingBalance.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoPagoSelection('Parcial')}
                    className={`px-md py-3 rounded-lg border font-button text-button transition-all cursor-pointer text-center ${
                      tipoPagoSelection === 'Parcial'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-canvas text-secondary border-hairline hover:bg-surface-soft'
                    }`}
                  >
                    Pago Parcial
                  </button>
                </div>
              </div>

              {/* Form Input: Monto Abonado */}
              <div className="flex flex-col gap-xs">
                <label className="font-title-sm text-title-sm text-ink font-semibold">
                  Monto a Abonar en Caja (S/.) <span className="text-error font-bold">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoAbonado}
                  onChange={(e) => {
                    setMontoAbonado(e.target.value);
                    if (parseFloat(e.target.value) > 0) {
                      setFormErrors((prev) => ({ ...prev, montoAbonado: undefined }));
                    }
                  }}
                  disabled={tipoPagoSelection === 'Completo'}
                  className={`bg-canvas border rounded-lg px-md py-sm font-body-sm text-ink focus:outline-none focus:ring-1 transition-colors disabled:bg-surface-soft disabled:text-secondary ${
                    formErrors.montoAbonado 
                      ? 'border-error focus:border-error focus:ring-error' 
                      : 'border-hairline focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="Ej. 40.00"
                />
                {formErrors.montoAbonado && (
                  <span className="text-error text-caption font-caption">{formErrors.montoAbonado}</span>
                )}
              </div>

              {/* Form Select: Método de Pago */}
              <div className="flex flex-col gap-xs">
                <label className="font-title-sm text-title-sm text-ink font-semibold">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta (POS Externo)</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                </select>
                <span className="text-[11px] text-body-muted font-caption italic mt-xxs block">
                  * Seguridad PCI: Queda prohibida la recolección de números completos de tarjeta o CVV en esta terminal de caja.
                </span>
              </div>

              {/* Form Input: Referencia */}
              <div className="flex flex-col gap-xs">
                <label className="font-title-sm text-title-sm text-ink font-semibold">Número de Operación / Referencia (Opcional)</label>
                <input
                  type="text"
                  value={referenciaOpcional}
                  onChange={(e) => setReferenciaOpcional(e.target.value)}
                  placeholder="Ej. TX-98234 o últimos 4 dígitos"
                  className="bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-ink focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Form Input: Observaciones */}
              <div className="flex flex-col gap-xs">
                <label className="font-title-sm text-title-sm text-ink font-semibold">
                  Observaciones Internas {parseFloat(montoTotalAjustado) !== (cita.servicio?.precio ?? 0) && <span className="text-error font-bold">*</span>}
                </label>
                <textarea
                  value={observacion}
                  onChange={(e) => {
                    setObservacion(e.target.value);
                    if (e.target.value.trim()) {
                      setFormErrors((prev) => ({ ...prev, observacion: undefined }));
                    }
                  }}
                  placeholder={
                    parseFloat(montoTotalAjustado) !== (cita.servicio?.precio ?? 0)
                      ? "Detalle obligatoriamente por qué el precio difiere del sugerido en catálogo..."
                      : "Información adicional sobre el descuento, recargo o nota interna..."
                  }
                  rows={3}
                  className={`bg-canvas border rounded-lg px-md py-sm font-body-sm text-ink focus:outline-none focus:ring-1 transition-colors resize-none ${
                    formErrors.observacion 
                      ? 'border-error focus:border-error focus:ring-error' 
                      : 'border-hairline focus:border-primary focus:ring-primary'
                  }`}
                />
                {formErrors.observacion && (
                  <span className="text-error text-caption font-caption">{formErrors.observacion}</span>
                )}
              </div>

            </div>

            {/* Form Footer Actions */}
            <div className="border-t border-hairline pt-md flex justify-end gap-md mt-lg">
              <button
                type="button"
                onClick={() => navigate('/admin/pagos')}
                disabled={saving}
                className="px-md py-2.5 rounded-lg font-button text-button text-ink bg-transparent border border-outline-variant hover:bg-surface-soft transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={saving || cita.estado !== 'Completada'}
                className="px-lg py-2.5 bg-primary hover:bg-primary-active text-on-primary font-button text-button rounded-lg transition-colors flex items-center gap-xs cursor-pointer shadow-sm disabled:opacity-50 font-bold"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-primary-dim border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                )}
                Confirmar y Cobrar
              </button>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
