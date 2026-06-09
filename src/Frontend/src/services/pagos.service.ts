import api from "./api";

export interface PagoDto {
  id: number;
  citaId: number;
  monto: number;
  metodoPago: string;
  tipoPago: string; // "Completo", "Parcial", "Restante", "Anulado"
  referencia?: string;
  ultimosDigitosTarjeta?: string;
  fechaPago: string;
  mascotaNombre?: string;
  propietarioNombre?: string;
  veterinarioNombre?: string;
  servicioNombre?: string;
  fechaCita?: string;
}

export interface RegistrarCobroRequestDto {
  citaId: number;
  montoTotalAjustado: number;
  montoAbonado: number;
  metodoPago: string; // Efectivo, Tarjeta, Transferencia, Yape, Plin
  referenciaOpcional?: string;
  observacion?: string;
}

export interface PagoTarjetaRequestDto {
  citaId: number;
  numeroTarjeta: string;
  nombreTitular: string;
  fechaVencimiento: string;
  cvv: string;
  tipoPago: "Completo" | "Parcial";
  montoTotal: number;
  montoPagar: number;
  guardarTarjeta: boolean;
}

export interface CompletarPagoRequestDto {
  citaId: number;
  montoRestante: number;
  metodoPago: "Tarjeta";
  numeroTarjeta: string;
  nombreTarjeta: string;
  fechaVencimiento: string;
  cvv: string;
  guardarTarjeta: boolean;
}

export interface CitaPendientePagoDto {
  id: number;
  fechaHora: string;
  estado: string;
  estadoPago: string;
  montoTotal: number;
  montoPagado: number;
  mascota?: {
    id: number;
    nombre: string;
    especie: string;
    usuario?: {
      nombre: string;
    };
  };
  servicio?: {
    id: number;
    nombre: string;
    precio: number;
  };
  veterinario?: {
    id: number;
    nombre: string;
  };
}

export const PagosService = {
  /**
   * Obtiene la lista de cobros y pagos filtrados (para Admin/Recepcionista)
   */
  async getPagos(params?: {
    tipoPago?: string;
    metodoPago?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
  }) {
    const response = await api.get("/api/Pagos", { params });
    return response.data.data;
  },

  /**
   * Obtiene los detalles de un pago por ID
   */
  async getPagoDetails(id: number): Promise<PagoDto> {
    const response = await api.get(`/api/Pagos/Details/${id}`);
    return response.data.data;
  },

  /**
   * Obtiene los detalles de pagos de una cita específica
   */
  async getDetailsByCita(citaId: number) {
    const response = await api.get("/api/Pagos/DetailsByCita", {
      params: { citaId },
    });
    return response.data.data;
  },

  /**
   * Obtiene citas completadas pendientes de cobro (o parciales)
   */
  async getPendientesPago(): Promise<CitaPendientePagoDto[]> {
    const response = await api.get("/api/Pagos/PendientesPago");
    return response.data.data;
  },

  /**
   * Registra un cobro manual
   */
  async registrarCobro(dto: RegistrarCobroRequestDto) {
    const response = await api.post("/api/Pagos/RegistrarCobro", dto);
    return response.data.data;
  },

  /**
   * Anula un pago
   */
  async anularPago(id: number, motivo: string): Promise<string> {
    const response = await api.post(`/api/Pagos/Anular/${id}`, { motivo });
    return response.data.data;
  },

  /**
   * Descarga el comprobante de pago en formato PDF (Retorna Base64)
   */
  async descargarComprobante(
    pagoId: number,
  ): Promise<{ fileBase64: string; fileName: string; contentType: string }> {
    const response = await api.get(
      `/api/PagoCita/DescargarComprobante/${pagoId}`,
    );
    return response.data.data;
  },

  /**
   * Obtiene los datos del formulario de pago para una cita (monto total, servicio, etc.)
   */
  async getPagoCitaInfo(citaId: number) {
    const response = await api.get(`/api/PagoCita/Pagar/${citaId}`);
    return response.data.data;
  },

  /**
   * Procesa un pago completo o parcial con tarjeta desde el portal del cliente
   */
  async procesarPagoTarjeta(
    dto: PagoTarjetaRequestDto,
  ): Promise<{ message: string; pagoId: number; citaId: number }> {
    const response = await api.post("/api/PagoCita/ProcesarPago", dto);
    return response.data.data;
  },

  /**
   * Procesa el saldo restante de una cita con pago parcial
   */
  async procesarPagoRestante(
    dto: CompletarPagoRequestDto,
  ): Promise<{ message: string; pagoId: number; citaId: number }> {
    const response = await api.post("/api/PagoCita/ProcesarPagoRestante", dto);
    return response.data.data;
  },
};

export default PagosService;
