import api from './api';

export interface TriageDto {
  id?: number;
  citaId?: number | null;
  mascotaId: number;
  mascotaNombre?: string;
  propietarioNombre?: string;
  nivel: string; // "N1", "N2", "N3"
  prioridadColor?: string; // "Rojo", "Naranja", "Verde"
  estado?: string; // "EnEspera", "EnAtencion", "Atendido"
  sintomas?: string | null;
  motivoConsulta?: string | null;
  temperatura?: number | null;
  frecuenciaCardiaca?: number | null;
  pesoEstimado?: number | null;
  tiempoEsperaEstimadoMin?: number;
  consultorio?: string | null;
  fechaRegistro?: string;
}

export interface HistorialClinicoDto {
  id?: number;
  citaId: number;
  pesoActual?: number | null;
  temperatura?: number | null;
  frecuenciaCardiaca?: number | null;
  cerrado?: boolean;
  diagnostico: string;
  tratamiento?: string | null;
  medicamentos?: string | null;
  observaciones?: string | null;
  motivoConsulta?: string | null;
  hallazgos?: string | null;
  recomendaciones?: string | null;
  proximoControl?: string | null; // ISO DateTime string or date
  fechaRegistro?: string;
  veterinarioNombre?: string;
  servicioNombre?: string;
  fechaCita?: string;
  motivoCita?: string;
}

export interface TriageColaResponse {
  triages: TriageDto[];
  totalEsperando: number;
  totalEmergencias: number;
}

export interface TriageMascotaDropdown {
  id: number;
  display: string;
}

export const AtencionService = {
  /**
   * Obtiene la cola de triage activa
   */
  async getColaTriage(): Promise<TriageColaResponse> {
    const response = await api.get('/api/Triage/Cola');
    return response.data.data;
  },

  /**
   * Registra un triage de paciente
   */
  async createTriage(triage: TriageDto): Promise<void> {
    await api.post('/api/Triage', triage);
  },

  /**
   * Cambia el estado del triage
   */
  async cambiarEstadoTriage(id: number, nuevoEstado: string): Promise<void> {
    await api.post(`/api/Triage/CambiarEstado/${id}`, null, {
      params: { nuevoEstado },
    });
  },

  /**
   * Obtiene la lista de mascotas activas para registrar en triage
   */
  async getTriageMascotas(): Promise<TriageMascotaDropdown[]> {
    const response = await api.get('/api/Triage/Mascotas');
    return response.data.data;
  },

  /**
   * Obtiene los historiales clínicos de una mascota (paginado)
   */
  async getHistoriales(mascotaId: number, page = 1) {
    const response = await api.get('/api/HistorialesClinicos', {
      params: { mascotaId, page },
    });
    return response.data;
  },

  /**
   * Obtiene los detalles del historial clínico por ID de cita
   */
  async getHistorialByCitaId(citaId: number) {
    const response = await api.get(`/api/HistorialesClinicos/details/${citaId}`);
    return response.data;
  },

  /**
   * Obtiene los detalles de un historial clínico por su ID
   */
  async getHistorialById(id: number) {
    const response = await api.get(`/api/HistorialesClinicos/${id}`);
    return response.data;
  },

  /**
   * Registra un borrador de historial clínico
   */
  async createHistorial(dto: HistorialClinicoDto) {
    const response = await api.post('/api/HistorialesClinicos', dto);
    return response.data;
  },

  /**
   * Actualiza un borrador de historial clínico
   */
  async updateHistorial(id: number, dto: HistorialClinicoDto) {
    const response = await api.put(`/api/HistorialesClinicos/${id}`, dto);
    return response.data;
  },

  /**
   * Cierra de manera irreversible la atención clínica de una cita
   */
  async cerrarAtencion(citaId: number) {
    const response = await api.post(`/api/HistorialesClinicos/Cerrar/${citaId}`);
    return response.data;
  }
};

export default AtencionService;
