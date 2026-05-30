import api from './api';

export const usuariosService = {
  getUsuarios: async () => {
    const response = await api.get('/api/usuarios');
    return response.data;
  },
  crearUsuario: async (data: any) => {
    const response = await api.post('/api/usuarios', data);
    return response.data;
  },
  editarUsuario: async (id: number, data: any) => {
    const response = await api.put(`/api/usuarios/${id}`, data);
    return response.data;
  },
  cambiarEstado: async (id: number, activo: boolean) => {
    const response = await api.put(`/api/usuarios/${id}/estado`, { activo });
    return response.data;
  },
  eliminarUsuario: async (id: number) => {
    const response = await api.delete(`/api/usuarios/${id}`);
    return response.data;
  }
};
