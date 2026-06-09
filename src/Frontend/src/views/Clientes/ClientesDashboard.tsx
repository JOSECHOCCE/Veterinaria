import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { Cliente } from '../../services/clientes.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

export default function ClientesDashboard() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for search and filter
  const [buscar, setBuscar] = useState<string>('');
  const [debouncedBuscar, setDebouncedBuscar] = useState<string>('');
  const [filtro, setFiltro] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  const [page, setPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 10; // Items per page

  // Debounce logic for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBuscar(buscar);
      setPage(1); // Reset page to 1 on new search
    }, 400);

    return () => clearTimeout(handler);
  }, [buscar]);

  // Load clients from API
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API expects true to show inactives, false to show actives only
      const mostrarInactivos = filtro === 'Inactivos' || filtro === 'Todos';
      const response = await ClientesService.getClientes(debouncedBuscar, mostrarInactivos, page);
      
      const dataPayload = response.data;
      let list: Cliente[] = dataPayload?.usuarios || [];
      
      // Filter list locally to accurately match active/inactive tabs if necessary
      if (filtro === 'Activos') {
        list = list.filter((u) => u.activo);
      } else if (filtro === 'Inactivos') {
        list = list.filter((u) => !u.activo);
      }

      setClientes(list);
      setTotalItems(dataPayload?.totalItems || list.length);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError('No pudimos cargar la lista de clientes. Por favor, compruebe su conexión e intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [debouncedBuscar, filtro, page]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Toggle active/inactive status
  const handleToggleActivo = async (id: number, currentStatus: boolean) => {
    try {
      await ClientesService.toggleActivo(id);
      toast.success(`Propietario ${currentStatus ? 'inactivado' : 'activado'} con éxito`);
      fetchClientes();
    } catch (err: any) {
      console.error('Error toggling client status:', err);
      toast.error('Ocurrió un error al cambiar el estado del cliente.');
    }
  };

  // Get initials for avatar fallback
  const getInitials = (nombre: string) => {
    if (!nombre) return 'U';
    return nombre
      .split(' ')
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Section Header */}
      <PageHeader
        title="Gestión de Clientes"
        description="Directorio administrativo para la búsqueda, filtrado y gestión de perfiles de propietarios y sus mascotas asociadas."
        actions={
          <Link to="/admin/clientes/nuevo">
            <motion.button
              className="bg-primary text-on-primary font-button text-button px-lg py-[12px] rounded-full hover:bg-primary-active transition-all shadow-sm flex items-center justify-center gap-xs shrink-0 cursor-pointer hover:shadow-md"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                person_add
              </span>
              Registrar Cliente
            </motion.button>
          </Link>
        }
      />

      {/* Toolbar (Search & Filters) */}
      <div className="flex flex-col xl:flex-row gap-md mb-lg justify-between items-start xl:items-center bg-surface-card p-sm rounded-xl border border-hairline shadow-sm">
        {/* Search Input */}
        <div className="relative w-full xl:w-96 shrink-0 group">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-body-muted group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="w-full bg-canvas border border-hairline rounded-lg pl-xl pr-md py-2 font-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-body-muted shadow-inner"
            placeholder="Buscar por nombre, correo o documento..."
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
          {buscar && (
            <button
              onClick={() => setBuscar('')}
              className="absolute right-sm top-1/2 -translate-y-1/2 text-body-muted hover:text-ink transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-xs items-center w-full xl:w-auto xl:justify-end">
          <span className="font-caption text-caption text-body-muted mr-xs hidden sm:block">Filtros:</span>
          {(['Todos', 'Activos', 'Inactivos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setFiltro(t);
                setPage(1);
              }}
              className={`font-caption px-md py-[8px] rounded-full border transition-all cursor-pointer shadow-sm ${
                filtro === t
                  ? 'bg-ink text-canvas border-ink font-semibold'
                  : 'bg-canvas text-ink border-hairline hover:border-outline hover:bg-surface-soft'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Data Card (Table or Loading/Empty/Error states) */}
      <div className="bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner message="Obteniendo directorio de propietarios..." />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <ErrorMessage message={error} onRetry={fetchClientes} />
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon="person_search"
              title="No se encontraron clientes"
              description="No hay perfiles de propietarios registrados que coincidan con la búsqueda o el filtro seleccionado."
              actionLabel="Registrar nuevo cliente"
              onAction={() => navigate('/admin/clientes/nuevo')}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-card border-b border-hairline">
                    <th className="font-caption-uppercase text-caption-uppercase text-body-muted py-sm px-lg font-medium tracking-widest w-[30%]">
                      Cliente
                    </th>
                    <th className="font-caption-uppercase text-caption-uppercase text-body-muted py-sm px-lg font-medium tracking-widest">
                      Contacto
                    </th>
                    <th className="font-caption-uppercase text-caption-uppercase text-body-muted py-sm px-lg font-medium tracking-widest">
                      Documento
                    </th>
                    <th className="font-caption-uppercase text-caption-uppercase text-body-muted py-sm px-lg font-medium tracking-widest w-[20%]">
                      Mascotas Asociadas
                    </th>
                    <th className="font-caption-uppercase text-caption-uppercase text-body-muted py-sm px-lg font-medium tracking-widest">
                      Estado
                    </th>
                    <th className="font-caption-uppercase text-caption-uppercase text-body-muted py-sm px-lg font-medium tracking-widest text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  <AnimatePresence mode="popLayout">
                    {clientes.map((cliente) => (
                      <motion.tr
                        key={cliente.id}
                        className="hover:bg-surface-soft/50 transition-colors group"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <td className="py-sm px-md align-middle">
                          <div className="flex items-center gap-md">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-hairline shrink-0 bg-surface-card flex items-center justify-center">
                              {cliente.rol ? ( // Si tiene avatar o similar lo cargamos, si no usamos iniciales
                                <div className="w-full h-full bg-surface-soft text-primary font-title-sm flex items-center justify-center font-bold">
                                  {getInitials(cliente.nombre)}
                                </div>
                              ) : (
                                <div className="w-full h-full bg-surface-soft text-primary font-title-sm flex items-center justify-center font-bold">
                                  {getInitials(cliente.nombre)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/clientes/${cliente.id}`}
                                className="font-title-sm text-title-sm text-ink truncate block hover:text-primary transition-colors cursor-pointer"
                              >
                                {cliente.nombre}
                              </Link>
                              <div className="font-body-sm text-body-sm text-body-muted truncate mt-xxs">
                                {cliente.email || 'Sin correo registrado'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-sm px-md align-middle font-body-sm text-body-sm text-ink whitespace-nowrap">
                          {cliente.telefono}
                        </td>
                        <td className="py-sm px-md align-middle font-code text-code text-body-muted whitespace-nowrap">
                          {cliente.dni || 'Sin DNI'}
                        </td>
                        <td className="py-sm px-md align-middle">
                            {cliente.mascotas && cliente.mascotas.length > 0 ? (
                              <span 
                                className="inline-flex items-center gap-xs px-sm py-[4px] bg-primary/10 border border-primary/20 text-primary font-caption text-caption rounded-full shadow-xs cursor-help select-none font-semibold"
                                title={cliente.mascotas.map((p) => p.nombre).join(', ')}
                              >
                                <span className="material-symbols-outlined text-[14px]">pets</span>
                                {cliente.mascotas.length} {cliente.mascotas.length === 1 ? 'mascota' : 'mascotas'}
                              </span>
                            ) : (
                              <span className="text-body-muted font-caption text-caption italic select-none">
                                Sin mascotas
                              </span>
                            )}
                        </td>
                        <td className="py-sm px-md align-middle whitespace-nowrap">
                          <span
                            className={`flex items-center gap-xs font-caption text-caption px-sm py-[4px] rounded-full inline-flex border ${
                              cliente.activo
                                ? 'text-ink bg-surface-card border-hairline'
                                : 'text-body-muted bg-surface-soft border-hairline'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                cliente.activo
                                  ? 'bg-success shadow-[0_0_4px_rgba(93,184,114,0.5)]'
                                  : 'bg-secondary'
                              }`}
                            />
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-sm px-md align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-xs opacity-60 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/admin/clientes/${cliente.id}`)}
                              className="p-xs text-body-muted hover:text-primary hover:bg-surface-variant/50 rounded-md transition-all cursor-pointer"
                              title="Ver ficha"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button
                              onClick={() => navigate(`/admin/clientes/${cliente.id}/editar`)}
                              className="p-xs text-body-muted hover:text-primary hover:bg-surface-variant/50 rounded-md transition-all cursor-pointer"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleToggleActivo(cliente.id, cliente.activo)}
                              className={`p-xs rounded-md transition-all cursor-pointer ${
                                cliente.activo
                                  ? 'text-body-muted hover:text-error hover:bg-error-container/30'
                                  : 'text-body-muted hover:text-success hover:bg-success/10'
                              }`}
                              title={cliente.activo ? 'Inactivar cliente' : 'Activar cliente'}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {cliente.activo ? 'block' : 'check_circle'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="bg-surface-card border-t border-hairline py-sm px-lg flex items-center justify-between mt-auto select-none">
              <span className="font-caption text-caption text-body-muted">
                Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, totalItems)} de {totalItems} clientes
              </span>
              <div className="flex gap-xs">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-hairline text-body-muted hover:text-ink hover:border-outline-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md font-caption-caps transition-colors cursor-pointer ${
                        page === pNum
                          ? 'bg-ink text-canvas border border-ink'
                          : 'border border-hairline text-ink hover:bg-surface-variant/30'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-hairline text-body-muted hover:text-ink hover:border-outline-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
