import api from './api';

export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string | null;
  duracionMinutos: number;
  precio: number;
  requiereVeterinario: boolean;
  especialidadRequerida?: string | null;
  activo: boolean;
}

export interface CrearServicioDto {
  nombre: string;
  descripcion?: string | null;
  duracionMinutos: number;
  precio: number;
  requiereVeterinario: boolean;
  especialidadRequerida?: string | null;
}

export interface EditarServicioDto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  duracionMinutos: number;
  precio: number;
  requiereVeterinario: boolean;
  especialidadRequerida?: string | null;
}

export const ServiciosService = {
  /**
   * Obtiene la lista de servicios filtrada por término de búsqueda e inactivos
   */
  async getServicios(q = '', mostrarInactivos = false) {
    const params: Record<string, any> = {};
    if (q) params.q = q;
    if (mostrarInactivos) params.mostrarInactivos = true;
    const response = await api.get('/api/Servicios', { params });
    return response.data;
  },

  /**
   * Obtiene el detalle de un servicio por su ID
   */
  async getServicioDetails(id: number) {
    const response = await api.get(`/api/Servicios/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo servicio
   */
  async createServicio(dto: CrearServicioDto) {
    const response = await api.post('/api/Servicios', dto);
    return response.data;
  },

  /**
   * Modifica un servicio existente
   */
  async updateServicio(id: number, dto: EditarServicioDto) {
    const response = await api.put(`/api/Servicios/${id}`, dto);
    return response.data;
  },

  /**
   * Elimina un servicio
   */
  async deleteServicio(id: number) {
    const response = await api.delete(`/api/Servicios/${id}`);
    return response.data;
  },

  /**
   * Alterna el estado activo/inactivo de un servicio
   */
  async toggleActivo(id: number) {
    const response = await api.post(`/api/Servicios/ToggleActivo/${id}`);
    return response.data;
  }
};

export default ServiciosService;
