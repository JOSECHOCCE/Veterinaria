import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Veterinario {
  id: number;
  nombre: string;
  especialidad: string | null;
  email: string | null;
  telefono: string | null;
  horarioInicio: string; // "hh:mm:ss" format
  horarioFin: string;    // "hh:mm:ss" format
  activo: boolean;
}

interface VeterinarioConCitas {
  veterinario: Veterinario;
  citasEstaSemana: number;
}

interface VeterinariosResponse {
  veterinarios: VeterinarioConCitas[];
  especialidades: string[];
  currentFilter: string | null;
  currentEspecialidad: string | null;
}

export default function GestionVeterinarios() {
  const [veterinarios, setVeterinarios] = useState<VeterinarioConCitas[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros y búsquedas
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('Todos');
  const [filterActivo, setFilterActivo] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('nombre-asc');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVeterinario, setSelectedVeterinario] = useState<Veterinario | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formularios
  const [createForm, setCreateForm] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    telefono: '',
    horarioInicio: '08:00',
    horarioFin: '18:00'
  });

  const [editForm, setEditForm] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    telefono: '',
    horarioInicio: '08:00',
    horarioFin: '18:00',
    activo: true
  });

  const fetchVeterinarios = useCallback(async (buscarTerm: string = '', esp: string = '') => {
    setLoading(true);
    try {
      const params: string[] = [];
      if (buscarTerm) params.push(`q=${encodeURIComponent(buscarTerm)}`);
      if (esp && esp !== 'Todos') params.push(`especialidad=${encodeURIComponent(esp)}`);
      
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await api.get(`/api/Veterinarios${query}`);
      
      if (response.data.success) {
        const payload: VeterinariosResponse = response.data.data;
        setVeterinarios(payload.veterinarios || []);
        setEspecialidades(payload.especialidades || []);
      } else {
        toast.error(response.data.message || 'Error al cargar médicos veterinarios.');
      }
    } catch (err: any) {
      console.error('Error fetching veterinarios:', err);
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVeterinarios();
  }, [fetchVeterinarios]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    fetchVeterinarios(searchInput, selectedEspecialidad);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    fetchVeterinarios('', selectedEspecialidad);
  };

  const handleEspecialidadChange = (esp: string) => {
    setSelectedEspecialidad(esp);
    fetchVeterinarios(searchTerm, esp);
  };

  const handleToggleActivo = async (item: VeterinarioConCitas) => {
    const vet = item.veterinario;
    try {
      const payload = {
        ...vet,
        activo: !vet.activo
      };
      const response = await api.put(`/api/Veterinarios/${vet.id}`, payload);
      if (response.data.success || response.status === 200) {
        setVeterinarios(veterinarios.map(v => v.veterinario.id === vet.id 
          ? { ...v, veterinario: { ...v.veterinario, activo: !vet.activo } } 
          : v
        ));
        toast.success(`Estado del Dr(a). ${vet.nombre} actualizado con éxito.`);
      } else {
        toast.error(response.data.message || 'Error al actualizar estado.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar estado.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre) {
      toast.error('El nombre es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre: createForm.nombre,
        especialidad: createForm.especialidad || null,
        email: createForm.email || null,
        telefono: createForm.telefono || null,
        // Convert hh:mm to hh:mm:ss format
        horarioInicio: createForm.horarioInicio.length === 5 ? `${createForm.horarioInicio}:00` : createForm.horarioInicio,
        horarioFin: createForm.horarioFin.length === 5 ? `${createForm.horarioFin}:00` : createForm.horarioFin,
        activo: true
      };

      const response = await api.post('/api/Veterinarios', payload);
      if (response.data?.success || response.status === 200) {
        toast.success('Médico veterinario registrado exitosamente.');
        setShowCreateModal(false);
        setCreateForm({
          nombre: '',
          especialidad: '',
          email: '',
          telefono: '',
          horarioInicio: '08:00',
          horarioFin: '18:00'
        });
        fetchVeterinarios(searchTerm, selectedEspecialidad);
      } else {
        toast.error(response.data?.message || 'Error al registrar el veterinario.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (vet: Veterinario) => {
    setSelectedVeterinario(vet);
    
    // Format timespan hh:mm:ss to hh:mm
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '08:00';
      return timeStr.substring(0, 5);
    };

    setEditForm({
      nombre: vet.nombre,
      especialidad: vet.especialidad || '',
      email: vet.email || '',
      telefono: vet.telefono || '',
      horarioInicio: formatTime(vet.horarioInicio),
      horarioFin: formatTime(vet.horarioFin),
      activo: vet.activo
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeterinario) return;

    if (!editForm.nombre) {
      toast.error('El nombre es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: selectedVeterinario.id,
        nombre: editForm.nombre,
        especialidad: editForm.especialidad || null,
        email: editForm.email || null,
        telefono: editForm.telefono || null,
        horarioInicio: editForm.horarioInicio.length === 5 ? `${editForm.horarioInicio}:00` : editForm.horarioInicio,
        horarioFin: editForm.horarioFin.length === 5 ? `${editForm.horarioFin}:00` : editForm.horarioFin,
        activo: editForm.activo
      };

      const response = await api.put(`/api/Veterinarios/${selectedVeterinario.id}`, payload);
      if (response.data?.success || response.status === 200) {
        toast.success('Datos del veterinario actualizados correctamente.');
        setShowEditModal(false);
        fetchVeterinarios(searchTerm, selectedEspecialidad);
      } else {
        toast.error(response.data?.message || 'Error al guardar cambios.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar los cambios.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (vet: Veterinario) => {
    setSelectedVeterinario(vet);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedVeterinario) return;

    try {
      const response = await api.delete(`/api/Veterinarios/${selectedVeterinario.id}`);
      if (response.data?.success || response.status === 200) {
        toast.success('Veterinario eliminado con éxito.');
        setShowDeleteModal(false);
        fetchVeterinarios(searchTerm, selectedEspecialidad);
      } else {
        toast.error(response.data?.message || 'No se pudo eliminar el veterinario.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Error de servidor al eliminar.';
      toast.error(errMsg);
      setShowDeleteModal(false);
    }
  };

  // Dynamic filter and sorting applying locally
  const filteredVeterinarios = veterinarios
    .filter(item => {
      const vet = item.veterinario;
      if (filterActivo === 'Activos' && !vet.activo) return false;
      if (filterActivo === 'Inactivos' && vet.activo) return false;
      return true;
    })
    .sort((a, b) => {
      const vetA = a.veterinario;
      const vetB = b.veterinario;
      if (sortOrder === 'nombre-asc') return vetA.nombre.localeCompare(vetB.nombre);
      if (sortOrder === 'nombre-desc') return vetB.nombre.localeCompare(vetA.nombre);
      if (sortOrder === 'citas-desc') return b.citasEstaSemana - a.citasEstaSemana;
      if (sortOrder === 'citas-asc') return a.citasEstaSemana - b.citasEstaSemana;
      return 0;
    });

  const formatTimeSpan = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Returns hh:mm from hh:mm:ss
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
            <span className="text-primary font-semibold">Veterinarios</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-background font-bold tracking-tight">Directorio de Veterinarios</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {filteredVeterinarios.length} médico{filteredVeterinarios.length !== 1 ? 's' : ''} veterinario{filteredVeterinarios.length !== 1 ? 's' : ''}
            {searchTerm && (
              <span> · Resultados para "<span className="text-primary font-semibold">{searchTerm}</span>"</span>
            )}
            {selectedEspecialidad !== 'Todos' && (
              <span> · Especialidad: "<span className="text-primary font-semibold">{selectedEspecialidad}</span>"</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-bold px-5 py-3 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer h-[44px] shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">medical_services</span>
          Registrar Veterinario
        </button>
      </header>

      {/* Search and Filters Card */}
      <section className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm space-y-4 w-full max-w-4xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-sm items-center w-full">
          <div className="flex-1 relative w-full">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[20px]">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, email, especialidad, teléfono..."
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
            {(searchTerm || selectedEspecialidad !== 'Todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setSelectedEspecialidad('Todos');
                  fetchVeterinarios('', 'Todos');
                }}
                className="px-4 py-2.5 rounded-xl font-label-md text-label-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Limpiar
              </button>
            )}
          </div>
        </form>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Especialidad:</label>
            <select
              value={selectedEspecialidad}
              onChange={(e) => handleEspecialidadChange(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <option value="Todos">Todas</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Estado:</label>
            <select
              value={filterActivo}
              onChange={(e) => setFilterActivo(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
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
              className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <option value="nombre-asc">Nombre (A - Z)</option>
              <option value="nombre-desc">Nombre (Z - A)</option>
              <option value="citas-desc">Más Citas esta Semana</option>
              <option value="citas-asc">Menos Citas esta Semana</option>
            </select>
          </div>
        </div>
      </section>

      {/* Loading Block */}
      {loading && veterinarios.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 w-full">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Cargando directorio de veterinarios...</p>
        </div>
      ) : filteredVeterinarios.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center text-center gap-sm shadow-sm w-full">
          <span className="material-symbols-outlined text-[48px] text-outline-variant">medical_services</span>
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">No se encontraron médicos veterinarios</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {searchTerm || selectedEspecialidad !== 'Todos' || filterActivo !== 'Todos' ? 'Intenta con otro término de búsqueda o cambia los filtros.' : 'Aún no hay veterinarios registrados.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md w-full"
        >
          {filteredVeterinarios.map((item) => {
            const vet = item.veterinario;
            return (
              <motion.div
                key={vet.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-md cursor-pointer group relative overflow-hidden text-left"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                {/* Card Header */}
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden border-2 border-surface-container-lowest shadow-sm flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[24px]">doctor</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-headline-md text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">
                        Dr(a). {vet.nombre}
                      </h3>
                      <span className="font-label-sm text-[11px] text-on-surface-variant mt-[2px] font-semibold text-primary">
                        {vet.especialidad || 'Medicina General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActivo(item);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        vet.activo ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          vet.activo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Medical Details */}
                <div className="flex flex-col gap-xs relative z-10 text-[13px] text-slate-600 dark:text-slate-400">
                  {vet.email && (
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                      <span className="truncate leading-none">{vet.email}</span>
                    </div>
                  )}
                  {vet.telefono && (
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">phone</span>
                      <span className="leading-none">{vet.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                    <span className="leading-none font-semibold">
                      Horario: {formatTimeSpan(vet.horarioInicio)} a {formatTimeSpan(vet.horarioFin)}
                    </span>
                  </div>
                </div>

                {/* Card Footer Statistics */}
                <div className="mt-auto pt-sm border-t border-outline-variant/50 grid grid-cols-2 gap-sm relative z-10">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Citas (Semana)</span>
                    <span className="text-headline-md text-slate-800 dark:text-slate-200 font-bold">{item.citasEstaSemana}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 justify-center">
                    <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Estado</span>
                    <span className={`text-xs font-bold leading-none mt-1 ${vet.activo ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {vet.activo ? 'De Alta' : 'De Baja'}
                    </span>
                  </div>
                </div>

                {/* Hover overlay actions */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-xl shadow border border-outline-variant/20 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(vet);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Editar veterinario"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(vet);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    title="Eliminar veterinario"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* MODAL CREAR VETERINARIO */}
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
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Veterinario</h3>
                    <p className="text-xs text-slate-500 mt-[2px]">Añade un nuevo médico veterinario al personal activo.</p>
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
                    {/* Nombre */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={createForm.nombre}
                        onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                        placeholder="Ej. Dr. Carlos Mendoza"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Especialidad */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Especialidad</label>
                      <input
                        type="text"
                        value={createForm.especialidad}
                        onChange={(e) => setCreateForm({ ...createForm, especialidad: e.target.value })}
                        placeholder="Ej. Cirugía, Fisioterapia, Dermatología..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="doctor@veterinaria.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono</label>
                      <input
                        type="text"
                        value={createForm.telefono}
                        onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                        placeholder="Ej. 987654321"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Horario de Atención */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hora de Inicio</label>
                        <input
                          type="time"
                          value={createForm.horarioInicio}
                          onChange={(e) => setCreateForm({ ...createForm, horarioInicio: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hora de Fin</label>
                        <input
                          type="time"
                          value={createForm.horarioFin}
                          onChange={(e) => setCreateForm({ ...createForm, horarioFin: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        />
                      </div>
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

      {/* MODAL EDITAR VETERINARIO */}
      {createPortal(
        <AnimatePresence>
          {showEditModal && selectedVeterinario && (
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
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Veterinario</h3>
                    <p className="text-xs text-slate-500 mt-[2px]">Actualiza el perfil y horarios de consulta.</p>
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
                    {/* Nombre */}
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

                    {/* Especialidad */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Especialidad</label>
                      <input
                        type="text"
                        value={editForm.especialidad}
                        onChange={(e) => setEditForm({ ...editForm, especialidad: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Teléfono</label>
                      <input
                        type="text"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Horario de Atención */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hora de Inicio</label>
                        <input
                          type="time"
                          value={editForm.horarioInicio}
                          onChange={(e) => setEditForm({ ...editForm, horarioInicio: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hora de Fin</label>
                        <input
                          type="time"
                          value={editForm.horarioFin}
                          onChange={(e) => setEditForm({ ...editForm, horarioFin: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Activo Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estatus Activo</span>
                        <span className="text-xs text-slate-400 mt-0.5">Determina si está habilitado para atender.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, activo: !editForm.activo })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          editForm.activo ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editForm.activo ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
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

      {/* MODAL ELIMINAR VETERINARIO */}
      {createPortal(
        <AnimatePresence>
          {showDeleteModal && selectedVeterinario && (
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
                  <h3 className="text-lg font-bold">¿Eliminar Veterinario?</h3>
                </div>

                <div className="text-sm text-slate-500 space-y-3">
                  <p>
                    Confirmas que deseas eliminar permanentemente a{' '}
                    <strong className="text-slate-700 dark:text-slate-300">Dr(a). {selectedVeterinario.nombre}</strong> del sistema.
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 rounded-xl text-xs flex gap-2">
                    <span className="material-symbols-outlined text-[18px] flex-shrink-0">info</span>
                    <p>
                      <strong>Aviso de Seguridad:</strong> Si el médico posee citas activas o históricas, el backend bloqueará la eliminación física para conservar la integridad legal de la clínica. Te sugerimos suspender temporalmente al médico cambiando su estado a "De Baja" en su lugar.
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
