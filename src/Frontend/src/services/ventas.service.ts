import api from './api';

export interface DetalleVentaDto {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaDto {
  id: number;
  fecha: string;
  clienteNombre?: string;
  total: number;
  tipoPago: string;
  detalles: DetalleVentaDto[];
}

export interface CrearVentaDto {
  clienteId?: number;
  recetaId?: number;
  tipoPago: string;
  detalles: { productoId: number; cantidad: number; precioUnitario: number }[];
}

export const ventasService = {
  async getVentas(desde?: string, hasta?: string, page = 1) {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    params.append('page', String(page));
    const response = await api.get(`/ventas?${params.toString()}`);
    return response.data;
  },

  async getVenta(id: number) {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  },

  async registrarVenta(data: CrearVentaDto) {
    const response = await api.post('/ventas', data);
    return response.data;
  }
};

export default ventasService;
