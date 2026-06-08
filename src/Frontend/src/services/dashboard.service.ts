import api from './api';

export interface ServicioEstadisticaDto {
  nombre: string;
  cantidadCitas: number;
  ingresos: number;
}

export interface VeterinarioEstadisticaDto {
  nombre: string;
  especialidad: string;
  citasSemana: number;
  citasMes: number;
}

export interface EspecieEstadisticaDto {
  especie: string;
  cantidad: number;
}

export interface CitaProximaDto {
  id: number;
  fechaHora: string;
  mascotaNombre: string;
  propietarioNombre: string;
  veterinarioNombre: string;
  servicioNombre: string;
  estado: string;
}

export interface DashboardViewModelDto {
  citasHoyTotal: number;
  citasHoyPendientes: number;
  citasHoyConfirmadas: number;
  citasHoyEnProceso: number;
  citasHoyCompletadas: number;
  citasHoyCanceladas: number;

  citasSemanaTotal: number;
  citasSemanaCompletadas: number;
  citasSemanaPendientes: number;

  serviciosMasSolicitados: ServicioEstadisticaDto[];
  
  ingresosMes: number;
  pagosConfirmadosMes: number;

  veterinariosMasOcupados: VeterinarioEstadisticaDto[];
  mascotasPorEspecie: EspecieEstadisticaDto[];
  proximasCitas: CitaProximaDto[];

  pagosPendientesCount: number;
  pagosPendientesTotal: number;

  totalMascotas: number;
  totalVeterinarios: number;
  totalUsuarios: number;
  totalServicios: number;
}

export const dashboardService = {
  /**
   * Obtiene la información del Dashboard administrativo y operativo
   */
  getDashboardData: async () => {
    const response = await api.get('/api/Dashboard');
    return response.data; // { success: true, data: DashboardViewModelDto }
  }
};

export default dashboardService;
