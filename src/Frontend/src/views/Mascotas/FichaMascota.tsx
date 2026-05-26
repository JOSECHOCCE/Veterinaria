import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  peso: number;
  color: string;
  fotoUrl: string | null;
  fechaNacimiento: string;
  activo: boolean;
  usuarioId: number;
  nombreUsuario: string;
}

interface MascotasResponse {
  data: Mascota[];
  total: number;
  page: number;
  pageSize: number;
  currentFilter: string;
}

export default function FichaMascota() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

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

  useEffect(() => {
    fetchMascotas();
  }, [fetchMascotas]);

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

  const getSpeciesIcon = (especie: string) => {
    const lower = especie?.toLowerCase() || '';
    if (lower.includes('canino') || lower.includes('perro')) return 'pets';
    if (lower.includes('felino') || lower.includes('gato')) return 'cruelty_free';
    if (lower.includes('ave') || lower.includes('pájaro')) return 'flutter';
    return 'pets';
  };

  const calculateAge = (fechaNacimiento: string) => {
    try {
      const birth = new Date(fechaNacimiento);
      const now = new Date();
      const diffMs = now.getTime() - birth.getTime();
      const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
      const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
      if (years > 0) return `${years} año${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} mes${months !== 1 ? 'es' : ''}` : ''}`;
      if (months > 0) return `${months} mes${months !== 1 ? 'es' : ''}`;
      return 'Recién nacido';
    } catch {
      return '';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  // Loading skeleton
  if (loading && mascotas.length === 0) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 ml-64 pt-[80px] p-lg"
      >
        <div className="max-w-[1400px] mx-auto space-y-margin">
          <div className="h-12 w-72 bg-surface-container-high/30 rounded-xl animate-pulse" />
          <div className="h-12 w-full max-w-md bg-surface-container-high/30 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-surface-container-high/30 rounded-2xl border border-outline-variant/10 animate-pulse" />
            ))}
          </div>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 ml-64 pt-[80px] p-lg"
    >
      <div className="max-w-[1400px] mx-auto space-y-margin">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
              <span>Gestión</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary font-semibold">Mascotas</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface">Directorio de Pacientes</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {total} mascota{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
              {searchTerm && (
                <span> · Resultados para "<span className="text-primary font-semibold">{searchTerm}</span>"</span>
              )}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-sm items-center w-full max-w-xl">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[20px]">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, especie, raza, propietario..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl font-label-md text-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Buscar
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2.5 rounded-xl font-label-md text-label-md border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Limpiar
            </button>
          )}
        </form>

        {/* Mascotas Cards Grid */}
        {mascotas.length === 0 && !loading ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center text-center gap-sm shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-outline-variant">search_off</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">No se encontraron mascotas</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Aún no hay mascotas registradas.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md"
          >
            {mascotas.map((mascota) => (
              <motion.div
                key={mascota.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer group relative"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                {/* Card Body */}
                <div className="p-md flex flex-col gap-md relative z-10">
                  {/* Top Row: Photo + Name */}
                  <div className="flex items-center gap-md">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-surface-container-lowest shadow-sm flex-shrink-0 bg-surface-container-high">
                      {mascota.fotoUrl ? (
                        <img
                          src={mascota.fotoUrl}
                          alt={mascota.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[28px]">{getSpeciesIcon(mascota.especie)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                          {mascota.nombre}
                        </h3>
                        <span
                          className={`flex-shrink-0 ml-2 px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 ${
                            mascota.activo
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${mascota.activo ? 'bg-secondary' : 'bg-outline'}`} />
                          {mascota.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <span className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">{getSpeciesIcon(mascota.especie)}</span>
                        {mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-sm">
                    <div className="bg-surface p-sm rounded-lg border border-outline-variant/50">
                      <div className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Edad</div>
                      <div className="font-body-md text-body-md text-on-surface font-semibold">
                        {mascota.fechaNacimiento ? calculateAge(mascota.fechaNacimiento) : 'N/D'}
                      </div>
                    </div>
                    <div className="bg-surface p-sm rounded-lg border border-outline-variant/50">
                      <div className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Peso</div>
                      <div className="font-body-md text-body-md text-on-surface font-semibold">
                        {mascota.peso ? `${mascota.peso} kg` : 'N/D'}
                      </div>
                    </div>
                  </div>

                  {/* Color tag (if available) */}
                  {mascota.color && (
                    <div className="flex items-center gap-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">palette</span>
                      <span className="font-body-md text-body-md text-on-surface">{mascota.color}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Owner */}
                <div className="mt-auto border-t border-outline-variant/50 p-md bg-surface-bright/30 flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Propietario</span>
                    <span className="font-body-md text-body-md text-primary font-semibold truncate">
                      {mascota.nombreUsuario || 'Sin asignar'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loading indicator for search re-fetch */}
        {loading && mascotas.length > 0 && (
          <div className="flex items-center justify-center py-md">
            <div className="flex items-center gap-sm text-on-surface-variant font-body-md text-body-md">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              Buscando mascotas...
            </div>
          </div>
        )}
      </div>
    </motion.main>
  );
}
