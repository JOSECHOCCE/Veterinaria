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

  const getInitialsBg = (nombre: string) => {
    if (!nombre) return 'bg-secondary-container text-on-secondary-container';
    const char = nombre.trim().charAt(0).toUpperCase();
    if (char >= 'A' && char <= 'H') {
      return 'bg-secondary-container text-on-secondary-container';
    } else if (char >= 'I' && char <= 'P') {
      return 'bg-tertiary-container text-on-tertiary-container';
    } else {
      return 'bg-primary-container/20 text-on-primary-container';
    }
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10">
      {/* Section Header */}
      <PageHeader
        title="Directorio de Clientes"
        description="Gestión y búsqueda de propietarios de pacientes"
        actions={
          <Link to="/admin/clientes/nuevo">
            <button className="bg-primary hover:bg-primary-active text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-md active:scale-95 duration-200 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Registrar Cliente
            </button>
          </Link>
        }
      />

      {/* Toolbar (Search & Filters) - Estilo Bento del mockup */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-hairline shadow-sm mb-6">
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {(['Todos', 'Activos', 'Inactivos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setFiltro(t);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors cursor-pointer ${
                filtro === t
                  ? 'bg-primary-container/20 text-on-primary-container'
                  : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {t === 'Todos' ? 'Todos los Clientes' : t === 'Activos' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs shrink-0 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            className="w-full h-10 pl-10 pr-10 rounded-full bg-surface-container-low border border-outline-variant font-body-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors"
            placeholder="Buscar por nombre, teléfono o DNI..."
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
          {buscar && (
            <button
              onClick={() => setBuscar('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-ink transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Data Card (Table or Loading/Empty/Error states) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-variant flex-1 flex flex-col min-h-[400px]"
      >
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
            <div className="overflow-x-auto flex-1 no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-semibold text-xs uppercase tracking-wider border-b border-surface-variant">
                    <th className="px-6 py-4 font-semibold w-[30%]">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Contacto</th>
                    <th className="px-6 py-4 font-semibold">Documento</th>
                    <th className="px-6 py-4 font-semibold w-[25%]">Mascotas Asociadas</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant text-sm text-on-surface">
                  <AnimatePresence mode="popLayout">
                    {clientes.map((cliente) => (
                      <motion.tr
                        key={cliente.id}
                        className="hover:bg-surface-bright transition-colors group border-b border-surface-variant"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${getInitialsBg(cliente.nombre)}`}>
                              {getInitials(cliente.nombre)}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/clientes/${cliente.id}`}
                                className="font-semibold text-on-surface hover:text-primary transition-colors truncate block"
                              >
                                {cliente.nombre}
                              </Link>
                              <div className="text-xs text-on-surface-variant truncate">
                                ID: {cliente.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex flex-col text-sm">
                            <span className="flex items-center gap-1 text-on-surface font-medium">
                              <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                              {cliente.telefono}
                            </span>
                            <span className="text-on-surface-variant mt-0.5 text-xs">
                              {cliente.email || 'Sin correo registrado'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle font-code text-xs text-on-surface-variant">
                          {cliente.dni || 'Sin DNI'}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex flex-wrap gap-1 items-center max-w-[220px]">
                            {cliente.mascotas && cliente.mascotas.length > 0 ? (
                              <>
                                {cliente.mascotas.slice(0, 2).map((mascota) => (
                                  <span
                                    key={mascota.id}
                                    className="px-2.5 py-1 bg-primary-container/20 text-on-primary-container rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-primary-container/30 transition-colors"
                                    title={`${mascota.nombre} (${mascota.especie})`}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">pets</span>
                                    {mascota.nombre}
                                  </span>
                                ))}
                                {cliente.mascotas.length > 2 && (
                                  <div className="relative group/tooltip inline-block">
                                    <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-semibold cursor-help select-none">
                                      +{cliente.mascotas.length - 2}
                                    </span>
                                    {/* Tooltip content popup */}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block bg-inverse-surface text-inverse-on-surface text-xs font-medium p-2.5 rounded-lg shadow-lg z-30 whitespace-nowrap border border-outline-variant">
                                      <div className="flex flex-col gap-1.5">
                                        {cliente.mascotas.slice(2).map((m) => (
                                          <div key={m.id} className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[12px] text-primary-fixed">pets</span>
                                            <span className="font-semibold text-white">{m.nombre}</span>
                                            <span className="text-[10px] text-outline-variant">({m.especie === 'Perro' ? 'Dog' : m.especie === 'Gato' ? 'Cat' : m.especie})</span>
                                          </div>
                                        ))}
                                      </div>
                                      {/* Tooltip arrow */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-inverse-surface" />
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-on-surface-variant text-xs italic">
                                Sin mascotas
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              cliente.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cliente.activo ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => navigate(`/admin/clientes/${cliente.id}`)}
                              className="p-1.5 text-outline hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors cursor-pointer"
                              title="Ver ficha"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button
                              onClick={() => navigate(`/admin/clientes/${cliente.id}/editar`)}
                              className="p-1.5 text-outline hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleToggleActivo(cliente.id, cliente.activo)}
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                cliente.activo
                                  ? 'text-outline hover:text-error hover:bg-error-container/30'
                                  : 'text-outline hover:text-success hover:bg-green-100'
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
            <div className="bg-surface-container-lowest border-t border-surface-variant py-4 px-6 flex items-center justify-between mt-auto select-none">
              <span className="text-sm text-on-surface-variant">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalItems)} of {totalItems} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50 transition-colors disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-colors cursor-pointer ${
                        page === pNum
                          ? 'bg-primary text-on-primary'
                          : 'hover:bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50 transition-colors disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
