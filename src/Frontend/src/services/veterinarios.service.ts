import api from './api';

export interface Veterinario {
  id: number;
  nombre: string;
  especialidad: string;
  activo: boolean;
  telefono?: string;
  email?: string;
}

export interface VeterinarioConCitas {
  veterinario: Veterinario;
  citasEstaSemana: number;
}

export interface VeterinariosResponse {
  veterinarios: VeterinarioConCitas[];
  especialidades: string[];
  currentFilter: string | null;
  currentEspecialidad: string | null;
}

export const VeterinariosService = {
  /**
   * Obtiene la lista de veterinarios con sus citas de la semana y especialidades.
   */
  async getVeterinarios(especialidad = '', q = '') {
    const params: Record<string, any> = {};
    if (especialidad) params.especialidad = especialidad;
    if (q) params.q = q;

    const response = await api.get('/api/Veterinarios', { params });
    return response.data;
  },

  /**
   * Obtiene los detalles de un veterinario y sus citas próximas.
   */
  async getVeterinarioDetails(id: number) {
    const response = await api.get(`/api/Veterinarios/${id}`);
    return response.data;
  }
};

export default VeterinariosService;
