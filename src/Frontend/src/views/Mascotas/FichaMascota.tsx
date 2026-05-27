import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  peso: number | null;
  color: string | null;
  fotoUrl: string | null;
  fechaNacimiento: string;
  activo: boolean;
  usuarioId: number;
  usuarioNombre?: string;
}

interface MascotasResponse {
  data: Mascota[];
  total: number;
  page: number;
  pageSize: number;
  currentFilter: string;
}

interface UsuarioMin {
  id: number;
  nombre: string;
}

export default function FichaMascota() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterEspecie, setFilterEspecie] = useState('Todos');
  const [filterActivo, setFilterActivo] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('nombre-asc');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMascota, setSelectedMascota] = useState<Mascota | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Lista de usuarios (para asignar propietarios, solo admin)
  const [usuarios, setUsuarios] = useState<UsuarioMin[]>([]);

  // Formularios
  const [createForm, setCreateForm] = useState({
    nombre: '',
    especie: 'Perro',
    raza: '',
    peso: '',
    color: '',
    fechaNacimiento: '',
    usuarioId: '',
    fotoUrl: ''
  });

  const [editForm, setEditForm] = useState({
    nombre: '',
    especie: 'Perro',
    raza: '',
    peso: '',
    color: '',
    fechaNacimiento: '',
    usuarioId: '',
    fotoUrl: '',
    activo: true
  });

  const fetchMascotas = useCallback(async (q: string = '') => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const response = await api.get(`/api/Mascotas${params}`);
      if (response.data.success) {
        const payload: MascotasResponse = response.data.data;
        setMascotas(payload.data);
        setTotal(payload.total);
      } else {
        toast.error(response.data.message || 'Error al cargar mascotas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    try {
      const response = await api.get('/api/Mascotas/Create');
      if (response.data.success) {
        setUsuarios(response.data.data.usuarios || []);
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  }, []);

  useEffect(() => {
    fetchMascotas();
    if (isAdmin) {
      fetchUsuarios();
    }
  }, [fetchMascotas, fetchUsuarios, isAdmin]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    fetchMascotas(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    fetchMascotas('');
  };

  const handleToggleActivo = async (mascota: Mascota) => {
    try {
      const payload = {
        ...mascota,
        activo: !mascota.activo,
        // Aseguramos nulos correctos
        raza: mascota.raza || null,
        peso: mascota.peso || null,
        color: mascota.color || null,
        fotoUrl: mascota.fotoUrl || null
      };

      const response = await api.put(`/api/Mascotas/${mascota.id}`, payload);
      if (response.data?.success || response.status === 200) {
        setMascotas(mascotas.map(m => m.id === mascota.id ? { ...m, activo: !m.activo } : m));
        toast.success(`Paciente ${mascota.nombre} ${!mascota.activo ? 'activado' : 'desactivado'} con éxito.`);
      } else {
        toast.error(response.data?.message || 'Error al actualizar el estado.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar el estado de la mascota.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre || !createForm.especie) {
      toast.error('Por favor completa los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre: createForm.nombre,
        especie: createForm.especie,
        raza: createForm.raza || null,
        peso: createForm.peso ? parseFloat(createForm.peso) : null,
        color: createForm.color || null,
        fechaNacimiento: createForm.fechaNacimiento || null,
        usuarioId: isAdmin ? parseInt(createForm.usuarioId) : 0, // El backend lo asignará si no es admin o es 0
        fotoUrl: createForm.fotoUrl || null
      };

      const response = await api.post('/api/Mascotas', payload);
      if (response.data?.success) {
        toast.success('Mascota registrada exitosamente.');
        setShowCreateModal(false);
        setCreateForm({
          nombre: '',
          especie: 'Perro',
          raza: '',
          peso: '',
          color: '',
          fechaNacimiento: '',
          usuarioId: '',
          fotoUrl: ''
        });
        fetchMascotas();
      } else {
        toast.error(response.data?.message || 'Error al crear la mascota.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (mascota: Mascota) => {
    setSelectedMascota(mascota);
    setEditForm({
      nombre: mascota.nombre,
      especie: mascota.especie || 'Perro',
      raza: mascota.raza || '',
      peso: mascota.peso ? String(mascota.peso) : '',
      color: mascota.color || '',
      fechaNacimiento: mascota.fechaNacimiento ? mascota.fechaNacimiento.split('T')[0] : '',
      usuarioId: String(mascota.usuarioId),
      fotoUrl: mascota.fotoUrl || '',
      activo: mascota.activo
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMascota) return;

    if (!editForm.nombre || !editForm.especie) {
      toast.error('El nombre y la especie son requeridos.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: selectedMascota.id,
        nombre: editForm.nombre,
        especie: editForm.especie,
        raza: editForm.raza || null,
        peso: editForm.peso ? parseFloat(editForm.peso) : null,
        color: editForm.color || null,
        fechaNacimiento: editForm.fechaNacimiento || null,
        usuarioId: parseInt(editForm.usuarioId),
        fotoUrl: editForm.fotoUrl || null,
        activo: editForm.activo
      };

      const response = await api.put(`/api/Mascotas/${selectedMascota.id}`, payload);
      if (response.data?.success || response.status === 200) {
        toast.success('Paciente actualizado correctamente.');
        setShowEditModal(false);
        fetchMascotas();
      } else {
        toast.error(response.data?.message || 'Error al guardar los cambios.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (mascota: Mascota) => {
    setSelectedMascota(mascota);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedMascota) return;

    try {
      const response = await api.delete(`/api/Mascotas/${selectedMascota.id}`);
      if (response.data?.success || response.status === 200) {
        toast.success('Mascota eliminada con éxito.');
        setShowDeleteModal(false);
        fetchMascotas();
      } else {
        toast.error(response.data?.message || 'No se pudo eliminar la mascota.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Error de servidor al eliminar.';
      toast.error(errMsg);
      setShowDeleteModal(false);
    }
  };

  const getSpeciesIcon = (especie: string) => {
    const lower = especie?.toLowerCase() || '';
    if (lower.includes('canino') || lower.includes('perro')) return 'pets';
    if (lower.includes('felino') || lower.includes('gato')) return 'cruelty_free';
    if (lower.includes('ave') || lower.includes('pájaro')) return 'flutter';
    if (lower.includes('conejo') || lower.includes('roedor')) return 'comedy_mask';
    return 'pets';
  };

  const calculateAge = (fechaNacimiento: string) => {
    try {
      if (!fechaNacimiento) return 'N/D';
      const birth = new Date(fechaNacimiento);
      const now = new Date();
      const diffMs = now.getTime() - birth.getTime();
      const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
      const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
      if (years > 0) return `${years} año${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} mes${months !== 1 ? 'es' : ''}` : ''}`;
      if (months > 0) return `${months} mes${months !== 1 ? 'es' : ''}`;
      return 'Recién nacido';
    } catch {
      return 'N/D';
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

  const filteredMascotas = mascotas
    .filter(m => {
      // Especie
      if (filterEspecie !== 'Todos') {
        const mEsp = m.especie?.toLowerCase() || '';
        const fEsp = filterEspecie.toLowerCase();
        if (fEsp === 'otro') {
          const known = ['perro', 'canino', 'gato', 'felino', 'ave', 'pájaro', 'conejo', 'roedor'];
          if (known.some(k => mEsp.includes(k))) return false;
        } else {
          if (!mEsp.includes(fEsp)) return false;
        }
      }
      // Estado
      if (filterActivo === 'Activos' && !m.activo) return false;
      if (filterActivo === 'Inactivos' && m.activo) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'nombre-asc') return a.nombre.localeCompare(b.nombre);
      if (sortOrder === 'nombre-desc') return b.nombre.localeCompare(a.nombre);
      if (sortOrder === 'peso-asc') return (a.peso || 0) - (b.peso || 0);
      if (sortOrder === 'peso-desc') return (b.peso || 0) - (a.peso || 0);
      if (sortOrder === 'edad-asc') return new Date(b.fechaNacimiento).getTime() - new Date(a.fechaNacimiento).getTime();
      if (sortOrder === 'edad-desc') return new Date(a.fechaNacimiento).getTime() - new Date(b.fechaNacimiento).getTime();
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
            <span className="text-primary font-semibold">Mascotas</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-background font-bold tracking-tight">Directorio de Pacientes</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {total} mascota{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
            {searchTerm && (
              <span> · Resultados para "<span className="text-primary font-semibold">{searchTerm}</span>"</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-bold px-5 py-3 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer h-[44px] shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Registrar Paciente
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
              placeholder="Buscar por nombre, especie, raza, propietario..."
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Especie:</label>
            <select
              value={filterEspecie}
              onChange={(e) => setFilterEspecie(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <option value="Todos">Todas</option>
              <option value="Perro">Perro</option>
              <option value="Gato">Gato</option>
              <option value="Ave">Ave</option>
              <option value="Conejo">Conejo</option>
              <option value="Roedor">Roedor</option>
              <option value="Otro">Otro</option>
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
              <option value="peso-asc">Peso (Menor a Mayor)</option>
              <option value="peso-desc">Peso (Mayor a Menor)</option>
              <option value="edad-asc">Edad (Menor a Mayor)</option>
              <option value="edad-desc">Edad (Mayor a Menor)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && mascotas.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 w-full">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Cargando directorio de mascotas...</p>
        </div>
      ) : filteredMascotas.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center text-center gap-sm shadow-sm w-full">
          <span className="material-symbols-outlined text-[48px] text-outline-variant">pets</span>
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">No se encontraron mascotas</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {searchTerm || filterEspecie !== 'Todos' || filterActivo !== 'Todos' ? 'Intenta con otro término de búsqueda o cambia los filtros.' : 'Aún no hay mascotas registradas.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md w-full"
        >
          {filteredMascotas.map((mascota) => (
            <motion.div
              key={mascota.id}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-md cursor-pointer group relative overflow-hidden"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

              {/* Card Header */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-sm min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden border-2 border-surface-container-lowest shadow-sm flex items-center justify-center text-primary shrink-0">
                    {mascota.fotoUrl ? (
                      <img src={mascota.fotoUrl} alt={mascota.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[24px]">{getSpeciesIcon(mascota.especie)}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-headline-md text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">
                      {mascota.nombre}
                    </h3>
                    <span className="font-label-sm text-[11px] text-on-surface-variant mt-[2px]">
                      {mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActivo(mascota);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      mascota.activo ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        mascota.activo ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Mascot Details */}
              <div className="grid grid-cols-2 gap-sm relative z-10 text-[13px]">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Edad</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                    {calculateAge(mascota.fechaNacimiento)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peso</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                    {mascota.peso ? `${mascota.peso} kg` : 'N/D'}
                  </span>
                </div>
              </div>

              {/* Color details if exists */}
              {mascota.color && (
                <div className="flex items-center gap-sm text-[12px] text-on-surface-variant relative z-10 px-1">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">palette</span>
                  <span className="text-slate-600 dark:text-slate-300">Color: {mascota.color}</span>
                </div>
              )}

              {/* Card Footer: Propietario */}
              <div className="mt-auto pt-sm border-t border-outline-variant/50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-sm min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-[9px] text-on-surface-variant uppercase tracking-wider leading-none">Propietario</span>
                    <span className="text-xs font-semibold text-primary truncate mt-0.5">
                      {mascota.usuarioNombre || 'Sin asignar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions hover overlay buttons */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-xl shadow border border-outline-variant/20 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(mascota);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Editar mascota"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(mascota);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                  title="Eliminar mascota"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Loading indicator for search re-fetch */}
      {loading && mascotas.length > 0 && (
        <div className="flex items-center justify-center py-md w-full">
          <div className="flex items-center gap-sm text-on-surface-variant font-body-md text-body-md">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            Buscando mascotas...
          </div>
        </div>
      )}

      {/* MODAL CREAR MASCOTA */}
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
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[90vh] text-left z-10"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Paciente</h3>
                    <p className="text-xs text-slate-500 mt-[2px]">Añade una nueva mascota al registro médico.</p>
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre del Paciente *</label>
                      <input
                        type="text"
                        required
                        value={createForm.nombre}
                        onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                        placeholder="Ej. Bruno"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Especie y Raza */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Especie *</label>
                        <select
                          value={createForm.especie}
                          onChange={(e) => setCreateForm({ ...createForm, especie: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        >
                          <option value="Perro">Perro (Canino)</option>
                          <option value="Gato">Gato (Felino)</option>
                          <option value="Ave">Ave</option>
                          <option value="Conejo">Conejo</option>
                          <option value="Roedor">Roedor</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Raza</label>
                        <input
                          type="text"
                          value={createForm.raza}
                          onChange={(e) => setCreateForm({ ...createForm, raza: e.target.value })}
                          placeholder="Ej. Golden Retriever"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Peso y Color */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Peso (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={createForm.peso}
                          onChange={(e) => setCreateForm({ ...createForm, peso: e.target.value })}
                          placeholder="Ej. 14.5"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Color</label>
                        <input
                          type="text"
                          value={createForm.color}
                          onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                          placeholder="Ej. Marrón claro"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Fecha Nacimiento */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={createForm.fechaNacimiento}
                        onChange={(e) => setCreateForm({ ...createForm, fechaNacimiento: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                      />
                    </div>

                    {/* Foto URL */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">URL de la Foto</label>
                      <input
                        type="text"
                        value={createForm.fotoUrl}
                        onChange={(e) => setCreateForm({ ...createForm, fotoUrl: e.target.value })}
                        placeholder="https://ejemplo.com/foto.jpg"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Propietario (Selector solo visible para Admin) */}
                    {isAdmin && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Asignar Propietario *</label>
                        <select
                          required
                          value={createForm.usuarioId}
                          onChange={(e) => setCreateForm({ ...createForm, usuarioId: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        >
                          <option value="">-- Seleccionar Propietario --</option>
                          {usuarios.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
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

      {/* MODAL EDITAR MASCOTA */}
      {createPortal(
        <AnimatePresence>
          {showEditModal && selectedMascota && (
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
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col max-h-[90vh] text-left z-10"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Datos del Paciente</h3>
                    <p className="text-xs text-slate-500 mt-[2px]">Actualiza el perfil clínico de la mascota.</p>
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre del Paciente *</label>
                      <input
                        type="text"
                        required
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Especie y Raza */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Especie *</label>
                        <select
                          value={editForm.especie}
                          onChange={(e) => setEditForm({ ...editForm, especie: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        >
                          <option value="Perro">Perro (Canino)</option>
                          <option value="Gato">Gato (Felino)</option>
                          <option value="Ave">Ave</option>
                          <option value="Conejo">Conejo</option>
                          <option value="Roedor">Roedor</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Raza</label>
                        <input
                          type="text"
                          value={editForm.raza}
                          onChange={(e) => setEditForm({ ...editForm, raza: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Peso y Color */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Peso (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.peso}
                          onChange={(e) => setEditForm({ ...editForm, peso: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Color</label>
                        <input
                          type="text"
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Fecha Nacimiento */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={editForm.fechaNacimiento}
                        onChange={(e) => setEditForm({ ...editForm, fechaNacimiento: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                      />
                    </div>

                    {/* Foto URL */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">URL de la Foto</label>
                      <input
                        type="text"
                        value={editForm.fotoUrl}
                        onChange={(e) => setEditForm({ ...editForm, fotoUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                      />
                    </div>

                    {/* Propietario (Selector solo visible para Admin) */}
                    {isAdmin && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Asignar Propietario *</label>
                        <select
                          required
                          value={editForm.usuarioId}
                          onChange={(e) => setEditForm({ ...editForm, usuarioId: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold cursor-pointer"
                        >
                          <option value="">-- Seleccionar Propietario --</option>
                          {usuarios.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Activo Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado de Alta</span>
                        <span className="text-xs text-slate-400 mt-0.5">Define si el paciente está activo en la clínica.</span>
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

      {/* MODAL ELIMINAR MASCOTA */}
      {createPortal(
        <AnimatePresence>
          {showDeleteModal && selectedMascota && (
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
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col space-y-4 text-left z-10"
              >
                <div className="flex items-center gap-3 text-rose-500">
                  <span className="material-symbols-outlined text-3xl font-bold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl">
                    warning
                  </span>
                  <h3 className="text-lg font-bold">¿Eliminar Mascota?</h3>
                </div>

                <div className="text-sm text-slate-500 space-y-3">
                  <p>
                    Confirmas que deseas eliminar permanentemente a{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{selectedMascota.nombre}</strong> ({selectedMascota.especie}{selectedMascota.raza ? ` - ${selectedMascota.raza}` : ''}) del sistema.
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 rounded-xl text-xs flex gap-2">
                    <span className="material-symbols-outlined text-[18px] flex-shrink-0">info</span>
                    <p>
                      <strong>Aviso de Seguridad:</strong> Si el paciente tiene citas históricas, de atención o registros clínicos,
                      el backend prevendrá la eliminación física para conservar la integridad legal de la bitácora. Puedes dar de baja de forma segura a la mascota desactivando su estado.
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
