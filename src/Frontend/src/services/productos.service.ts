import api from './api';

export interface ProductoDto {
  id: number;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  precioUnitario: number;
  stockActual: number;
  puntoReorden: number;
  requiereReceta: boolean;
  activo: boolean;
  fechaVencimiento?: string;
  lote?: string;
}

export const productosService = {
  async getProductos(q?: string, categoria?: string, page = 1) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (categoria) params.append('categoria', categoria);
    params.append('page', String(page));
    const response = await api.get(`/productos?${params.toString()}`);
    return response.data;
  },

  async getProducto(id: number) {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  async createProducto(data: Partial<ProductoDto>) {
    const response = await api.post('/productos', data);
    return response.data;
  },

  async updateProducto(id: number, data: Partial<ProductoDto>) {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },

  async deleteProducto(id: number) {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  }
};

export default productosService;
