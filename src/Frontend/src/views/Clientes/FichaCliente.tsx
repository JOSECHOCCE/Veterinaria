import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  direccion: string;
  activo: boolean;
  fechaRegistro: string;
  rol: string;
}

interface ClientesResponse {
  usuarios: Cliente[];
  citasPorUsuario: Record<string, number>;
  totalItems: number;
  page: number;
}

export default function FichaCliente() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [citasPorUsuario, setCitasPorUsuario] = useState<Record<string, number>>({});
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchClientes = useCallback(async (buscar: string = '') => {
    setLoading(true);
    try {
      const params = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
      const response = await api.get(`/api/Clientes${params}`);
      if (response.data.success) {
        const data: ClientesResponse = response.data.data;
        setClientes(data.usuarios);
        setCitasPorUsuario(data.citasPorUsuario || {});
        setTotalItems(data.totalItems);
      } else {
        toast.error(response.data.message || 'Error al cargar clientes');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    fetchClientes(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    fetchClientes('');
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
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
  if (loading && clientes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="ml-64 mt-16 p-lg flex flex-col gap-lg"
      >
        <div className="h-12 w-72 bg-surface-container-high/30 rounded-xl animate-pulse" />
        <div className="h-12 w-full max-w-md bg-surface-container-high/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-52 bg-surface-container-high/30 rounded-2xl border border-outline-variant/10 animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="ml-64 mt-16 p-lg flex flex-col gap-lg"
    >
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
            <span>Gestión</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary font-semibold">Clientes</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-background">Directorio de Clientes</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {totalItems} cliente{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
            {searchTerm && (
              <span> · Resultados para "<span className="text-primary font-semibold">{searchTerm}</span>"</span>
            )}
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-sm items-center w-full max-w-xl">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[20px]">search</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, email, DNI..."
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

      {/* Client Cards Grid */}
      {clientes.length === 0 && !loading ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center text-center gap-sm shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-outline-variant">person_search</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">No se encontraron clientes</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Aún no hay clientes registrados.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md"
        >
          {clientes.map((cliente) => {
            const totalCitas = citasPorUsuario[String(cliente.id)] || 0;
            return (
              <motion.div
                key={cliente.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-md cursor-pointer group"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/15">
                      <span className="material-symbols-outlined text-[24px]">person</span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                        {cliente.nombre}
                      </h3>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        ID: {cliente.id}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 ${
                      cliente.activo
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${cliente.activo ? 'bg-secondary' : 'bg-outline'}`} />
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-xs">
                  <div className="flex items-center gap-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    <span className="font-body-md text-body-md text-primary truncate">{cliente.email}</span>
                  </div>
                  {cliente.telefono && (
                    <div className="flex items-center gap-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
                      <span className="font-body-md text-body-md text-on-surface">{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.dni && (
                    <div className="flex items-center gap-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">badge</span>
                      <span className="font-body-md text-body-md text-on-surface">DNI: {cliente.dni}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Stats */}
                <div className="mt-auto pt-md border-t border-outline-variant/50 grid grid-cols-2 gap-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Citas</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">{totalCitas}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Registro</span>
                    <span className="font-body-md text-body-md text-on-surface font-semibold">{formatDate(cliente.fechaRegistro)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Loading indicator for search re-fetch */}
      {loading && clientes.length > 0 && (
        <div className="flex items-center justify-center py-md">
          <div className="flex items-center gap-sm text-on-surface-variant font-body-md text-body-md">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            Buscando clientes...
          </div>
        </div>
      )}
    </motion.div>
  );
}
