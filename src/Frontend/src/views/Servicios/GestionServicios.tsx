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
import banoPeluqueria from '../../assets/Baño y Peluquería.png';
import cirugiaMenor from '../../assets/Cirugía Menor.png';
import consultaGeneral from '../../assets/Consulta General.png';
import desparacitacion from '../../assets/Desparacitación.png';
import vacunacion from '../../assets/Vacunación.png';

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
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'Medicina' | 'Cirugía' | 'Estética'>('Todos');

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

  const getServiceCategory = (s: Servicio): 'Medicina' | 'Cirugía' | 'Estética' => {
    const name = s.nombre.toLowerCase();
    const desc = (s.descripcion || '').toLowerCase();
    const esp = (s.especialidadRequerida || '').toLowerCase();
    
    if (name.includes('cirug') || name.includes('quirur') || name.includes('dental') || name.includes('limpieza') || esp.includes('cirug')) {
      return 'Cirugía';
    }
    if (name.includes('estetic') || name.includes('peluquer') || name.includes('baño') || name.includes('uñas') || name.includes('spa') || name.includes('corte')) {
      return 'Estética';
    }
    return 'Medicina';
  };

  const getServiceImage = (s: Servicio) => {
    const name = s.nombre.toLowerCase();
    const desc = (s.descripcion || '').toLowerCase();
    
    if (name.includes('vacuna') || name.includes('inmun') || desc.includes('vacuna')) {
      return vacunacion;
    }
    if (name.includes('desparacit') || name.includes('desparasit') || name.includes('antiparasit') || desc.includes('desparacit') || desc.includes('desparasit')) {
      return desparacitacion;
    }
    if (name.includes('cirug') || name.includes('quirur') || name.includes('dental') || name.includes('limpieza') || name.includes('operac') || desc.includes('cirug')) {
      return cirugiaMenor;
    }
    if (name.includes('estetic') || name.includes('peluquer') || name.includes('baño') || name.includes('uñas') || name.includes('spa') || name.includes('corte') || desc.includes('baño')) {
      return banoPeluqueria;
    }
    return consultaGeneral;
  };

  const filteredServicios = servicios.filter(s => {
    if (selectedCategory === 'Todos') return true;
    return getServiceCategory(s) === selectedCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto w-full relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[45%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-teal/5 blur-[120px]" />
      </div>

      {/* Header Section */}
      <PageHeader
        title="Catálogo de Servicios"
        description="Gestiona las ofertas comerciales de la clínica, ajusta tarifas y define los requerimientos de personal para cada intervención."
        actions={
          isAdmin ? (
            <button
              onClick={() => navigate('/admin/servicios/nuevo')}
              className="bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Crear nuevo servicio
            </button>
          ) : undefined
        }
        hasDivider={true}
      />

      {/* Toolbar (Search & Filters) */}
      <div className="bg-white rounded-3xl p-4 mb-8 border border-primary/10 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row gap-4 items-center w-full">
          
          {/* Search bar */}
          <div className="relative flex-grow w-full md:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              placeholder="Buscar servicios por nombre o descripción..."
              type="text"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategory('Todos')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${selectedCategory === 'Todos' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-variant'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedCategory('Medicina')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${selectedCategory === 'Medicina' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-variant'}`}
            >
              Medicina
            </button>
            <button
              onClick={() => setSelectedCategory('Cirugía')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${selectedCategory === 'Cirugía' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-variant'}`}
            >
              Cirugía
            </button>
            <button
              onClick={() => setSelectedCategory('Estética')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${selectedCategory === 'Estética' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-variant'}`}
            >
              Estética
            </button>

            <div className="h-6 w-[1px] bg-surface-variant/60 mx-2 hidden md:block" />

            {/* Show Inactives Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span>Mostrar inactivos</span>
            </label>
          </div>

        </div>
      </div>

      {/* Grid of Bento Service Cards */}
      {filteredServicios.length === 0 ? (
        <div className="bg-white border border-primary/10 rounded-3xl p-6">
          <EmptyState
            title="Catálogo vacío"
            description={buscar ? 'No hay servicios que coincidan con tu búsqueda.' : 'No hay servicios configurados actualmente.'}
            actionLabel={isAdmin ? 'Configurar Primer Servicio' : undefined}
            onAction={isAdmin ? () => navigate('/admin/servicios/nuevo') : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredServicios.map((s) => {
              const cat = getServiceCategory(s);
              const img = getServiceImage(s);
              const badgeColors = 
                cat === 'Cirugía' ? 'bg-tertiary-container/30 text-tertiary border-tertiary/10' :
                cat === 'Estética' ? 'bg-secondary-container/30 text-on-secondary-container border-secondary/10' :
                'bg-primary-container/20 text-primary border-primary/10';

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className={`bg-white rounded-3xl overflow-hidden border border-primary/10 shadow-sm flex flex-col transition-all hover:-translate-y-1 hover:shadow-md relative group ${!s.activo ? 'opacity-70 bg-surface-container-low/20' : ''}`}
                >
                  {/* Header Image Section */}
                  <div className="h-48 overflow-hidden relative bg-surface-variant">
                    <img
                      alt={s.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={img}
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider shadow-sm ${badgeColors}`}>
                        {cat}
                      </span>
                    </div>

                    {/* Admin Actions Dropdown (Floating on top left) */}
                    {isAdmin && (
                      <div className="absolute top-4 left-4 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId((prev) => (prev === s.id ? null : s.id));
                          }}
                          className="w-8 h-8 rounded-full bg-white/95 backdrop-blur text-secondary hover:text-ink flex items-center justify-center border border-primary/5 transition-all shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>

                        {activeDropdownId === s.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveDropdownId(null)}
                            />
                            <div className="absolute left-0 mt-1 w-44 bg-white/95 backdrop-blur-md border border-primary/10 rounded-2xl shadow-xl z-30 py-2 text-xs font-bold text-on-surface text-left">
                              <button
                                onClick={() => navigate(`/admin/servicios/${s.id}/editar`)}
                                className="w-full px-4 py-2.5 hover:bg-surface-soft transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                Editar Servicio
                              </button>
                              <button
                                onClick={() => handleToggleActivo(s.id)}
                                className="w-full px-4 py-2.5 hover:bg-surface-soft transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {s.activo ? 'block' : 'check_circle'}
                                </span>
                                {s.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="w-full px-4 py-2.5 hover:bg-error-container/20 text-error transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Details Area */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-base text-on-surface leading-snug">{s.nombre}</h4>
                      <span className="text-[10px] font-bold text-on-surface-variant shrink-0 bg-surface-soft px-2.5 py-1 rounded-md border border-outline-variant/30">
                        {s.duracionMinutos} min
                      </span>
                    </div>
                    
                    <p className="text-xs text-on-surface-variant font-medium mb-6 flex-1 leading-relaxed line-clamp-2">
                      {s.descripcion || 'Sin descripción detallada.'}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-variant/30">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider">Precio base</span>
                        <span className="text-lg font-bold text-primary">S/. {s.precio.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {s.requiereVeterinario ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container/10 border border-primary-container/30 text-[9px] font-bold text-primary uppercase">
                            Veterinario
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface border border-outline-variant/30 text-[9px] font-bold text-on-surface-variant/60 uppercase">
                            Estilista/Groomer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
