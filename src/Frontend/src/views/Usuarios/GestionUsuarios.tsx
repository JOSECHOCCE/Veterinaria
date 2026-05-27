import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  rol: string;
  activo: boolean;
  fechaRegistro: string;
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRol, setSelectedRol] = useState('Todos');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Usuario seleccionado para editar/eliminar
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Formularios
  const [createForm, setCreateForm] = useState({
    nombre: '',
    email: '',
    password: '',
    dni: '',
    telefono: '',
    direccion: '',
    rol: 'Recepcionista'
  });

  const [editForm, setEditForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    direccion: '',
    rol: 'Usuario'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/usuarios');
      if (response.data?.succeeded) {
        setUsuarios(response.data.data);
      } else {
        setError('No se pudieron recuperar los usuarios.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleToggleActivo = async (user: Usuario) => {
    try {
      const response = await api.put(`/api/usuarios/${user.id}/estado`, { activo: !user.activo });
      if (response.data?.succeeded) {
        setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, activo: !u.activo } : u));
        showToast(`Usuario ${user.email} ${!user.activo ? 'activado' : 'desactivado'} con éxito.`);
      } else {
        showToast(response.data?.message || 'Error al actualizar el estado.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al actualizar el estado.', 'error');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre || !createForm.email || !createForm.password || !createForm.rol) {
      showToast('Por favor, rellene todos los campos obligatorios.', 'warning');
      return;
    }

    try {
      const response = await api.post('/api/usuarios', createForm);
      if (response.data?.succeeded) {
        showToast('Usuario interno creado y registrado exitosamente.', 'success');
        setShowCreateModal(false);
        setCreateForm({
          nombre: '',
          email: '',
          password: '',
          dni: '',
          telefono: '',
          direccion: '',
          rol: 'Recepcionista'
        });
        fetchUsuarios();
      } else {
        showToast(response.data?.message || 'Error al crear el usuario.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al conectar con el servidor.', 'error');
    }
  };

  const handleEditClick = (user: Usuario) => {
    setSelectedUser(user);
    setEditForm({
      nombre: user.nombre,
      dni: user.dni || '',
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      rol: user.rol
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await api.put(`/api/usuarios/${selectedUser.id}`, editForm);
      if (response.data?.succeeded) {
        showToast('Datos de usuario actualizados correctamente.', 'success');
        setShowEditModal(false);
        fetchUsuarios();
      } else {
        showToast(response.data?.message || 'Error al guardar los cambios.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al guardar los cambios.', 'error');
    }
  };

  const handleDeleteClick = (user: Usuario) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.delete(`/api/usuarios/${selectedUser.id}`);
      if (response.data?.succeeded) {
        showToast('El usuario ha sido eliminado físicamente del sistema.', 'success');
        setShowDeleteModal(false);
        fetchUsuarios();
      } else {
        showToast(response.data?.message || 'No se pudo eliminar el usuario.', 'error');
      }
    } catch (err: any) {
      // Atrapar mensajes del backend que impiden eliminación física por seguridad
      const errMsg = err.response?.data?.message || 'Error de servidor al intentar eliminar.';
      showToast(errMsg, 'error');
      setShowDeleteModal(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.dni && u.dni.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRol = selectedRol === 'Todos' || u.rol === selectedRol;

    return matchesSearch && matchesRol;
  });

  const getRolBadgeClass = (rol: string) => {
    switch (rol) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40';
      case 'Veterinario':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40';
      case 'Recepcionista':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/40';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : toast.type === 'error'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}
          >
            <span className="material-symbols-outlined font-bold">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'warning'}
            </span>
            <p className="font-semibold text-sm">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Control de Personal y Cuentas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestiona accesos, crea cuentas de veterinarios y recepcionistas, y supervisa usuarios registrados.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-bold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Registrar Personal
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, correo electrónico o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="w-full md:w-60 flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rol:</label>
          <select
            value={selectedRol}
            onChange={(e) => setSelectedRol(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
          >
            <option value="Todos">Todos los roles</option>
            <option value="Admin">Administrador (Admin)</option>
            <option value="Veterinario">Veterinario</option>
            <option value="Recepcionista">Recepcionista</option>
            <option value="Usuario">Usuario (Cliente)</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-semibold animate-pulse">Cargando cuentas...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
            <p className="font-semibold text-lg">{error}</p>
            <button 
              onClick={fetchUsuarios}
              className="mt-4 text-primary hover:underline text-sm font-bold flex items-center justify-center gap-1 mx-auto"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
            </button>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">group_off</span>
            <p className="font-semibold text-lg">No se encontraron usuarios</p>
            <p className="text-sm text-slate-400">Intenta buscar con otros términos o filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6">Identificación</th>
                  <th className="py-4 px-6">Rol</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Registro</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <AnimatePresence>
                  {filteredUsuarios.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm bg-gradient-to-tr ${
                            user.rol === 'Admin' 
                              ? 'from-purple-500 to-indigo-600' 
                              : user.rol === 'Veterinario'
                              ? 'from-blue-500 to-cyan-600'
                              : user.rol === 'Recepcionista'
                              ? 'from-emerald-500 to-teal-600'
                              : 'from-slate-400 to-slate-600'
                          }`}>
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              {user.nombre}
                            </h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            DNI: {user.dni || 'No registrado'}
                          </span>
                          <span className="text-xs text-slate-400 mt-[2px]">
                            Tel: {user.telefono || 'N/D'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider leading-none ${getRolBadgeClass(user.rol)}`}>
                          {user.rol}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActivo(user)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              user.activo ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                user.activo ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-semibold ${user.activo ? 'text-primary' : 'text-slate-400'}`}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(user.fechaRegistro).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title="Editar usuario"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR */}
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
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Nuevo Personal</h3>
                  <p className="text-xs text-slate-500 mt-[2px]">Crea una nueva cuenta de acceso administrativo o médico.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={createForm.nombre}
                      onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                      placeholder="Ej. Dr. Carlos Mendoza"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="correo@veterinaria.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contraseña Inicial *</label>
                    <input
                      type="password"
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Min. 6 caracteres"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">DNI / Identificación</label>
                    <input
                      type="text"
                      value={createForm.dni}
                      onChange={(e) => setCreateForm({ ...createForm, dni: e.target.value })}
                      placeholder="DNI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={createForm.telefono}
                      onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                      placeholder="Ej. 987654321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dirección Física</label>
                    <input
                      type="text"
                      value={createForm.direccion}
                      onChange={(e) => setCreateForm({ ...createForm, direccion: e.target.value })}
                      placeholder="Dirección, Distrito"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rol Asignado *</label>
                    <select
                      value={createForm.rol}
                      onChange={(e) => setCreateForm({ ...createForm, rol: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                    >
                      <option value="Recepcionista">Recepcionista (Control de Citas/Pagos)</option>
                      <option value="Veterinario">Veterinario (Atención Clínica/Consultas)</option>
                      <option value="Admin">Administrador (Control Total)</option>
                      <option value="Usuario">Usuario (Cliente Normal)</option>
                    </select>
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
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-semibold text-sm text-on-primary shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Crear Cuenta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDITAR */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
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
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Información de Cuenta</h3>
                  <p className="text-xs text-slate-500 mt-[2px]">Actualiza el perfil y los accesos del usuario.</p>
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
                  <div className="bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Correo Electrónico</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{selectedUser.email}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">DNI / Identificación</label>
                      <input
                        type="text"
                        value={editForm.dni}
                        onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono</label>
                      <input
                        type="text"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dirección Física</label>
                    <input
                      type="text"
                      value={editForm.direccion}
                      onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rol del Sistema *</label>
                    <select
                      value={editForm.rol}
                      onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                      disabled={selectedUser.email === 'admin@veterinaria.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Veterinario">Veterinario</option>
                      <option value="Admin">Administrador (Admin)</option>
                      <option value="Usuario">Usuario (Cliente)</option>
                    </select>
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
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-semibold text-sm text-on-primary shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMAR ELIMINAR */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
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
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <span className="material-symbols-outlined text-3xl font-bold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl">
                  warning
                </span>
                <h3 className="text-lg font-bold">¿Deseas eliminar este usuario?</h3>
              </div>

              <div className="text-sm text-slate-500 space-y-3">
                <p>
                  Estás a punto de eliminar físicamente la cuenta de{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{selectedUser.email}</strong> del sistema.
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 rounded-xl text-xs flex gap-2">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">info</span>
                  <p>
                    <strong>Nota de Seguridad:</strong> Si este usuario posee mascotas con historial de citas, historiales médicos,
                    triajes o registros de pagos, el backend bloqueará la eliminación física. En esos casos, se recomienda utilizar
                    la <strong>desactivación lógica</strong> (el switch de estado activo/inactivo).
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
      </AnimatePresence>
    </div>
  );
}
