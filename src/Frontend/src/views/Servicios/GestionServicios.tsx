import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  duracionMinutos: number;
  precio: number;
  activo: boolean;
}

const GestionServicios: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Estados para Modal de Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Datos del Formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState<number>(30);
  const [precio, setPrecio] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Cargar servicios
  const loadServicios = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/Servicios`, {
        params: {
          q: searchQuery,
          mostrarInactivos: mostrarInactivos
        }
      });
      if (response.data.success) {
        setServicios(response.data.data.servicios || []);
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      toast.error('No se pudo cargar la lista de servicios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Retardo para evitar peticiones en cada pulsación
    const timer = setTimeout(() => {
      loadServicios();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mostrarInactivos]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setDuracionMinutos(30);
    setPrecio(0);
    setModalOpen(true);
  };

  const handleOpenEditModal = (s: Servicio) => {
    setEditingId(s.id);
    setNombre(s.nombre);
    setDescripcion(s.descripcion || '');
    setDuracionMinutos(s.duracionMinutos);
    setPrecio(s.precio);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || duracionMinutos <= 0 || precio <= 0) {
      toast.error('Por favor completa correctamente todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Editar
        const response = await api.put(`/api/Servicios/${editingId}`, {
          id: editingId,
          nombre,
          descripcion,
          duracionMinutos,
          precio,
          activo: true // Por defecto
        });
        if (response.data.success) {
          toast.success('¡Servicio actualizado exitosamente!');
          setModalOpen(false);
          loadServicios();
        }
      } else {
        // Crear
        const response = await api.post(`/api/Servicios`, {
          nombre,
          descripcion,
          duracionMinutos,
          precio,
          activo: true
        });
        if (response.data.success) {
          toast.success('¡Servicio creado exitosamente!');
          setModalOpen(false);
          loadServicios();
        }
      }
    } catch (error: any) {
      console.error('Error al guardar servicio:', error);
      toast.error(error.response?.data?.message || 'Ocurrió un error al guardar el servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (id: number) => {
    try {
      const response = await api.post(`/api/Servicios/ToggleActivo/${id}`);
      if (response.data.success) {
        toast.success(response.data.data || 'Estado del servicio modificado.');
        // Actualizar estado local inmediato
        setServicios(prev => 
          prev.map(s => s.id === id ? { ...s, activo: !s.activo } : s)
        );
      }
    } catch (error) {
      console.error('Error al cambiar estado del servicio:', error);
      toast.error('No se pudo modificar el estado del servicio.');
    }
  };

  const handleDeleteServicio = async (id: number, nombreServicio: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el servicio "${nombreServicio}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/Servicios/${id}`);
      if (response.data.success) {
        toast.success('¡Servicio eliminado exitosamente!');
        loadServicios();
      }
    } catch (error: any) {
      console.error('Error al eliminar servicio:', error);
      toast.error(error.response?.data?.message || 'No se pudo eliminar el servicio. Recuerda que no puede tener citas asociadas.');
    }
  };

  const formatDuracion = (minutos: number): string => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins === 0 ? `${horas}h` : `${horas}h ${mins}m`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="flex-grow w-full bg-background min-h-screen pt-24 pb-margin"
    >
      <main className="flex-grow w-full max-w-6xl mx-auto px-margin flex flex-col gap-md">
        
        {/* Cabecera Administrativa */}
        <section className="flex flex-col sm:flex-row items-center justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md gap-sm">
          <div className="flex items-center gap-md text-left">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[32px]">medical_services</span>
            </div>
            <div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface">Catálogo de Servicios Clínicos</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Configura las opciones de servicios, duración y costos que se ofertarán para agendar citas.</p>
            </div>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="bg-primary text-on-primary px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-tint transition-colors shadow-sm cursor-pointer h-[44px]"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Crear Servicio
          </button>
        </section>

        {/* Caja de Herramientas y Filtros */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-sm flex flex-col sm:flex-row items-center justify-between gap-sm">
          {/* Búsqueda */}
          <div className="relative rounded-xl border border-outline-variant/30 bg-surface shadow-sm focus-within:border-primary transition-all duration-200 w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              type="text" 
              className="w-full h-10 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none"
              placeholder="Buscar servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mostrar Inactivos Switch */}
          <div className="flex items-center gap-xs cursor-pointer select-none">
            <input 
              type="checkbox" 
              id="mostrar-inactivos"
              className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary bg-transparent cursor-pointer"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            <label htmlFor="mostrar-inactivos" className="font-body-md text-body-md text-on-surface font-semibold cursor-pointer">
              Mostrar Servicios Inactivos
            </label>
          </div>
        </section>

        {/* Tabla / Grid */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
              <p className="font-label-sm text-label-sm text-outline mt-xs">Consultando catálogo de servicios...</p>
            </div>
          ) : servicios.length === 0 ? (
            <div className="py-20 text-center opacity-65 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[56px] text-outline">design_services</span>
              <h3 className="font-headline-md text-lg text-on-surface mt-xs font-bold">Sin servicios</h3>
              <p className="font-body-md text-body-md mt-2">No se encontraron servicios que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[13px] text-on-surface-variant font-bold">
                    <th className="p-md">Servicio</th>
                    <th className="p-md">Descripción</th>
                    <th className="p-md">Duración</th>
                    <th className="p-md text-right">Precio Base</th>
                    <th className="p-md text-center">Estado</th>
                    <th className="p-md text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-body-md text-on-surface font-medium">
                  {servicios.map((s) => (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-surface transition-colors ${!s.activo ? 'opacity-60 bg-surface-container-high/20' : ''}`}
                    >
                      <td className="p-md font-bold text-primary text-[15px]">
                        {s.nombre}
                      </td>
                      <td className="p-md text-[13px] text-on-surface-variant max-w-xs truncate" title={s.descripcion || ''}>
                        {s.descripcion || 'Sin descripción.'}
                      </td>
                      <td className="p-md text-[13px]">
                        <span className="inline-flex items-center gap-xs font-semibold">
                          <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                          {formatDuracion(s.duracionMinutos)}
                        </span>
                      </td>
                      <td className="p-md text-right font-bold text-on-surface text-[15px]">
                        S/. {s.precio.toFixed(2)}
                      </td>
                      <td className="p-md text-center">
                        <button
                          onClick={() => handleToggleActivo(s.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                            s.activo ? 'bg-primary' : 'bg-outline-variant/40'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              s.activo ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="p-md text-center">
                        <div className="inline-flex items-center gap-xs">
                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-xs rounded-lg border border-outline-variant/40 hover:bg-surface-container-high text-outline hover:text-on-surface transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Editar Servicio"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          
                          {/* Botón Eliminar */}
                          <button
                            onClick={() => handleDeleteServicio(s.id, s.nombre)}
                            className="p-xs rounded-lg border border-error/20 hover:bg-error-container/20 text-error transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Eliminar Servicio"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* MODAL CREAR / EDITAR (Animado) */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-md overflow-y-auto">
              {/* Capa oscura translúcida */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                className="fixed inset-0 bg-black/45 backdrop-blur-sm"
              />

              {/* Contenedor del Modal */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="relative bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant p-md max-w-lg w-full z-10 text-left overflow-hidden flex flex-col gap-md"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-surface-variant pb-xs">
                  <h3 className="font-headline-md text-lg text-on-surface font-extrabold flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary">
                      {editingId ? 'edit_note' : 'add_circle'}
                    </span>
                    {editingId ? 'Editar Servicio Clínico' : 'Nuevo Servicio Clínico'}
                  </h3>
                  <button 
                    onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-container-high text-outline flex items-center justify-center cursor-pointer border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-sm">
                  {/* Nombre */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Nombre del Servicio</label>
                    <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                      <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">design_services</span>
                      <input 
                        className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                        type="text" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Consulta Especializada"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Fila Duración y Precio */}
                  <div className="grid grid-cols-2 gap-sm">
                    {/* Duración */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Duración (minutos)</label>
                      <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">schedule</span>
                        <input 
                          className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface focus:outline-none" 
                          type="number" 
                          min={15}
                          max={480}
                          value={duracionMinutos}
                          onChange={(e) => setDuracionMinutos(Number(e.target.value))}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Precio Base (S/.)</label>
                      <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">payments</span>
                        <input 
                          className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface focus:outline-none" 
                          type="number" 
                          step="0.01"
                          min={0.01}
                          value={precio}
                          onChange={(e) => setPrecio(Number(e.target.value))}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Descripción / Notas</label>
                    <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                      <span className="material-symbols-outlined absolute left-sm top-[18px] -translate-y-1/2 text-outline">description</span>
                      <textarea 
                        className="w-full pl-10 pr-sm pt-xs bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none min-h-[80px] resize-none" 
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Escribe los detalles específicos del procedimiento..."
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex justify-end gap-xs border-t border-surface-variant/30 pt-sm mt-xs">
                    <button 
                      type="button" 
                      onClick={() => setModalOpen(false)}
                      className="bg-transparent border border-outline text-on-surface px-margin py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer h-10"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className={`px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs cursor-pointer h-10 ${
                        submitting 
                          ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed' 
                          : 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/20 hover:shadow-lg'
                      }`}
                    >
                      {submitting ? (
                        <div className="flex items-center gap-sm">
                          <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                          <span>Guardando...</span>
                        </div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">save</span>
                          <span>{editingId ? 'Actualizar' : 'Crear Servicio'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </motion.div>
  );
};

export default GestionServicios;
