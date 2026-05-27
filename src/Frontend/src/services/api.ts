import axios from 'axios';

// Usar el proxy local de Vite en desarrollo ('') o la URL de producción especificada
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // Obligatorio para enviar/recibir cookies de sesión de Identity
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de petición para inyectar automáticamente el token JWT si está disponible
api.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores comunes globalmente (ej. sesión vencida)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la API responde con 401 (No Autorizado) y no estamos en la página de login, redirigir
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

