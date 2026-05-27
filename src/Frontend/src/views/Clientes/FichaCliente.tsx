import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  direccion: string;
  activo: boolean;
  fechaRegistro: string;
  rol: string;
}

interface ClientesResponse {
  usuarios: Cliente[];
  citasPorUsuario: Record<string, number>;
  totalItems: number;
  page: number;
}

export default function FichaCliente() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [citasPorUsuario, setCitasPorUsuario] = useState<Record<string, number>>({});
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterActivo, setFilterActivo] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('nombre-asc');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formularios
  const [createForm, setCreateForm] = useState({
    nombre: '',
    email: '',
    password: '',
    dni: '',
    telefono: '',
    direccion: ''
  });

  const [editForm, setEditForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    direccion: ''
  });

  const fetchClientes = useCallback(async (buscar: string = '') => {
    setLoading(true);
    try {
      const params = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
      const response = await api.get(`/api/Clientes${params}`);
      if (response.data.success) {
        const data: ClientesResponse = response.data.data;
        setClientes(data.usuarios);
        setCitasPorUsuario(data.citasPorUsuario || {});
        setTotalItems(data.totalItems);
      } else {
        toast.error(response.data.message || 'Error al cargar clientes');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    fetchClientes(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    fetchClientes('');
  };

  const handleToggleActivo = async (cliente: Cliente) => {
    try {
      const response = await api.put(`/api/usuarios/${cliente.id}/estado`, { activo: !cliente.activo });
      if (response.data?.succeeded) {
        setClientes(clientes.map(c => c.id === cliente.id ? { ...c, activo: !c.activo } : c));
        toast.success(`Cliente ${cliente.nombre} ${!cliente.activo ? 'activado' : 'desactivado'} con éxito.`);
      } else {
        toast.error(response.data?.message || 'Error al actualizar el estado.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar el estado.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre || !createForm.email || !createForm.password) {
      toast.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      // Registrar al cliente como usuario (Rol = Usuario) en nuestro endpoint unificado de usuarios
      const payload = { ...createForm, rol: 'Usuario' };
      const response = await api.post('/api/usuarios', payload);
      if (response.data?.succeeded) {
        toast.success('Cliente registrado exitosamente en el sistema.');
        setShowCreateModal(false);
        setCreateForm({
          nombre: '',
          email: '',
          password: '',
          dni: '',
          telefono: '',
          direccion: ''
        });
        fetchClientes();
      } else {
        toast.error(response.data?.message || 'Error al crear el cliente.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setEditForm({
      nombre: cliente.nombre,
      dni: cliente.dni || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;

    setSubmitting(true);
    try {
      const payload = { ...editForm, rol: 'Usuario' }; // Mantiene su rol de cliente
      const response = await api.put(`/api/usuarios/${selectedCliente.id}`, payload);
      if (response.data?.succeeded) {
        toast.success('Datos del cliente actualizados correctamente.');
        setShowEditModal(false);
        fetchClientes();
      } else {
        toast.error(response.data?.message || 'Error al guardar los cambios.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCliente) return;

    try {
      const response = await api.delete(`/api/usuarios/${selectedCliente.id}`);
      if (response.data?.succeeded) {
        toast.success('El cliente ha sido eliminado físicamente con éxito.');
        setShowDeleteModal(false);
        fetchClientes();
      } else {
        toast.error(response.data?.message || 'No se pudo eliminar el cliente.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Error de servidor al eliminar.';
      toast.error(errMsg);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
  };

  const filteredClientes = clientes
    .filter(c => {
      if (filterActivo === 'Activos' && !c.activo) return false;
      if (filterActivo === 'Inactivos' && c.activo) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'nombre-asc') return a.nombre.localeCompare(b.nombre);
      if (sortOrder === 'nombre-desc') return b.nombre.localeCompare(a.nombre);
      if (sortOrder === 'fecha-recent') return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
      if (sortOrder === 'fecha-old') return new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime();
      return 0;
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full text-left space-y-lg"
    >
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md w-full">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
            <span>Gestión</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary font-semibold">Clientes</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-background font-bold tracking-tight">Directorio de Clientes</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {totalItems} cliente{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
            {searchTerm && (
              <span> · Resultados para "<span className="text-primary font-semibold">{searchTerm}</span>"</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-bold px-5 py-3 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer h-[44px] shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Registrar Cliente
        </button>
      </header>

      {/* Search and Filters */}
      <section className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm space-y-4 w-full max-w-4xl">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-sm items-center w-full">
          <div className="flex-1 relative w-full">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[20px]">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, email, DNI..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-sm w-full md:w-auto shrink-0 justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-label-md text-label-md bg-primary text-on-primary hover:bg-primary/95 transition-colors flex items-center gap-2 shadow cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Buscar
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2.5 rounded-xl font-label-md text-label-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Limpiar
              </button>
            )}
          </div>
        </form>

        {/* Advanced Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Estado:</label>
            <select
              value={filterActivo}
              onChange={(e) => setFilterActivo(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Activos">Activos</option>
              <option value="Inactivos">Inactivos</option>
            </select>
          </div>

          <div className="flex flex-1 items-center gap-2 sm:justify-end">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Ordenar:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <option value="nombre-asc">Nombre (A - Z)</option>
              <option value="nombre-desc">Nombre (Z - A)</option>
              <option value="fecha-recent">Registro (Más reciente)</option>
              <option value="fecha-old">Registro (Más antiguo)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Loading indicator */}
      {loading && clientes.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 w-full">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Cargando directorio...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center text-center gap-sm shadow-sm w-full">
          <span className="material-symbols-outlined text-[48px] text-outline-variant">person_search</span>
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">No se encontraron clientes</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {searchTerm || filterActivo !== 'Todos' ? 'Intenta con otro término de búsqueda o cambia los filtros.' : 'Aún no hay clientes registrados.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md w-full"
        >
          {filteredClientes.map((cliente) => {
            const totalCitas = citasPorUsuario[String(cliente.id)] || 0;
            return (
              <motion.div
                key={cliente.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-md cursor-pointer group relative overflow-hidden"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                {/* Card Header */}
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/15 shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">person</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-headline-md text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">
                        {cliente.nombre}
                      </h3>
                      <span className="font-label-sm text-[11px] text-on-surface-variant mt-[2px]">
                        ID: {cliente.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActivo(cliente);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cliente.activo ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          cliente.activo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-xs relative z-10 text-[13px]">
                  <div className="flex items-center gap-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                    <span className="text-primary font-semibold truncate leading-none">{cliente.email}</span>
                  </div>
                  {cliente.telefono && (
                    <div className="flex items-center gap-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">phone_iphone</span>
                      <span className="text-slate-600 dark:text-slate-300 leading-none">{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.dni && (
                    <div className="flex items-center gap-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                      <span className="text-slate-600 dark:text-slate-300 leading-none">DNI: {cliente.dni}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Stats */}
                <div className="mt-auto pt-sm border-t border-outline-variant/50 grid grid-cols-2 gap-sm relative z-10">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Citas</span>
                    <span className="text-headline-md text-slate-800 dark:text-slate-200 font-bold">{totalCitas}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Registro</span>
                    <span className="font-body-md text-slate-600 dark:text-slate-400 font-semibold">{formatDate(cliente.fechaRegistro)}</span>
                  </div>
                </div>

                {/* Card Actions overlay buttons */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-xl shadow border border-outline-variant/20 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(cliente);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Editar cliente"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(cliente);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    title="Eliminar cliente"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* MODAL CREAR CLIENTE */}
      {createPortal(
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                onClick={() => setShowCreateModal(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[90vh] text-left"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Nuevo Cliente</h3>
                    <p className="text-xs text-slate-500 mt-[2px]">Crea una nueva cuenta de cliente en el sistema.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={createForm.nombre}
                        onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                        placeholder="Ej. Juan Pérez García"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="cliente@correo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contraseña de Acceso *</label>
                      <input
                        type="password"
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">DNI / ID</label>
                        <input
                          type="text"
                          value={createForm.dni}
                          onChange={(e) => setCreateForm({ ...createForm, dni: e.target.value })}
                          placeholder="DNI"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono</label>
                        <input
                          type="text"
                          value={createForm.telefono}
                          onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                          placeholder="Ej. 999888777"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dirección Completa</label>
                      <input
                        type="text"
                        value={createForm.direccion}
                        onChange={(e) => setCreateForm({ ...createForm, direccion: e.target.value })}
                        placeholder="Dirección, Distrito"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 font-semibold text-sm text-on-primary shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting && <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>}
                      Registrar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL EDITAR CLIENTE */}
      {createPortal(
        <AnimatePresence>
          {showEditModal && selectedCliente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                onClick={() => setShowEditModal(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[90vh] text-left"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Datos del Cliente</h3>
                    <p className="text-xs text-slate-500 mt-[2px]">Actualiza el perfil y datos de contacto.</p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Correo Electrónico</span>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{selectedCliente.email}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">DNI / Identificación</label>
                        <input
                          type="text"
                          value={editForm.dni}
                          onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono</label>
                        <input
                          type="text"
                          value={editForm.telefono}
                          onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dirección Física</label>
                      <input
                        type="text"
                        value={editForm.direccion}
                        onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 font-semibold text-sm text-on-primary shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting && <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>}
                      Guardar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL ELIMINAR CLIENTE */}
      {createPortal(
        <AnimatePresence>
          {showDeleteModal && selectedCliente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                onClick={() => setShowDeleteModal(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col space-y-4 text-left"
              >
                <div className="flex items-center gap-3 text-rose-500">
                  <span className="material-symbols-outlined text-3xl font-bold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl">
                    warning
                  </span>
                  <h3 className="text-lg font-bold">¿Eliminar Cliente?</h3>
                </div>

                <div className="text-sm text-slate-500 space-y-3">
                  <p>
                    Confirmas que deseas eliminar permanentemente la cuenta de{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{selectedCliente.nombre}</strong> ({selectedCliente.email}) del sistema.
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 rounded-xl text-xs flex gap-2">
                    <span className="material-symbols-outlined text-[18px] flex-shrink-0">info</span>
                    <p>
                      <strong>Aviso de Seguridad:</strong> Si el cliente tiene citas históricas, pagos registrados o historiales
                      médicos activos de sus mascotas, el backend prevendrá la eliminación física. Te sugerimos desactivar su cuenta
                      en su lugar para bloquear accesos de forma rápida y segura.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteSubmit}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Confirmar Eliminación
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
