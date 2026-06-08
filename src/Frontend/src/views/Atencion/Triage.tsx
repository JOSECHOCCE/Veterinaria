import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AtencionService from '../../services/atencion.service';
import type { TriageMascotaDropdown, TriageDto } from '../../services/atencion.service';
import CitasService from '../../services/citas.service';
import type { CalendarioEventDto } from '../../services/citas.service';

export default function Triage() {
  const navigate = useNavigate();

  // Form Fields State
  const [mascotaId, setMascotaId] = useState<number>(0);
  const [nivel, setNivel] = useState<string>('N3'); // default N3
  const [sintomas, setSintomas] = useState<string>('');
  const [motivoConsulta, setMotivoConsulta] = useState<string>('');
  
  // Vital Signs
  const [temperatura, setTemperatura] = useState<string>('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState<string>('');
  const [pesoEstimado, setPesoEstimado] = useState<string>('');

  // Dropdowns data
  const [mascotas, setMascotas] = useState<TriageMascotaDropdown[]>([]);
  const [todayCitas, setTodayCitas] = useState<CalendarioEventDto[]>([]);
  const [selectedCitaId, setSelectedCitaId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load active pets
        const petsData = await AtencionService.getTriageMascotas();
        setMascotas(petsData || []);

        // Load today's appointments to link if possible
        const today = new Date().toISOString().split('T')[0];
        const start = `${today}T00:00:00`;
        const end = `${today}T23:59:59`;
        const citasData = await CitasService.getCalendarioData(start, end);
        
        // Filter appointments that aren't completed or canceled
        const activeCitas = citasData.filter(
          (c) => !['Completada', 'Cancelada', 'Rechazada', 'NoAsistio'].includes(c.extendedProps.estado)
        );
        setTodayCitas(activeCitas);
      } catch (err) {
        console.error('Error loading triage form catalogs:', err);
        toast.error('No se pudo cargar la información del formulario.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-detect appointment for selected pet
  useEffect(() => {
    if (!mascotaId) {
      setSelectedCitaId(null);
      return;
    }
    const matchedCita = todayCitas.find((c) => c.extendedProps.mascotaId === mascotaId);
    if (matchedCita) {
      setSelectedCitaId(matchedCita.id);
      if (!motivoConsulta) {
        setMotivoConsulta(matchedCita.extendedProps.motivo || '');
      }
    } else {
      setSelectedCitaId(null);
    }
  }, [mascotaId, todayCitas, motivoConsulta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mascotaId) {
      toast.error('Debe seleccionar una mascota.');
      return;
    }

    try {
      const payload: TriageDto = {
        mascotaId,
        citaId: selectedCitaId,
        nivel,
        sintomas: sintomas.trim() || null,
        motivoConsulta: motivoConsulta.trim() || null,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        frecuenciaCardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
        pesoEstimado: pesoEstimado ? parseFloat(pesoEstimado) : null,
      };

      await AtencionService.createTriage(payload);
      toast.success('Paciente registrado en triage e ingresado a la cola de atención.');
      navigate('/admin/cola');
    } catch (err: any) {
      console.error('Error saving triage:', err);
      toast.error(err.response?.data?.message || 'Error al guardar el registro de triage.');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none">
      {/* Header */}
      <header className="flex justify-between items-center pb-md border-b border-hairline mb-xl">
        <button
          onClick={() => navigate('/admin/cola')}
          className="flex items-center gap-xs text-secondary hover:text-ink transition-colors font-button text-button group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Volver a la Cola
        </button>
        <div className="font-title-sm text-title-sm text-ink font-semibold">Triage Operativo</div>
      </header>

      <div className="mb-lg">
        <h1 className="font-display-md text-display-md text-ink">Registro de Triage</h1>
        <p className="font-body-md text-body-md text-secondary max-w-2xl mt-1">
          Ingrese los datos preliminares del paciente para clasificar su urgencia e ingresarlo a la sala de espera.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Patient & Urgency (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          {/* Patient Details */}
          <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">pets</span>
              Identificación del Paciente
            </h2>

            <div className="flex flex-col gap-md">
              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Mascota Activa</label>
                <select
                  value={mascotaId}
                  onChange={(e) => setMascotaId(Number(e.target.value))}
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value={0}>Seleccione una mascota...</option>
                  {mascotas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCitaId && (
                <div className="bg-success/5 border border-success/20 text-success p-3 rounded-lg flex items-center gap-sm font-semibold">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Cita médica de hoy detectada y vinculada automáticamente.
                </div>
              )}
            </div>
          </section>

          {/* Urgency Classification */}
          <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">clinical_notes</span>
              Nivel de Clasificación de Urgencia
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {/* N1 */}
              <label
                className={`p-lg border rounded-xl flex flex-col gap-sm cursor-pointer transition-all ${
                  nivel === 'N1'
                    ? 'border-error bg-error/5 shadow-xs font-bold text-error'
                    : 'border-hairline bg-canvas hover:border-error/40 hover:text-error'
                }`}
              >
                <input
                  type="radio"
                  name="nivel"
                  checked={nivel === 'N1'}
                  onChange={() => setNivel('N1')}
                  className="sr-only"
                />
                <span className="font-title-sm text-title-sm">N1 - Emergencia</span>
                <span className="text-[12px] text-body-muted font-normal mt-xs leading-relaxed">
                  Peligro vital inmediato. Sin tiempo de espera. Derivación a Sala de Shock.
                </span>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-error">
                  <span className="w-2 h-2 rounded-full bg-error animate-ping mr-1"></span>
                  Prioridad Roja
                </span>
              </label>

              {/* N2 */}
              <label
                className={`p-lg border rounded-xl flex flex-col gap-sm cursor-pointer transition-all ${
                  nivel === 'N2'
                    ? 'border-accent-amber bg-accent-amber/5 shadow-xs font-bold text-accent-amber'
                    : 'border-hairline bg-canvas hover:border-accent-amber/40 hover:text-accent-amber'
                }`}
              >
                <input
                  type="radio"
                  name="nivel"
                  checked={nivel === 'N2'}
                  onChange={() => setNivel('N2')}
                  className="sr-only"
                />
                <span className="font-title-sm text-title-sm">N2 - Urgente</span>
                <span className="text-[12px] text-body-muted font-normal mt-xs leading-relaxed">
                  Condición de riesgo potencial. Espera estimada de 15 minutos.
                </span>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-accent-amber">
                  Prioridad Naranja
                </span>
              </label>

              {/* N3 */}
              <label
                className={`p-lg border rounded-xl flex flex-col gap-sm cursor-pointer transition-all ${
                  nivel === 'N3'
                    ? 'border-success bg-success/5 shadow-xs font-bold text-success'
                    : 'border-hairline bg-canvas hover:border-success/40 hover:text-success'
                }`}
              >
                <input
                  type="radio"
                  name="nivel"
                  checked={nivel === 'N3'}
                  onChange={() => setNivel('N3')}
                  className="sr-only"
                />
                <span className="font-title-sm text-title-sm">N3 - No Urgente</span>
                <span className="text-[12px] text-body-muted font-normal mt-xs leading-relaxed">
                  Consulta de rutina o control estable. Espera de 30 minutos.
                </span>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-success">
                  Prioridad Verde
                </span>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Vitals & Symptoms (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Vital Signs */}
          <section className="bg-surface-card rounded-xl p-lg border border-transparent shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">vital_signs</span>
              Signos Vitales Básicos
            </h2>

            <div className="flex flex-col gap-md">
              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperatura}
                  onChange={(e) => setTemperatura(e.target.value)}
                  placeholder="Ej: 38.5"
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Frecuencia Cardíaca (lpm)</label>
                <input
                  type="number"
                  value={frecuenciaCardiaca}
                  onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                  placeholder="Ej: 90"
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Peso Estimado (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={pesoEstimado}
                  onChange={(e) => setPesoEstimado(e.target.value)}
                  placeholder="Ej: 14.2"
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </section>

          {/* Reason / Notes */}
          <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-md">
            <h2 className="font-title-md text-title-md text-ink font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">description</span>
              Motivo e Historial Sintomático
            </h2>

            <div className="flex flex-col gap-md">
              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Motivo de Ingreso</label>
                <input
                  type="text"
                  value={motivoConsulta}
                  onChange={(e) => setMotivoConsulta(e.target.value)}
                  placeholder="Ej: Cojera en pata trasera..."
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-caption-caps text-caption-caps text-secondary block mb-1">Síntomas Reportados</label>
                <textarea
                  value={sintomas}
                  onChange={(e) => setSintomas(e.target.value)}
                  placeholder="Descripción detallada de síntomas..."
                  rows={3}
                  className="w-full bg-canvas border border-hairline rounded-lg py-2 px-3 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Form Actions Footer */}
        <div className="lg:col-span-12 mt-lg flex flex-col sm:flex-row justify-end items-center gap-md pt-lg border-t border-hairline">
          <button
            type="button"
            onClick={() => navigate('/admin/cola')}
            className="w-full sm:w-auto px-lg py-2.5 rounded-lg font-button text-button border border-ink text-ink hover:bg-surface-soft transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="w-full sm:w-auto px-xl py-2.5 rounded-lg font-button text-button bg-primary text-on-primary hover:bg-primary-active transition-colors cursor-pointer text-center shadow-sm"
          >
            Registrar Ingreso a Triage
          </button>
        </div>
      </form>
    </div>
  );
}

// Simple Spinner Component locally to support catalog loading
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div className={`rounded-full border-primary/20 border-t-primary animate-spin ${sizeClasses[size]}`}></div>
  );
}
