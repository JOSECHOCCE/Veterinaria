import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsuarios } from '../../hooks/useUsuarios';

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

export default function UserManagement() {
  const { 
    usuarios, 
    loading, 
    error: apiError, 
    fetchUsuarios, 
    crearUsuario, 
    editarUsuario, 
    cambiarEstado, 
    eliminarUsuario 
  } = useUsuarios();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRol, setSelectedRol] = useState('Todos');
  const [filterActivo, setFilterActivo] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('nombre-asc');

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

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleToggleActivo = async (user: Usuario) => {
    const result = await cambiarEstado(user.id, !user.activo);
    if (result.success) {
      showToast(`Usuario ${user.email} ${!user.activo ? 'activado' : 'desactivado'} con éxito.`, 'success');
    } else {
      showToast(result.message || 'Error al actualizar el estado.', 'error');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre || !createForm.email || !createForm.password || !createForm.rol) {
      showToast('Por favor, rellene todos los campos obligatorios.', 'warning');
      return;
    }

    const result = await crearUsuario(createForm);
    if (result.success) {
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
    } else {
      showToast(result.message || 'Error al crear el usuario.', 'error');
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

    const result = await editarUsuario(selectedUser.id, editForm);
    if (result.success) {
      showToast('Datos de usuario actualizados correctamente.', 'success');
      setShowEditModal(false);
    } else {
      showToast(result.message || 'Error al guardar los cambios.', 'error');
    }
  };

  const handleDeleteClick = (user: Usuario) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;

    const result = await eliminarUsuario(selectedUser.id);
    if (result.success) {
      showToast('El usuario ha sido eliminado físicamente del sistema.', 'success');
      setShowDeleteModal(false);
    } else {
      showToast(result.message || 'No se pudo eliminar el usuario.', 'error');
      setShowDeleteModal(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsuarios = (usuarios as Usuario[]).filter(u => {
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.dni && u.dni.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRol = selectedRol === 'Todos' || u.rol === selectedRol;
    
    const matchesActivo = 
      filterActivo === 'Todos' || 
      (filterActivo === 'Activos' && u.activo) || 
      (filterActivo === 'Inactivos' && !u.activo);

    return matchesSearch && matchesRol && matchesActivo;
  }).sort((a, b) => {
    if (sortOrder === 'nombre-asc') return a.nombre.localeCompare(b.nombre);
    if (sortOrder === 'nombre-desc') return b.nombre.localeCompare(a.nombre);
    if (sortOrder === 'fecha-recent') return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
    if (sortOrder === 'fecha-old') return new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime();
    return 0;
  });

  const getRolBadgeStyles = (rol: string) => {
    switch (rol) {
      case 'Admin':
        return { backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' };
      case 'Veterinario':
        return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
      case 'Recepcionista':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
    }
  };

  const getAvatarGradient = (rol: string) => {
    switch (rol) {
      case 'Admin':
        return 'linear-gradient(135deg, #a855f7 0%, #4f46e5 100%)';
      case 'Veterinario':
        return 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)';
      case 'Recepcionista':
        return 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)';
      default:
        return 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
    }
  };

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#faf9f5', // Canvas
      minHeight: '100vh',
      color: '#141413', // Ink
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 100,
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(20, 20, 19, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid',
              backgroundColor: toast.type === 'success' ? '#ecfdf5' : toast.type === 'error' ? '#fef2f2' : '#fffbeb',
              borderColor: toast.type === 'success' ? '#a7f3d0' : toast.type === 'error' ? '#fecaca' : '#fef3c7',
              color: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#92400e'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'warning'}
            </span>
            <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', 'Times New Roman', serif",
            fontSize: '36px',
            fontWeight: 400,
            letterSpacing: '-0.5px',
            color: '#141413',
            margin: 0
          }}>
            Control de Personal y Cuentas
          </h2>
          <p style={{ color: '#6c6a64', fontSize: '15px', marginTop: '6px', margin: 0 }}>
            Administra accesos, crea cuentas de veterinarios y recepcionistas, y supervisa usuarios registrados.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: '#cc785c', // Accent Primary
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(204, 120, 92, 0.15)',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#a9583e'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#cc785c'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          <span>Registrar Personal</span>
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'rgba(239, 233, 222, 0.4)', // Surface soft
        border: '1px solid #e6dfd8', // Hairline
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#8e8b82',
            fontSize: '20px'
          }}>
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, correo electrónico o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '8px',
              border: '1px solid #e6dfd8',
              backgroundColor: '#faf9f5',
              color: '#141413',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#cc785c'}
            onBlur={e => e.target.style.borderColor = '#e6dfd8'}
          />
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid #e6dfd8'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b82', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol:</label>
            <select
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e6dfd8',
                backgroundColor: '#faf9f5',
                color: '#3d3d3a',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Todos">Todos los roles</option>
              <option value="Admin">Administrador</option>
              <option value="Veterinario">Veterinario</option>
              <option value="Recepcionista">Recepcionista</option>
              <option value="Usuario">Usuario (Cliente)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b82', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado:</label>
            <select
              value={filterActivo}
              onChange={(e) => setFilterActivo(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e6dfd8',
                backgroundColor: '#faf9f5',
                color: '#3d3d3a',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Todos">Todos</option>
              <option value="Activos">Activos</option>
              <option value="Inactivos">Inactivos</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b82', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ordenar:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e6dfd8',
                backgroundColor: '#faf9f5',
                color: '#3d3d3a',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="nombre-asc">Nombre (A - Z)</option>
              <option value="nombre-desc">Nombre (Z - A)</option>
              <option value="fecha-recent">Registro (Más reciente)</option>
              <option value="fecha-old">Registro (Más antiguo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Card */}
      <div style={{
        backgroundColor: '#ffffff', // Card surface
        border: '1px solid #e6dfd8', // Hairline
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(20, 20, 19, 0.02)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #cc785c',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#6c6a64', fontWeight: 500 }}>Cargando cuentas de personal...</p>
          </div>
        ) : apiError ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#6c6a64' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#c64545', marginBottom: '12px' }}>error</span>
            <p style={{ fontWeight: 600, fontSize: '18px', margin: '0 0 16px' }}>{apiError}</p>
            <button 
              onClick={fetchUsuarios}
              style={{
                color: '#cc785c',
                background: 'none',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              Reintentar
            </button>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#8e8b82' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px' }}>group_off</span>
            <p style={{ fontWeight: 600, fontSize: '18px', margin: '0 0 4px' }}>No se encontraron usuarios</p>
            <p style={{ fontSize: '14px', margin: 0 }}>Intenta buscar con otros filtros o términos.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e6dfd8',
                  backgroundColor: 'rgba(239, 233, 222, 0.2)',
                  color: '#6c6a64',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <th style={{ padding: '16px 24px' }}>Usuario</th>
                  <th style={{ padding: '16px 24px' }}>Identificación</th>
                  <th style={{ padding: '16px 24px' }}>Rol</th>
                  <th style={{ padding: '16px 24px' }}>Estado</th>
                  <th style={{ padding: '16px 24px' }}>Registro</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '14px' }}>
                <AnimatePresence>
                  {filteredUsuarios.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #ebe6df',
                        transition: 'background-color 0.15s'
                      }}
                      className="table-row-hover"
                    >
                      {/* Usuario */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            background: getAvatarGradient(user.rol)
                          }}>
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <h4 style={{ margin: 0, fontWeight: 600, color: '#141413' }}>{user.nombre}</h4>
                            <span style={{ fontSize: '12px', color: '#6c6a64' }}>{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Identificacion */}
                      <td style={{ padding: '16px 24px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 500, color: '#3d3d3a' }}>DNI: {user.dni || '—'}</span>
                          <span style={{ fontSize: '12px', color: '#8e8b82' }}>Tel: {user.telefono || '—'}</span>
                        </div>
                      </td>

                      {/* Rol */}
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          lineHeight: 1,
                          ...getRolBadgeStyles(user.rol)
                        }}>
                          {user.rol}
                        </span>
                      </td>

                      {/* Estado con Toggle Switch */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            onClick={() => handleToggleActivo(user)}
                            style={{
                              width: '40px',
                              height: '22px',
                              borderRadius: '9999px',
                              backgroundColor: user.activo ? '#cc785c' : '#e6dfd8',
                              border: 'none',
                              position: 'relative',
                              cursor: 'pointer',
                              padding: 0,
                              transition: 'background-color 0.2s ease'
                            }}
                          >
                            <span style={{
                              display: 'block',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              position: 'absolute',
                              top: '3px',
                              left: user.activo ? '21px' : '3px',
                              transition: 'left 0.2s ease'
                            }} />
                          </button>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: user.activo ? '#cc785c' : '#8e8b82'
                          }}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>

                      {/* Registro */}
                      <td style={{ padding: '16px 24px', color: '#6c6a64', fontSize: '13px' }}>
                        {new Date(user.fechaRegistro).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleEditClick(user)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#6c6a64',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            className="action-btn-hover"
                            title="Editar usuario"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#c64545',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            className="delete-btn-hover"
                            title="Eliminar usuario"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR */}
      {showCreateModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          {/* Backdrop */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(20, 20, 19, 0.4)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowCreateModal(false)}
          />
          {/* Content Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '512px',
              maxHeight: '90vh',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e6dfd8',
              boxShadow: '0 20px 40px -10px rgba(20, 20, 19, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              textAlign: 'left'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e6dfd8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(204,120,92,0.03) 0%, rgba(0,0,0,0) 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Registrar Nuevo Personal</h3>
                <span style={{ fontSize: '12px', color: '#8e8b82', display: 'block', marginTop: '2px' }}>
                  Crea una nueva cuenta de acceso administrativo o médico.
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8e8b82',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  placeholder="Ej. Dr. Carlos Mendoza"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#faf9f5'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="correo@vetcare.pro"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e6dfd8',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#faf9f5',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min. 6 caracteres"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e6dfd8',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#faf9f5',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNI</label>
                  <input
                    type="text"
                    value={createForm.dni}
                    onChange={(e) => setCreateForm({ ...createForm, dni: e.target.value })}
                    placeholder="DNI"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e6dfd8',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#faf9f5',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teléfono</label>
                  <input
                    type="text"
                    value={createForm.telefono}
                    onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                    placeholder="Contacto"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e6dfd8',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#faf9f5',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección</label>
                <input
                  type="text"
                  value={createForm.direccion}
                  onChange={(e) => setCreateForm({ ...createForm, direccion: e.target.value })}
                  placeholder="Dirección, Distrito"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#faf9f5'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol Asignado *</label>
                <select
                  value={createForm.rol}
                  onChange={(e) => setCreateForm({ ...createForm, rol: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#faf9f5',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#141413'
                  }}
                >
                  <option value="Recepcionista">Recepcionista (Operativo)</option>
                  <option value="Veterinario">Veterinario (Médico)</option>
                  <option value="Admin">Administrador (Total)</option>
                  <option value="Usuario">Usuario (Cliente)</option>
                </select>
              </div>

              <div style={{
                paddingTop: '20px',
                borderTop: '1px solid #e6dfd8',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    backgroundColor: '#faf9f5',
                    color: '#6c6a64',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#cc785c',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

      {/* MODAL EDITAR */}
      {showEditModal && selectedUser && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(20, 20, 19, 0.4)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowEditModal(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '512px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e6dfd8',
              boxShadow: '0 20px 40px -10px rgba(20, 20, 19, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              textAlign: 'left'
            }}
          >
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e6dfd8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(204,120,92,0.03) 0%, rgba(0,0,0,0) 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Editar Información de Cuenta</h3>
                <span style={{ fontSize: '12px', color: '#8e8b82', display: 'block', marginTop: '2px' }}>
                  Actualiza el perfil y accesos del usuario en el sistema.
                </span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8e8b82',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                backgroundColor: '#efe9de',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e6dfd8',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b82', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correo Electrónico</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#3d3d3a' }}>{selectedUser.email}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#faf9f5'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNI</label>
                  <input
                    type="text"
                    value={editForm.dni}
                    onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e6dfd8',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#faf9f5',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teléfono</label>
                  <input
                    type="text"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e6dfd8',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#faf9f5',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección</label>
                <input
                  type="text"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#faf9f5'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6c6a64', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol Asignado *</label>
                <select
                  value={editForm.rol}
                  onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                  disabled={selectedUser.email === 'admin@veterinaria.com'}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#faf9f5',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#141413',
                    opacity: selectedUser.email === 'admin@veterinaria.com' ? 0.6 : 1
                  }}
                >
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Veterinario">Veterinario</option>
                  <option value="Admin">Administrador</option>
                  <option value="Usuario">Usuario (Cliente)</option>
                </select>
              </div>

              <div style={{
                paddingTop: '20px',
                borderTop: '1px solid #e6dfd8',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e6dfd8',
                    backgroundColor: '#faf9f5',
                    color: '#6c6a64',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#cc785c',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {showDeleteModal && selectedUser && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(20, 20, 19, 0.4)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowDeleteModal(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '448px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e6dfd8',
              padding: '24px',
              boxShadow: '0 20px 40px -10px rgba(20, 20, 19, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#c64545' }}>
              <span className="material-symbols-outlined" style={{
                fontSize: '28px',
                fontWeight: 'bold',
                backgroundColor: 'rgba(198, 69, 69, 0.1)',
                padding: '10px',
                borderRadius: '12px'
              }}>
                warning
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>¿Deseas eliminar este usuario?</h3>
            </div>

            <div style={{ fontSize: '14px', color: '#6c6a64', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 12px' }}>
                Estás a punto de eliminar físicamente la cuenta del usuario{' '}
                <strong style={{ color: '#141413' }}>{selectedUser.email}</strong>.
              </p>
              
              <div style={{
                padding: '12px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                color: '#b45309',
                borderRadius: '12px',
                fontSize: '12.5px',
                display: 'flex',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>info</span>
                <p style={{ margin: 0 }}>
                  <strong>Restricción de Seguridad:</strong> Si el usuario posee historial de citas, registros clínicos o de cobros, el backend bloqueará la eliminación física por auditoría legal. En esos casos, debes usar la <strong>desactivación lógica</strong>.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '8px'
            }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e6dfd8',
                  backgroundColor: '#faf9f5',
                  color: '#6c6a64',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSubmit}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#c64545',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Confirmar Eliminación
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Element styles for hover transitions and spin animation */}
      <style>{`
        .table-row-hover:hover {
          background-color: #fcfbf9 !important;
        }
        .action-btn-hover:hover {
          background-color: #f3f0e8 !important;
          color: #cc785c !important;
        }
        .delete-btn-hover:hover {
          background-color: #fef2f2 !important;
          color: #991b1b !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
