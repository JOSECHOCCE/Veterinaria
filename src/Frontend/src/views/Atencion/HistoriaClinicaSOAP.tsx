import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

interface RecetaItem {
  farmaco: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
}

interface CitaDetails {
  cita: {
    id: number;
    fechaHora: string;
    estado: string;
    motivo: string;
    mascotaId: number;
    mascotaNombre: string;
    propietarioNombre: string;
    veterinarioNombre: string;
    servicioNombre: string;
    precioServicio: number;
  };
}

const DIAGNOSTICOS_COMUNES = [
  "Gastroenteritis aguda (K52.9)",
  "Gastritis crónica (K29.5)",
  "Otitis externa bacteriana (H60.3)",
  "Dermatitis alérgica por pulgas (L23.9)",
  "Parvovirosis canina (B34.8)",
  "Insuficiencia renal crónica (N18.9)",
  "Conjuntivitis bilateral (H10.9)",
  "Bronquitis infecciosa (J40)",
  "Fractura de fémur (S72.0)",
  "Deshidratación leve (E86.0)",
  "Parasitosis gastrointestinal (B82.9)",
  "Faringitis aguda (J02.9)"
];

export default function HistoriaClinicaSOAP() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const citaId = searchParams.get('citaId');
  const triageId = searchParams.get('triageId');

  // Recuperar parámetros de Triage de la URL
  const triageTemp = searchParams.get('temp') || '';
  const triageFc = searchParams.get('fc') || '';
  const triagePeso = searchParams.get('peso') || '';
  const triageMotivo = searchParams.get('motivo') || '';
  const triagePaciente = searchParams.get('paciente') || '';
  const triagePropietario = searchParams.get('propietario') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [citaData, setCitaData] = useState<CitaDetails | null>(null);

  // SOAP Form State
  const [motivo, setMotivo] = useState(triageMotivo);
  const [anamnesis, setAnamnesis] = useState('');
  
  // Constantes y Examen Físico
  const [temperatura, setTemperatura] = useState(triageTemp);
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState(triageFc);
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState('');
  const [peso, setPeso] = useState(triagePeso);
  const [examenFisico, setExamenFisico] = useState('');

  // Diagnósticos
  const [diagnosticos, setDiagnosticos] = useState<string[]>([]);
  const [buscarDiag, setBuscarDiag] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Plan e Indicaciones
  const [procedimientos, setProcedimientos] = useState('');
  const [receta, setReceta] = useState<RecetaItem[]>([
    { farmaco: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }
  ]);

  useEffect(() => {
    if (citaId) {
      async function fetchCitaDetails() {
        try {
          const response = await api.get(`/api/Citas/${citaId}`);
          if (response.data.success) {
            setCitaData(response.data.data);
            if (response.data.data.cita.motivo && !triageMotivo) {
              setMotivo(response.data.data.cita.motivo);
            }
          } else {
            toast.error(response.data.message || 'Error al cargar detalles de la cita');
          }
        } catch (error) {
          console.error('Error fetching cita details:', error);
          toast.error('No se pudo cargar la información de la cita.');
        } finally {
          setLoading(false);
        }
      }
      fetchCitaDetails();
    } else {
      setLoading(false);
    }
  }, [citaId, triageMotivo]);

  // Receta Handlers
  const handleAddReceta = () => {
    setReceta([...receta, { farmaco: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }]);
  };

  const handleRemoveReceta = (index: number) => {
    setReceta(receta.filter((_, i) => i !== index));
  };

  const handleRecetaChange = (index: number, field: keyof RecetaItem, value: string) => {
    const updated = [...receta];
    updated[index] = { ...updated[index], [field]: value };
    setReceta(updated);
  };

  // Diagnósticos Handlers
  const handleAddDiagnostico = (diag: string) => {
    if (!diagnosticos.includes(diag)) {
      setDiagnosticos([...diagnosticos, diag]);
    }
    setBuscarDiag('');
    setMostrarSugerencias(false);
  };

  const handleRemoveDiagnostico = (diag: string) => {
    setDiagnosticos(diagnosticos.filter(d => d !== diag));
  };

  const handleCustomDiagnostico = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && buscarDiag.trim()) {
      e.preventDefault();
      handleAddDiagnostico(buscarDiag.trim());
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!citaId) {
      toast.error('No se puede guardar un historial clínico sin una cita válida.');
      return;
    }

    if (diagnosticos.length === 0) {
      toast.error('Debe seleccionar o ingresar al menos un diagnóstico.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Completar la cita en el backend
      const completeResponse = await api.post(`/api/Citas/Complete/${citaId}`);
      if (!completeResponse.data.success) {
        throw new Error(completeResponse.data.message || 'Error al completar la cita');
      }

      // 2. Formatear medicamentos de la receta
      const medicamentosText = receta
        .filter(r => r.farmaco.trim() !== '')
        .map(r => `${r.farmaco} (Dosis: ${r.dosis}, Frec: ${r.frecuencia}, Dur: ${r.duracion}) - Obs: ${r.indicaciones}`)
        .join('\n');

      // 3. Formatear observaciones estructuradas de SOAP
      const observacionesText = `[SUBJETIVO]
Motivo: ${motivo}
Anamnesis: ${anamnesis}

[OBJETIVO]
Constantes: Temp: ${temperatura}°C, FC: ${frecuenciaCardiaca} lpm, FR: ${frecuenciaRespiratoria} rpm, Peso: ${peso} kg.
Examen Físico: ${examenFisico}`;

      // 4. Crear el Historial Clínico
      const body = {
        citaId: Number(citaId),
        diagnostico: diagnosticos.join(', '),
        tratamiento: procedimientos || 'Sin procedimientos clínicos registrados.',
        medicamentos: medicamentosText || 'Sin medicamentos recetados.',
        observaciones: observacionesText
      };

      const historyResponse = await api.post('/api/HistorialesClinicos', body);
      if (historyResponse.data.success) {
        // 5. Si proviene de la cola de Triage, marcar el triage como "Atendido" para retirarlo
        if (triageId) {
          await api.post(`/api/Triage/CambiarEstado/${triageId}?nuevoEstado=Atendido`);
        }

        toast.success('Consulta clínica (SOAP) guardada exitosamente.');
        navigate('/admin/cola');
      } else {
        toast.error(historyResponse.data.message || 'Error al guardar el historial clínico');
      }
    } catch (error: any) {
      console.error('Error saving SOAP:', error);
      const msg = error.response?.data?.message || error.message || 'No se pudo completar el registro clínico.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const sugerenciasFiltradas = DIAGNOSTICOS_COMUNES.filter(d =>
    d.toLowerCase().includes(buscarDiag.toLowerCase())
  );

  const pacienteNombre = citaData?.cita?.mascotaNombre || triagePaciente || 'Paciente';
  const propietarioNombre = citaData?.cita?.propietarioNombre || triagePropietario || 'Propietario';
  const veterinarioNombre = citaData?.cita?.veterinarioNombre || 'Clínico de Guardia';
  const servicioNombre = citaData?.cita?.servicioNombre || 'Consulta General';

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-sm">Cargando detalles del paciente...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }} 
      className="flex-grow pt-16 md:pl-64 flex flex-col w-full bg-background"
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full">
        {/* Sticky Patient Header */}
        <div className="sticky top-16 z-30 bg-surface-container-lowest px-gutter py-4 border-b border-outline-variant shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary flex-shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-3xl font-semibold">pets</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-headline-lg text-headline-lg text-on-surface">{pacienteNombre}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container border border-primary/20">
                  En Consulta
                </span>
              </div>
              <div className="text-on-surface-variant font-body-md mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-on-surface">{servicioNombre}</span>
                <span className="w-1 h-1 rounded-full bg-outline"></span>
                <span>Clínico: {veterinarioNombre}</span>
                <span className="w-1 h-1 rounded-full bg-outline"></span>
                <span className="font-medium text-on-surface">Propietario: {propietarioNombre}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="h-10 px-4 rounded-lg border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors bg-surface-container-lowest"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="h-10 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {submitting ? 'Guardando...' : 'Guardar SOAP'}
            </button>
          </div>
        </div>

        {/* SOAP Form Content */}
        <div className="p-gutter max-w-5xl mx-auto w-full pb-32 flex flex-col gap-margin">
          <div className="mb-md">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Registro Clínico (SOAP)</h2>
            <p className="text-on-surface-variant text-body-md">Complete los campos correspondientes a la evaluación del paciente. Todos los signos vitales provienen directamente de Triage.</p>
          </div>

          {/* S - Subjective */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-headline-md">S</div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Subjetivo</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="motivo">Motivo de Consulta principal</label>
                <input 
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  id="motivo" 
                  placeholder="Ej: Vómitos persistentes y letargo" 
                  type="text" 
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="anamnesis">Anamnesis / Historia clínica reciente</label>
                <textarea 
                  className="w-full p-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[120px]" 
                  id="anamnesis" 
                  placeholder="Detalle los síntomas reportados por el propietario, inicio, frecuencia, cambios en dieta, etc." 
                  rows={4}
                  value={anamnesis}
                  onChange={(e) => setAnamnesis(e.target.value)}
                ></textarea>
              </div>
            </div>
          </section>

          {/* O - Objective */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold font-headline-md">O</div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Objetivo</h3>
            </div>
            
            {/* Constantes de Triage */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-surface-bright rounded-lg border border-outline-variant/50">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">Temperatura (°C)</label>
                <input 
                  className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-lg font-medium" 
                  placeholder="38.5" 
                  step="0.1" 
                  type="number" 
                  value={temperatura}
                  onChange={(e) => setTemperatura(e.target.value)}
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">FC (lpm)</label>
                <input 
                  className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-lg font-medium" 
                  placeholder="80" 
                  type="number" 
                  value={frecuenciaCardiaca}
                  onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">FR (rpm)</label>
                <input 
                  className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-lg font-medium" 
                  placeholder="24" 
                  type="number" 
                  value={frecuenciaRespiratoria}
                  onChange={(e) => setFrecuenciaRespiratoria(e.target.value)}
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">Peso (kg)</label>
                <input 
                  className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-lg font-medium" 
                  placeholder="32.4" 
                  step="0.1" 
                  type="number" 
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="examen_fisico">Hallazgos del Examen Físico</label>
              <textarea 
                className="w-full p-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all resize-y min-h-[140px]" 
                id="examen_fisico" 
                placeholder="Condición corporal, mucosas, TLLC, palpación abdominal, auscultación cardiopulmonar, etc." 
                rows={5}
                value={examenFisico}
                onChange={(e) => setExamenFisico(e.target.value)}
              ></textarea>
            </div>
          </section>

          {/* A - Analysis */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold font-headline-md">A</div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Análisis (Diagnóstico)</h3>
            </div>
            <div className="flex flex-col gap-6">
              <div className="relative">
                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">Buscador de Diagnósticos (CIE-10 Vet / SNOMED)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant">search</span>
                  <input 
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all font-body-lg" 
                    placeholder="Escriba para buscar patologías..." 
                    type="text" 
                    value={buscarDiag}
                    onChange={(e) => {
                      setBuscarDiag(e.target.value);
                      setMostrarSugerencias(true);
                    }}
                    onFocus={() => setMostrarSugerencias(true)}
                    onKeyDown={handleCustomDiagnostico}
                  />
                </div>

                {/* Suggestions List Dropdown */}
                {mostrarSugerencias && buscarDiag.trim() !== '' && (
                  <div className="absolute z-40 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <ul className="py-1">
                      {sugerenciasFiltradas.length > 0 ? (
                        sugerenciasFiltradas.map((sug, idx) => (
                          <li 
                            key={idx}
                            onClick={() => handleAddDiagnostico(sug)}
                            className="px-4 py-2 hover:bg-surface-variant cursor-pointer text-body-md text-on-surface transition-colors"
                          >
                            {sug}
                          </li>
                        ))
                      ) : (
                        <li 
                          onClick={() => handleAddDiagnostico(buscarDiag.trim())}
                          className="px-4 py-2 hover:bg-surface-variant cursor-pointer text-body-md text-primary font-medium transition-colors"
                        >
                          Presione Enter para agregar diagnóstico personalizado: "{buscarDiag}"
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">Diagnósticos Seleccionados <span className="text-error">*</span></label>
                <div className="flex flex-wrap gap-2 p-4 min-h-[80px] bg-surface-bright rounded-lg border border-outline-variant border-dashed">
                  {diagnosticos.length === 0 ? (
                    <span className="text-on-surface-variant font-body-md italic self-center opacity-65">No hay diagnósticos agregados aún. Busque y agregue arriba.</span>
                  ) : (
                    diagnosticos.map((diag, index) => (
                      <div 
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant shadow-sm transition-all"
                      >
                        <span className="text-body-md text-on-surface font-medium">{diag}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveDiagnostico(diag)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* P - Plan */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-headline-md">P</div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Plan Terapéutico</h3>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="procedimientos">Procedimientos Clínicos / Pruebas Solicitadas</label>
                <textarea 
                  className="w-full p-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[90px]" 
                  id="procedimientos" 
                  placeholder="Ej: Hemograma completo, Bioquímica básica, Ecografía abdominal programada..." 
                  rows={3}
                  value={procedimientos}
                  onChange={(e) => setProcedimientos(e.target.value)}
                ></textarea>
              </div>

              <div className="border-t border-outline-variant pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="font-headline-md text-headline-md text-on-surface block">Receta Médica</label>
                  <button 
                    type="button"
                    onClick={handleAddReceta}
                    className="text-primary text-label-md font-label-md hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Añadir Medicamento
                  </button>
                </div>
                <div className="space-y-4">
                  {receta.map((item, idx) => (
                    <div key={idx} className="p-4 bg-surface-bright rounded-lg border border-outline-variant transition-all shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Fármaco</label>
                          <input 
                            className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-body-md" 
                            type="text" 
                            placeholder="Nombre comercial o principio activo"
                            value={item.farmaco}
                            onChange={(e) => handleRecetaChange(idx, 'farmaco', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Dosis</label>
                          <input 
                            className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-body-md" 
                            type="text" 
                            placeholder="Ej: 1 comp"
                            value={item.dosis}
                            onChange={(e) => handleRecetaChange(idx, 'dosis', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Frecuencia</label>
                          <input 
                            className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-body-md" 
                            type="text" 
                            placeholder="Ej: Cada 24 hs"
                            value={item.frecuencia}
                            onChange={(e) => handleRecetaChange(idx, 'frecuencia', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Duración</label>
                          <input 
                            className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-body-md" 
                            type="text" 
                            placeholder="Ej: 4 días"
                            value={item.duracion}
                            onChange={(e) => handleRecetaChange(idx, 'duracion', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end justify-center pb-1">
                          <button 
                            type="button"
                            onClick={() => handleRemoveReceta(idx)}
                            disabled={receta.length === 1}
                            className="w-8 h-8 rounded text-error hover:bg-error-container/30 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Indicaciones extra para el propietario</label>
                        <input 
                          className="w-full h-8 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm" 
                          type="text" 
                          placeholder="Administrar preferentemente con un poco de comida."
                          value={item.indicaciones}
                          onChange={(e) => handleRecetaChange(idx, 'indicaciones', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </motion.div>
  );
}
