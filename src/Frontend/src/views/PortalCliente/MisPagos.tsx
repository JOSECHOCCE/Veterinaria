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

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <PageHeader
        title="Mis Pagos"
        description="Consulta tus saldos pendientes, pagos realizados y comprobantes de tus atenciones."
        actions={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-surface-soft border border-hairline px-5 py-3 rounded-xl flex items-center gap-4 shadow-inner">
              <span className="material-symbols-outlined text-primary text-[24px]">
                payments
              </span>
              <div>
                <p className="font-caption text-[11px] text-body-muted uppercase tracking-wider leading-none font-semibold">
                  Total Invertido
                </p>
                <p className="font-display-sm text-title-sm font-bold text-ink mt-1">
                  S/. {totalPagado.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-5 py-3 rounded-xl flex items-center gap-4 shadow-inner">
              <span className="material-symbols-outlined text-amber-700 text-[24px]">
                account_balance_wallet
              </span>
              <div>
                <p className="font-caption text-[11px] text-amber-700 uppercase tracking-wider leading-none font-semibold">
                  Saldo Pendiente
                </p>
                <p className="font-display-sm text-title-sm font-bold text-amber-900 mt-1">
                  S/. {totalPendiente.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        }
        hasDivider={true}
      />

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-700">
            check_circle
          </span>
          <p className="font-body-sm text-body-sm font-medium">
            {successMessage}
          </p>
        </div>
      )}

      <section className="bg-surface-card border border-hairline rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-hairline flex items-center justify-between gap-4">
          <div>
            <h2 className="font-title-md text-title-md font-bold text-ink">
              Pagos pendientes
            </h2>
            <p className="font-body-sm text-body-sm text-body-muted mt-1">
              Atenciones completadas que aún tienen saldo por cancelar.
            </p>
          </div>
          <span className="bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-3 py-1 text-[12px] font-bold">
            {pagosPendientes.length} pendiente
            {pagosPendientes.length === 1 ? "" : "s"}
          </span>
        </div>

        {pagosPendientes.length === 0 ? (
          <div className="border border-dashed border-hairline rounded-xl flex flex-col items-center justify-center m-6 p-10 bg-canvas/30 text-center">
            <span className="material-symbols-outlined text-[44px] text-emerald-600 mb-3">
              verified
            </span>
            <h3 className="font-title-md text-title-md font-bold text-ink">
              No tienes saldos pendientes
            </h3>
            <p className="font-body-sm text-body-sm text-body-muted mt-1 max-w-sm">
              Cuando una atención quede por pagar, aparecerá aquí con el monto y
              la opción de pago.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas/50 border-b border-hairline font-caption-caps text-caption-caps text-body-muted">
                  <th className="p-4 pl-6 font-bold">Servicio / Mascota</th>
                  <th className="p-4 font-bold">Fecha de Cita</th>
                  <th className="p-4 font-bold text-right">Total</th>
                  <th className="p-4 font-bold text-right">Pagado</th>
                  <th className="p-4 font-bold text-right">Saldo</th>
                  <th className="p-4 pr-6 font-bold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-body-sm text-ink">
                {pagosPendientes.map((pago) => (
                  <tr
                    key={pago.citaId}
                    className="hover:bg-surface-soft/40 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-semibold text-ink leading-tight">
                        {pago.servicioNombre}
                      </p>
                      <p className="text-[12px] text-body-muted mt-0.5">
                        {pago.mascotaNombre}
                        {pago.veterinarioNombre
                          ? ` · ${pago.veterinarioNombre}`
                          : ""}
                      </p>
                    </td>
                    <td className="p-4 font-medium">
                      {formatDate(pago.fechaHora)} ·{" "}
                      {formatTime(pago.fechaHora)}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      S/. {pago.montoTotal.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-body-muted">
                      S/. {pago.montoPagado.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-bold text-error">
                      S/. {pago.saldoPendiente.toFixed(2)}
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => openPaymentModal(pago)}
                        className="bg-primary text-on-primary px-4 py-2 rounded-full font-button text-[12px] font-bold hover:bg-primary-active transition-colors cursor-pointer"
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

      <section className="bg-surface-card border border-hairline rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-hairline">
          <h2 className="font-title-md text-title-md font-bold text-ink">
            Historial de pagos
          </h2>
          <p className="font-body-sm text-body-sm text-body-muted mt-1">
            Pagos ya registrados con opción de descargar el comprobante PDF.
          </p>
        </div>

        {pagos.length === 0 ? (
          <div className="border border-dashed border-hairline rounded-xl flex flex-col items-center justify-center m-6 p-12 bg-canvas/30 text-center">
            <span className="material-symbols-outlined text-[48px] text-body-muted mb-3">
              receipt_long
            </span>
            <h3 className="font-title-md text-title-md font-bold text-ink">
              Sin transacciones registradas
            </h3>
            <p className="font-body-sm text-body-sm text-body-muted mt-1 max-w-sm">
              No tienes recibos ni pagos registrados en tu cuenta en este
              momento.
            </p>
          </div>
        ) : (
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
                  <tr
                    key={pago.id}
                    className="hover:bg-surface-soft/40 transition-colors"
                  >
                    <td className="p-4 pl-6 font-medium">
                      {formatDate(pago.fechaPago)}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-ink leading-tight">
                        {pago.servicioNombre}
                      </p>
                      <p className="text-[12px] text-body-muted mt-0.5">
                        Cita: {formatDate(pago.citaFecha)} a las{" "}
                        {formatTime(pago.citaFecha)}
                      </p>
                    </td>
                    <td className="p-4 text-center font-medium">
                      {pago.metodoPago || "No especificado"}
                    </td>
                    <td className="p-4 text-center text-body-muted font-code text-code">
                      {pago.numeroOperacion || "—"}
                    </td>
                    <td className="p-4 text-right font-bold text-ink">
                      S/. {pago.montoCobrado.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-200">
                        {pago.estado || "Pagado"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleDownloadPdf(pago.id)}
                        className="text-primary hover:text-primary-active font-button text-[12px] font-bold flex items-center gap-1 mx-auto hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          download
                        </span>
                        Recibo PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedPago && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-hairline rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-hairline flex items-start justify-between gap-4">
              <div>
                <h3 className="font-title-lg text-title-lg font-bold text-ink">
                  Pagar saldo pendiente
                </h3>
                <p className="font-body-sm text-body-sm text-body-muted mt-1">
                  {selectedPago.servicioNombre} · S/.{" "}
                  {selectedPago.saldoPendiente.toFixed(2)}
                </p>
              </div>
              <button
                onClick={closePaymentModal}
                className="text-body-muted hover:text-ink cursor-pointer"
                aria-label="Cerrar modal de pago"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {paymentError && (
                <div className="bg-error-container text-on-error-container border border-error/20 rounded-xl px-4 py-3 text-body-sm">
                  {paymentError}
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="font-caption text-caption text-body-muted font-semibold">
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
                  className="bg-canvas border border-hairline rounded-xl px-4 py-3 font-body-sm text-body-sm outline-none focus:border-primary"
                  placeholder="1234567812345678"
                  inputMode="numeric"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-caption text-caption text-body-muted font-semibold">
                  Nombre del titular
                </span>
                <input
                  value={form.nombreTitular}
                  onChange={(event) =>
                    handleFormChange("nombreTitular", event.target.value)
                  }
                  className="bg-canvas border border-hairline rounded-xl px-4 py-3 font-body-sm text-body-sm outline-none focus:border-primary"
                  placeholder="Nombre y apellido"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="font-caption text-caption text-body-muted font-semibold">
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
                    className="bg-canvas border border-hairline rounded-xl px-4 py-3 font-body-sm text-body-sm outline-none focus:border-primary"
                    placeholder="MM/AA"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="font-caption text-caption text-body-muted font-semibold">
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
                    className="bg-canvas border border-hairline rounded-xl px-4 py-3 font-body-sm text-body-sm outline-none focus:border-primary"
                    placeholder="123"
                    inputMode="numeric"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-body-sm text-body-muted">
                <input
                  type="checkbox"
                  checked={form.guardarTarjeta}
                  onChange={(event) =>
                    handleFormChange("guardarTarjeta", event.target.checked)
                  }
                  className="accent-primary"
                />
                Guardar tarjeta para futuros pagos
              </label>
            </div>

            <div className="px-6 py-5 border-t border-hairline bg-canvas/40 flex items-center justify-end gap-3">
              <button
                onClick={closePaymentModal}
                disabled={processingPayment}
                className="px-5 py-2.5 rounded-full border border-hairline text-ink font-button text-button hover:bg-surface-soft transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handlePaySelected}
                disabled={processingPayment}
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-button text-button hover:bg-primary-active transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {processingPayment && (
                  <span className="material-symbols-outlined text-[18px] animate-spin">
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
