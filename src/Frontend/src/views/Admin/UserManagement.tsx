import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usuariosService } from '../../services/usuarios.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

interface UsuarioDetailsDto {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  dni?: string;
  rol: string;
  activo: boolean;
  fechaRegistro: string;
}

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState<UsuarioDetailsDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('Todos');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;

  // Selected User for Actions
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioDetailsDto | null>(null);

  // Modals Open States
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  // Submission States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Creation Form Fields
  const [createNombre, setCreateNombre] = useState<string>('');
  const [createEmail, setCreateEmail] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('');
  const [createDni, setCreateDni] = useState<string>('');
  const [createTelefono, setCreateTelefono] = useState<string>('');
  const [createDireccion, setCreateDireccion] = useState<string>('');
  const [createRol, setCreateRol] = useState<string>('Recepcionista');

  // Editing Form Fields
  const [editNombre, setEditNombre] = useState<string>('');
  const [editDni, setEditDni] = useState<string>('');
  const [editTelefono, setEditTelefono] = useState<string>('');
  const [editDireccion, setEditDireccion] = useState<string>('');
  const [editRol, setEditRol] = useState<string>('Recepcionista');

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usuariosService.getUsuarios();
      if (response.success && Array.isArray(response.data)) {
        setUsuarios(response.data);
      } else {
        setUsuarios(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('No se pudieron cargar los usuarios del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Helpers
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter((n) => n.length > 0 && !n.toLowerCase().startsWith('dr') && !n.toLowerCase().startsWith('dra'))
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US';
  };

  const getAvatarUrl = (user: UsuarioDetailsDto) => {
    const email = user.email.toLowerCase();
    const nombre = user.nombre.toLowerCase();
    if (email.includes('carlos.m') || nombre.includes('carlos mendoza')) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuBYoL-V_KM_kaHQaAoGkBTtu98HNig3flbiz8xBvaRi0vFSoDW9iNE1Pt-7z0g07DtskOZ6-nxCaCYvaOh2WdBSje1k06RtSTmBnJb8MvrKwM-QysY7Hd2-20UDUZYnim7_4dinRNNw8oky4xB_qIaPdZm4Y0gev90w_e3eikoNYtQqq68nMYBvrSdAXQKhDQxQDoZGv6ppSf0fwP6-p8xlT7-ZT4em9r1HpT0r8cQSznRbE3OsyvydeA";
    }
    if (email.includes('admin') || nombre.includes('ana rojas')) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuBEpVWVioMIOEPIoLoc-glU0BuHqYxpZwV-7apQlCwyo7If9lP_iHCYpvCKS0_n6o_qHl9KNIQPHZRyZDUZrPQSM9UojFzZ9LrqEqQO0shyKqAm4UQcN9AD6T7QW1OdelIXDoffi1GHQk73rzZdzYr73dV4Q_xrWvu0Yki5p1YJ-JY2nDh1ke9LvPEXbRsu13H6ZIcZMvbilA7Xk1qRrmMQxJrCUTMJ0ztQGjmXcTtI46447Ix4letcsA";
    }
    return null;
  };

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case 'Admin':
        return 'Admin';
      case 'Veterinario':
        return 'Veterinario';
      case 'Recepcionista':
        return 'Recepcionista';
      case 'Usuario':
        return 'Cliente';
      default:
        return rol;
    }
  };

  // Actions
  const handleOpenCreate = () => {
    setCreateNombre('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateDni('');
    setCreateTelefono('');
    setCreateDireccion('');
    setCreateRol('Recepcionista');
    setActionError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNombre.trim() || !createEmail.trim() || !createPassword.trim()) {
      toast.error('Por favor, rellene los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const data = {
        nombre: createNombre.trim(),
        email: createEmail.trim(),
        password: createPassword.trim(),
        dni: createDni.trim() || null,
        telefono: createTelefono.trim() || null,
        direccion: createDireccion.trim() || null,
        rol: createRol,
      };
      const response = await usuariosService.crearUsuario(data);
      if (response.success) {
        toast.success('Usuario creado exitosamente');
        setIsCreateOpen(false);
        fetchUsuarios();
      } else {
        setActionError(response.message || 'Error al crear el usuario.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Error al conectar con el servidor.';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (usuario: UsuarioDetailsDto) => {
    setSelectedUsuario(usuario);
    setEditNombre(usuario.nombre || '');
    setEditDni(usuario.dni || '');
    setEditTelefono(usuario.telefono || '');
    setEditDireccion(usuario.direccion || '');
    setEditRol(usuario.rol || 'Recepcionista');
    setActionError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsuario) return;
    if (!editNombre.trim()) {
      toast.error('Por favor, ingrese el nombre del usuario.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const data = {
        nombre: editNombre.trim(),
        dni: editDni.trim() || null,
        telefono: editTelefono.trim() || null,
        direccion: editDireccion.trim() || null,
        rol: editRol,
      };
      const response = await usuariosService.editarUsuario(selectedUsuario.id, data);
      if (response.success) {
        toast.success('Usuario actualizado correctamente');
        setIsEditOpen(false);
        fetchUsuarios();
      } else {
        setActionError(response.message || 'Error al actualizar el usuario.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Error al conectar con el servidor.';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusConfirm = (usuario: UsuarioDetailsDto) => {
    setSelectedUsuario(usuario);
    setActionError(null);
    setIsStatusConfirmOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedUsuario) return;

    setSubmitting(true);
    setActionError(null);
    try {
      const response = await usuariosService.cambiarEstado(selectedUsuario.id, !selectedUsuario.activo);
      if (response.success) {
        toast.success(`Usuario ${!selectedUsuario.activo ? 'activado' : 'desactivado'} con éxito`);
        setIsStatusConfirmOpen(false);
        fetchUsuarios();
      } else {
        setActionError(response.message || 'Error al cambiar el estado del usuario.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Error de comunicación.';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (usuario: UsuarioDetailsDto) => {
    setSelectedUsuario(usuario);
    setActionError(null);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUsuario = async () => {
    if (!selectedUsuario) return;

    setSubmitting(true);
    setActionError(null);
    try {
      const response = await usuariosService.eliminarUsuario(selectedUsuario.id);
      if (response.success) {
        toast.success('Usuario eliminado físicamente con éxito');
        setIsDeleteConfirmOpen(false);
        fetchUsuarios();
      } else {
        setActionError(response.message || 'No se puede eliminar el usuario.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'No se pudo eliminar el usuario de forma física.';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filters & Search logic
  const filteredUsuarios = usuarios.filter((user) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      user.nombre.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      getRoleLabel(user.rol).toLowerCase().includes(term);

    const matchesRole = roleFilter === 'Todos' || user.rol === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const totalItems = filteredUsuarios.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <Spinner message="Cargando directorio de usuarios internos..." />;
  }

  if (error) {
    return <ErrorMessage title="Error al cargar usuarios" message={error} onRetry={fetchUsuarios} />;
  }

  return (
    <div className="p-6 md:p-8 flex-1 w-full max-w-container-max mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Gestión de Usuarios</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Administra el acceso y roles del personal de la clínica.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-primary text-on-primary rounded-lg h-12 px-6 flex items-center gap-2 hover:bg-surface-tint transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span className="font-label-md text-label-md">Crear usuario</span>
        </button>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest p-2 rounded-xl ambient-shadow">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { value: 'Todos', label: 'Todos' },
            { value: 'Veterinario', label: 'Veterinarios' },
            { value: 'Recepcionista', label: 'Recepcionistas' },
            { value: 'Admin', label: 'Admin' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRoleFilter(item.value)}
              className={`px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors cursor-pointer border-none ${
                roleFilter === item.value
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface transition-all outline-none"
            placeholder="Buscar por nombre o correo..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden flex-1 border border-outline-variant/10">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center my-12">
            <span className="material-symbols-outlined text-on-surface-variant text-[48px] mb-4">search_off</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-1">No se encontraron usuarios</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Pruebe a cambiar los criterios de búsqueda o de filtrado de roles para encontrar al personal.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedUsuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className={`hover:bg-surface-bright/50 transition-colors group ${
                        !usuario.activo ? 'bg-surface-container-lowest/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-4 ${!usuario.activo ? 'opacity-60' : ''}`}>
                          {/* Circle Avatar or Image */}
                          {getAvatarUrl(usuario) ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container shrink-0">
                              <img
                                src={getAvatarUrl(usuario) || undefined}
                                alt={`Avatar ${usuario.nombre}`}
                                className={`w-full h-full object-cover ${!usuario.activo ? 'grayscale' : ''}`}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-headline-md shrink-0">
                              {getInitials(usuario.nombre)}
                            </div>
                          )}
                          <div>
                            <div className="font-body-lg text-body-lg text-on-surface font-semibold">
                              {usuario.nombre}
                            </div>
                            <div className="font-body-md text-body-md text-on-surface-variant text-sm">
                              {usuario.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${
                            usuario.rol === 'Admin'
                              ? 'bg-surface-variant text-on-surface-variant'
                              : usuario.rol === 'Veterinario'
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-tertiary-container text-on-tertiary-container'
                          }`}
                        >
                          {getRoleLabel(usuario.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {usuario.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-[#e6fffa] text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-variant text-on-surface-variant">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(usuario)}
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleOpenStatusConfirm(usuario)}
                            className={`p-2 transition-colors rounded-lg cursor-pointer ${
                              usuario.activo
                                ? 'text-on-surface-variant hover:text-error hover:bg-error-container/50'
                                : 'text-on-surface-variant hover:text-primary hover:bg-primary-container/20'
                            }`}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {usuario.activo ? 'block' : 'check_circle'}
                            </span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleOpenDeleteConfirm(usuario)}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/50 transition-colors rounded-lg cursor-pointer"
                            title="Eliminar físicamente"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} usuarios
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 rounded flex items-center justify-center font-label-sm text-label-sm transition-all cursor-pointer ${
                        currentPage === idx + 1
                          ? 'bg-primary text-on-primary font-semibold'
                          : 'text-on-surface hover:bg-surface-variant'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* CREATE USER MODAL */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsCreateOpen(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[6px]"
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">person_add</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Crear Usuario Interno</h3>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                  className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {actionError && (
                  <div className="p-4 bg-error-container/20 border border-error-container text-error rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                    <div className="font-body-sm text-body-sm">{actionError}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">
                      Nombre Completo <span className="text-error">*</span>
                    </label>
                    <input
                      className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="Ej. Dr. Sebastián Varela"
                      type="text"
                      required
                      value={createNombre}
                      onChange={(e) => setCreateNombre(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1">
                        Email / Usuario <span className="text-error">*</span>
                      </label>
                      <input
                        className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                        placeholder="s.varela@vetcare.pro"
                        type="email"
                        required
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1">
                        Contraseña <span className="text-error">*</span>
                      </label>
                      <input
                        className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                        placeholder="Mínimo 6 caracteres"
                        type="password"
                        required
                        minLength={6}
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1">DNI / ID</label>
                      <input
                        className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                        placeholder="Ej. 12345678X"
                        type="text"
                        value={createDni}
                        onChange={(e) => setCreateDni(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1">Teléfono</label>
                      <input
                        className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                        placeholder="Ej. 611223344"
                        type="tel"
                        value={createTelefono}
                        onChange={(e) => setCreateTelefono(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Dirección</label>
                    <input
                      className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="Ej. Calle Principal 123"
                      type="text"
                      value={createDireccion}
                      onChange={(e) => setCreateDireccion(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Rol de Acceso</label>
                    <select
                      className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={createRol}
                      onChange={(e) => setCreateRol(e.target.value)}
                    >
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Veterinario">Veterinario</option>
                      <option value="Admin">Administrador</option>
                      <option value="Usuario">Cliente / Usuario</option>
                    </select>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end items-center gap-4 pt-6 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={submitting}
                    className="px-5 h-11 flex items-center justify-center font-label-md text-label-md text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-all cursor-pointer border-none"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 h-11 flex items-center justify-center font-label-md text-label-md text-on-primary bg-primary rounded-lg hover:bg-surface-tint shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer border-none"
                  >
                    {submitting ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {isEditOpen && selectedUsuario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsEditOpen(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[6px]"
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">edit_note</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Editar Usuario Interno</h3>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  disabled={submitting}
                  className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {actionError && (
                  <div className="p-4 bg-error-container/20 border border-error-container text-error rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                    <div className="font-body-sm text-body-sm">{actionError}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Email / Usuario</label>
                    <input
                      className="w-full h-11 bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface-variant outline-none cursor-not-allowed"
                      type="text"
                      disabled
                      value={selectedUsuario.email}
                    />
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                      El correo electrónico no puede ser modificado por seguridad.
                    </p>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">
                      Nombre Completo <span className="text-error">*</span>
                    </label>
                    <input
                      className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="Ej. Dr. Sebastián Varela"
                      type="text"
                      required
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1">DNI / ID</label>
                      <input
                        className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                        placeholder="Ej. 12345678X"
                        type="text"
                        value={editDni}
                        onChange={(e) => setEditDni(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1">Teléfono</label>
                      <input
                        className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                        placeholder="Ej. 611223344"
                        type="tel"
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Dirección</label>
                    <input
                      className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="Ej. Calle Principal 123"
                      type="text"
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface mb-1">Rol de Acceso</label>
                    <select
                      className="w-full h-11 bg-surface border border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={editRol}
                      onChange={(e) => setEditRol(e.target.value)}
                    >
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Veterinario">Veterinario</option>
                      <option value="Admin">Administrador</option>
                      <option value="Usuario">Cliente / Usuario</option>
                    </select>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end items-center gap-4 pt-6 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    disabled={submitting}
                    className="px-5 h-11 flex items-center justify-center font-label-md text-label-md text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-all cursor-pointer border-none"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 h-11 flex items-center justify-center font-label-md text-label-md text-on-primary bg-primary rounded-lg hover:bg-surface-tint shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer border-none"
                  >
                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* STATUS CHANGE CONFIRMATION MODAL */}
        {isStatusConfirmOpen && selectedUsuario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsStatusConfirmOpen(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[6px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant/30 shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    selectedUsuario.activo ? 'bg-error-container text-error' : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {selectedUsuario.activo ? 'block' : 'check_circle'}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-1">
                    ¿{selectedUsuario.activo ? 'Desactivar' : 'Activar'} cuenta?
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Está a punto de cambiar el estado de la cuenta de{' '}
                    <strong className="text-on-surface font-semibold">{selectedUsuario.nombre}</strong> (
                    {selectedUsuario.email}) a{' '}
                    <strong className="text-on-surface font-semibold">{selectedUsuario.activo ? 'Inactivo' : 'Activo'}</strong>.
                  </p>
                  {selectedUsuario.activo && (
                    <p className="font-body-sm text-body-sm text-error font-medium mt-2 leading-relaxed">
                      El usuario ya no podrá iniciar sesión en la plataforma hasta que se reactive.
                    </p>
                  )}
                </div>
              </div>

              {actionError && (
                <div className="mb-6 p-4 bg-error-container/20 border border-error-container text-error rounded-xl flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <div className="font-body-sm text-body-sm">{actionError}</div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsStatusConfirmOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 font-label-md text-label-md text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-all cursor-pointer border-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={submitting}
                  className={`px-4 py-2 font-label-md text-label-md text-white rounded-lg shadow-sm hover:shadow transition-all cursor-pointer border-none ${
                    selectedUsuario.activo
                      ? 'bg-error hover:bg-error/95'
                      : 'bg-primary hover:bg-surface-tint'
                  }`}
                >
                  {submitting ? 'Procesando...' : selectedUsuario.activo ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {isDeleteConfirmOpen && selectedUsuario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[6px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant/30 shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-1">
                    ¿Eliminar usuario físicamente?
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Esta acción es irreversible y eliminará completamente a{' '}
                    <strong className="text-on-surface font-semibold">{selectedUsuario.nombre}</strong> (
                    {selectedUsuario.email}) del sistema.
                  </p>
                  <p className="font-body-sm text-body-sm text-error font-medium mt-2 leading-relaxed">
                    Solo se puede proceder con la eliminación si la cuenta no posee ningún tipo de historial clínico, citas previas o facturas contables registradas.
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="mb-6 p-4 bg-tertiary-container/20 border border-tertiary-container text-on-surface rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-error font-semibold">
                    <span className="material-symbols-outlined text-[20px] shrink-0">report</span>
                    <h4 className="font-label-md text-label-md font-bold">Restricción de Seguridad</h4>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {actionError}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 font-label-md text-label-md text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-all cursor-pointer border-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUsuario}
                  disabled={submitting}
                  className="px-4 py-2 font-label-md text-label-md text-white bg-error hover:bg-error/95 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer border-none"
                >
                  {submitting ? 'Eliminando...' : 'Eliminar Físicamente'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
