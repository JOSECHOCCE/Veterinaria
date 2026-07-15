import { useState, useEffect, useCallback } from "react";
import PortalClienteService, {
  type PortalPagoPendienteDto,
  type PortalPagoRealizadoDto,
} from "../../services/portalCliente.service";
import PagosService from "../../services/pagos.service";
import PageHeader from "../../components/common/PageHeader";

interface PagoFormState {
  numeroTarjeta: string;
  nombreTitular: string;
  fechaVencimiento: string;
  cvv: string;
  guardarTarjeta: boolean;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const INITIAL_FORM_STATE: PagoFormState = {
  numeroTarjeta: "",
  nombreTitular: "",
  fechaVencimiento: "",
  cvv: "",
  guardarTarjeta: false,
};

const getErrorMessage = (err: unknown, fallback: string) => {
  const apiError = err as ApiErrorResponse;
  return apiError.response?.data?.message || fallback;
};

export default function MisPagos() {
  const [pagos, setPagos] = useState<PortalPagoRealizadoDto[]>([]);
  const [pagosPendientes, setPagosPendientes] = useState<
    PortalPagoPendienteDto[]
  >([]);
  const [selectedPago, setSelectedPago] =
    useState<PortalPagoPendienteDto | null>(null);
  const [form, setForm] = useState<PagoFormState>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPagos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PortalClienteService.getMisPagos();
      if (res.success && res.data) {
        setPagos(res.data.pagosRealizados || []);
        setPagosPendientes(res.data.pagosPendientes || []);
      } else {
        setError(res.message || "Error al obtener la lista de pagos.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error de conexión con el servidor."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const downloadBase64File = (
    fileBase64: string,
    fileName: string,
    contentType: string,
  ) => {
    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async (pagoId: number) => {
    try {
      setError(null);
      const file = await PagosService.descargarComprobante(pagoId);
      downloadBase64File(file.fileBase64, file.fileName, file.contentType);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo descargar el comprobante."));
    }
  };

  const openPaymentModal = (pago: PortalPagoPendienteDto) => {
    setSelectedPago(pago);
    setForm(INITIAL_FORM_STATE);
    setPaymentError(null);
    setSuccessMessage(null);
  };

  const closePaymentModal = () => {
    if (processingPayment) return;
    setSelectedPago(null);
    setForm(INITIAL_FORM_STATE);
    setPaymentError(null);
  };

  const handleFormChange = (
    field: keyof PagoFormState,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validatePaymentForm = () => {
    if (!/^\d{16}$/.test(form.numeroTarjeta)) {
      return "Ingresa un número de tarjeta válido de 16 dígitos.";
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/.test(form.nombreTitular.trim())) {
      return "Ingresa el nombre del titular tal como figura en la tarjeta.";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.fechaVencimiento)) {
      return "Ingresa la fecha de vencimiento en formato MM/AA.";
    }

    if (!/^\d{3}$/.test(form.cvv)) {
      return "Ingresa un CVV válido de 3 dígitos.";
    }

    return null;
  };

  const handlePaySelected = async () => {
    if (!selectedPago) return;

    const validationError = validatePaymentForm();
    if (validationError) {
      setPaymentError(validationError);
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentError(null);

      const result =
        selectedPago.estadoPago === "Parcial"
          ? await PagosService.procesarPagoRestante({
              citaId: selectedPago.citaId,
              montoRestante: selectedPago.saldoPendiente,
              metodoPago: "Tarjeta",
              numeroTarjeta: form.numeroTarjeta,
              nombreTarjeta: form.nombreTitular,
              fechaVencimiento: form.fechaVencimiento,
              cvv: form.cvv,
              guardarTarjeta: form.guardarTarjeta,
            })
          : await PagosService.procesarPagoTarjeta({
              citaId: selectedPago.citaId,
              numeroTarjeta: form.numeroTarjeta,
              nombreTitular: form.nombreTitular,
              fechaVencimiento: form.fechaVencimiento,
              cvv: form.cvv,
              tipoPago: "Completo",
              montoTotal: selectedPago.montoTotal,
              montoPagar: selectedPago.saldoPendiente,
              guardarTarjeta: form.guardarTarjeta,
            });

      setSuccessMessage(result.message || "Pago registrado correctamente.");
      setSelectedPago(null);
      setForm(INITIAL_FORM_STATE);
      await fetchPagos();
    } catch (err: unknown) {
      setPaymentError(getErrorMessage(err, "No se pudo procesar el pago."));
    } finally {
      setProcessingPayment(false);
    }
  };

  const totalPagado = pagos.reduce(
    (sum, pago) => sum + (pago.montoCobrado || 0),
    0,
  );
  const totalPendiente = pagosPendientes.reduce(
    (sum, pago) => sum + (pago.saldoPendiente || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-20 bg-surface-card rounded-lg w-full"></div>
        <div className="h-32 bg-surface-card rounded-xl w-full"></div>
        <div className="h-44 bg-surface-card rounded-xl w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6">
        <span className="material-symbols-outlined text-[48px] text-error">
          error
        </span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">
            Error de facturación
          </h3>
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

  const getConceptIcon = (concepto: string) => {
    const text = concepto.toLowerCase();
    if (text.includes("vacuna") || text.includes("inmun")) {
      return { icon: "vaccines", bg: "bg-primary-container/20", color: "text-primary" };
    }
    if (text.includes("medicamento") || text.includes("farmacia") || text.includes("antiparasit")) {
      return { icon: "medication", bg: "bg-secondary-container/50", color: "text-secondary" };
    }
    if (text.includes("cirug") || text.includes("operac") || text.includes("dental") || text.includes("limpieza")) {
      return { icon: "medical_services", bg: "bg-tertiary-container/20", color: "text-tertiary" };
    }
    return { icon: "local_hospital", bg: "bg-primary-container/20", color: "text-primary" };
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto w-full relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[45%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-teal/5 blur-[120px]" />
      </div>

      {/* Header Area */}
      <header className="mb-8 pb-4 border-b border-surface-variant/40">
        <h2 className="text-3xl font-bold text-on-surface">Mis Pagos</h2>
        <p className="text-xs font-medium text-on-surface-variant mt-1">Consulta tus saldos pendientes, pagos realizados y comprobantes de tus atenciones.</p>
      </header>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center gap-3 mb-6 shadow-sm">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <p className="text-xs font-bold">{successMessage}</p>
        </div>
      )}

      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Total Spent Card */}
        <div className="bg-white rounded-3xl p-6 border border-primary/10 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1">Gasto Total (Año)</p>
              <h3 className="text-2xl md:text-3xl font-bold text-on-surface">S/. {totalPagado.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary border border-primary/10">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-primary mt-4 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_down</span>
            12% menos que el año pasado
          </p>
        </div>

        {/* Next Payment / Balance */}
        <div className="bg-white rounded-3xl p-6 border border-primary/10 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1">Saldo Pendiente</p>
              <h3 className={`text-2xl md:text-3xl font-bold ${totalPendiente > 0 ? 'text-error' : 'text-on-surface'}`}>
                S/. {totalPendiente.toFixed(2)}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${totalPendiente > 0 ? 'bg-error-container/20 text-error border-error/10' : 'bg-green-50 text-green-700 border-green-100'}`}>
              <span className="material-symbols-outlined text-[24px]">
                {totalPendiente > 0 ? 'warning' : 'check_circle'}
              </span>
            </div>
          </div>
          <p className="text-xs font-semibold text-on-surface-variant mt-4">
            {totalPendiente > 0 ? 'Tienes atenciones pendientes de pago.' : 'Todas las cuentas están al día.'}
          </p>
        </div>

        {/* Payment Method Default */}
        <div className="bg-white rounded-3xl p-6 border border-primary/10 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-surface-container-low rounded-full opacity-50" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1">Método Principal</p>
              <h3 className="text-sm font-bold text-on-surface mt-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">credit_card</span>
                •••• 4242
              </h3>
            </div>
          </div>
          <button className="text-primary font-bold text-xs text-left mt-4 hover:underline self-start relative z-10 cursor-pointer">
            Gestionar métodos de pago
          </button>
        </div>
      </section>

      {/* Pagos Pendientes Section */}
      <section className="bg-white border border-primary/10 rounded-3xl overflow-hidden shadow-sm mb-8">
        <div className="px-6 py-5 border-b border-surface-variant/40 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-on-surface">Pagos Pendientes</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Atenciones completadas que aún tienen saldo por cancelar.</p>
          </div>
          <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-bold">
            {pagosPendientes.length} pendiente{pagosPendientes.length === 1 ? "" : "s"}
          </span>
        </div>

        {pagosPendientes.length === 0 ? (
          <div className="border border-dashed border-outline-variant/60 rounded-2xl flex flex-col items-center justify-center m-6 p-10 bg-surface-container-low/20 text-center">
            <span className="material-symbols-outlined text-[36px] text-green-600 mb-2">verified</span>
            <h4 className="font-bold text-sm text-on-surface">No tienes saldos pendientes</h4>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
              Cuando una atención quede por pagar, aparecerá aquí con el monto y la opción de pago.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-surface-variant/40 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="p-4 pl-6">Servicio / Mascota</th>
                  <th className="p-4">Fecha de Cita</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Pagado</th>
                  <th className="p-4 text-right">Saldo</th>
                  <th className="p-4 pr-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/20 text-xs font-semibold text-on-surface">
                {pagosPendientes.map((pago) => (
                  <tr key={pago.citaId} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-on-surface">{pago.servicioNombre}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">
                        {pago.mascotaNombre} {pago.veterinarioNombre ? `· ${pago.veterinarioNombre}` : ""}
                      </p>
                    </td>
                    <td className="p-4 text-on-surface-variant">{formatDate(pago.fechaHora)} · {formatTime(pago.fechaHora)}</td>
                    <td className="p-4 text-right">S/. {pago.montoTotal.toFixed(2)}</td>
                    <td className="p-4 text-right text-on-surface-variant">S/. {pago.montoPagado.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-error">S/. {pago.saldoPendiente.toFixed(2)}</td>
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => openPaymentModal(pago)}
                        className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-active transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        Pagar saldo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Historial de Transacciones Section */}
      <section className="bg-white border border-primary/10 rounded-3xl overflow-hidden shadow-sm flex-grow flex flex-col">
        <div className="px-6 py-5 border-b border-surface-variant/40 flex justify-between items-center bg-white">
          <div>
            <h3 className="font-bold text-base text-on-surface">Historial de Transacciones</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Pagos ya registrados con opción de descargar el comprobante PDF.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-background transition-colors text-xs font-bold border border-outline-variant/60 rounded-xl px-3 py-2 cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              <span>Filtrar</span>
            </button>
          </div>
        </div>

        {pagos.length === 0 ? (
          <div className="border border-dashed border-outline-variant/60 rounded-2xl flex flex-col items-center justify-center m-6 p-12 bg-surface-container-low/20 text-center">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-2">receipt_long</span>
            <h4 className="font-bold text-sm text-on-surface">Sin transacciones registradas</h4>
            <p className="text-xs text-on-surface-variant mt-1">No tienes recibos ni pagos registrados en tu cuenta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-surface-variant/40 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="p-4 pl-6">Concepto / Cita</th>
                  <th className="p-4">Fecha de Pago</th>
                  <th className="p-4 text-center">Método</th>
                  <th className="p-4 text-center">Operación</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 pr-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/20 text-xs font-semibold text-on-surface">
                {pagos.map((pago) => {
                  const media = getConceptIcon(pago.servicioNombre);

                  return (
                    <tr key={pago.id} className="hover:bg-surface-container-low/20 transition-colors group">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${media.bg} flex items-center justify-center ${media.color} shrink-0 border border-primary/5`}>
                          <span className="material-symbols-outlined text-[18px]">{media.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{pago.servicioNombre}</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">
                            Cita: {formatDate(pago.citaFecha)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant">{formatDate(pago.fechaPago)}</td>
                      <td className="p-4 text-center">{pago.metodoPago || "Tarjeta"}</td>
                      <td className="p-4 text-center font-code text-[11px] text-on-surface-variant">{pago.numeroOperacion || "—"}</td>
                      <td className="p-4 text-right font-bold text-on-surface">S/. {pago.montoCobrado.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-wider">
                          {pago.estado || "Pagado"}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <button
                          onClick={() => handleDownloadPdf(pago.id)}
                          className="text-primary hover:text-primary-active font-bold text-xs flex items-center gap-1 mx-auto hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Recibo PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Pago Glassmorphism */}
      {selectedPago && (
        <div className="fixed inset-0 z-50 bg-[#141413]/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-lg border border-white/60 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10">
            <div className="p-6 border-b border-outline-variant/40 flex justify-between items-center bg-white/40">
              <div>
                <h3 className="text-lg font-bold text-on-background">
                  Pagar saldo pendiente
                </h3>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
                  {selectedPago.servicioNombre} · S/. {selectedPago.saldoPendiente.toFixed(2)}
                </p>
              </div>
              <button
                onClick={closePaymentModal}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-soft hover:text-on-background transition-colors cursor-pointer"
                aria-label="Cerrar modal de pago"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {paymentError && (
                <div className="bg-error-container/85 text-on-error-container border border-error/15 rounded-xl px-4 py-3 text-xs font-bold">
                  {paymentError}
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface">
                  Número de tarjeta
                </span>
                <input
                  value={form.numeroTarjeta}
                  onChange={(event) =>
                    handleFormChange(
                      "numeroTarjeta",
                      event.target.value.replace(/\D/g, "").slice(0, 16),
                    )
                  }
                  className="bg-white border border-outline-variant rounded-xl px-4 py-3 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  placeholder="1234567812345678"
                  inputMode="numeric"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface">
                  Nombre del titular
                </span>
                <input
                  value={form.nombreTitular}
                  onChange={(event) =>
                    handleFormChange("nombreTitular", event.target.value)
                  }
                  className="bg-white border border-outline-variant rounded-xl px-4 py-3 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  placeholder="Nombre y apellido"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface">
                    Vencimiento
                  </span>
                  <input
                    value={form.fechaVencimiento}
                    onChange={(event) =>
                      handleFormChange(
                        "fechaVencimiento",
                        event.target.value.slice(0, 5),
                      )
                    }
                    className="bg-white border border-outline-variant rounded-xl px-4 py-3 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="MM/AA"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface">
                    CVV
                  </span>
                  <input
                    value={form.cvv}
                    onChange={(event) =>
                      handleFormChange(
                        "cvv",
                        event.target.value.replace(/\D/g, "").slice(0, 3),
                      )
                    }
                    className="bg-white border border-outline-variant rounded-xl px-4 py-3 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    placeholder="123"
                    inputMode="numeric"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={form.guardarTarjeta}
                  onChange={(event) =>
                    handleFormChange("guardarTarjeta", event.target.checked)
                  }
                  className="accent-primary w-4 h-4"
                />
                Guardar tarjeta para futuros pagos
              </label>
            </div>

            <div className="px-6 py-5 border-t border-outline-variant/40 bg-white/40 flex items-center justify-end gap-3">
              <button
                onClick={closePaymentModal}
                disabled={processingPayment}
                className="flex-1 bg-white border border-outline-variant hover:bg-surface-soft text-on-surface py-3 rounded-full font-button text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handlePaySelected}
                disabled={processingPayment}
                className="flex-1 bg-gradient-to-r from-primary to-primary-active hover:shadow-lg hover:shadow-primary/15 text-white py-3 rounded-full font-button text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              >
                {processingPayment && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                Pagar S/. {selectedPago.saldoPendiente.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
