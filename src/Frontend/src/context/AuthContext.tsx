import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface User {
  email: string;
  nombreCompleto: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Restaurar usuario temporalmente desde localStorage para evitar parpadeos
    const savedUser = window.localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return window.localStorage.getItem('user') !== null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Al montar, verificamos con el backend si hay una sesión activa de Identity (Cookie de sesión)
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await api.get('/api/auth/me');
        if (response.data.success && response.data.data) {
          const userData = response.data.data;
          setUser(userData);
          setIsAuthenticated(true);
          window.localStorage.setItem('user', JSON.stringify(userData));
        } else {
          throw new Error('Sesión inválida');
        }
      } catch (error) {
        console.log('Sesión activa no encontrada en el backend:', error);
        setUser(null);
        setIsAuthenticated(false);
        window.localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        setUser(userData);
        setIsAuthenticated(true);
        window.localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.data.message || 'Error al iniciar sesión');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error de conexión';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      window.localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
