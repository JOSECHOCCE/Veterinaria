import api from './api';

export interface NotificacionDto {
  id: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: 'Info' | 'Success' | 'Warning' | 'Error';
  icono?: string | null;
  urlAccion?: string | null;
  leida: boolean;
  fechaCreacion: string;
  fechaLectura?: string | null;
  // Ciertos endpoints formatean campos adicionales en C# (como tiempoRelativo, etc.)
  tiempoRelativo?: string;
  fecha?: string;
}

export const notificacionesService = {
  /**
   * Obtiene la lista completa de notificaciones y el conteo de no leídas
   */
  getNotificaciones: async () => {
    const response = await api.get('/api/Notificaciones');
    return response.data;
  },

  /**
   * Obtiene únicamente la cantidad de notificaciones no leídas
   */
  getNoLeidasCount: async () => {
    const response = await api.get('/api/Notificaciones/ObtenerNoLeidas');
    return response.data;
  },

  /**
   * Obtiene las 5 notificaciones más recientes (formateadas con tiempo relativo)
   */
  getRecientes: async () => {
    const response = await api.get('/api/Notificaciones/ObtenerRecientes');
    return response.data;
  },

  /**
   * Marca una notificación como leída
   */
  marcarLeida: async (id: number) => {
    const response = await api.post(`/api/Notificaciones/MarcarLeida/${id}`);
    return response.data;
  },

  /**
   * Marca todas las notificaciones del usuario como leídas
   */
  marcarTodasLeidas: async () => {
    const response = await api.post('/api/Notificaciones/MarcarTodasLeidas');
    return response.data;
  },

  /**
   * Elimina una notificación por su ID
   */
  eliminarNotificacion: async (id: number) => {
    const response = await api.delete(`/api/Notificaciones/${id}`);
    return response.data;
  },

  /**
   * Actualiza la preferencia del cliente para recibir recordatorios no críticos
   */
  actualizarPreferencias: async (recibirRecordatorios: boolean) => {
    const response = await api.put('/api/Notificaciones/Preferencias', { recibirRecordatorios });
    return response.data;
  }
};

export default notificacionesService;
