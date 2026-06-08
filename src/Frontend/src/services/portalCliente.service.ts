import api from './api';

export interface RegistrarMascotaPortalDto {
  nombre: string;
  especie: string;
}

export interface SolicitarCitaPortalDto {
  mascotaId: number;
  servicioId: number;
  fechaHora: string;
  veterinarioId?: number | null;
  motivo?: string | null;
}

export interface ActualizarPerfilPortalDto {
  telefono?: string | null;
  direccion?: string | null;
  passwordActual?: string | null;
  passwordNuevo?: string | null;
}

export const PortalClienteService = {
  /**
   * Obtiene la información del Dashboard del cliente
   */
  async getDashboard() {
    const response = await api.get('/api/PortalCliente/Dashboard');
    return response.data;
  },

  /**
   * Obtiene la lista de mascotas del cliente autenticado
   */
  async getMisMascotas() {
    const response = await api.get('/api/PortalCliente/Mascotas');
    return response.data;
  },

  /**
   * Registra una nueva mascota desde el portal del cliente
   */
  async registrarMascota(payload: RegistrarMascotaPortalDto) {
    const response = await api.post('/api/PortalCliente/Mascotas', payload);
    return response.data;
  },

  /**
   * Obtiene el historial clínico de una mascota del cliente
   */
  async getHistorialMascota(mascotaId: number) {
    const response = await api.get(`/api/PortalCliente/Mascotas/${mascotaId}/Historial`);
    return response.data;
  },

  /**
   * Obtiene la lista de citas del cliente autenticado
   */
  async getMisCitas() {
    const response = await api.get('/api/PortalCliente/Citas');
    return response.data;
  },

  /**
   * Solicita una nueva cita desde el portal del cliente
   */
  async solicitarCita(payload: SolicitarCitaPortalDto) {
    const response = await api.post('/api/PortalCliente/Citas', payload);
    return response.data;
  },

  /**
   * Cancela una cita desde el portal del cliente
   */
  async cancelarCita(citaId: number) {
    const response = await api.put(`/api/PortalCliente/Citas/${citaId}/Cancelar`);
    return response.data;
  },

  /**
   * Obtiene el historial de pagos del cliente autenticado
   */
  async getMisPagos() {
    const response = await api.get('/api/PortalCliente/Pagos');
    return response.data;
  },

  /**
   * Obtiene el perfil del cliente autenticado
   */
  async getMiPerfil() {
    const response = await api.get('/api/PortalCliente/Perfil');
    return response.data;
  },

  /**
   * Actualiza el perfil de contacto del cliente
   */
  async actualizarPerfil(payload: ActualizarPerfilPortalDto) {
    const response = await api.put('/api/PortalCliente/Perfil', payload);
    return response.data;
  },

  /**
   * Obtiene los horarios disponibles para un veterinario y una fecha específica
   */
  async getHorariosDisponibles(veterinarioId: number, fecha: string) {
    const response = await api.get('/api/Citas/HorariosDisponibles', {
      params: { veterinarioId, fecha }
    });
    return response.data;
  },

  /**
   * Bloquea temporalmente un bloque de agenda por 5 minutos
   */
  async reservarTemporalmente(payload: { mascotaId: number; servicioId: number; fechaHora: string; veterinarioId: number }) {
    const response = await api.post('/api/Citas/ReservaTemporal', payload);
    return response.data;
  },

  /**
   * Obtiene la lista de servicios activos para la reserva
   */
  async getServiciosActivos() {
    const response = await api.get('/api/Servicios');
    return response.data;
  },

  /**
   * Obtiene la lista de veterinarios activos
   */
  async getVeterinariosActivos() {
    const response = await api.get('/api/Veterinarios');
    return response.data;
  }
};

export default PortalClienteService;
