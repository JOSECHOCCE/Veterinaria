import api from './api';

export interface MascotaPayload {
  id?: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  peso?: number | null;
  color?: string | null;
  fechaNacimiento?: string | null;
  usuarioId: number;
  fotoUrl?: string | null;
  activo?: boolean;
  sexo?: string | null;
  observacionesGenerales?: string | null;
  alergiasConocidas?: string | null;
}

export const MascotasService = {
  /**
   * Obtiene la lista paginada y filtrada de mascotas activas
   */
  async getMascotas(q = '', page = 1) {
    const params: Record<string, any> = { page };
    if (q) {
      params.q = q;
    }
    const response = await api.get('/api/Mascotas', { params });
    return response.data;
  },

  /**
   * Obtiene el detalle clínico completo de una mascota
   */
  async getMascotaDetails(id: number) {
    const response = await api.get(`/api/Mascotas/${id}`);
    return response.data;
  },

  /**
   * Inicializa la vista de creación retornando propietarios activos
   */
  async getPropietariosDropdown() {
    const response = await api.get('/api/Mascotas/Create');
    return response.data;
  },

  /**
   * Registra una nueva mascota en el sistema
   */
  async createMascota(payload: MascotaPayload) {
    const response = await api.post('/api/Mascotas', payload);
    return response.data;
  },

  /**
   * Actualiza el perfil de una mascota (incluyendo propietario)
   */
  async updateMascota(id: number, payload: MascotaPayload) {
    const response = await api.put(`/api/Mascotas/${id}`, payload);
    return response.data;
  },

  /**
   * Inicializa la vista de edición retornando mascota y propietarios activos
   */
  async getMascotaEdit(id: number) {
    const response = await api.get(`/api/Mascotas/Edit/${id}`);
    return response.data;
  },

  /**
   * Da de baja (soft-delete) una mascota y cancela citas futuras
   */
  async deleteMascota(id: number) {
    const response = await api.delete(`/api/Mascotas/${id}`);
    return response.data;
  },
};

export default MascotasService;
