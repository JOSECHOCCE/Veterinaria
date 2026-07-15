import api from './api';

export interface CitaDto {
  id?: number;
  fechaHora: string; // ISO DateTime string
  estado?: string;
  motivo?: string | null;
  mascotaId: number;
  veterinarioId: number;
  servicioId: number;
  // Read-only navigation fields
  mascotaNombre?: string;
  propietarioNombre?: string;
  veterinarioNombre?: string;
  servicioNombre?: string;
  precioServicio?: number;
}

export interface CalendarioEventDto {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  textColor: string;
  extendedProps: {
    mascota?: string;
    mascotaId?: number;
    servicio?: string;
    servicioId?: number;
    veterinario?: string;
    veterinarioId?: number;
    estado: string;
    motivo?: string | null;
    propietario?: string;
    duracion: number;
    precio: number;
    hasTriage?: boolean;
    triageId?: number;
  };
}

export interface HorarioDisponibleDto {
  value: string; // "yyyy-MM-ddTHH:mm"
  text: string;  // "HH:mm"
}

export interface ValidarDisponibilidadDto {
  disponible: boolean;
  mensaje: string;
}

export const CitasService = {
  /**
   * Obtiene citas para un rango de fechas formateadas para el calendario.
   */
  async getCalendarioData(start?: string, end?: string): Promise<CalendarioEventDto[]> {
    const params: Record<string, any> = {};
    if (start) params.start = start;
    if (end) params.end = end;

    const response = await api.get('/api/Citas/CalendarioData', { params });
    return response.data.data;
  },

  /**
   * Obtiene los bloques de horarios disponibles para un veterinario en una fecha específica.
   */
  async getHorariosDisponibles(veterinarioId: number, fecha: string): Promise<HorarioDisponibleDto[]> {
    const params = { veterinarioId, fecha };
    const response = await api.get('/api/Citas/HorariosDisponibles', { params });
    return response.data.data;
  },

  /**
   * Valida si un bloque de horario está disponible para un veterinario y servicio.
   */
  async validarDisponibilidad(
    veterinarioId: number,
    fechaHora: string,
    servicioId: number,
    citaId?: number
  ): Promise<ValidarDisponibilidadDto> {
    const params: Record<string, any> = { veterinarioId, fechaHora, servicioId };
    if (citaId) params.citaId = citaId;

    const response = await api.get('/api/Citas/ValidarDisponibilidad', { params });
    return response.data.data;
  },

  /**
   * Reserva temporalmente un bloque por 5 minutos antes de confirmar la cita.
   */
  async reservaTemporal(dto: CitaDto): Promise<{ message: string; citaId: number }> {
    const response = await api.post('/api/Citas/ReservaTemporal', dto);
    return response.data.data;
  },

  /**
   * Confirma y crea una cita de forma definitiva.
   */
  async createCita(dto: CitaDto): Promise<{ message: string; citaId: number }> {
    const response = await api.post('/api/Citas', dto);
    return response.data.data;
  },

  /**
   * Edita los detalles principales de una cita (requiere rol Staff).
   */
  async updateCita(id: number, dto: CitaDto): Promise<void> {
    await api.put(`/api/Citas/${id}`, dto);
  },

  /**
   * Cambia el estado operativo de una cita (Llegada, En Atención, Completada, etc.).
   */
  async cambiarEstado(id: number, nuevoEstado: string): Promise<void> {
    await api.post(`/api/Citas/CambiarEstado/${id}`, null, {
      params: { nuevoEstado },
    });
  },

  /**
   * Cancela una cita de forma lógica.
   */
  async cancelarCita(id: number): Promise<void> {
    await api.post(`/api/Citas/Cancel/${id}`);
  }
};

export default CitasService;
