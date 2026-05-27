import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  peso?: number;
  alergias?: string;
  observaciones?: string;
  fotoUrl?: string;
}

interface HistorialClinico {
  id: number;
  citaId: number;
  diagnostico: string;
  tratamiento?: string;
  medicamentos?: string;
  observaciones?: string;
  fechaRegistro: string;
  veterinarioNombre?: string;
  servicioNombre?: string;
  fechaCita?: string;
  motivoCita?: string;
}

const HistorialCliente: React.FC = () => {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [selectedMascotaId, setSelectedMascotaId] = useState<number | null>(null);
  const [historiales, setHistoriales] = useState<HistorialClinico[]>([]);
  const [mascotaDetalle, setMascotaDetalle] = useState<Mascota | null>(null);
  
  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Cargar mascotas del cliente
  useEffect(() => {
    async function loadMascotas() {
      try {
        const response = await api.get('/api/Mascotas');
        if (response.data.success) {
          const list = response.data.data.data || [];
          setMascotas(list);
          if (list.length > 0) {
            setSelectedMascotaId(list[0].id);
          }
        }
      } catch (error) {
        console.error('Error al cargar mascotas:', error);
        toast.error('No se pudo cargar tu lista de mascotas.');
      } finally {
        setLoadingMascotas(false);
      }
    }

    loadMascotas();
  }, []);

  // Cargar historial de la mascota seleccionada
  useEffect(() => {
    if (selectedMascotaId === null) return;

    async function loadHistorial() {
      setLoadingHistorial(true);
      setExpandedId(null);
      try {
        // Cargar historial clinico
        const response = await api.get(`/api/HistorialesClinicos?mascotaId=${selectedMascotaId}`);
        if (response.data.success) {
          setHistoriales(response.data.data.historiales || []);
          setMascotaDetalle(response.data.data.mascota || null);
        }
      } catch (error) {
        console.error('Error al cargar historial clínico:', error);
        toast.error('No se pudo cargar el historial clínico.');
      } finally {
        setLoadingHistorial(false);
      }
    }

    loadHistorial();
  }, [selectedMascotaId]);

  const formatFecha = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loadingMascotas) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-sm">Cargando tus mascotas...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="flex-grow w-full bg-background min-h-screen pt-24 pb-margin"
    >
      <main className="flex-grow w-full max-w-5xl mx-auto px-margin flex flex-col gap-md">
        
        {/* Cabecera y Selector */}
        <section className="flex flex-col md:flex-row items-center justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md gap-md">
          <div className="flex items-center gap-md text-left">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[32px]">folder_shared</span>
            </div>
            <div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface">Historial Médico de mis Mascotas</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Consulta el registro clínico detallado, recetas y observaciones médicas de tus mascotas en modo de solo lectura.</p>
            </div>
          </div>

          {/* Selector de Mascota Premium */}
          <div className="flex flex-col gap-xs w-full md:w-64 text-left">
            <label className="font-label-md text-label-sm text-outline font-semibold" htmlFor="select-mascota">Selecciona una Mascota</label>
            <div className="relative rounded-xl border border-outline-variant/40 bg-surface shadow-sm focus-within:border-primary transition-all duration-200">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">pets</span>
              <select
                id="select-mascota"
                value={selectedMascotaId || ''}
                onChange={(e) => setSelectedMascotaId(Number(e.target.value))}
                className="w-full h-11 pl-10 pr-md bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer appearance-none"
              >
                {mascotas.map((pet) => (
                  <option key={pet.id} value={pet.id}>{pet.nombre}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-outline pointer-events-none">arrow_drop_down</span>
            </div>
          </div>
        </section>

        {/* Ficha Rápida e Historial */}
        {selectedMascotaId === null ? (
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-xl text-center">
            <span className="material-symbols-outlined text-[56px] text-outline">pets</span>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm">No tienes mascotas registradas. Agrega una mascota para comenzar.</p>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md items-start">
            
            {/* Columna 1: Tarjeta Ficha Rápida Mascota */}
            <section className="lg:col-span-1 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm text-left">
              <div className="border-b border-surface-variant pb-xs">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">clinical_notes</span>
                  Ficha Médica Rápida
                </h3>
              </div>

              {mascotaDetalle && (
                <div className="flex flex-col gap-sm">
                  {/* Foto y Datos Principales */}
                  <div className="flex items-center gap-sm mt-xs">
                    <img 
                      src={mascotaDetalle.fotoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=128&h=128&q=80'} 
                      alt={mascotaDetalle.nombre}
                      className="w-16 h-16 rounded-2xl object-cover border border-outline-variant shadow-md"
                    />
                    <div className="flex flex-col">
                      <span className="font-headline-md text-[20px] font-bold text-primary">{mascotaDetalle.nombre}</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">{mascotaDetalle.especie} • {mascotaDetalle.raza || 'Mestizo'}</span>
                    </div>
                  </div>

                  {/* Atributos Clínicos */}
                  <div className="grid grid-cols-2 gap-sm bg-surface-container-low p-sm rounded-xl border border-outline-variant/20 mt-xs">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">Último Peso</span>
                      <span className="font-headline-md text-lg font-bold text-on-surface">{mascotaDetalle.peso ? `${mascotaDetalle.peso} kg` : 'No registrado'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">Alergias</span>
                      <span className="font-headline-md text-xs font-bold text-error uppercase tracking-wide truncate" title={mascotaDetalle.alergias || 'Ninguna'}>
                        {mascotaDetalle.alergias || 'Ninguna'}
                      </span>
                    </div>
                  </div>

                  {/* Notas Generales */}
                  <div className="flex flex-col gap-xs bg-surface p-sm rounded-xl border border-outline-variant/30">
                    <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">Observaciones Generales</span>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {mascotaDetalle.observaciones || 'Sin notas especiales del veterinario.'}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Columna 2 y 3: Timeline Clínico */}
            <section className="lg:col-span-2 flex flex-col gap-sm">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md">
                <div className="border-b border-surface-variant pb-xs mb-md text-left">
                  <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Historial de Consultas & Atenciones
                  </h3>
                </div>

                {loadingHistorial ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
                    <p className="font-label-md text-label-sm text-outline mt-xs">Cargando consultas de la mascota...</p>
                  </div>
                ) : historiales.length === 0 ? (
                  <div className="py-16 text-center opacity-65 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[48px] text-outline">history_edu</span>
                    <h4 className="font-headline-md text-on-surface font-bold mt-xs">Sin registros médicos</h4>
                    <p className="font-body-md text-body-md mt-2">Esta mascota aún no tiene consultas médicas registradas en la clínica.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-outline-variant/40 flex flex-col gap-md text-left">
                    {historiales.map((hist, index) => {
                      const isExpanded = expandedId === hist.id;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          key={hist.id} 
                          className="relative flex flex-col bg-surface rounded-xl border border-outline-variant hover:border-primary shadow-sm overflow-hidden transition-all duration-300"
                        >
                          {/* Punto en el Timeline */}
                          <div className="absolute -left-[31px] top-6 w-3 h-3 rounded-full bg-primary border-2 border-surface shadow" />

                          {/* Cabecera de la Atención (Siempre Visible) */}
                          <div 
                            onClick={() => toggleExpand(hist.id)}
                            className="p-sm flex justify-between items-center cursor-pointer select-none bg-surface-container-low/40 hover:bg-surface-container-low transition-colors"
                          >
                            <div className="flex flex-col gap-xs">
                              <span className="font-label-md text-label-md text-primary font-bold">{hist.fechaCita ? formatFecha(hist.fechaCita) : formatFecha(hist.fechaRegistro)}</span>
                              <h4 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                                {hist.servicioNombre || 'Consulta General'}
                              </h4>
                              <p className="font-body-md text-[13px] text-on-surface-variant font-medium">Atendido por: {hist.veterinarioNombre || 'Médico Veterinario'}</p>
                            </div>
                            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-outline border border-outline-variant/40">
                              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                expand_more
                              </span>
                            </button>
                          </div>

                          {/* Contenido Detallado Expandible (Acordeón) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="p-sm border-t border-outline-variant/30 flex flex-col gap-md bg-surface-container-lowest">
                                  {/* Motivo de consulta si existe */}
                                  {hist.motivoCita && (
                                    <div className="flex flex-col gap-xs bg-surface-container-high/40 p-sm rounded-lg border border-outline-variant/10">
                                      <span className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Motivo de consulta (Reportado por el Dueño)</span>
                                      <p className="font-body-md text-body-md text-on-surface font-normal italic">
                                        "{hist.motivoCita}"
                                      </p>
                                    </div>
                                  )}

                                  {/* Diagnóstico (Core) */}
                                  <div className="flex flex-col gap-xs">
                                    <span className="font-label-sm text-[10px] text-primary font-bold uppercase tracking-wider">Diagnóstico Veterinario</span>
                                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                                      {hist.diagnostico}
                                    </p>
                                  </div>

                                  {/* Fila Tratamiento y Medicamentos */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                                    {/* Tratamiento en Consulta */}
                                    <div className="flex flex-col gap-xs bg-surface p-sm rounded-lg border border-outline-variant/20">
                                      <span className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Tratamiento Clínico</span>
                                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                                        {hist.tratamiento || 'Procedimiento menor estándar.'}
                                      </p>
                                    </div>

                                    {/* Medicamentos / Receta */}
                                    <div className="flex flex-col gap-xs bg-surface p-sm rounded-lg border border-outline-variant/20">
                                      <span className="font-label-sm text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-xs">
                                        <span className="material-symbols-outlined text-[14px]">prescriptions</span>
                                        Medicación Indicada
                                      </span>
                                      <p className="font-body-md text-body-md text-on-surface font-bold leading-relaxed whitespace-pre-line">
                                        {hist.medicamentos || 'Sin medicación prescrita.'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Observaciones y Cuidados en Casa */}
                                  <div className="flex flex-col gap-xs border-t border-outline-variant/30 pt-sm">
                                    <span className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Recomendaciones & Cuidados en Casa</span>
                                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                                      {hist.observaciones || 'Continuar con alimentación balanceada e hidratación.'}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </motion.div>
                      );
                    })}
                  </div>
                )}

              </div>
            </section>

          </div>
        )}

      </main>
    </motion.div>
  );
};

export default HistorialCliente;
