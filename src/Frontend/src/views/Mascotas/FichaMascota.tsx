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
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM8pZR065mBN_zRsT0K-9h3W-ByY0dCkx1tJr6a_KXTKD63fcCW5FzMmFTzmcaQigIIqG5xFDGqXOQq0JWvRnTCq13J_DBfqi4QunaYKGRE_MqRX0DivSZ-mN9D_htDVybloxprk1_R1fFGlPD17YrWlt0_hwENNtVIaygWOCZ94AMIJnF7ZlEGmciyOTyS5OrBnA9vRzUw-nHhbN3CafZ-NxbGJNMglUBngYtJ7mo1oskzaYx3B6aoBIErCd0BxF692CDhzyjxZ8';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuADiZUuDOMsyo4M1wr15dg3fsL80rExV4tuKhka1NyJjHWVWLimgnT9wQsjQr8_z23jhtb7SlqFPuCp44eCRnKKZQ06tqmkTYPWibResnGBfH25z7mbfCkavRFdwIZBit8JTNFZcCBpO5k-6zKZHsK3WQP1gLKHSuIWd0CnTSc3wHEu4qXuEj0S3VP0RG_a0KFGMwEZw77fbutpjCXcTFhJs8POZ_CGRMzwVeiFkdXY9Top7gLGWkK9vmUQRl9Kbxy8J9jI4X9UToA';
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;
  const filteredList = getFilteredMascotas();

  if (loading && page === 1 && mascotas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-lg">
        <ErrorMessage message={error} onRetry={fetchMascotas} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-xl">
        <div>
          <p className="font-caption-uppercase text-caption-uppercase text-outline mb-2">Directorio</p>
          <h2 className="font-display-lg text-display-lg text-ink font-normal">Gestión de Pacientes</h2>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={() => navigate('/admin/mascotas/nuevo')}
            className="bg-primary text-on-primary font-button text-button py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">pets</span>
            Registrar Mascota
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-card rounded-xl p-md md:p-lg border border-hairline shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-[20px]">search</span>
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-outline focus:ring-1 focus:ring-outline transition-all"
              placeholder="Buscar por nombre o especie..."
              type="text"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-xs overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            {(['Todos', 'Caninos', 'Felinos', 'Exóticos'] as const).map((filterOpt) => (
              <button
                key={filterOpt}
                onClick={() => {
                  setEspecieFiltro(filterOpt);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full font-caption text-caption whitespace-nowrap transition-all cursor-pointer ${
                  especieFiltro === filterOpt
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'bg-canvas border border-hairline text-body-muted hover:bg-surface-soft'
                }`}
              >
                {filterOpt}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        {filteredList.length === 0 ? (
          <EmptyState
            title="No se encontraron mascotas"
            description={buscar ? 'No hay pacientes que coincidan con tu búsqueda.' : 'Aún no se han registrado mascotas en el sistema.'}
            actionLabel="Registrar Mascota"
            onAction={() => navigate('/admin/mascotas/nuevo')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline text-body-muted font-caption-uppercase text-caption-uppercase">
                  <th className="py-sm px-sm font-medium">Mascota</th>
                  <th className="py-sm px-sm font-medium">Especie / Raza</th>
                  <th className="py-sm px-sm font-medium">Dueño Responsable</th>
                  <th className="py-sm px-sm font-medium">Estado</th>
                  <th className="py-sm px-sm font-medium text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-ink">
                <AnimatePresence mode="popLayout">
                  {filteredList.map((m) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      onClick={() => navigate(`/admin/mascotas/${m.id}`)}
                      className={`border-b border-hairline-soft hover:bg-surface-soft transition-colors group cursor-pointer ${
                        !m.activo ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-md px-sm">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.fotoUrl || getPetImageFallback(m.especie)}
                            alt={m.nombre}
                            className="w-10 h-10 rounded-full object-cover border border-hairline"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getPetImageFallback(m.especie);
                            }}
                          />
                          <div>
                            <p className="font-title-sm text-title-sm font-medium">{m.nombre}</p>
                            <p className="font-caption text-caption text-body-muted">#PAC-{String(m.id).padStart(3, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-md px-sm">
                        <p className="font-medium">{m.especie}</p>
                        <p className="text-body-muted text-caption">{m.raza || 'Sin raza definida'}</p>
                      </td>
                      <td className="py-md px-sm">
                        <p className="font-medium">{m.usuarioNombre || 'No asignado'}</p>
                        <p className="text-body-muted text-caption">Propietario</p>
                      </td>
                      <td className="py-md px-sm">
                        {m.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success font-caption text-caption border border-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-body-muted font-caption text-caption border border-secondary-fixed-dim">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-md px-sm text-right">
                        <span className="material-symbols-outlined text-body-muted group-hover:text-primary transition-colors pr-sm">
                          arrow_forward
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-hairline mt-md pt-md">
            <p className="font-caption text-caption text-body-muted">
              Mostrando {Math.min(totalItems, (page - 1) * limit + 1)}-{Math.min(totalItems, page * limit)} de {totalItems} pacientes
            </p>
            <div className="flex items-center gap-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-hairline text-body-muted hover:bg-surface-soft disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded border font-caption text-caption transition-all cursor-pointer ${
                    page === p
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-hairline text-ink hover:bg-surface-soft'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-hairline text-body-muted hover:bg-surface-soft disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
