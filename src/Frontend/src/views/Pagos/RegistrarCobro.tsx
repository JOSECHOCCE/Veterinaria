import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import PagosService from '../../services/pagos.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';

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
  fotoUrl?: string | null;
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
  const [searchParams] = useSearchParams();
  const isAutofill = searchParams.get('autofill') === 'true';

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
        const remaining = Math.max(0, baseMonto - c.montoPagado);
        setMontoAbonado(remaining.toString());

        if (isAutofill) {
          setTipoPagoSelection('Completo');
          setMetodoPago('Efectivo');
          setReferenciaOpcional(`Atención finalizada #${c.id}`);
          if (baseMonto !== (c.servicio?.precio ?? 0)) {
            setObservacion('Monto calculado automáticamente tras finalizar atención clínica/procedimiento.');
          } else {
            setObservacion('Atención clínica completada. Cobro estándar de servicio.');
          }
        }
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

  const getPetImageFallback = (esp: string) => {
    const species = esp.toLowerCase();
    if (species.includes('perro') || species.includes('canin') || species.includes('dog')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM8pZR065mBN_zRsT0K-9h3W-ByY0dCkx1tJr6a_KXTKD63fcCW5FzMmFTzmcaQigIIqG5xFDGqXOQq0JWvRnTCq13J_DBfqi4QunaYKGRE_MqRX0DivSZ-mN9D_htDVybloxprk1_R1fFGlPD17YrWlt0_hwENNtVIaygWOCZ94AMIJnF7ZlEGmciyOTyS5OrBnA9vRzUw-nHhbN3CafZ-NxbGJNMglUBngYtJ7mo1oskzaYx3B6aoBIErCd0BxF692CDhzyjxZ8';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuADiZUuDOMsyo4M1wr15dg3fsL80rExV4tuKhka1NyJjHWVWLimgnT9wQsjQr8_z23jhtb7SlqFPuCp44eCRnKKZQ06tqmkTYPWibResnGBfH25z7mbfCkavRFdwIZBit8JTNFZcCBpO5k-6zKZHsK3WQP1gLKHSuIWd0CnTSc3wHEu4qXuEj0S3VP0RG_a0KFGMwEZw77fbutpjCXcTFhJs8POZ_CGRMzwVeiFkdXY9Top7gLGWkK9vmUQRl9Kbxy8J9jI4X9UToA';
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

  const originalPrecio = cita?.servicio?.precio ?? 0;

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none p-gutter">
      {/* Header */}
      <PageHeader
        title="Registrar Cobro"
        description="Complete los detalles del pago de la consulta y emita el comprobante correspondiente."
        backLink={{ to: '/admin/pagos', label: 'Volver a Caja' }}
        hasDivider={true}
      />

      {cita && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {isAutofill && (
            <div className="col-span-1 lg:col-span-12 p-md bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md shadow-xs animate-in fade-in slide-in-from-top-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                </div>
                <div>
                  <h4 className="font-title-sm font-bold text-emerald-800 dark:text-emerald-300">
                    ⚡ Llenado Automático Habilitado (Consulta Médica Finalizada)
                  </h4>
                  <p className="font-body-sm text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Se pre-cargaron el saldo pendiente (S/. {montoAbonado || '0.00'}), método de pago y la observación justificativa obligatoria. Revise y haga clic en <strong>Registrar e Imprimir Comprobante</strong>.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold tracking-wide uppercase shrink-0">
                Auto-completado
              </span>
            </div>
          )}
          
          {/* Left Column: Cita Details Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Appointment Summary */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 rounded-xl p-6 shadow-xs relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <h3 className="font-headline-md text-headline-md text-ink font-bold flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Resumen
              </h3>

              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0 border border-hairline">
                  <img
                    alt={cita.mascota?.nombre}
                    className="w-full h-full object-cover"
                    src={cita.mascota?.fotoUrl || getPetImageFallback(cita.mascota?.especie || '')}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getPetImageFallback(cita.mascota?.especie || '');
                    }}
                  />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Paciente</p>
                  <p className="font-body-lg text-body-lg font-semibold text-ink leading-tight">{cita.mascota?.nombre}</p>
                  <p className="font-label-md text-label-md text-secondary mt-0.5">
                    {cita.mascota?.especie} {cita.mascota?.raza ? `• ${cita.mascota.raza}` : ''}
                  </p>
                </div>
              </div>

              <hr className="border-t border-surface-variant my-1" />

              {/* Owner Info */}
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Propietario</p>
                <div className="flex items-center gap-2 font-body-md text-ink font-medium">
                  <span className="material-symbols-outlined text-secondary text-sm">person</span>
                  {cita.mascota?.usuario?.nombre || 'Sin registrar'}
                </div>
              </div>

              {/* Service Info */}
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Servicio</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="px-3 py-1 bg-[#e6fffa] text-primary rounded-full text-label-sm font-label-sm font-semibold border border-primary-container/30">
                    {cita.servicio?.nombre || 'Consulta General'}
                  </span>
                </div>
              </div>

              {/* Vet Info */}
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Atendido por</p>
                <div className="flex items-center gap-2 font-body-md text-ink">
                  <span className="material-symbols-outlined text-secondary text-sm">stethoscope</span>
                  Dr(a). {cita.veterinario?.nombre || 'No asignado'}
                </div>
              </div>
            </div>

            {/* Financial Totals Card */}
            <div className="bg-primary text-on-primary rounded-xl p-6 shadow-md relative overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-2 font-body-md">
                  <p className="opacity-95">Precio Base Sugerido</p>
                  <p className="font-semibold">S/. {originalPrecio.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center mb-6 font-body-md">
                  <p className="opacity-95">Abonado Previamente</p>
                  <p className="font-semibold">S/. {cita.montoPagado.toFixed(2)}</p>
                </div>
                <hr className="border-t border-on-primary/20 mb-4"/>
                <div className="flex justify-between items-end">
                  <p className="font-body-lg font-medium">Saldo Pendiente</p>
                  <p className="text-[32px] leading-none font-bold">S/. {(cita.montoTotal - cita.montoPagado).toFixed(2)}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Billing Form (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-surface-variant/50 rounded-xl p-8 shadow-xs">
            <h3 className="font-headline-md text-headline-md text-ink font-bold mb-6">Detalles del Pago</h3>
            
            <div className="flex flex-col gap-6">
              
              {/* Row: Amount and Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monto Total Ajustado */}
                <div className="flex flex-col gap-2">
                  <label className="text-label-md font-label-md text-on-surface" htmlFor="amount">
                    Monto final a cobrar <span className="text-error font-bold">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[20px]">attach_money</span>
                    <input
                      type="number"
                      step="0.01"
                      id="amount"
                      value={montoTotalAjustado}
                      onChange={(e) => {
                        setMontoTotalAjustado(e.target.value);
                        if (parseFloat(e.target.value) > 0) {
                          setFormErrors((prev) => ({ ...prev, montoTotalAjustado: undefined }));
                        }
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border bg-surface focus:outline-none focus:ring-1 transition-colors text-body-lg font-body-lg text-on-background placeholder:text-outline-variant ${
                        formErrors.montoTotalAjustado ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'
                      }`}
                    />
                  </div>
                  {formErrors.montoTotalAjustado && (
                    <span className="text-error text-caption font-caption mt-1">{formErrors.montoTotalAjustado}</span>
                  )}
                </div>

                {/* Método de Pago */}
                <div className="flex flex-col gap-2">
                  <label className="text-label-md font-label-md text-on-surface" htmlFor="payment-method">
                    Método de pago <span className="text-error font-bold">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="payment-method"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-body-md font-body-md text-on-background appearance-none cursor-pointer"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta (POS Externo)</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined pointer-events-none text-[20px]">expand_more</span>
                  </div>
                  <p className="text-label-sm font-label-sm text-outline mt-1 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    PCI Compliant: No ingrese dígitos de tarjeta.
                  </p>
                </div>
              </div>

              {/* Row: Tipo de Pago Parcial o Completo */}
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface">Tipo de Recaudación</label>
                <div className="grid grid-cols-2 gap-sm mt-1">
                  <button
                    type="button"
                    onClick={() => setTipoPagoSelection('Completo')}
                    className={`px-md py-3 rounded-lg border font-button text-button transition-all cursor-pointer text-center ${
                      tipoPagoSelection === 'Completo'
                        ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
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
                        ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                        : 'bg-canvas text-secondary border-hairline hover:bg-surface-soft'
                    }`}
                  >
                    Pago Parcial
                  </button>
                </div>
              </div>

              {/* Monto a Abonar (Visible/Habilitado para Pago Parcial) */}
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface" htmlFor="amount-to-pay">
                  Monto a Abonar en Caja <span className="text-error font-bold">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="amount-to-pay"
                  value={montoAbonado}
                  onChange={(e) => {
                    setMontoAbonado(e.target.value);
                    if (parseFloat(e.target.value) > 0) {
                      setFormErrors((prev) => ({ ...prev, montoAbonado: undefined }));
                    }
                  }}
                  disabled={tipoPagoSelection === 'Completo'}
                  className={`w-full p-4 py-3 rounded-lg border bg-surface focus:outline-none focus:ring-1 transition-colors text-body-md font-body-md text-on-background placeholder:text-outline-variant disabled:bg-surface-soft disabled:text-secondary ${
                    formErrors.montoAbonado ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'
                  }`}
                />
                {formErrors.montoAbonado && (
                  <span className="text-error text-caption font-caption mt-1">{formErrors.montoAbonado}</span>
                )}
              </div>

              {/* Operation Number */}
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface" htmlFor="operation-number">
                  Número de operación / Referencia <span className="text-outline font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[20px]">tag</span>
                  <input
                    type="text"
                    id="operation-number"
                    value={referenciaOpcional}
                    onChange={(e) => setReferenciaOpcional(e.target.value)}
                    placeholder="Ej: 987654321"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-body-md font-body-md text-on-background placeholder:text-outline-variant"
                  />
                </div>
                <p className="text-label-sm font-label-sm text-outline mt-1 font-medium">Requerido para transferencias y billeteras digitales.</p>
              </div>

              {/* Observation Textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface flex justify-between" htmlFor="observation">
                  <span>Observación</span>
                  {parseFloat(montoTotalAjustado) !== originalPrecio && (
                    <span className="text-error font-bold text-label-sm">Requerido por cambio de precio sugerido</span>
                  )}
                </label>
                <textarea
                  id="observation"
                  rows={3}
                  value={observacion}
                  onChange={(e) => {
                    setObservacion(e.target.value);
                    if (e.target.value.trim()) {
                      setFormErrors((prev) => ({ ...prev, observacion: undefined }));
                    }
                  }}
                  placeholder={
                    parseFloat(montoTotalAjustado) !== originalPrecio
                      ? "Detalle obligatoriamente por qué el precio difiere del sugerido en catálogo..."
                      : "Agregue notas sobre el cobro (ej: descuento por cliente frecuente...)"
                  }
                  className={`w-full p-4 rounded-lg border bg-surface focus:outline-none focus:ring-1 transition-colors text-body-md font-body-md text-on-background resize-none placeholder:text-outline-variant ${
                    formErrors.observacion ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'
                  }`}
                />
                {formErrors.observacion && (
                  <span className="text-error text-caption font-caption mt-1">{formErrors.observacion}</span>
                )}
              </div>

              {/* Divider */}
              <hr className="border-t border-surface-variant my-4"/>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/pagos')}
                  className="px-6 py-3 rounded-lg border border-outline text-secondary hover:bg-surface-container-low hover:text-on-surface font-label-md text-label-md transition-colors duration-200 order-2 sm:order-1 h-12 cursor-pointer font-bold"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={saving || cita.estado !== 'Completada'}
                  className="px-8 py-3 rounded-lg bg-primary text-on-primary hover:bg-primary-active font-label-md text-label-md transition-all duration-200 order-0 sm:order-3 h-12 flex items-center justify-center gap-2 cursor-pointer font-bold shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-primary-dim border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  )}
                  Registrar Pago Recibido
                </button>
              </div>

            </div>
          </div>

        </form>
      )}

    </div>
  );
}
