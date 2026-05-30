import { useState, useCallback } from 'react';
import { usuariosService } from '../services/usuarios.service';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usuariosService.getUsuarios();
      if (response.success) {
        setUsuarios(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const crearUsuario = async (data: any) => {
    try {
      const response = await usuariosService.crearUsuario(data);
      if (response.success) {
        await fetchUsuarios();
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const editarUsuario = async (id: number, data: any) => {
    try {
      const response = await usuariosService.editarUsuario(id, data);
      if (response.success) {
        await fetchUsuarios();
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const cambiarEstado = async (id: number, activo: boolean) => {
    try {
      const response = await usuariosService.cambiarEstado(id, activo);
      if (response.success) {
        await fetchUsuarios();
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const eliminarUsuario = async (id: number) => {
    try {
      const response = await usuariosService.eliminarUsuario(id);
      if (response.success) {
        await fetchUsuarios();
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return {
    usuarios,
    loading,
    error,
    fetchUsuarios,
    crearUsuario,
    editarUsuario,
    cambiarEstado,
    eliminarUsuario
  };
}
