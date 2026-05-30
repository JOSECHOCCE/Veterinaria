import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import MascotasService from '../../services/mascotas.service';
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
  alergiasConocidas?: string | null;
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
  const navigate = useNavigate();
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
      const data = await MascotasService.getMascotas(q);
      if (data.success) {
        const payload: MascotasResponse = data.data;
        setMascotas(payload.data);
        setTotal(payload.total);
      } else {
        toast.error(data.message || 'Error al cargar mascotas');
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
      const data = await MascotasService.getPropietariosDropdown();
      if (data.success) {
        setUsuarios(data.data.usuarios || []);
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
        raza: mascota.raza || null,
        peso: mascota.peso || null,
        color: mascota.color || null,
        fotoUrl: mascota.fotoUrl || null
      };

      const data = await MascotasService.updateMascota(mascota.id, payload);
      if (data.success) {
        setMascotas(mascotas.map(m => m.id === mascota.id ? { ...m, activo: !m.activo } : m));
        toast.success(`Paciente ${mascota.nombre} ${!mascota.activo ? 'activado' : 'desactivado'} con éxito.`);
      } else {
        toast.error(data.message || 'Error al actualizar el estado.');
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
        usuarioId: isAdmin ? parseInt(createForm.usuarioId) : 0,
        fotoUrl: createForm.fotoUrl || null
      };

      const data = await MascotasService.createMascota(payload);
      if (data.success) {
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
        toast.error(data.message || 'Error al crear la mascota.');
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

      const data = await MascotasService.updateMascota(selectedMascota.id, payload);
      if (data.success) {
        toast.success('Paciente actualizado correctamente.');
        setShowEditModal(false);
        fetchMascotas();
      } else {
        toast.error(data.message || 'Error al guardar los cambios.');
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
      const data = await MascotasService.deleteMascota(selectedMascota.id);
      if (data.success) {
        toast.success('Mascota eliminada con éxito.');
        setShowDeleteModal(false);
        fetchMascotas();
      } else {
        toast.error(data.message || 'No se pudo eliminar la mascota.');
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full text-left max-w-container-max mx-auto px-margin-desktop py-8 bg-[#faf9f5]"
    >
      <header className="flex justify-between items-end pb-8 mb-8 border-b border-[#141413]/10 sticky top-0 bg-[#faf9f5]/85 backdrop-blur-[10px] z-40">
        <div>
          <nav className="flex items-center gap-2 text-[#6c6a64] font-semibold text-xs uppercase tracking-widest mb-3">
            <span>Gestión</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#cc785c]">Mascotas</span>
          </nav>
          <h2 className="editorial-title text-4xl text-[#141413]">Nuestras Mascotas</h2>
          <p className="font-body-md text-[#3d3d3a]/80 italic mt-1">Unidad Clínica Central</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-editorial-primary h-[44px] shrink-0 font-medium px-6 py-3 rounded-[4px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_20px_rgba(20,20,19,0.05)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Registrar Mascota</span>
        </button>
      </header>

      <section className="bg-white border border-[#141413]/10 p-6 rounded-[8px] mb-8 shadow-[0_4px_20px_rgba(20,20,19,0.02)]">
        <form onSubmit={handleSearch} className="grid grid-cols-12 gap-4 items-center w-full">
          <div className="col-span-12 md:col-span-6 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6c6a64]/50" style={{ fontSize: '20px' }}>search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, especie, raza..."
              className="w-full bg-[#faf9f5] border border-[#141413]/10 rounded-[4px] pl-11 pr-4 py-3 font-body-md text-[#141413] placeholder:text-[#6c6a64]/40 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none transition-all"
            />
          </div>
          <div className="col-span-12 md:col-span-6 flex gap-3">
            <select
              value={filterEspecie}
              onChange={(e) => setFilterEspecie(e.target.value)}
              className="flex-1 bg-[#faf9f5] border border-[#141413]/10 rounded-[4px] px-3 py-3 font-medium text-sm text-[#141413] outline-none focus:ring-1 focus:ring-[#cc785c]"
            >
              <option value="Todos">Especie: Todas</option>
              <option value="Perro">Perro</option>
              <option value="Gato">Gato</option>
              <option value="Ave">Ave</option>
              <option value="Conejo">Conejo</option>
              <option value="Roedor">Roedor</option>
              <option value="Otro">Otro</option>
            </select>
            <select
              value={filterActivo}
              onChange={(e) => setFilterActivo(e.target.value)}
              className="flex-1 bg-[#faf9f5] border border-[#141413]/10 rounded-[4px] px-3 py-3 font-medium text-sm text-[#141413] outline-none focus:ring-1 focus:ring-[#cc785c]"
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Activos">Activos</option>
              <option value="Inactivos">Inactivos</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="flex-1 bg-[#faf9f5] border border-[#141413]/10 rounded-[4px] px-3 py-3 font-medium text-sm text-[#141413] outline-none focus:ring-1 focus:ring-[#cc785c]"
            >
              <option value="nombre-asc">Ordenar: Nombre A-Z</option>
              <option value="nombre-desc">Ordenar: Nombre Z-A</option>
              <option value="peso-asc">Peso (asc)</option>
              <option value="peso-desc">Peso (desc)</option>
              <option value="edad-asc">Más jóvenes</option>
              <option value="edad-desc">Más viejos</option>
            </select>
          </div>
        </form>

        {searchTerm && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#141413]/5 text-xs text-[#6c6a64]">
            <span>Filtro de búsqueda: <strong>"{searchTerm}"</strong></span>
            <button
              onClick={handleClearSearch}
              className="text-[#cc785c] hover:underline font-bold"
            >
              Limpiar filtro
            </button>
          </div>
        )}
      </section>

      {filteredMascotas.length === 0 ? (
        <div className="bg-white border border-[#141413]/10 p-12 text-center rounded-[8px] flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-[#cc785c]/40 mb-3">pets</span>
          <h3 className="editorial-title text-xl text-[#141413] mb-1">Sin registros</h3>
          <p className="text-[#6c6a64] max-w-sm text-sm">
            No se encontraron mascotas activas que coincidan con la búsqueda o filtros aplicados.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredMascotas.map((mascota) => (
            <motion.div
              key={mascota.id}
              variants={cardVariants}
              onClick={() => {
                if (user?.role === 'Usuario' || user?.role === 'Cliente') {
                  navigate(`/cliente/mascotas/${mascota.id}`);
                } else {
                  navigate(`/admin/mascotas/${mascota.id}`);
                }
              }}
              className="bg-white border border-[#141413]/10 p-6 rounded-[4px] hover:shadow-[0_12px_32px_rgba(20,20,19,0.06)] hover:-translate-y-1 hover:border-[#cc785c]/30 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-[#cc785c]/10 p-0.5 bg-[#faf9f5] flex items-center justify-center shrink-0">
                  {mascota.fotoUrl ? (
                    <img src={mascota.fotoUrl} alt={mascota.nombre} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[32px] text-[#cc785c]">{getSpeciesIcon(mascota.especie)}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-[#cc785c]/5 text-[#cc785c] text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                    {mascota.especie}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${mascota.activo ? 'bg-[#5db872]' : 'bg-[#6c6a64]/30'}`}></span>
                    <span className={`font-semibold text-[11px] uppercase tracking-wider ${mascota.activo ? 'text-[#5db872]' : 'text-[#6c6a64]/50'}`}>
                      {mascota.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="font-headline-sm text-xl text-[#141413] mb-1 font-semibold group-hover:text-[#cc785c] transition-colors">
                {mascota.nombre}
              </h3>
              <p className="font-body-md text-xs text-[#3d3d3a]/80 mb-5">
                Prop: <span className="text-[#cc785c] hover:underline font-medium">{mascota.usuarioNombre || 'Sin asignar'}</span>
              </p>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 border-t border-[#141413]/10 pt-4 mb-6 mt-auto">
                <div>
                  <p className="font-semibold text-[10px] text-[#6c6a64]/60 uppercase tracking-widest mb-0.5">Raza</p>
                  <p className="font-body-md text-xs text-[#141413] truncate font-medium">{mascota.raza || 'Común'}</p>
                </div>
                <div>
                  <p className="font-semibold text-[10px] text-[#6c6a64]/60 uppercase tracking-widest mb-0.5">Edad</p>
                  <p className="font-body-md text-xs text-[#141413] font-medium">{calculateAge(mascota.fechaNacimiento)}</p>
                </div>
                <div>
                  <p className="font-semibold text-[10px] text-[#6c6a64]/60 uppercase tracking-widest mb-0.5">Peso</p>
                  <p className="font-body-md text-xs text-[#141413] font-medium">{mascota.peso ? `${mascota.peso} kg` : 'N/D'}</p>
                </div>
                <div>
                  <p className="font-semibold text-[10px] text-[#6c6a64]/60 uppercase tracking-widest mb-0.5">Alergias</p>
                  <p className={`font-body-md text-xs truncate font-semibold ${mascota.alergiasConocidas ? 'text-[#c64545]' : 'text-[#6c6a64]/40'}`}>
                    {mascota.alergiasConocidas || 'Ninguna'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-[#141413]/5 pt-4 mt-auto">
                <span className="text-[#cc785c] font-semibold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver Ficha Completa
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
                
                {isAdmin && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditClick(mascota)}
                      className="p-1 text-[#6c6a64]/60 hover:text-[#cc785c] transition-colors"
                      title="Editar ficha"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(mascota)}
                      className="p-1 text-[#6c6a64]/60 hover:text-[#c64545] transition-colors"
                      title="Dar de baja"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-3 text-sm text-[#6c6a64]">
            <span className="material-symbols-outlined animate-spin text-[#cc785c]">progress_activity</span>
            <span>Cargando datos clínicos...</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-[#141413]/30 backdrop-blur-[2px] z-[55]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-[460px] bg-[#faf9f5] border-l border-[#141413]/10 z-[60] flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-[#141413]/10 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-headline-sm text-2xl text-[#141413]">Registro de Mascota</h3>
                  <p className="font-body-md text-xs text-[#6c6a64] italic mt-0.5">Nueva entrada clínica</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-[#faf9f5] rounded-full transition-colors cursor-pointer text-[#141413]"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">NOMBRE *</label>
                    <input
                      type="text"
                      required
                      value={createForm.nombre}
                      onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                      placeholder="Ej: Zeus"
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">ESPECIE *</label>
                      <select
                        value={createForm.especie}
                        onChange={(e) => setCreateForm({ ...createForm, especie: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      >
                        <option value="Perro">Perro</option>
                        <option value="Gato">Gato</option>
                        <option value="Ave">Ave</option>
                        <option value="Conejo">Conejo</option>
                        <option value="Roedor">Roedor</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">SEXO</label>
                      <select
                        value={createForm.fotoUrl}
                        onChange={(e) => setCreateForm({ ...createForm, fotoUrl: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      >
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                      </select>
                    </div>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">PROPIETARIO RESPONSABLE *</label>
                      <select
                        required
                        value={createForm.usuarioId}
                        onChange={(e) => setCreateForm({ ...createForm, usuarioId: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      >
                        <option value="">Seleccionar propietario...</option>
                        {usuarios.map(u => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">RAZA</label>
                    <input
                      type="text"
                      value={createForm.raza}
                      onChange={(e) => setCreateForm({ ...createForm, raza: e.target.value })}
                      placeholder="Ej: Golden Retriever"
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">NACIMIENTO</label>
                      <input
                        type="date"
                        value={createForm.fechaNacimiento}
                        onChange={(e) => setCreateForm({ ...createForm, fechaNacimiento: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">PESO (KG)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={createForm.peso}
                        onChange={(e) => setCreateForm({ ...createForm, peso: e.target.value })}
                        placeholder="Ej: 15.5"
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">COLOR DE MANTO</label>
                    <input
                      type="text"
                      value={createForm.color}
                      onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                      placeholder="Ej: Canela"
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">ALERGIAS CONOCIDAS</label>
                    <input
                      type="text"
                      value={createForm.fotoUrl}
                      onChange={(e) => setCreateForm({ ...createForm, fotoUrl: e.target.value })}
                      placeholder="Ninguna"
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">OBSERVACIONES CLÍNICAS</label>
                    <textarea
                      rows={3}
                      value={createForm.raza}
                      onChange={(e) => setCreateForm({ ...createForm, raza: e.target.value })}
                      placeholder="Historial médico general, notas o comentarios..."
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413] resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-[#141413]/10 flex gap-4 bg-white -mx-8 px-8 pb-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#cc785c] text-white font-semibold text-sm py-4 rounded-[4px] hover:bg-[#a9583e] transition-colors cursor-pointer flex justify-center items-center gap-2 shadow-[0_4px_20px_rgba(20,20,19,0.05)]"
                  >
                    {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>Guardar Ficha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 border border-[#141413]/20 text-[#6c6a64] font-semibold text-sm py-4 rounded-[4px] hover:bg-[#141413]/5 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedMascota && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-[#141413]/30 backdrop-blur-[2px] z-[55]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-[460px] bg-[#faf9f5] border-l border-[#141413]/10 z-[60] flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-[#141413]/10 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-headline-sm text-2xl text-[#141413]">Editar Datos del Paciente</h3>
                  <p className="font-body-md text-xs text-[#6c6a64] italic mt-0.5">Modificar ficha de {selectedMascota.nombre}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-[#faf9f5] rounded-full transition-colors cursor-pointer text-[#141413]"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">NOMBRE DEL PACIENTE *</label>
                    <input
                      type="text"
                      required
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">ESPECIE *</label>
                      <select
                        value={editForm.especie}
                        onChange={(e) => setEditForm({ ...editForm, especie: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      >
                        <option value="Perro">Perro</option>
                        <option value="Gato">Gato</option>
                        <option value="Ave">Ave</option>
                        <option value="Conejo">Conejo</option>
                        <option value="Roedor">Roedor</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">SEXO</label>
                      <select
                        value={editForm.fotoUrl}
                        onChange={(e) => setEditForm({ ...editForm, fotoUrl: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      >
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                      </select>
                    </div>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">PROPIETARIO RESPONSABLE *</label>
                      <select
                        required
                        value={editForm.usuarioId}
                        onChange={(e) => setEditForm({ ...editForm, usuarioId: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      >
                        <option value="">Seleccionar propietario...</option>
                        {usuarios.map(u => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">RAZA</label>
                    <input
                      type="text"
                      value={editForm.raza}
                      onChange={(e) => setEditForm({ ...editForm, raza: e.target.value })}
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">NACIMIENTO</label>
                      <input
                        type="date"
                        value={editForm.fechaNacimiento}
                        onChange={(e) => setEditForm({ ...editForm, fechaNacimiento: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">PESO (KG)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.peso}
                        onChange={(e) => setEditForm({ ...editForm, peso: e.target.value })}
                        className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">COLOR DE MANTO</label>
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>

                  <div className="flex justify-between items-center bg-white border border-[#141413]/10 p-4 rounded-[4px] mt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-[10px] text-[#6c6a64] uppercase tracking-wider">Estado de Alta</span>
                      <span className="text-[10px] text-[#6c6a64]/70">Marcar como mascota activa del hospital.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, activo: !editForm.activo })}
                      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{ backgroundColor: editForm.activo ? '#cc785c' : '#e6dfd8' }}
                    >
                      <span
                        className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        style={{ transform: editForm.activo ? 'translateX(16px)' : 'translateX(0)' }}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#141413]/10 flex gap-4 bg-white -mx-8 px-8 pb-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#cc785c] text-white font-semibold text-sm py-4 rounded-[4px] hover:bg-[#a9583e] transition-colors cursor-pointer flex justify-center items-center gap-2 shadow-[0_4px_20px_rgba(20,20,19,0.05)]"
                  >
                    {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>Guardar Cambios</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 border border-[#141413]/20 text-[#6c6a64] font-semibold text-sm py-4 rounded-[4px] hover:bg-[#141413]/5 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && selectedMascota && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#141413]/30 backdrop-blur-[2px]"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md p-8 shadow-2xl flex flex-col space-y-4 text-left z-10 bg-white border border-[#141413]/10 rounded-[4px]"
            >
              <div className="flex items-center gap-3 text-[#c64545]">
                <span className="material-symbols-outlined text-3xl font-bold p-2 bg-[#c64545]/10 rounded-[8px]">
                  warning
                </span>
                <h3 className="editorial-title text-xl text-[#c64545] font-semibold">¿Inactivar Paciente?</h3>
              </div>

              <div className="text-sm space-y-3 text-[#6c6a64]">
                <p>
                  Confirmas que deseas dar de baja o inactivar permanentemente a{' '}
                  <strong className="text-[#141413]">{selectedMascota.nombre}</strong> ({selectedMascota.especie}{selectedMascota.raza ? ` - ${selectedMascota.raza}` : ''}) del sistema de la clínica.
                </p>
                <div className="p-3 text-xs flex gap-2 rounded-[6px] bg-[#d4a017]/10 border border-[#d4a017]/20 text-[#d4a017]">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">info</span>
                  <p>
                    <strong>Aviso de Seguridad (RF-13):</strong> Si el paciente tiene citas históricas, de atención o registros clínicos,
                    el backend prevendrá la eliminación física de la base de datos para conservar la integridad legal de la bitácora. Puedes dar de baja de forma segura a la mascota desactivando su estado y cancelando automáticamente sus citas futuras.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#141413]/5">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-editorial-secondary px-5 py-2.5"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  className="btn-editorial-primary px-5 py-2.5 bg-[#c64545] hover:bg-[#a93838]"
                >
                  Confirmar Baja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
