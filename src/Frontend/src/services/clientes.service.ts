import api from './api';

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  direccion: string;
  activo: boolean;
  fechaRegistro: string;
  rol: string;
  observaciones?: string;
  mascotas?: Array<{
    id: number;
    nombre: string;
    especie: string;
    raza?: string;
    sexo?: string;
    fechaNacimiento?: string;
    peso?: number;
    fotoUrl?: string;
    activo: boolean;
  }>;
}

export interface ClientesResponse {
  buscarActual: string | null;
  mostrarInactivos: boolean;
  citasPorUsuario: Record<string, number>;
  usuarios: Cliente[];
  totalItems: number;
  page: number;
}

export interface Duplicado {
  tipo: string; // "DNI", "Telefono", "Email"
  valor: string;
  clienteExistenteId: number;
  clienteExistenteNombre: string;
}

export interface CrearClienteDto {
  nombre: string;
  telefono: string;
  email?: string;
  dni?: string;
  direccion?: string;
  observaciones?: string;
  ignorarDuplicados?: boolean;
}

export interface EditarClienteDto {
  nombre: string;
  telefono: string;
  email?: string;
  dni?: string;
  direccion?: string;
  observaciones?: string;
  ignorarDuplicados?: boolean;
}

export interface ClienteDetalle {
  totalCitas: number;
  citasCompletadas: number;
  citasCanceladas: number;
  citasPendientes: number;
  citas: Array<{
    id: number;
    fechaHora: string;
    estado: string;
    motivo: string;
    montoTotal: number;
    montoPagado: number;
    estadoPago: string;
    mascotaId: number;
    mascota?: {
      id: number;
      nombre: string;
      especie: string;
    };
    servicio?: {
      id: number;
      nombre: string;
      precio: number;
    };
    veterinario?: {
      id: number;
      nombre: string;
    };
  }>;
  totalGastado: number;
  pagosPendientes: number;
  usuario: Cliente & {
    mascotas: Array<{
      id: number;
      nombre: string;
      especie: string;
      raza?: string;
      sexo?: string;
      fechaNacimiento?: string;
      peso?: number;
      fotoUrl?: string;
      activo: boolean;
    }>;
  };
}

const ClientesService = {
  getClientes: async (buscar = '', mostrarInactivos = false, page = 1) => {
    const params = new URLSearchParams();
    if (buscar) params.append('buscar', buscar);
    if (mostrarInactivos) params.append('mostrarInactivos', 'true');
    params.append('page', String(page));

    const response = await api.get(`/api/Clientes?${params.toString()}`);
    return response.data;
  },

  getClienteDetails: async (id: number) => {
    const response = await api.get(`/api/Clientes/${id}`);
    return response.data;
  },

  registrarCliente: async (dto: CrearClienteDto) => {
    const response = await api.post('/api/Clientes', dto);
    return response.data;
  },

  editarCliente: async (id: number, dto: EditarClienteDto) => {
    const response = await api.put(`/api/Clientes/${id}`, dto);
    return response.data;
  },

  toggleActivo: async (id: number) => {
    const response = await api.post(`/api/Clientes/ToggleActivo/${id}`);
    return response.data;
  },

  deleteCliente: async (id: number) => {
    const response = await api.delete(`/api/Clientes/${id}`);
    return response.data;
  },

  checkDuplicates: async (params: { dni?: string; email?: string; telefono?: string; excluirId?: number }) => {
    const query = new URLSearchParams();
    if (params.dni) query.append('dni', params.dni);
    if (params.email) query.append('email', params.email);
    if (params.telefono) query.append('telefono', params.telefono);
    if (params.excluirId) query.append('excluirId', String(params.excluirId));

    const response = await api.get(`/api/Clientes/check-duplicates?${query.toString()}`);
    return response.data;
  }
};

export default ClientesService;
