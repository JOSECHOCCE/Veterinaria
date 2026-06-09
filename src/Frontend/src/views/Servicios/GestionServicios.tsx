import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ServiciosService from '../../services/servicios.service';
import type { Servicio } from '../../services/servicios.service';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

export default function GestionServicios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search states
  const [buscar, setBuscar] = useState<string>('');
  const [debouncedBuscar, setDebouncedBuscar] = useState<string>('');
  const [mostrarInactivos, setMostrarInactivos] = useState<boolean>(true);

  // Dropdown overlay state for actions
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBuscar(buscar);
    }, 400);
    return () => clearTimeout(handler);
  }, [buscar]);

  const fetchServicios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ServiciosService.getServicios(debouncedBuscar, mostrarInactivos);
      if (res.success && res.data) {
        setServicios(res.data.servicios || []);
      } else {
        setError(res.message || 'Error al obtener la lista de servicios.');
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError('No pudimos conectar con el servidor. Comprueba tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [debouncedBuscar, mostrarInactivos]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  const handleToggleActivo = async (id: number) => {
    try {
      const res = await ServiciosService.toggleActivo(id);
      if (res.success) {
        toast.success(res.message || 'Estado del servicio modificado con éxito.');
        fetchServicios();
      } else {
        toast.error(res.message || 'Error al modificar el estado del servicio.');
      }
    } catch (err: any) {
      console.error('Error toggling service status:', err);
      toast.error('Error de conexión al cambiar el estado.');
    } finally {
      setActiveDropdownId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      const res = await ServiciosService.deleteServicio(id);
      if (res.success) {
        toast.success('Servicio eliminado exitosamente.');
        fetchServicios();
      } else {
        toast.error(res.message || 'No se puede eliminar el servicio.');
      }
    } catch (err: any) {
      console.error('Error deleting service:', err);
      const msg = err.response?.data?.message || 'Error al eliminar el servicio.';
      toast.error(msg);
    } finally {
      setActiveDropdownId(null);
    }
  };

  if (loading && servicios.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-lg">
        <ErrorMessage message={error} onRetry={fetchServicios} />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-w-0">
      {/* Header Section */}
      <PageHeader
        title="Catálogo de Servicios"
        description="Gestiona las ofertas comerciales de la clínica, ajusta tarifas y define los requerimientos de personal para cada intervención."
        actions={
          isAdmin ? (
            <button
              onClick={() => navigate('/admin/servicios/nuevo')}
              className="bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container px-6 py-2.5 rounded-lg font-button text-button transition-colors flex items-center gap-xs shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Crear nuevo servicio
            </button>
          ) : undefined
        }
        hasDivider={true}
      />

      {/* Main Content: Table inside Card */}
      <div className="bg-surface-card rounded-xl border border-hairline shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-lg border-b border-hairline bg-surface-soft/50 flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-[18px]">search</span>
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-outline focus:ring-1 focus:ring-outline transition-all"
              placeholder="Buscar servicio..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-lg">
            {/* Show Inactives Toggle */}
            <label className="flex items-center gap-sm font-body-sm text-body-sm text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="rounded border-hairline text-primary focus:ring-primary w-4 h-4"
              />
              <span>Mostrar servicios inactivos</span>
            </label>
            <div className="text-caption text-secondary font-caption select-none">
              Total: {servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'}
            </div>
          </div>
        </div>

        {/* Data Table */}
        {servicios.length === 0 ? (
          <EmptyState
            title="Catálogo vacío"
            description={buscar ? 'No hay servicios que coincidan con tu búsqueda.' : 'No hay servicios configurados actualmente.'}
            actionLabel={isAdmin ? 'Configurar Primer Servicio' : undefined}
            onAction={isAdmin ? () => navigate('/admin/servicios/nuevo') : undefined}
          />
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline">
                  <th className="py-sm px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Nombre del servicio</th>
                  <th className="py-sm px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Duración est.</th>
                  <th className="py-sm px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Precio base</th>
                  <th className="py-sm px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Req. Veterinario</th>
                  <th className="py-sm px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider text-right">Estado</th>
                  <th className="py-sm px-lg w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <AnimatePresence mode="popLayout">
                  {servicios.map((s) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-surface-soft/50 transition-colors group ${!s.activo ? 'opacity-65 bg-surface/30' : ''}`}
                    >
                      <td className="py-sm px-md">
                        <div className="font-body-md text-body-strong text-ink font-semibold">{s.nombre}</div>
                        <div className="font-caption text-caption text-body-muted mt-0.5 max-w-md line-clamp-1">{s.descripcion || 'Sin descripción'}</div>
                      </td>
                      <td className="py-sm px-md font-body-sm text-body-muted font-medium">{s.duracionMinutos} min</td>
                      <td className="py-sm px-md font-code text-code text-ink font-semibold">${s.precio.toFixed(2)}</td>
                      <td className="py-sm px-md">
                        {s.requiereVeterinario ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-container/10 border border-primary-container/30 font-caption text-caption text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface border border-hairline font-caption text-caption text-secondary">
                            No
                          </span>
                        )}
                      </td>
                      <td className="py-sm px-md text-right">
                        {s.activo ? (
                          <span className="inline-flex items-center font-caption text-caption text-success font-medium">
                            <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center font-caption text-caption text-secondary">
                            <span className="material-symbols-outlined text-sm mr-1">block</span>
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-sm px-md text-right relative">
                        {isAdmin && (
                          <div className="inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId((prev) => (prev === s.id ? null : s.id));
                              }}
                              className="text-secondary hover:text-ink p-1 rounded hover:bg-canvas transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {activeDropdownId === s.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setActiveDropdownId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 bg-surface-container-lowest border border-hairline rounded-md shadow-lg z-30 py-1 font-body-sm text-body-sm text-ink text-left">
                                  <button
                                    onClick={() => navigate(`/admin/servicios/${s.id}/editar`)}
                                    className="w-full px-sm py-2 hover:bg-surface-soft transition-colors text-left flex items-center gap-xs cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Editar Servicio
                                  </button>
                                  <button
                                    onClick={() => handleToggleActivo(s.id)}
                                    className="w-full px-sm py-2 hover:bg-surface-soft transition-colors text-left flex items-center gap-xs cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      {s.activo ? 'block' : 'check_circle'}
                                    </span>
                                    {s.activo ? 'Desactivar' : 'Activar'}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(s.id)}
                                    className="w-full px-sm py-2 hover:bg-error-container/10 text-error transition-colors text-left flex items-center gap-xs cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Eliminar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
