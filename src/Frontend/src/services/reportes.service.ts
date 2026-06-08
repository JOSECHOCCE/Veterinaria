import api from './api';

export interface CitaReporteItemDto {
  citaId: number;
  fechaHora: string;
  estado: string;
  mascota: string;
  servicio: string;
  veterinario: string;
  montoTotal: number;
}

export interface ReporteCitasDto {
  fechaInicio: string;
  fechaFin: string;
  totalCitas: number;
  completadas: number;
  canceladas: number;
  pendientes: number;
  detalle: CitaReporteItemDto[];
}

export interface IngresoReporteItemDto {
  pagoId: number;
  fechaPago: string;
  monto: number;
  metodoPago: string;
  concepto: string;
}

export interface ReporteIngresosDto {
  fechaInicio: string;
  fechaFin: string;
  totalIngresos: number;
  totalEfectivo: number;
  totalTarjeta: number;
  detalle: IngresoReporteItemDto[];
}

export interface NuevoClienteReporteItemDto {
  clienteId: number;
  nombre: string;
  fechaRegistro: string;
  cantidadMascotas: number;
}

export interface ReporteNuevosClientesDto {
  fechaInicio: string;
  fechaFin: string;
  totalNuevosClientes: number;
  totalNuevasMascotas: number;
  detalle: NuevoClienteReporteItemDto[];
}

export const reportesService = {
  /**
   * Obtiene el reporte de citas filtrado por rango de fechas, estado y veterinario
   */
  getReporteCitas: async (fechaInicio: string, fechaFin: string, estado?: string | null, veterinarioId?: number | null) => {
    const params: Record<string, any> = { fechaInicio, fechaFin };
    if (estado) params.estado = estado;
    if (veterinarioId) params.veterinarioId = veterinarioId;
    
    const response = await api.get('/api/Reportes/Citas', { params });
    return response.data; // { success: true, data: ReporteCitasDto }
  },

  /**
   * Exporta el reporte de citas en el formato especificado (csv o pdf)
   */
  exportarReporteCitas: async (fechaInicio: string, fechaFin: string, formato: 'csv' | 'pdf', estado?: string | null, veterinarioId?: number | null) => {
    const params: Record<string, any> = { fechaInicio, fechaFin, formato };
    if (estado) params.estado = estado;
    if (veterinarioId) params.veterinarioId = veterinarioId;
    
    const response = await api.get('/api/Reportes/Citas/Exportar', {
      params,
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Obtiene el reporte de ingresos/pagos filtrado por rango de fechas y método de pago
   */
  getReporteIngresos: async (fechaInicio: string, fechaFin: string, metodoPago?: string | null) => {
    const params: Record<string, any> = { fechaInicio, fechaFin };
    if (metodoPago) params.metodoPago = metodoPago;

    const response = await api.get('/api/Reportes/Ingresos', { params });
    return response.data; // { success: true, data: ReporteIngresosDto }
  },

  /**
   * Exporta el reporte de ingresos en el formato especificado (csv o pdf)
   */
  exportarReporteIngresos: async (fechaInicio: string, fechaFin: string, formato: 'csv' | 'pdf', metodoPago?: string | null) => {
    const params: Record<string, any> = { fechaInicio, fechaFin, formato };
    if (metodoPago) params.metodoPago = metodoPago;

    const response = await api.get('/api/Reportes/Ingresos/Exportar', {
      params,
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Obtiene el reporte de captación de nuevos clientes en un rango de fechas
   */
  getReporteNuevosClientes: async (fechaInicio: string, fechaFin: string) => {
    const params = { fechaInicio, fechaFin };
    const response = await api.get('/api/Reportes/NuevosClientes', { params });
    return response.data; // { success: true, data: ReporteNuevosClientesDto }
  }
};

export default reportesService;
