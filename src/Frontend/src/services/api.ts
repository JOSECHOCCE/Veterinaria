import axios from 'axios';

// Usar el puerto HTTP local del backend (5132) o HTTPS (7293)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5132',
  withCredentials: true, // Obligatorio para enviar/recibir cookies de sesión de Identity
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores comunes globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la API responde con 401 (No Autorizado) y no estamos en la página de login, redirigir
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      window.localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
