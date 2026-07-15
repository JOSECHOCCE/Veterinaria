import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MascotasService from '../../services/mascotas.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  peso?: number | null;
  color?: string | null;
  fechaNacimiento?: string | null;
  usuarioId: number;
  usuarioNombre?: string | null;
  activo: boolean;
  fotoUrl?: string | null;
  sexo?: string | null;
}

export default function FichaMascota() {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search, species filter, and pagination states
  const [buscar, setBuscar] = useState<string>('');
  const [debouncedBuscar, setDebouncedBuscar] = useState<string>('');
  const [especieFiltro, setEspecieFiltro] = useState<'Todos' | 'Caninos' | 'Felinos' | 'Exóticos'>('Todos');
  const [page, setPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 10;

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBuscar(buscar);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [buscar]);

  const fetchMascotas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await MascotasService.getMascotas(debouncedBuscar, page);
      if (res.success && res.data) {
        setMascotas(res.data.data || []);
        setTotalItems(res.data.total || 0);
      } else {
        setError(res.message || 'Error al obtener la lista de mascotas.');
      }
    } catch (err: any) {
      console.error('Error fetching pets:', err);
      setError('No pudimos conectar con el servidor. Comprueba tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [debouncedBuscar, page]);

  useEffect(() => {
    fetchMascotas();
  }, [fetchMascotas]);

  // Filter local items by species
  const getFilteredMascotas = () => {
    if (especieFiltro === 'Todos') return mascotas;
    return mascotas.filter((m) => {
      const esp = m.especie?.toLowerCase() || '';
      if (especieFiltro === 'Caninos') return esp.includes('perro') || esp.includes('canin') || esp.includes('dog');
      if (especieFiltro === 'Felinos') return esp.includes('gato') || esp.includes('felin') || esp.includes('cat');
      if (especieFiltro === 'Exóticos') return !esp.includes('perro') && !esp.includes('canin') && !esp.includes('dog') && !esp.includes('gato') && !esp.includes('felin') && !esp.includes('cat');
      return true;
    });
  };

  const getPetImageFallback = (esp: string) => {
    const species = esp.toLowerCase();
    if (species.includes('perro') || species.includes('canin') || species.includes('dog')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGLkyijdSwLz9sNJLIq6dXqSMLg7m059hATtoS8THg7KxR8B6reUjzOpGqTkxJyOU5D_Sx7fiCC8mojqsJy5Kv2inZGbezLKYxbg7Vqkxov7ZoTAX89CIO3_mpq_qDfTILJXaOSYeVdd6hm4SypuUBxzsdTzscYqhpktl61dAOxHWXDT7ZROF74Qpvd9jni4x4giQtJS1CPYXFwFrQL7S8AHa-YxX5t_GnmkNOR5DyfG08aFzYvaM5xg';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDASZYKUqOKnwyluB3xWyt7baBCtBuSw9BETDSt_dlgtD4GVmhbo5EvvrMteSdZGFSmqAMo4-t-uR7T_L5RNL0hh77brXif0AnV-VRntWmxCfJPhUS1zczqZO8RI0NOeCytiVRMAunB6Y-V-uZQtzlRxOpjXgzVvmsTqWlRwVw2OqHENFLi6AKM-LVDDUOKu3w2LbW8kzjKomZYT5jwJjlo7xqnGQ6_x_g7T4RluhFremQGwMJMs5xEJQ';
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;
  const filteredList = getFilteredMascotas();

  if (loading && page === 1 && mascotas.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow p-6">
        <ErrorMessage message={error} onRetry={fetchMascotas} />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-ink">Directorio de Pacientes</h1>
          <p className="font-body-md text-body-md text-body-muted mt-1">
            Administra e identifica expedientes médicos con contexto operativo.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/mascotas/nuevo')}
          className="bg-primary text-on-primary font-bold text-sm h-12 px-6 rounded-xl flex items-center gap-2 hover:bg-primary-container transition-all cursor-pointer shadow-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Registrar Mascota
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-[20px]">search</span>
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-full font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder="Buscar paciente, raza o responsable..."
            type="text"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto select-none">
          {(['Todos', 'Caninos', 'Felinos', 'Exóticos'] as const).map((filterOpt) => (
            <button
              key={filterOpt}
              type="button"
              onClick={() => {
                setEspecieFiltro(filterOpt);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                especieFiltro === filterOpt
                  ? 'bg-secondary-container text-on-secondary-container shadow-xs'
                  : 'bg-surface border border-outline-variant/50 text-body-muted hover:bg-surface-container-low'
              }`}
            >
              {filterOpt}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-outline-variant/20 shadow-xs">
          <EmptyState
            title="No se encontraron mascotas"
            description={buscar ? 'No hay pacientes que coincidan con tu búsqueda.' : 'Aún no se han registrado mascotas en el sistema.'}
            actionLabel="Registrar Mascota"
            onAction={() => navigate('/admin/mascotas/nuevo')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredList.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`bg-white rounded-2xl p-6 shadow-xs border border-outline-variant/20 hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                  !m.activo ? 'opacity-70' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={m.fotoUrl || getPetImageFallback(m.especie)}
                        alt={m.nombre}
                        className="w-16 h-16 rounded-full object-cover border-2 border-surface shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getPetImageFallback(m.especie);
                        }}
                      />
                      <div>
                        <h3 className="font-title-sm text-title-sm font-bold text-ink leading-tight">
                          {m.nombre}
                        </h3>
                        <p className="font-body-sm text-body-sm text-body-muted mt-0.5">
                          {m.raza || 'Sin raza definida'}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                      m.activo 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-[#f1f4f6] text-secondary border-outline-variant/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.activo ? 'bg-emerald-600' : 'bg-secondary'}`} />
                      {m.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-4 pt-4 border-t border-outline-variant/15 text-xs">
                    <div>
                      <span className="block text-body-muted font-bold uppercase tracking-wider mb-1">Especie</span>
                      <span className="font-semibold text-ink flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">pets</span>
                        {m.especie}
                      </span>
                    </div>
                    <div>
                      <span className="block text-body-muted font-bold uppercase tracking-wider mb-1">Responsable</span>
                      <span className="font-semibold text-ink truncate block" title={m.usuarioNombre || 'No asignado'}>
                        {m.usuarioNombre || 'No asignado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/mascotas/${m.id}`)}
                    className="flex-grow bg-surface-container-low hover:bg-surface-container-high text-ink font-bold text-xs py-2.5 rounded-xl transition-colors border border-outline-variant/40 cursor-pointer text-center"
                  >
                    Ver Expediente
                  </button>
                  <button
                    onClick={() => navigate(`/admin/mascotas/${m.id}/editar`)}
                    className="w-10 h-10 flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high text-body-muted hover:text-primary rounded-xl transition-all border border-outline-variant/40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-outline-variant/20 mt-6 pt-6">
          <p className="font-caption text-caption text-body-muted">
            Mostrando {Math.min(totalItems, (page - 1) * limit + 1)}-{Math.min(totalItems, page * limit)} de {totalItems} pacientes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 text-body-muted hover:bg-surface-soft disabled:opacity-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded border font-bold text-xs transition-all cursor-pointer ${
                  page === p
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant/50 text-ink hover:bg-surface-soft'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 text-body-muted hover:bg-surface-soft disabled:opacity-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
