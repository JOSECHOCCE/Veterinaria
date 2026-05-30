import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientes } from '../../hooks/useClientes';
import type { Cliente, Duplicado } from '../../services/clientes.service';

export default function ClientesDashboard() {
  const navigate = useNavigate();
  const {
    clientes,
    citasPorUsuario,
    totalItems,
    page,
    setPage,
    loading,
    buscar,
    mostrarInactivos,
    setMostrarInactivos,
    handleSearch,
    handleToggleActivo,
    handleDelete,
    handleRegistrar,
    handleEditar
  } = useClientes('', false);

  const [searchInput, setSearchInput] = useState(buscar);
  const [filterActivo, setFilterActivo] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('nombre-asc');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Duplicados control
  const [duplicatesList, setDuplicatesList] = useState<Duplicado[]>([]);
  const [duplicateReason, setDuplicateReason] = useState('');
  const [pendingAction, setPendingAction] = useState<() => Promise<any>>(() => async () => {});

  // Formularios
  const [createForm, setCreateForm] = useState({
    nombre: '',
    email: '',
    dni: '',
    telefono: '',
    direccion: '',
    observaciones: ''
  });

  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    dni: '',
    telefono: '',
    direccion: '',
    observaciones: ''
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    handleSearch('');
  };

  const triggerToggleInactivos = () => {
    setMostrarInactivos(!mostrarInactivos);
  };

  // Enviar Creación
  const submitCreate = async (ignorar = false) => {
    setSubmitting(true);
    const dto = {
      ...createForm,
      email: createForm.email || undefined,
      dni: createForm.dni || undefined,
      direccion: createForm.direccion || undefined,
      observaciones: createForm.observaciones || undefined,
      ignorarDuplicados: ignorar
    };

    const res = await handleRegistrar(dto);
    setSubmitting(false);

    if (res.success) {
      setShowCreateModal(false);
      setCreateForm({
        nombre: '',
        email: '',
        dni: '',
        telefono: '',
        direccion: '',
        observaciones: ''
      });
    } else if (res.duplicados && res.duplicados.length > 0) {
      // Se detectaron duplicados advertibles
      setDuplicatesList(res.duplicados);
      setDuplicateReason(res.message);
      setPendingAction(() => () => submitCreate(true));
      setShowDuplicateModal(true);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre || !createForm.telefono) {
      alert('Por favor completa los campos obligatorios (Nombre y Teléfono).');
      return;
    }
    submitCreate(false);
  };

  // Enviar Edición
  const submitEdit = async (ignorar = false) => {
    if (!selectedCliente) return;
    setSubmitting(true);
    const dto = {
      ...editForm,
      email: editForm.email || undefined,
      dni: editForm.dni || undefined,
      direccion: editForm.direccion || undefined,
      observaciones: editForm.observaciones || undefined,
      ignorarDuplicados: ignorar
    };

    const res = await handleEditar(selectedCliente.id, dto);
    setSubmitting(false);

    if (res.success) {
      setShowEditModal(false);
      setSelectedCliente(null);
    } else if (res.duplicados && res.duplicados.length > 0) {
      setDuplicatesList(res.duplicados);
      setDuplicateReason(res.message);
      setPendingAction(() => () => submitEdit(true));
      setShowDuplicateModal(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.nombre || !editForm.telefono) {
      alert('Nombre y Teléfono son requeridos.');
      return;
    }
    submitEdit(false);
  };

  const handleEditClick = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCliente(cliente);
    setEditForm({
      nombre: cliente.nombre,
      email: cliente.email && !cliente.email.startsWith('sin_correo_') ? cliente.email : '',
      dni: cliente.dni || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      observaciones: ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCliente(cliente);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!selectedCliente) return;
    const res = await handleDelete(selectedCliente.id);
    if (res.success) {
      setShowDeleteModal(false);
      setSelectedCliente(null);
    } else {
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

  // Filtrado y ordenamiento en memoria local de los clientes devueltos
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

  const totalPages = Math.ceil(totalItems / 10);

  // Calcular métricas
  const totalActivos = clientes.filter(c => c.activo).length;
  const totalMascotas = clientes.reduce((acc, curr) => acc + (curr.mascotas?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left', width: '100%' }}>
      
      {/* HEADER DE LA PÁGINA */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xxs)', color: 'var(--color-outline-variant)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span>Gestión</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
            <span style={{ color: 'var(--color-primary)' }}>Clientes</span>
          </div>
          <h1 className="display-lg editorial-title" style={{ marginTop: 'var(--spacing-xxs)', fontWeight: 300 }}>
            Directorio de Clientes
          </h1>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '14px' }}>
            {totalItems} cliente{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''} en total
            {buscar && (
              <span> · Resultados para "<span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{buscar}</span>"</span>
            )}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-editorial-primary"
          style={{
            boxShadow: '0 4px 14px rgba(204, 120, 92, 0.25)',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
          Nuevo Cliente
        </button>
      </header>

      {/* FILA DE ESTADÍSTICAS PREMIUM */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-md)' }}>
        <div className="editorial-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(204, 120, 92, 0.08)', color: 'var(--color-primary)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>group</span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Clientes</span>
            <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-ink)', margin: '2px 0 0 0' }}>{totalItems}</h3>
          </div>
        </div>

        <div className="editorial-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(93, 184, 114, 0.08)', color: 'var(--color-semantic-success)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>how_to_reg</span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Activos</span>
            <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-ink)', margin: '2px 0 0 0' }}>{totalActivos}</h3>
          </div>
        </div>

        <div className="editorial-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(232, 165, 90, 0.08)', color: 'var(--color-primary)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>pets</span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mascotas Registradas</span>
            <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-ink)', margin: '2px 0 0 0' }}>{totalMascotas}</h3>
          </div>
        </div>
      </section>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <section className="editorial-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-muted)',
              fontSize: '20px'
            }}>search</span>
            <input
              type="text"
              className="editorial-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, DNI, teléfono o correo electrónico..."
              style={{ paddingLeft: '44px' }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            )}
          </div>
          
          <button type="submit" className="btn-editorial-primary" style={{ padding: '0 24px', height: '40px' }}>
            Buscar
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-body)' }}>
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={triggerToggleInactivos}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--color-primary)',
                  cursor: 'pointer'
                }}
              />
              <span>Mostrar clientes inactivos</span>
            </label>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-hairline)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Estado:</span>
              <select
                value={filterActivo}
                onChange={(e) => setFilterActivo(e.target.value)}
                className="editorial-select"
                style={{ height: '32px', padding: '2px 10px', fontSize: '13px', width: 'auto' }}
              >
                <option value="Todos">Todos</option>
                <option value="Activos">Activos</option>
                <option value="Inactivos">Inactivos</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Ordenar:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="editorial-select"
              style={{ height: '32px', padding: '2px 10px', fontSize: '13px', width: 'auto' }}
            >
              <option value="nombre-asc">Nombre (A-Z)</option>
              <option value="nombre-desc">Nombre (Z-A)</option>
              <option value="fecha-recent">Más Recientes</option>
              <option value="fecha-old">Más Antiguos</option>
            </select>
          </div>
        </div>
      </section>

      {/* TABLA DE DATOS DE CLIENTES */}
      <div className="editorial-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--color-hairline)' }}>
        {loading ? (
          <div style={{ padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-hairline)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Cargando clientes...</span>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-hairline)', marginBottom: '16px' }}>search_off</span>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: 'var(--color-ink)' }}>No se encontraron clientes</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>Intenta ajustando los términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas-soft)' }}>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nombre</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>DNI</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Teléfono</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Correo</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Mascotas</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Estado</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => {
                const totalCitas = citasPorUsuario[cliente.id] || 0;
                const isPlaceholderEmail = cliente.email?.startsWith('sin_correo_');
                return (
                  <tr
                    key={cliente.id}
                    onClick={() => navigate(`/admin/clientes/${cliente.id}`)}
                    style={{
                      borderBottom: '1px solid var(--color-hairline-soft)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: cliente.activo ? 'rgba(204, 120, 92, 0.08)' : 'var(--color-hairline-soft)',
                          color: cliente.activo ? 'var(--color-primary)' : 'var(--color-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                            {cliente.nombre}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                            Registrado: {formatDate(cliente.fechaRegistro)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--color-body)' }}>
                      {cliente.dni || <span style={{ color: 'var(--color-muted)', fontSize: '13px' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--color-body)' }}>
                      {cliente.telefono}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--color-body)' }}>
                      {isPlaceholderEmail ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>Sin correo</span>
                      ) : (
                        cliente.email
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--color-body)' }}>
                      <span className="badge-editorial-pill badge-editorial-default" style={{ gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>pets</span>
                        {cliente.mascotas?.length || 0}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge-editorial-pill ${cliente.activo ? 'badge-editorial-success' : 'badge-editorial-default'}`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEditClick(cliente, e)}
                          title="Editar Cliente"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-hairline)',
                            backgroundColor: 'white',
                            color: 'var(--color-body)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.color = 'var(--color-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-hairline)';
                            e.currentTarget.style.color = 'var(--color-body)';
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActivo(cliente); }}
                          title={cliente.activo ? 'Desactivar Cliente' : 'Activar Cliente'}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-hairline)',
                            backgroundColor: 'white',
                            color: cliente.activo ? 'var(--color-semantic-warning)' : 'var(--color-semantic-success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = cliente.activo ? 'rgba(212,160,23,0.08)' : 'rgba(93,184,114,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {cliente.activo ? 'block' : 'check_circle'}
                          </span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteClick(cliente, e)}
                          title="Desactivar y Cancelar Citas (Baja en Cascada)"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-hairline)',
                            backgroundColor: 'white',
                            color: 'var(--color-semantic-error)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-semantic-error)';
                            e.currentTarget.style.backgroundColor = 'rgba(198,69,69,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-hairline)';
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINACIÓN */}
      {!loading && totalPages > 1 && (
        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-hairline)', paddingTop: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Página <strong>{page}</strong> de {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-editorial-secondary"
              style={{ padding: '6px 14px', height: '34px', fontSize: '13px' }}
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-editorial-secondary"
              style={{ padding: '6px 14px', height: '34px', fontSize: '13px' }}
            >
              Siguiente
            </button>
          </div>
        </footer>
      )}

      {/* MODAL REGISTRAR NUEVO CLIENTE */}
      {createPortal(
        <AnimatePresence>
          {showCreateModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20, 20, 19, 0.4)', backdropFilter: 'blur(6px)' }}
                onClick={() => setShowCreateModal(false)}
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '540px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid var(--color-hairline)',
                  boxShadow: '0 24px 60px -15px rgba(20,20,19,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 40px)',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}
              >
                {/* Header */}
                <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--color-hairline-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontSize: '22px', fontWeight: 500, margin: 0, color: 'var(--color-ink)' }}>
                      Registrar Nuevo Cliente
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-muted)' }}>Crea un perfil administrativo y legal para mascotas</p>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', display: 'flex' }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Nombre Completo <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        placeholder="Ej. Juan Carlos Pérez Flores"
                        value={createForm.nombre}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Teléfono <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="editorial-input"
                        placeholder="Ej. 987654321"
                        value={createForm.telefono}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, telefono: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Documento Identidad (DNI)
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        placeholder="Ej. 72839102"
                        value={createForm.dni}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, dni: e.target.value }))}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Correo Electrónico (Opcional)
                      </label>
                      <input
                        type="email"
                        className="editorial-input"
                        placeholder="Ej. cliente@correo.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
                        Si ingresas un correo, se creará una cuenta de portal cliente automáticamente.
                      </span>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Dirección Habitual
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        placeholder="Ej. Av. Primavera 123, Dpto 402"
                        value={createForm.direccion}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, direccion: e.target.value }))}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Observaciones Clínicas o Administrativas
                      </label>
                      <textarea
                        className="editorial-input"
                        placeholder="Ej. Cliente prefiere contacto por WhatsApp. Horario de tarde."
                        value={createForm.observaciones}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, observaciones: e.target.value }))}
                        style={{ height: '80px', resize: 'none', padding: '10px 14px' }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '20px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn-editorial-secondary"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-editorial-primary"
                      disabled={submitting}
                      style={{ minWidth: '140px' }}
                    >
                      {submitting ? 'Registrando...' : 'Registrar Cliente'}
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
          {showEditModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20, 20, 19, 0.4)', backdropFilter: 'blur(6px)' }}
                onClick={() => setShowEditModal(false)}
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '540px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid var(--color-hairline)',
                  boxShadow: '0 24px 60px -15px rgba(20,20,19,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 40px)',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}
              >
                {/* Header */}
                <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--color-hairline-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontSize: '22px', fontWeight: 500, margin: 0, color: 'var(--color-ink)' }}>
                      Editar Datos del Cliente
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-muted)' }}>Actualiza la información de contacto y personal</p>
                  </div>
                  <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', display: 'flex' }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Nombre Completo <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        placeholder="Ej. Juan Carlos Pérez Flores"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Teléfono <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="editorial-input"
                        placeholder="Ej. 987654321"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Documento Identidad (DNI)
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        placeholder="Ej. 72839102"
                        value={editForm.dni}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dni: e.target.value }))}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Correo Electrónico (Opcional)
                      </label>
                      <input
                        type="email"
                        className="editorial-input"
                        placeholder="Ej. cliente@correo.com"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
                        Si el cliente no tenía correo anteriormente y lo agregas ahora, se creará su cuenta de portal.
                      </span>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Dirección Habitual
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        placeholder="Ej. Av. Primavera 123, Dpto 402"
                        value={editForm.direccion}
                        onChange={(e) => setEditForm(prev => ({ ...prev, direccion: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '20px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => { setShowEditModal(false); setSelectedCliente(null); }}
                      className="btn-editorial-secondary"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-editorial-primary"
                      disabled={submitting}
                      style={{ minWidth: '140px' }}
                    >
                      {submitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL ADVERTENCIA DE DUPLICADOS */}
      {createPortal(
        <AnimatePresence>
          {showDuplicateModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20, 20, 19, 0.5)', backdropFilter: 'blur(5px)' }}
                onClick={() => setShowDuplicateModal(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '460px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid var(--color-hairline)',
                  boxShadow: '0 20px 48px rgba(20,20,19,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', backgroundColor: 'rgba(204,120,92,0.08)', padding: '10px', borderRadius: '12px' }}>
                    warning
                  </span>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontSize: '18px', fontWeight: 500, margin: 0, color: 'var(--color-ink)' }}>
                      Posible Registro Duplicado
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Validación de recepción (RF-09)</span>
                  </div>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--color-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ margin: 0 }}>
                    Hemos detectado coincidencias críticas en nuestra base de datos. Por favor revisa los clientes existentes:
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '6px 0' }}>
                    {duplicatesList.map((dup, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: 'var(--color-canvas-soft)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-hairline-soft)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--color-ink)', fontSize: '13px' }}>{dup.clienteExistenteNombre}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                            Coincide en {dup.tipo}: <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{dup.valor}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowDuplicateModal(false);
                            setShowCreateModal(false);
                            setShowEditModal(false);
                            navigate(`/admin/clientes/${dup.clienteExistenteId}`);
                          }}
                          className="btn-editorial-secondary"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            height: '26px'
                          }}
                        >
                          Ver Ficha
                        </button>
                      </div>
                    ))}
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                    La recepcionista o el administrador tienen la facultad de decidir si corrigen el conflicto o forzan el registro para crear fichas independientes.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={() => setShowDuplicateModal(false)}
                    className="btn-editorial-secondary"
                  >
                    Corregir Datos
                  </button>
                  <button
                    onClick={async () => {
                      setShowDuplicateModal(false);
                      await pendingAction();
                    }}
                    className="btn-editorial-primary"
                  >
                    Ignorar y Registrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL ELIMINAR / DESACTIVAR EN CASCADA */}
      {createPortal(
        <AnimatePresence>
          {showDeleteModal && selectedCliente && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20, 20, 19, 0.4)', backdropFilter: 'blur(6px)' }}
                onClick={() => setShowDeleteModal(false)}
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '480px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid var(--color-hairline)',
                  boxShadow: '0 24px 60px -15px rgba(20,20,19,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-semantic-error)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', backgroundColor: 'rgba(198,69,69,0.08)', padding: '10px', borderRadius: '12px' }}>
                    warning
                  </span>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontSize: '18px', fontWeight: 500, margin: 0, color: 'var(--color-ink)' }}>
                      ¿Dar de baja en cascada?
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Desactivación de Cuenta y Mascotas (RF-08)</span>
                  </div>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--color-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ margin: 0 }}>
                    Estás a punto de dar de baja al cliente <strong>{selectedCliente.nombre}</strong>. 
                  </p>
                  
                  <div style={{
                    padding: '12px 14px',
                    backgroundColor: 'rgba(198,69,69,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(198,69,69,0.12)',
                    fontSize: '13px',
                    color: 'var(--color-semantic-error)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_box_outline_blank</span>
                      <span>Se desactivará la ficha del cliente (Acceso al portal denegado).</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_box_outline_blank</span>
                      <span>Se desactivarán automáticamente todas sus mascotas registradas ({selectedCliente.mascotas?.length || 0}).</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_box_outline_blank</span>
                      <span>Se cancelarán todas sus citas futuras pendientes o confirmadas.</span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                    Esta acción preservará los datos históricos de atenciones y cobros clínicos para auditoría legal.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '16px', marginTop: '8px' }}>
                  <button
                    onClick={() => { setShowDeleteModal(false); setSelectedCliente(null); }}
                    className="btn-editorial-secondary"
                  >
                    Conservar Activo
                  </button>
                  <button
                    onClick={executeDelete}
                    className="btn-editorial-primary"
                    style={{ backgroundColor: 'var(--color-semantic-error)' }}
                  >
                    Confirmar Baja en Cascada
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
