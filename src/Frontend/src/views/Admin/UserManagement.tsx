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
  const itemsPerPage = 5;

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

  const getRoleBadgeClass = (rol: string) => {
    switch (rol) {
      case 'Admin':
        return 'bg-primary-container text-on-primary-container border border-primary/20';
      case 'Veterinario':
        return 'bg-tertiary-container text-on-tertiary-container border border-tertiary/20';
      case 'Recepcionista':
        return 'bg-secondary-container text-on-secondary-container border border-secondary/20';
      default:
        return 'bg-surface-variant text-on-surface-variant border border-hairline';
    }
  };

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case 'Admin':
        return 'Administrador';
      case 'Veterinario':
        return 'Veterinario';
      case 'Recepcionista':
        return 'Recepcionista';
      case 'Usuario':
        return 'Cliente / Usuario';
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
    <div className="max-w-7xl w-full mx-auto py-md flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-xl">
        <div>
          <h2 className="font-display-lg text-display-lg text-ink">Gestión de Usuarios Internos</h2>
          <p className="font-body-md text-body-md text-body-muted mt-2 max-w-2xl">
            Administre el acceso, los roles y la información del personal de la clínica. Mantenga actualizado el directorio para asegurar operaciones fluidas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary-active text-on-primary font-button text-button py-3 px-6 rounded-lg transition-colors whitespace-nowrap shadow-sm hover:shadow flex items-center gap-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear usuario interno
        </button>
      </div>

      {/* Toolbar Section */}
      <div className="bg-surface-soft border border-hairline rounded-xl p-md mb-lg flex flex-col md:flex-row gap-md items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-body-muted">
            search
          </span>
          <input
            className="w-full bg-canvas border border-hairline rounded-lg pl-11 pr-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            placeholder="Buscar usuario..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-sm w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="font-caption text-caption text-body-muted hidden sm:inline">Filtrar:</span>
          {['Todos', 'Admin', 'Recepcionista', 'Veterinario', 'Usuario'].map((rol) => (
            <button
              key={rol}
              onClick={() => setRoleFilter(rol)}
              className={`font-button text-button py-1.5 px-3.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === rol
                  ? 'bg-primary border-primary text-on-primary shadow-sm font-semibold'
                  : 'bg-canvas border-hairline text-ink hover:bg-surface-variant/30'
              }`}
            >
              {rol === 'Todos' ? 'Todos' : getRoleLabel(rol)}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden shadow-sm">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center p-xl text-center my-xl">
            <span className="material-symbols-outlined text-body-muted text-[48px] mb-sm">search_off</span>
            <h3 className="font-title-lg text-title-lg text-ink mb-xs">No se encontraron usuarios</h3>
            <p className="font-body-sm text-body-sm text-body-muted max-w-sm">
              Pruebe a cambiar los criterios de búsqueda o de filtrado de roles para encontrar al personal.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-surface-soft">
                    <th className="py-4 px-6 font-title-sm text-title-sm text-ink font-semibold">Usuario</th>
                    <th className="py-4 px-6 font-title-sm text-title-sm text-ink font-semibold">Rol Asignado</th>
                    <th className="py-4 px-6 font-title-sm text-title-sm text-ink font-semibold">Estado</th>
                    <th className="py-4 px-6 font-title-sm text-title-sm text-ink font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {paginatedUsuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className={`hover:bg-surface-soft/50 transition-colors ${
                        !usuario.activo ? 'bg-surface-variant/20' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-md">
                          {/* Circle Avatar with Initials */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-title-sm border border-hairline shrink-0 shadow-sm ${
                              usuario.activo ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-fixed text-secondary'
                            }`}
                          >
                            {getInitials(usuario.nombre)}
                          </div>
                          <div>
                            <div
                              className={`font-title-sm text-title-sm ${
                                usuario.activo ? 'text-ink font-medium' : 'text-body-muted'
                              }`}
                            >
                              {usuario.nombre}
                            </div>
                            <div className="font-caption text-caption text-body-muted mt-xxs">
                              {usuario.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full font-caption text-caption font-medium shadow-sm ${getRoleBadgeClass(
                            usuario.rol
                          )}`}
                        >
                          {getRoleLabel(usuario.rol)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-xs">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              usuario.activo ? 'bg-success animate-pulse' : 'bg-secondary-fixed-dim'
                            }`}
                          />
                          <span
                            className={`font-body-sm text-body-sm ${
                              usuario.activo ? 'text-ink font-medium' : 'text-body-muted'
                            }`}
                          >
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-xs">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(usuario)}
                            className="p-2 text-body-muted hover:text-primary transition-colors rounded-lg hover:bg-surface-variant/40 cursor-pointer"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleOpenStatusConfirm(usuario)}
                            className={`p-2 transition-colors rounded-lg hover:bg-surface-variant/40 cursor-pointer ${
                              usuario.activo ? 'text-body-muted hover:text-error' : 'text-body-muted hover:text-success'
                            }`}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {usuario.activo ? 'block' : 'check_circle'}
                            </span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleOpenDeleteConfirm(usuario)}
                            className="p-2 text-body-muted hover:text-error transition-colors rounded-lg hover:bg-surface-variant/40 cursor-pointer"
                            title="Eliminar físicamente"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
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
              <div className="bg-surface-soft border-t border-hairline p-4 flex items-center justify-between">
                <span className="font-caption text-caption text-body-muted">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} usuarios
                </span>
                <div className="flex items-center gap-xs">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-hairline rounded bg-canvas text-ink hover:bg-surface-variant/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer font-caption text-caption ${
                        currentPage === idx + 1
                          ? 'bg-primary text-on-primary font-semibold shadow-sm'
                          : 'bg-transparent text-ink hover:bg-surface-variant/30'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1 border border-hairline rounded bg-canvas text-ink hover:bg-surface-variant/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
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
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-canvas w-full max-w-lg rounded-2xl border border-hairline shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-soft">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">person_add</span>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold">Crear Usuario Interno</h3>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                  className="p-1 rounded-full text-body-muted hover:text-ink hover:bg-surface-variant/30 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-md">
                {actionError && (
                  <div className="p-lg bg-error-container/20 border border-error-container text-error rounded-xl flex items-start gap-sm">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                    <div className="font-body-sm text-body-sm">{actionError}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-md">
                  <div>
                    <label className="block font-title-sm text-title-sm text-ink mb-xs">
                      Nombre Completo <span className="text-error">*</span>
                    </label>
                    <input
                      className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Ej. Dr. Sebastián Varela"
                      type="text"
                      required
                      value={createNombre}
                      onChange={(e) => setCreateNombre(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <div>
                      <label className="block font-title-sm text-title-sm text-ink mb-xs">
                        Email / Usuario <span className="text-error">*</span>
                      </label>
                      <input
                        className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="s.varela@vetcare.pro"
                        type="email"
                        required
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-title-sm text-title-sm text-ink mb-xs">
                        Contraseña <span className="text-error">*</span>
                      </label>
                      <input
                        className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Mínimo 6 caracteres"
                        type="password"
                        required
                        minLength={6}
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <div>
                      <label className="block font-title-sm text-title-sm text-ink mb-xs">DNI / ID</label>
                      <input
                        className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Ej. 12345678X"
                        type="text"
                        value={createDni}
                        onChange={(e) => setCreateDni(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-title-sm text-title-sm text-ink mb-xs">Teléfono</label>
                      <input
                        className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Ej. 611223344"
                        type="tel"
                        value={createTelefono}
                        onChange={(e) => setCreateTelefono(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-title-sm text-title-sm text-ink mb-xs">Dirección</label>
                    <input
                      className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Ej. Calle Principal 123"
                      type="text"
                      value={createDireccion}
                      onChange={(e) => setCreateDireccion(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-title-sm text-title-sm text-ink mb-xs">Rol de Acceso</label>
                    <select
                      className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                <div className="flex justify-end items-center gap-md pt-lg border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 font-button text-button text-ink bg-transparent border border-hairline rounded-lg hover:bg-surface-soft transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 font-button text-button text-on-primary bg-primary rounded-lg hover:bg-primary-active shadow-sm transition-all flex items-center justify-center gap-xs disabled:opacity-50 cursor-pointer"
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
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-canvas w-full max-w-lg rounded-2xl border border-hairline shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-soft">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">edit_note</span>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold">Editar Usuario Interno</h3>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  disabled={submitting}
                  className="p-1 rounded-full text-body-muted hover:text-ink hover:bg-surface-variant/30 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-md">
                {actionError && (
                  <div className="p-lg bg-error-container/20 border border-error-container text-error rounded-xl flex items-start gap-sm">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                    <div className="font-body-sm text-body-sm">{actionError}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-md">
                  <div>
                    <label className="block font-title-sm text-title-sm text-ink mb-xs">Email / Usuario</label>
                    <input
                      className="w-full bg-surface-soft border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-body-muted outline-none cursor-not-allowed"
                      type="text"
                      disabled
                      value={selectedUsuario.email}
                    />
                    <p className="font-caption text-caption text-body-muted mt-xxs">
                      El correo electrónico no puede ser modificado por seguridad.
                    </p>
                  </div>

                  <div>
                    <label className="block font-title-sm text-title-sm text-ink mb-xs">
                      Nombre Completo <span className="text-error">*</span>
                    </label>
                    <input
                      className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Ej. Dr. Sebastián Varela"
                      type="text"
                      required
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <div>
                      <label className="block font-title-sm text-title-sm text-ink mb-xs">DNI / ID</label>
                      <input
                        className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Ej. 12345678X"
                        type="text"
                        value={editDni}
                        onChange={(e) => setEditDni(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-title-sm text-title-sm text-ink mb-xs">Teléfono</label>
                      <input
                        className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Ej. 611223344"
                        type="tel"
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-title-sm text-title-sm text-ink mb-xs">Dirección</label>
                    <input
                      className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Ej. Calle Principal 123"
                      type="text"
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-title-sm text-title-sm text-ink mb-xs">Rol de Acceso</label>
                    <select
                      className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                <div className="flex justify-end items-center gap-md pt-lg border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 font-button text-button text-ink bg-transparent border border-hairline rounded-lg hover:bg-surface-soft transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 font-button text-button text-on-primary bg-primary rounded-lg hover:bg-primary-active shadow-sm transition-all flex items-center justify-center gap-xs disabled:opacity-50 cursor-pointer"
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
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-canvas w-full max-w-md rounded-2xl border border-hairline shadow-xl p-6 relative overflow-hidden"
            >
              <div className="flex items-start gap-md mb-lg">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    selectedUsuario.activo ? 'bg-error-container text-error' : 'bg-success/20 text-success'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {selectedUsuario.activo ? 'block' : 'check_circle'}
                  </span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold mb-xs">
                    ¿{selectedUsuario.activo ? 'Desactivar' : 'Activar'} cuenta de usuario?
                  </h3>
                  <p className="font-body-sm text-body-sm text-body-muted leading-relaxed">
                    Está a punto de cambiar el estado de la cuenta de{' '}
                    <strong className="text-ink">{selectedUsuario.nombre}</strong> (
                    {selectedUsuario.email}) a{' '}
                    <strong className="text-ink">{selectedUsuario.activo ? 'Inactivo' : 'Activo'}</strong>.
                  </p>
                  {selectedUsuario.activo && (
                    <p className="font-body-sm text-body-sm text-error font-medium mt-sm leading-relaxed">
                      El usuario ya no podrá iniciar sesión en la plataforma hasta que se reactive.
                    </p>
                  )}
                </div>
              </div>

              {actionError && (
                <div className="mb-lg p-md bg-error-container/20 border border-error-container text-error rounded-xl flex items-start gap-sm">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <div className="font-body-sm text-body-sm">{actionError}</div>
                </div>
              )}

              <div className="flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setIsStatusConfirmOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 font-button text-button text-ink bg-transparent border border-hairline rounded-lg hover:bg-surface-soft transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={submitting}
                  className={`px-4 py-2 font-button text-button text-on-primary rounded-lg shadow-sm hover:shadow transition-all cursor-pointer ${
                    selectedUsuario.activo
                      ? 'bg-error hover:bg-error/90'
                      : 'bg-success hover:bg-success/90'
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
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-canvas w-full max-w-md rounded-2xl border border-hairline shadow-xl p-6 relative overflow-hidden"
            >
              <div className="flex items-start gap-md mb-lg">
                <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold mb-xs">
                    ¿Eliminar usuario físicamente?
                  </h3>
                  <p className="font-body-sm text-body-sm text-body-muted leading-relaxed">
                    Esta acción es irreversible y eliminará completamente a{' '}
                    <strong className="text-ink">{selectedUsuario.nombre}</strong> (
                    {selectedUsuario.email}) del sistema.
                  </p>
                  <p className="font-body-sm text-body-sm text-error font-medium mt-sm leading-relaxed">
                    Solo se puede proceder con la eliminación si la cuenta no posee ningún tipo de historial clínico, citas previas o facturas contables registradas.
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="mb-lg p-lg bg-accent-amber/10 border border-accent-amber text-body-strong rounded-xl flex flex-col gap-sm">
                  <div className="flex items-center gap-xs text-error font-semibold">
                    <span className="material-symbols-outlined text-[20px] shrink-0">report</span>
                    <h4 className="font-title-sm text-title-sm font-bold">Restricción de Seguridad</h4>
                  </div>
                  <p className="font-body-sm text-body-sm text-body-muted leading-relaxed">
                    {actionError}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 font-button text-button text-ink bg-transparent border border-hairline rounded-lg hover:bg-surface-soft transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUsuario}
                  disabled={submitting}
                  className="px-4 py-2 font-button text-button text-on-primary bg-error hover:bg-error/90 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
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
