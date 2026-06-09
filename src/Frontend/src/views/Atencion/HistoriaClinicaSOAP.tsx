import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import AtencionService from '../../services/atencion.service';
import type { HistorialClinicoDto } from '../../services/atencion.service';
import MascotasService from '../../services/mascotas.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';

interface HistorialRecent {
  id: number;
  fechaRegistro: string;
  servicioNombre?: string | null;
  veterinarioNombre?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  medicamentos?: string | null;
  recomendaciones?: string | null;
  proximoControl?: string | null;
}

interface Alertas {
  alergias: string;
  condicionCronica: string;
  ultimaVacuna: string;
}

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  peso?: number | null;
  color?: string | null;
  fechaNacimiento?: string | null;
  usuarioId: number;
  usuarioNombre?: string | null;
  activo: boolean;
  fotoUrl?: string | null;
  sexo?: string | null;
  observacionesGenerales?: string | null;
  alergiasConocidas?: string | null;
}

interface Cita {
  id: number;
  fechaHora: string;
  estado: string;
  motivo?: string | null;
  servicio?: {
    id: number;
    nombre: string;
  } | null;
  veterinario?: {
    id: number;
    nombre: string;
  } | null;
}

export default function HistoriaClinicaSOAP() {
  const { citaId } = useParams<{ citaId: string }>();
  const citaIdNum = Number(citaId);
  const navigate = useNavigate();
  const location = useLocation();

  // Loaders
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Loaded Entities Context
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [cita, setCita] = useState<Cita | null>(null);
  const [servicioNombre, setServicioNombre] = useState<string>('');
  const [veterinarioNombre, setVeterinarioNombre] = useState<string>('');
  const [recentHistoriales, setRecentHistoriales] = useState<HistorialRecent[]>([]);
  const [alertasMedicas, setAlertasMedicas] = useState<Alertas | null>(null);

  // Form State
  const [isExisting, setIsExisting] = useState<boolean>(false);
  const [historialId, setHistorialId] = useState<number | undefined>(undefined);
  const [cerrado, setCerrado] = useState<boolean>(false);

  // SOAP inputs
  const [pesoActual, setPesoActual] = useState<string>('');
  const [temperatura, setTemperatura] = useState<string>('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState<string>('');
  const [motivoConsulta, setMotivoConsulta] = useState<string>('');
  const [hallazgos, setHallazgos] = useState<string>('');
  const [diagnostico, setDiagnostico] = useState<string>('');
  const [tratamiento, setTratamiento] = useState<string>('');
  const [medicamentos, setMedicamentos] = useState<string>('');
  const [recomendaciones, setRecomendaciones] = useState<string>('');
  const [proximoControl, setProximoControl] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Auto-calculated fields
  const [formErrors, setFormErrors] = useState<{ diagnostico?: string }>({});

  const calculateAge = (birthDateStr?: string | null) => {
    if (!birthDateStr) return 'Edad desconocida';
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age === 0) {
      const months = today.getMonth() - birthDate.getMonth() + 
        (12 * (today.getFullYear() - birthDate.getFullYear()));
      return `${months} meses`;
    }
    return `${age} ${age === 1 ? 'año' : 'años'}`;
  };

  const fetchPatientDetails = useCallback(async (mascotaId: number, targetCitaId: number) => {
    try {
      const res = await MascotasService.getMascotaDetails(mascotaId);
      if (res.success && res.data) {
        setMascota(res.data.mascota);
        setRecentHistoriales(res.data.historiales || []);
        setAlertasMedicas(res.data.alertas || null);

        // Find the matching appointment to display details
        const matchingCita = (res.data.citas || []).find((c: Cita) => c.id === targetCitaId);
        if (matchingCita) {
          setCita(matchingCita);
          setServicioNombre(matchingCita.servicio?.nombre || 'Consulta General');
          setVeterinarioNombre(matchingCita.veterinario?.nombre || 'Veterinario');
        }
      }
    } catch (err) {
      console.error('Error fetching mascota details:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (isNaN(citaIdNum)) {
      setError('ID de cita no válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Try to get existing clinical history for this appointment
      const res = await AtencionService.getHistorialByCitaId(citaIdNum);
      if (res.success && res.data) {
        // Draft or Closed History exists
        const dto = res.data.historialDto as HistorialClinicoDto;
        setIsExisting(true);
        setHistorialId(dto.id);
        setCerrado(dto.cerrado || false);

        // Map inputs
        setPesoActual(dto.pesoActual?.toString() || '');
        setTemperatura(dto.temperatura?.toString() || '');
        setFrecuenciaCardiaca(dto.frecuenciaCardiaca?.toString() || '');
        setMotivoConsulta(dto.motivoConsulta || '');
        setHallazgos(dto.hallazgos || '');
        setDiagnostico(dto.diagnostico || '');
        setTratamiento(dto.tratamiento || '');
        setMedicamentos(dto.medicamentos || '');
        setRecomendaciones(dto.recomendaciones || '');
        setProximoControl(dto.proximoControl ? dto.proximoControl.split('T')[0] : '');
        setObservaciones(dto.observaciones || '');

        // Extract context details
        setMascota(res.data.mascota);
        setCita(res.data.cita);
        setServicioNombre(res.data.servicio?.nombre || 'Consulta General');
        setVeterinarioNombre(res.data.veterinario?.nombre || 'Veterinario');

        // Load other clinical histories of this pet
        if (res.data.mascota?.id) {
          await fetchPatientDetails(res.data.mascota.id, citaIdNum);
        }
        setLoading(false);
      }
    } catch (err: any) {
      // 2. If 404, it means it's a new consult entry.
      if (err.response?.status === 404) {
        setIsExisting(false);
        setHistorialId(undefined);
        setCerrado(false);

        // Prepopulate from state (if navigated from Queue)
        const triageData = location.state?.triage;

        if (triageData) {
          setPesoActual(triageData.pesoEstimado?.toString() || triageData.peso?.toString() || '');
          setTemperatura(triageData.temperatura?.toString() || '');
          setFrecuenciaCardiaca(triageData.frecuenciaCardiaca?.toString() || '');
          setMotivoConsulta(triageData.motivoConsulta || triageData.sintomas || '');

          await fetchPatientDetails(triageData.mascotaId, citaIdNum);
          setLoading(false);
        } else {
          // Attempt to scan from the active Triage queue to find this appointment
          try {
            const queueRes = await AtencionService.getColaTriage();
            const matchingTriage = (queueRes.triages || []).find((t) => t.citaId === citaIdNum);
            
            if (matchingTriage) {
              setPesoActual(matchingTriage.pesoEstimado?.toString() || '');
              setTemperatura(matchingTriage.temperatura?.toString() || '');
              setFrecuenciaCardiaca(matchingTriage.frecuenciaCardiaca?.toString() || '');
              setMotivoConsulta(matchingTriage.motivoConsulta || matchingTriage.sintomas || '');
              
              await fetchPatientDetails(matchingTriage.mascotaId, citaIdNum);
              setLoading(false);
            } else {
              // No triage details, ask user to go back
              setError('No se pudo encontrar un triage activo ni historial clínico para esta cita. Regrese a la cola de atención para iniciar.');
              setLoading(false);
            }
          } catch (queueErr) {
            console.error('Error scanning triage queue:', queueErr);
            setError('Error al conectar con la cola de atención.');
            setLoading(false);
          }
        }
      } else {
        console.error('Error fetching clinical history:', err);
        setError('Error al obtener los detalles del historial clínico.');
        setLoading(false);
      }
    }
  }, [citaIdNum, location.state, fetchPatientDetails]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Validation
  const validateForm = () => {
    const errors: { diagnostico?: string } = {};
    if (!diagnostico.trim()) {
      errors.diagnostico = 'El diagnóstico es obligatorio para guardar o finalizar la consulta.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper to compile save DTO
  const getSaveDto = (): HistorialClinicoDto => {
    return {
      id: historialId,
      citaId: citaIdNum,
      pesoActual: pesoActual ? parseFloat(pesoActual) : null,
      temperatura: temperatura ? parseFloat(temperatura) : null,
      frecuenciaCardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
      motivoConsulta: motivoConsulta.trim() || null,
      hallazgos: hallazgos.trim() || null,
      diagnostico: diagnostico.trim() || 'Borrador en evolución', // Default so backend required validation passes
      tratamiento: tratamiento.trim() || null,
      medicamentos: medicamentos.trim() || null,
      recomendaciones: recomendaciones.trim() || null,
      proximoControl: proximoControl ? `${proximoControl}T00:00:00` : null,
      observaciones: observaciones.trim() || null,
      cerrado: false,
    };
  };

  // Save Draft Clinical History
  const handleGuardarBorrador = async () => {
    setSaving(true);
    try {
      const dto = getSaveDto();
      if (isExisting && historialId) {
        await AtencionService.updateHistorial(historialId, dto);
      } else {
        await AtencionService.createHistorial(dto);
      }
      toast.success('Borrador guardado exitosamente.');
      
      // Reload from DB to obtain newly generated history details and ID
      await loadData();
    } catch (err: any) {
      console.error('Error saving draft:', err);
      toast.error(err.response?.data?.message || 'Error al guardar el borrador.');
    } finally {
      setSaving(false);
    }
  };

  // Finalize / Close Clinical History
  const handleFinalizarAtencion = async () => {
    if (!validateForm()) {
      toast.error('Debe completar el diagnóstico obligatorio antes de finalizar.');
      return;
    }

    if (!window.confirm('¿Está seguro de que desea finalizar la evolución clínica? Esto cerrará el expediente de forma irreversible y pasará la cita a Completada.')) {
      return;
    }

    setSaving(true);
    try {
      // 1. Update/Create draft with the final form entries first (so they are saved)
      const dto = getSaveDto();
      // Enforce the typed diagnosis in the saving payload
      dto.diagnostico = diagnostico.trim();

      if (isExisting && historialId) {
        await AtencionService.updateHistorial(historialId, dto);
      } else {
        await AtencionService.createHistorial(dto);
      }

      // 2. Invoke the irreversible Close endpoint
      await AtencionService.cerrarAtencion(citaIdNum);
      toast.success('Consulta clínica finalizada y guardada exitosamente.');
      
      // 3. Navigate back to queue
      navigate('/admin/cola');
    } catch (err: any) {
      console.error('Error closing history:', err);
      toast.error(err.response?.data?.message || 'Error al finalizar la atención clínica.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" message="Cargando expediente clínico SOAP..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow p-lg">
        <ErrorMessage message={error} onRetry={loadData} title="No se pudo abrir el expediente" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0 select-none">
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-sm flex-wrap">
            <span>Evolución Clínica (SOAP)</span>
            {cerrado ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20 text-caption font-caption font-semibold">
                <span className="material-symbols-outlined text-sm">lock</span>
                Expediente Cerrado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-caption font-caption font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Atención Activa
              </span>
            )}
          </div>
        }
        description={`Registro médico y diagnóstico en tiempo real para la cita de ${mascota?.nombre || 'la mascota'}.`}
        backLink={{ to: '/admin/cola', label: 'Volver a la Cola' }}
        hasDivider={true}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        
        {/* Left Column (Bento Cards): Patient Context & Alerts */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          
          {/* Patient Card */}
          {mascota && (
            <div className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-soft mb-md shadow-sm bg-surface-soft flex items-center justify-center">
                {mascota.fotoUrl ? (
                  <img
                    alt={mascota.nombre}
                    className="w-full h-full object-cover"
                    src={mascota.fotoUrl}
                  />
                ) : (
                  <span className="material-symbols-outlined text-[48px] text-secondary">
                    pets
                  </span>
                )}
              </div>
              <h2 className="font-display-sm text-display-sm text-ink mb-1">{mascota.nombre}</h2>
              <p className="font-body-sm text-body-sm text-body-muted mb-md">
                {mascota.especie} {mascota.raza ? `• ${mascota.raza}` : ''} • {mascota.sexo || 'Sexo no especificado'} • {calculateAge(mascota.fechaNacimiento)}
              </p>
              
              <div className="w-full grid grid-cols-2 gap-px bg-hairline rounded-lg overflow-hidden border border-hairline">
                <div className="bg-surface-container-lowest p-sm">
                  <span className="block font-caption text-[11px] text-body-muted uppercase tracking-wider">Último Peso</span>
                  <span className="font-title-sm text-title-sm text-ink font-bold">
                    {mascota.peso ? `${mascota.peso} kg` : 'Sin registro'}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-sm">
                  <span className="block font-caption text-[11px] text-body-muted uppercase tracking-wider">Dueño / Titular</span>
                  <span className="font-title-sm text-title-sm text-ink font-bold truncate block">
                    {mascota.usuarioNombre || 'No asignado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Critical Alerts */}
          <div className={`border-l-4 rounded-r-xl p-md flex flex-col gap-sm shadow-xs ${
            (mascota?.alergiasConocidas || alertasMedicas?.alergias || alertasMedicas?.condicionCronica) 
              ? 'bg-error-container border-error text-on-error-container' 
              : 'bg-success/10 border-success text-ink'
          }`}>
            <div className="flex items-center gap-xs font-title-sm text-title-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]">
                {(mascota?.alergiasConocidas || alertasMedicas?.alergias || alertasMedicas?.condicionCronica) ? 'warning' : 'verified_user'}
              </span>
              Alertas y Alergias
            </div>
            {(mascota?.alergiasConocidas || alertasMedicas?.alergias || alertasMedicas?.condicionCronica) ? (
              <ul className="flex flex-col gap-xs font-body-sm text-body-sm list-disc pl-4">
                {mascota?.alergiasConocidas && <li>Alergias generales: {mascota.alergiasConocidas}</li>}
                {alertasMedicas?.alergias && <li>Alergias registradas: {alertasMedicas.alergias}</li>}
                {alertasMedicas?.condicionCronica && <li>Condiciones crónicas: {alertasMedicas.condicionCronica}</li>}
                {alertasMedicas?.ultimaVacuna && <li>Última vacuna: {alertasMedicas.ultimaVacuna}</li>}
              </ul>
            ) : (
              <p className="font-body-sm text-body-sm italic text-secondary">
                No se han reportado alergias o alertas críticas conocidas para esta mascota.
              </p>
            )}
          </div>

          {/* Recent History Feed */}
          <div className="bg-surface-container-lowest border border-hairline rounded-xl p-lg flex flex-col gap-md">
            <h3 className="font-title-sm text-title-sm text-ink flex items-center justify-between border-b border-hairline pb-sm font-bold">
              Historial Reciente
            </h3>
            {recentHistoriales.length === 0 ? (
              <p className="font-body-sm text-body-sm italic text-secondary">
                Sin atenciones previas registradas.
              </p>
            ) : (
              <div className="flex flex-col gap-md max-h-[300px] overflow-y-auto pr-xs">
                {recentHistoriales.slice(0, 4).map((h) => (
                  <div key={h.id} className="flex gap-md items-start border-b border-hairline/50 pb-sm last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-surface-soft flex items-center justify-center shrink-0 text-secondary">
                      <span className="material-symbols-outlined text-sm">stethoscope</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-body-sm text-body-sm font-semibold text-ink truncate">
                        {h.diagnostico || 'Consulta General'}
                      </h4>
                      <p className="font-caption text-caption text-body-muted mt-0.5">
                        {h.fechaRegistro ? new Date(h.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha no especificada'}
                        {h.veterinarioNombre ? ` • Dr(a). ${h.veterinarioNombre}` : ''}
                      </p>
                      {h.tratamiento && (
                        <p className="font-body-xs text-[12px] text-secondary mt-1 truncate">
                          Rx: {h.tratamiento}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SOAP Medical Form */}
        <div className="lg:col-span-8 flex flex-col gap-lg bg-surface-container-lowest border border-hairline rounded-xl shadow-xs overflow-hidden">
          
          {/* Form Header info */}
          <div className="px-lg py-md border-b border-hairline bg-surface-soft/20 flex justify-between items-center">
            <div>
              <h2 className="font-display-sm text-display-sm text-ink">{servicioNombre}</h2>
              <p className="font-body-sm text-body-sm text-body-muted mt-0.5">
                Médico: Dr(a). {veterinarioNombre} {cita?.fechaHora ? `• ${new Date(cita.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
              </p>
            </div>
            <div>
              {cerrado ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-secondary font-caption text-caption border border-hairline font-bold">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Solo Lectura
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-fixed text-primary font-caption text-caption border border-primary/20 animate-pulse font-bold">
                  <span className="material-symbols-outlined text-sm">pending_actions</span>
                  En Progreso
                </span>
              )}
            </div>
          </div>

          {/* Form Scrollable Workspace */}
          <div className="p-lg flex flex-col gap-lg">
            
            {/* Section: S & O (Subjective & Objective) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg border-b border-hairline pb-lg">
              
              {/* S: Subjetivo */}
              <div className="flex flex-col gap-md">
                <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs">
                  <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption">S</span>
                  Subjetivo (Anamnesis)
                </h3>
                
                <div className="flex flex-col gap-xs">
                  <label className="font-caption text-caption text-body-muted">Motivo de consulta / Síntomas reportados</label>
                  <textarea
                    value={motivoConsulta}
                    onChange={(e) => setMotivoConsulta(e.target.value)}
                    disabled={cerrado}
                    placeholder="Describa lo que relata el propietario o los síntomas iniciales..."
                    rows={4}
                    className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none disabled:bg-surface-soft disabled:text-secondary"
                  />
                </div>
              </div>

              {/* O: Objetivo (Vital Signs) */}
              <div className="flex flex-col gap-md">
                <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs">
                  <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption">O</span>
                  Objetivo (Examen Físico)
                </h3>
                
                {/* Vital signs inputs */}
                <div className="grid grid-cols-3 gap-sm">
                  <div className="flex flex-col gap-xs">
                    <label className="font-caption text-caption text-body-muted">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pesoActual}
                      onChange={(e) => setPesoActual(e.target.value)}
                      disabled={cerrado}
                      placeholder="Ej. 12.5"
                      className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-surface-soft disabled:text-secondary"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-caption text-caption text-body-muted">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperatura}
                      onChange={(e) => setTemperatura(e.target.value)}
                      disabled={cerrado}
                      placeholder="Ej. 38.5"
                      className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-surface-soft disabled:text-secondary"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-caption text-caption text-body-muted">FC (lpm)</label>
                    <input
                      type="number"
                      value={frecuenciaCardiaca}
                      onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                      disabled={cerrado}
                      placeholder="Ej. 90"
                      className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-surface-soft disabled:text-secondary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-caption text-caption text-body-muted">Hallazgos clínicos del Examen Físico</label>
                  <textarea
                    value={hallazgos}
                    onChange={(e) => setHallazgos(e.target.value)}
                    disabled={cerrado}
                    placeholder="Detalle la evaluación de mucosas, ganglios, auscultación cardiopulmonar, etc..."
                    rows={2}
                    className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none disabled:bg-surface-soft disabled:text-secondary"
                  />
                </div>
              </div>
            </div>

            {/* Section: A (Analysis) */}
            <div className="border-b border-hairline pb-lg">
              <div className="flex flex-col gap-md">
                <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs">
                  <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption">A</span>
                  Análisis (Diagnóstico)
                </h3>
                
                <div className="flex flex-col gap-xs">
                  <label className="font-caption text-caption text-body-muted">
                    Diagnóstico Definitivo o Presuntivo <span className="text-error font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={diagnostico}
                    onChange={(e) => {
                      setDiagnostico(e.target.value);
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => ({ ...prev, diagnostico: undefined }));
                      }
                    }}
                    disabled={cerrado}
                    placeholder="Ej. Otitis externa bilateral de origen bacteriano"
                    className={`w-full bg-canvas border rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:outline-none focus:ring-1 transition-colors disabled:bg-surface-soft disabled:text-secondary ${
                      formErrors.diagnostico 
                        ? 'border-error focus:border-error focus:ring-error' 
                        : 'border-hairline focus:border-primary focus:ring-primary'
                    }`}
                  />
                  {formErrors.diagnostico && (
                    <span className="text-error text-caption font-caption">{formErrors.diagnostico}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section: P (Plan) */}
            <div className="flex flex-col gap-md pb-md">
              <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs">
                <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption">P</span>
                Plan (Tratamiento y Receta)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="flex flex-col gap-xs">
                  <label className="font-caption text-caption text-body-muted">Tratamiento clínico en consultorio</label>
                  <textarea
                    value={tratamiento}
                    onChange={(e) => setTratamiento(e.target.value)}
                    disabled={cerrado}
                    placeholder="Detalle los procedimientos aplicados o inyecciones aplicadas en clínica..."
                    rows={3}
                    className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none disabled:bg-surface-soft disabled:text-secondary"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-caption text-caption text-body-muted">Receta de Medicamentos (Cuidado en casa)</label>
                  <textarea
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    disabled={cerrado}
                    placeholder="Medicamentos, dosis, frecuencia y duración..."
                    rows={3}
                    className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none disabled:bg-surface-soft disabled:text-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-md items-start mt-xs">
                <div className="md:col-span-2 flex flex-col gap-xs">
                  <label className="font-caption text-caption text-body-muted">Recomendaciones e Indicaciones</label>
                  <textarea
                    value={recomendaciones}
                    onChange={(e) => setRecomendaciones(e.target.value)}
                    disabled={cerrado}
                    placeholder="Dieta, reposo, o cuidados generales..."
                    rows={2}
                    className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none disabled:bg-surface-soft disabled:text-secondary"
                  />
                </div>
                
                <div className="flex flex-col gap-xs">
                  <label className="font-caption text-caption text-body-muted">Próximo Control (Opcional)</label>
                  <input
                    type="date"
                    value={proximoControl}
                    onChange={(e) => setProximoControl(e.target.value)}
                    disabled={cerrado}
                    className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-surface-soft disabled:text-secondary cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs mt-xs">
                <label className="font-caption text-caption text-body-muted">Observaciones Internas (No visible para clientes)</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  disabled={cerrado}
                  placeholder="Detalles administrativos, comportamiento del animal o notas de control interno..."
                  rows={2}
                  className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow resize-none disabled:bg-surface-soft disabled:text-secondary"
                />
              </div>
            </div>

          </div>

          {/* Sticky Actions Footer */}
          <div className="px-lg py-md border-t border-hairline bg-surface-soft/10 flex justify-between items-center">
            {cerrado ? (
              <div className="flex items-center gap-xs text-secondary font-body-sm">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Este expediente clínico ha sido cerrado y bloqueado permanentemente.
              </div>
            ) : (
              <div className="text-caption text-caption text-secondary font-caption">
                * Campos requeridos obligatoriamente antes del cierre.
              </div>
            )}

            <div className="flex items-center gap-md">
              {cerrado ? (
                <button
                  type="button"
                  onClick={() => navigate('/admin/cola')}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-active text-on-primary font-button text-button rounded-lg transition-colors flex items-center gap-xs cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Volver a la Cola
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleGuardarBorrador}
                    className="px-5 py-2.5 border border-hairline bg-canvas hover:bg-surface-soft text-ink disabled:opacity-50 font-button text-button rounded-lg transition-colors flex items-center gap-xs cursor-pointer"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-hairline border-t-primary rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">save</span>
                    )}
                    Guardar Borrador
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleFinalizarAtencion}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-active text-on-primary disabled:opacity-50 font-button text-button rounded-lg transition-colors flex items-center gap-xs cursor-pointer shadow-sm font-bold"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-primary-dim border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    )}
                    Finalizar Consulta
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
