import api from './api';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  changePassword: async (data: any) => {
    const response = await api.post('/api/auth/change-password', data);
    return response.data;
  }
};
