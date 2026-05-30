import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import ClientesService from '../services/clientes.service';
import type { Cliente, CrearClienteDto, EditarClienteDto, Duplicado } from '../services/clientes.service';

export function useClientes(initialSearch = '', initialShowInactivos = false) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [citasPorUsuario, setCitasPorUsuario] = useState<Record<string, number>>({});
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState(initialSearch);
  const [mostrarInactivos, setMostrarInactivos] = useState(initialShowInactivos);

  const fetchClientes = useCallback(async (searchTerm = buscar, showInactivos = mostrarInactivos, currentPage = page) => {
    setLoading(true);
    try {
      const response = await ClientesService.getClientes(searchTerm, showInactivos, currentPage);
      if (response.success) {
        setClientes(response.data.usuarios);
        setCitasPorUsuario(response.data.citasPorUsuario || {});
        setTotalItems(response.data.totalItems);
        setPage(response.data.page);
      } else {
        toast.error(response.message || 'Error al cargar clientes');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('No se pudo conectar con el servidor para obtener los clientes.');
    } finally {
      setLoading(false);
    }
  }, [buscar, mostrarInactivos, page]);

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos, page]);

  const handleSearch = (term: string) => {
    setBuscar(term);
    setPage(1);
    fetchClientes(term, mostrarInactivos, 1);
  };

  const handleToggleActivo = async (cliente: Cliente) => {
    try {
      const response = await ClientesService.toggleActivo(cliente.id);
      if (response.success) {
        setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, activo: !c.activo } : c));
        toast.success(`Cliente ${cliente.nombre} ${cliente.activo ? 'desactivado' : 'activado'} correctamente.`);
      } else {
        toast.error(response.message || 'Error al cambiar estado.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error de servidor.');
    }
  };

  const handleDelete = async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await ClientesService.deleteCliente(id);
      if (response.success) {
        setClientes(prev => prev.filter(c => c.id !== id));
        setTotalItems(prev => prev - 1);
        toast.success(response.message || 'Cliente desactivado exitosamente.');
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || 'No se pudo desactivar el cliente.');
        return { success: false, message: response.message };
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Error del servidor al desactivar el cliente.';
      toast.error(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const handleRegistrar = async (dto: CrearClienteDto): Promise<{ success: boolean; message: string; duplicados?: Duplicado[] }> => {
    try {
      const response = await ClientesService.registrarCliente(dto);
      if (response.success) {
        toast.success('Cliente registrado exitosamente.');
        fetchClientes(buscar, mostrarInactivos, 1);
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      const data = err.response?.data;
      if (data && !data.success && data.data && Array.isArray(data.data)) {
        // Se detectaron duplicados advertibles
        return { success: false, message: data.message, duplicados: data.data };
      }
      const msg = data?.message || 'Error al registrar cliente.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const handleEditar = async (id: number, dto: EditarClienteDto): Promise<{ success: boolean; message: string; duplicados?: Duplicado[] }> => {
    try {
      const response = await ClientesService.editarCliente(id, dto);
      if (response.success) {
        toast.success('Cliente actualizado correctamente.');
        fetchClientes(buscar, mostrarInactivos, page);
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      const data = err.response?.data;
      if (data && !data.success && data.data && Array.isArray(data.data)) {
        // Se detectaron duplicados
        return { success: false, message: data.message, duplicados: data.data };
      }
      const msg = data?.message || 'Error al actualizar cliente.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  return {
    clientes,
    citasPorUsuario,
    totalItems,
    page,
    setPage,
    loading,
    buscar,
    setBuscar,
    mostrarInactivos,
    setMostrarInactivos,
    handleSearch,
    handleToggleActivo,
    handleDelete,
    handleRegistrar,
    handleEditar,
    refetch: fetchClientes
  };
}
