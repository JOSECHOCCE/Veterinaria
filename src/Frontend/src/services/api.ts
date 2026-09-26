import axios from 'axios';

// Normalizar la URL base del backend:
// Si viene vacía (desarrollo local), usa '' para aprovechar el proxy de Vite.
// Si viene como nombre de servicio interno de Render (ej. 'vetcare-api-2yul') o sin protocolo,
// se normaliza a URL HTTPS pública completa.
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
export const getNormalizedApiUrl = (url: string = rawApiUrl): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url.replace(/\/+$/, '');
  if (url.includes('.onrender.com')) return `https://${url}`.replace(/\/+$/, '');
  return `https://${url}.onrender.com`.replace(/\/+$/, '');
};

export const API_BASE_URL = getNormalizedApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
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
    // Si la API responde con 401 (No Autorizado) y no estamos en la página de login o en rutas públicas, redirigir
    const publicRoutes = ['/', '/servicios', '/equipo', '/contacto'];
    const isPublicRoute = publicRoutes.includes(window.location.pathname);

    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login') && !isPublicRoute) {
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

