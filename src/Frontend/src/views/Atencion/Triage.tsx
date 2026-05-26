import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface MascotaOption {
  id: number;
  display: string;
}

const Triage = () => {
  const navigate = useNavigate();

  const [mascotas, setMascotas] = useState<MascotaOption[]>([]);
  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [mascotaId, setMascotaId] = useState<number | ''>('');
  const [nivel, setNivel] = useState('N3');
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState('');
  const [peso, setPeso] = useState('');

  useEffect(() => {
    async function fetchMascotas() {
      try {
        const response = await api.get('/api/Triage/Mascotas');
        if (response.data.success) {
          setMascotas(response.data.data);
        } else {
          toast.error(response.data.message || 'Error al cargar mascotas');
        }
      } catch (error) {
        console.error('Error fetching mascotas:', error);
        toast.error('No se pudo cargar la lista de mascotas.');
      } finally {
        setLoadingMascotas(false);
      }
    }
    fetchMascotas();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!mascotaId) {
      toast.error('Seleccione una mascota.');
      return;
    }
    if (!motivoConsulta.trim()) {
      toast.error('Ingrese el motivo de consulta.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        mascotaId: Number(mascotaId),
        nivel,
        motivoConsulta,
        temperatura: temperatura ? parseFloat(temperatura) : 0,
        frecuenciaCardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca, 10) : 0,
        peso: peso ? parseFloat(peso) : 0,
      };

      const response = await api.post('/api/Triage', body);
      if (response.data.success) {
        toast.success('Triage registrado correctamente.');
        navigate('/cola');
      } else {
        toast.error(response.data.message || 'Error al registrar triage');
      }
    } catch (error: any) {
      console.error('Error submitting triage:', error);
      const msg = error.response?.data?.message || 'No se pudo registrar el triage.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate(-1);
  }

  // Map radio values to nivel codes
  function handlePriorityChange(value: string) {
    switch (value) {
      case 'level1': setNivel('N1'); break;
      case 'level2': setNivel('N2'); break;
      case 'level3': setNivel('N3'); break;
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }} 
      className="flex-grow p-margin max-w-2xl mx-auto w-full"
    >
      <form className="flex flex-col gap-margin" onSubmit={handleSubmit}>
        {/* Section: Identificación del Paciente */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <div className="flex items-center gap-sm mb-md pb-sm border-b border-surface-variant">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Identificación del Paciente</h2>
          </div>
          <div className="flex flex-col gap-sm">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="mascota">Mascota</label>
              <div className="relative">
                <select
                  className="appearance-none w-full h-[48px] bg-surface-bright border border-outline text-on-surface rounded-DEFAULT px-sm pr-10 font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                  id="mascota"
                  value={mascotaId}
                  onChange={(e) => setMascotaId(e.target.value ? Number(e.target.value) : '')}
                  disabled={loadingMascotas}
                >
                  <option value="">
                    {loadingMascotas ? 'Cargando mascotas...' : 'Seleccione una mascota'}
                  </option>
                  {mascotas.map((m) => (
                    <option key={m.id} value={m.id}>{m.display}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section: Signos Vitales */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <div className="flex items-center gap-sm mb-md pb-sm border-b border-surface-variant">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Signos Vitales</h2>
          </div>
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="temp">Temperatura (°C)</label>
              <input
                className="h-[48px] bg-surface-bright border border-outline text-on-surface rounded-DEFAULT px-sm font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                id="temp"
                placeholder="Ej. 38.5"
                step="0.1"
                type="number"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="hr">Frecuencia Cardíaca (LPM)</label>
              <input
                className="h-[48px] bg-surface-bright border border-outline text-on-surface rounded-DEFAULT px-sm font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                id="hr"
                placeholder="Ej. 120"
                type="number"
                value={frecuenciaCardiaca}
                onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="weight">Peso Estimado (KG)</label>
              <input
                className="h-[48px] bg-surface-bright border border-outline text-on-surface rounded-DEFAULT px-sm font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                id="weight"
                placeholder="Ej. 15.2"
                step="0.1"
                type="number"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Section: Motivo de Consulta */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <div className="flex items-center gap-sm mb-md pb-sm border-b border-surface-variant">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Motivo de Consulta</h2>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface sr-only" htmlFor="reason">Descripción del motivo</label>
            <textarea
              className="bg-surface-bright border border-outline text-on-surface rounded-DEFAULT p-sm font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow resize-y"
              id="reason"
              placeholder="Describa brevemente los síntomas o motivo de llegada del paciente..."
              rows={4}
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
            ></textarea>
          </div>
        </section>

        {/* Section: Nivel de Prioridad */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <div className="flex items-center gap-sm mb-md pb-sm border-b border-surface-variant">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Clasificación de Prioridad</h2>
          </div>
          <div className="flex flex-col gap-sm">
            {/* Nivel 1: Emergencia */}
            <label className="cursor-pointer relative">
              <input
                className="peer sr-only"
                name="priority"
                type="radio"
                value="level1"
                checked={nivel === 'N1'}
                onChange={(e) => handlePriorityChange(e.target.value)}
              />
              <div className="flex flex-col p-sm border border-outline-variant rounded-xl bg-surface-bright hover:bg-surface-container transition-colors peer-checked:border-error peer-checked:bg-error-container peer-checked:ring-1 peer-checked:ring-error">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-outline peer-checked:border-error peer-checked:bg-error flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-surface-container-lowest hidden peer-checked:block"></div>
                    </div>
                    <span className="font-headline-md text-headline-md text-error">Nivel 1: Emergencia</span>
                  </div>
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <p className="mt-xs text-body-md text-on-surface-variant ml-[28px]">Riesgo vital inminente. Requiere atención médica inmediata (Ej: Paro cardiorrespiratorio, hemorragia masiva).</p>
              </div>
            </label>
            
            {/* Nivel 2: Urgente */}
            <label className="cursor-pointer relative">
              <input
                className="peer sr-only"
                name="priority"
                type="radio"
                value="level2"
                checked={nivel === 'N2'}
                onChange={(e) => handlePriorityChange(e.target.value)}
              />
              <div className="flex flex-col p-sm border border-outline-variant rounded-xl bg-surface-bright hover:bg-surface-container transition-colors peer-checked:border-tertiary-fixed-dim peer-checked:bg-tertiary-fixed peer-checked:ring-1 peer-checked:ring-tertiary-fixed-dim">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-outline flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full hidden"></div>
                    </div>
                    <span className="font-headline-md text-headline-md text-on-tertiary-fixed-variant">Nivel 2: Urgente</span>
                  </div>
                  <span className="material-symbols-outlined text-on-tertiary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                </div>
                <p className="mt-xs text-body-md text-on-surface-variant ml-[28px]">Condición grave, pero estable por el momento. Atención a la brevedad (Ej: Fracturas abiertas, dolor agudo severo).</p>
              </div>
            </label>
            
            {/* Nivel 3: No Urgente */}
            <label className="cursor-pointer relative">
              <input
                className="peer sr-only"
                name="priority"
                type="radio"
                value="level3"
                checked={nivel === 'N3'}
                onChange={(e) => handlePriorityChange(e.target.value)}
              />
              <div className="flex flex-col p-sm border border-outline-variant rounded-xl bg-surface-bright hover:bg-surface-container transition-colors peer-checked:border-secondary peer-checked:bg-secondary-container peer-checked:ring-1 peer-checked:ring-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-outline peer-checked:border-secondary peer-checked:bg-secondary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-surface-container-lowest hidden peer-checked:block"></div>
                    </div>
                    <span className="font-headline-md text-headline-md text-on-secondary-container">Nivel 3: No Urgente</span>
                  </div>
                  <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <p className="mt-xs text-body-md text-on-surface-variant ml-[28px]">Estable, sin riesgo vital. Puede esperar su turno (Ej: Vacunaciones, problemas dermatológicos leves).</p>
              </div>
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-sm pt-sm mt-md border-t border-surface-variant">
          <button
            className="h-[48px] px-lg rounded-full font-label-md text-label-md text-primary border border-outline hover:bg-surface-container-low transition-colors w-full sm:w-auto"
            type="button"
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button
            className="h-[48px] px-lg rounded-full font-label-md text-label-md bg-primary text-on-primary hover:bg-surface-tint transition-colors shadow-sm flex items-center justify-center gap-xs w-full sm:w-auto sm:ml-auto"
            type="submit"
            disabled={submitting}
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
            {submitting ? 'Enviando...' : 'Enviar a Cola de Atención'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Triage;
