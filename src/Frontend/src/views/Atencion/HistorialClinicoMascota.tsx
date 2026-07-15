import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import MascotasService from '../../services/mascotas.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

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

interface Historial {
  id: number;
  fechaRegistro: string;
  servicioNombre: string;
  veterinarioNombre: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamentos?: string;
  recomendaciones?: string;
  proximoControl?: string;
  pesoActual?: number | null;
  temperatura?: number | null;
  frecuenciaCardiaca?: number | null;
  motivoConsulta?: string | null;
  hallazgos?: string | null;
  observaciones?: string | null;
}

interface Alertas {
  alergias: string;
  condicionCronica: string;
  ultimaVacuna: string;
}

export default function HistorialClinicoMascota() {
  const { id } = useParams<{ id: string }>();
  const petId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isStaff = user?.role === 'Admin' || user?.role === 'Recepcionista' || user?.role === 'Veterinario';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [alertas, setAlertas] = useState<Alertas | null>(null);

  // SOAP modal state
  const [selectedHistorial, setSelectedHistorial] = useState<Historial | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (isNaN(petId)) {
      setError('Identificador de mascota no válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await MascotasService.getMascotaDetails(petId);
      if (res.success && res.data) {
        setMascota(res.data.mascota);
        setHistoriales(res.data.historiales || []);
        setAlertas(res.data.alertas || null);
      } else {
        setError(res.message || 'No se pudieron obtener los antecedentes médicos.');
      }
    } catch (err) {
      console.error('Error fetching clinical history:', err);
      setError('Error al conectar con el servidor para obtener el historial clínico.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenSoapDetail = (historial: Historial) => {
    setSelectedHistorial(historial);
    setShowModal(true);
  };

  const handleCloseSoapDetail = () => {
    setSelectedHistorial(null);
    setShowModal(false);
  };

  const getPetImageFallback = (esp: string) => {
    const species = esp.toLowerCase();
    if (species.includes('perro') || species.includes('canin') || species.includes('dog')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM8pZR065mBN_zRsT0K-9h3W-ByY0dCkx1tJr6a_KXTKD63fcCW5FzMmFTzmcaQigIIqG5xFDGqXOQq0JWvRnTCq13J_DBfqi4QunaYKGRE_MqRX0DivSZ-mN9D_htDVybloxprk1_R1fFGlPD17YrWlt0_hwENNtVIaygWOCZ94AMIJnF7ZlEGmciyOTyS5OrBnA9vRzUw-nHhbN3CafZ-NxbGJNMglUBngYtJ7mo1oskzaYx3B6aoBIErCd0BxF692CDhzyjxZ8';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuADiZUuDOMsyo4M1wr15dg3fsL80rExV4tuKhka1NyJjHWVWLimgnT9wQsjQr8_z23jhtb7SlqFPuCp44eCRnKKZQ06tqmkTYPWibResnGBfH25z7mbfCkavRFdwIZBit8JTNFZcCBpO5k-6zKZHsK3WQP1gLKHSuIWd0CnTSc3wHEu4qXuEj0S3VP0RG_a0KFGMwEZw77fbutpjCXcTFhJs8POZ_CGRMzwVeiFkdXY9Top7gLGWkK9vmUQRl9Kbxy8J9jI4X9UToA';
  };

  const getPetAge = (dobString: string | null | undefined) => {
    if (!dobString) return 'Edad no registrada';
    const birth = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return months === 1 ? '1 mes' : `${months} meses`;
    }

    return `${years} años` + (months > 0 ? `, ${months} ${months === 1 ? 'mes' : 'meses'}` : '');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" message="Cargando expediente clínico del paciente..." />
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="flex-grow p-lg">
        <ErrorMessage message={error || 'La mascota especificada no existe.'} onRetry={loadData} title="Error de Carga" />
      </div>
    );
  }

  // Get the latest values for vitals cards
  const latestWeight = mascota.peso || (historiales.length > 0 ? historiales[0].pesoActual : null);
  const latestFC = historiales.length > 0 ? historiales[0].frecuenciaCardiaca : null;
  const allergy = mascota.alergiasConocidas || alertas?.alergias || 'Ninguna conocida';
  const lastVaccine = alertas?.ultimaVacuna || 'Ninguna registrada';

  const fromRoute = location.state?.from;
  const backTo = fromRoute || (isStaff ? `/admin/mascotas/${mascota.id}` : `/cliente/mascotas/${mascota.id}`);
  const backLabel = fromRoute === '/admin/mi-agenda' ? 'Volver a Mi Agenda' : fromRoute === '/admin/cola' ? 'Volver a Cola de Atención' : 'Volver a la Ficha';

  return (
    <div className="flex-grow flex flex-col min-w-0 pb-12 p-6 select-none animate-fadeIn">
      
      {/* Breadcrumb Header */}
      <PageHeader
        title="Expediente Clínico Electrónico"
        description={`Antecedentes médicos, consultas clínicas (SOAP) y fichas de evolución de ${mascota.nombre}.`}
        backLink={{
          to: backTo,
          label: backLabel,
        }}
        hasDivider={true}
      />

      {/* Patient Header (Professional EHR Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Profile Card */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-outline-variant/20 shadow-xs p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 -z-0" />
          
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md bg-surface-soft flex items-center justify-center z-10">
            <img
              alt={mascota.nombre}
              className="w-full h-full object-cover"
              src={mascota.fotoUrl || getPetImageFallback(mascota.especie)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getPetImageFallback(mascota.especie);
              }}
            />
          </div>
          <h2 className="font-headline-lg text-2xl text-ink font-bold mb-1 z-10">
            {mascota.nombre}
          </h2>
          <p className="text-sm text-body-muted mb-4 font-medium z-10">
            {mascota.especie} • {mascota.raza || 'Sin raza'} • {mascota.sexo || 'Sexo no especificado'} • {getPetAge(mascota.fechaNacimiento)}
          </p>

          {/* Prominent Owner/Tutor Box inside Profile */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 mb-4 text-left flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-body-muted uppercase tracking-wider">Tutor / Propietario</p>
              <p className="font-bold text-ink text-sm truncate" title={mascota.usuarioNombre || 'No registrado'}>
                {mascota.usuarioNombre || 'No registrado'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-center w-full mt-auto z-10">
            <span className="px-3 py-1 bg-[#e6fffa] text-primary rounded-full text-xs font-bold border border-primary-container/30">
              {mascota.activo ? 'Paciente Activo' : 'Inactivo'}
            </span>
            <span className="px-3 py-1 bg-surface-soft text-secondary rounded-full text-xs font-bold border border-outline-variant/20">
              ID PAC-{mascota.id}
            </span>
          </div>
        </div>

        {/* Vitals & Quick Info EHR Grid */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">weight</span>
              </div>
              <span className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Último Peso</span>
              <div className="font-headline-lg text-2xl text-ink font-extrabold mt-1">
                {latestWeight ? `${latestWeight} kg` : '---'}
              </div>
            </div>
            <span className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-3">
              <span className="material-symbols-outlined text-[14px]">monitor_weight</span>
              Monitoreo continuo
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">favorite</span>
              </div>
              <span className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Frec. Cardíaca</span>
              <div className="font-headline-lg text-2xl text-ink font-extrabold mt-1">
                {latestFC ? `${latestFC} lpm` : '---'}
              </div>
            </div>
            <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-3">
              <span className="material-symbols-outlined text-[14px]">ecg_heart</span>
              Signos vitales
            </span>
          </div>

          <div className={`rounded-2xl border shadow-xs p-5 flex flex-col justify-between ${
            allergy !== 'Ninguna' && allergy !== 'Ninguna conocida' && allergy !== 'ninguna conocida'
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : 'bg-white border-outline-variant/20'
          }`}>
            <div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                allergy !== 'Ninguna' && allergy !== 'Ninguna conocida' && allergy !== 'ninguna conocida'
                  ? 'bg-rose-200/60 text-rose-700'
                  : 'bg-amber-500/10 text-amber-600'
              }`}>
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Alergias Conocidas</span>
              <div className="font-bold text-base mt-1 truncate" title={allergy}>
                {allergy}
              </div>
            </div>
            <span className={`text-[11px] font-semibold mt-3 flex items-center gap-1 ${
              allergy !== 'Ninguna' && allergy !== 'Ninguna conocida' && allergy !== 'ninguna conocida' ? 'text-rose-700 font-bold' : 'text-body-muted'
            }`}>
              <span className="material-symbols-outlined text-[14px]">shield_with_house</span>
              {allergy !== 'Ninguna' && allergy !== 'Ninguna conocida' && allergy !== 'ninguna conocida' ? 'Alerta médica crítica' : 'Sin reportar'}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">vaccines</span>
              </div>
              <span className="text-[11px] font-bold text-body-muted uppercase tracking-wider">Inmunización</span>
              <div className="font-bold text-sm text-ink mt-1 truncate" title={lastVaccine}>
                {lastVaccine}
              </div>
            </div>
            <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1 mt-3">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Control profiláctico
            </span>
          </div>
        </div>
      </div>

      {/* Medical History Timeline Layout (Professional EHR Timeline) */}
      <section className="bg-white border border-outline-variant/20 rounded-2xl p-6 shadow-xs flex flex-col gap-6 flex-grow min-h-0">
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant/15 flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">history</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-lg text-ink font-bold">
                Historial Clínico de Atenciones (SOAP)
              </h2>
              <p className="text-xs text-body-muted">
                Todas las evoluciones, diagnósticos y tratamientos registrados por el equipo médico.
              </p>
            </div>
          </div>
          <span className="bg-surface-soft text-ink font-bold text-xs px-3 py-1.5 rounded-full border border-outline-variant/20">
            Total Consultas: {historiales.length}
          </span>
        </div>

        {historiales.length === 0 ? (
          <EmptyState
            title="Sin atenciones clínicas registradas"
            description="Esta mascota no posee expedientes médicos o evoluciones clínicas registradas hasta la fecha."
          />
        ) : (
          <div className="relative pl-7 ml-3 border-l-2 border-primary/20 flex flex-col gap-6 pt-2">
            {historiales.map((h) => {
              const isConsultation = h.servicioNombre?.toLowerCase().includes('consult') || h.servicioNombre?.toLowerCase().includes('cheq');
              const iconName = isConsultation ? 'stethoscope' : 'medication';

              return (
                <article key={h.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[43px] top-1.5 w-8 h-8 rounded-full border-2 border-primary bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[16px] font-bold">{iconName}</span>
                  </div>

                  {/* Card content */}
                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col gap-4">
                    <div className="flex justify-between items-start flex-wrap gap-3 pb-3 border-b border-outline-variant/10">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                            {formatDate(h.fechaRegistro)}
                          </span>
                          <span className="text-xs font-bold bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full">
                            {h.servicioNombre}
                          </span>
                        </div>
                        <p className="text-sm text-ink font-bold flex items-center gap-1.5 mt-2">
                          <span className="material-symbols-outlined text-[18px] text-primary">clinical_notes</span>
                          Atendido por: Dr(a). {h.veterinarioNombre}
                        </p>
                      </div>

                      {/* Owner details on card */}
                      <div className="bg-surface-soft px-3 py-1.5 rounded-xl border border-outline-variant/15 text-right">
                        <span className="block text-[10px] text-body-muted font-bold uppercase tracking-wider">Tutor del Paciente</span>
                        <span className="text-xs font-bold text-ink flex items-center justify-end gap-1">
                          <span className="material-symbols-outlined text-[14px] text-secondary">person</span>
                          {mascota.usuarioNombre || 'No registrado'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Diagnóstico */}
                      <div className="bg-white p-3.5 rounded-xl border border-outline-variant/15">
                        <span className="text-[11px] font-bold text-body-muted uppercase tracking-wider flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-sm text-primary">fact_check</span>
                          Diagnóstico Principal
                        </span>
                        <h4 className="text-sm text-ink font-bold leading-relaxed">
                          {h.diagnostico || 'Borrador clínico o consulta en curso.'}
                        </h4>
                      </div>

                      {/* Tratamiento / Receta */}
                      {h.tratamiento && (
                        <div className="bg-white p-3.5 rounded-xl border border-outline-variant/15">
                          <span className="text-[11px] font-bold text-body-muted uppercase tracking-wider flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-sm text-emerald-600">prescriptions</span>
                            Tratamiento en Consultorio / Receta
                          </span>
                          <p className="text-sm text-ink leading-relaxed line-clamp-2">
                            {h.tratamiento}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      {h.proximoControl ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-primary font-bold bg-[#e6fffa] px-3 py-1.5 rounded-xl border border-primary-container/30">
                          <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                          Próximo Control Sugerido: {formatDate(h.proximoControl)}
                        </span>
                      ) : (
                        <span className="text-xs text-body-muted italic">Sin próximo control programado</span>
                      )}

                      <button
                        onClick={() => handleOpenSoapDetail(h)}
                        className="text-xs bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer self-end sm:self-auto"
                      >
                        Expediente SOAP Detallado
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Read-only SOAP Detail Modal (EHR Quality) */}
      <AnimatePresence>
        {showModal && selectedHistorial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-outline-variant/20 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-outline-variant/15 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-lg text-lg text-ink font-bold">
                        Expediente SOAP Completo
                      </h3>
                      <span className="bg-white/80 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold border border-primary/20">
                        {selectedHistorial.servicioNombre}
                      </span>
                    </div>
                    <p className="text-xs text-body-muted mt-0.5 font-medium">
                      Consulta: {formatDate(selectedHistorial.fechaRegistro)} • Atendido por: Dr(a). {selectedHistorial.veterinarioNombre} • Tutor: {mascota.usuarioNombre || 'No registrado'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSoapDetail}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/60 text-secondary hover:text-ink transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                
                {/* S: Subjective */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">S</span>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Subjetivo (Anamnesis y Motivo de Consulta)</h4>
                      <p className="text-[11px] text-blue-800">Síntomas reportados por el tutor y observaciones iniciales</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-100/80 text-sm text-ink leading-relaxed whitespace-pre-line font-medium shadow-xs">
                    {selectedHistorial.motivoConsulta || 'No se registraron observaciones subjetivas iniciales.'}
                  </div>
                </div>

                {/* O: Objective */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">O</span>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Objetivo (Examen Físico y Constantes Vitales)</h4>
                      <p className="text-[11px] text-emerald-800">Mediciones clínicas y hallazgos en consultorio</p>
                    </div>
                  </div>
                  
                  {/* Vital signs cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white border border-emerald-100 p-3 rounded-xl text-center shadow-xs">
                      <span className="block text-[11px] text-body-muted uppercase font-bold tracking-wider">Peso Registrado</span>
                      <span className="text-base font-extrabold text-ink mt-0.5 block">
                        {selectedHistorial.pesoActual ? `${selectedHistorial.pesoActual} kg` : '---'}
                      </span>
                    </div>
                    <div className="bg-white border border-emerald-100 p-3 rounded-xl text-center shadow-xs">
                      <span className="block text-[11px] text-body-muted uppercase font-bold tracking-wider">Temperatura</span>
                      <span className="text-base font-extrabold text-ink mt-0.5 block">
                        {selectedHistorial.temperatura ? `${selectedHistorial.temperatura} °C` : '---'}
                      </span>
                    </div>
                    <div className="bg-white border border-emerald-100 p-3 rounded-xl text-center shadow-xs">
                      <span className="block text-[11px] text-body-muted uppercase font-bold tracking-wider">Freq. Cardíaca</span>
                      <span className="text-base font-extrabold text-ink mt-0.5 block">
                        {selectedHistorial.frecuenciaCardiaca ? `${selectedHistorial.frecuenciaCardiaca} lpm` : '---'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-100/80 text-sm text-ink leading-relaxed whitespace-pre-line font-medium shadow-xs">
                    {selectedHistorial.hallazgos || 'No se detallaron hallazgos clínicos específicos en el examen físico.'}
                  </div>
                </div>

                {/* A: Analysis */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">A</span>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Análisis (Diagnóstico Clínico Principal)</h4>
                      <p className="text-[11px] text-amber-800">Conclusión médica profesional basada en evidencia</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100/80 text-sm font-bold text-ink leading-relaxed shadow-xs">
                    {selectedHistorial.diagnostico || 'Borrador clínico.'}
                  </div>
                </div>

                {/* P: Plan */}
                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">P</span>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Plan (Tratamiento, Receta Médica y Recomendaciones)</h4>
                      <p className="text-[11px] text-purple-800">Indicaciones terapéuticas y seguimiento para el tutor</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-purple-100/80 shadow-xs">
                      <span className="text-[11px] text-purple-800 uppercase tracking-wider block mb-1.5 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">medical_services</span>
                        Procedimientos en Consultorio
                      </span>
                      <p className="text-sm text-ink font-medium whitespace-pre-line leading-relaxed">
                        {selectedHistorial.tratamiento || 'Ninguno registrado.'}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-purple-100/80 shadow-xs">
                      <span className="text-[11px] text-purple-800 uppercase tracking-wider block mb-1.5 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">pill</span>
                        Medicamentos / Receta
                      </span>
                      <p className="text-sm text-ink font-medium whitespace-pre-line leading-relaxed">
                        {selectedHistorial.medicamentos || 'Sin medicamentos recetados en esta consulta.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-white p-4 rounded-xl border border-purple-100/80 shadow-xs">
                    <span className="text-[11px] text-purple-800 uppercase tracking-wider block mb-1.5 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">recommend</span>
                      Recomendaciones para el Hogar
                    </span>
                    <p className="text-sm text-ink font-medium whitespace-pre-line leading-relaxed">
                      {selectedHistorial.recomendaciones || 'Ninguna recomendación adicional reportada.'}
                    </p>
                  </div>
                </div>

                {/* Observaciones extra */}
                {selectedHistorial.observaciones && (
                  <div className="bg-surface-soft p-4 rounded-xl border border-outline-variant/20">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">Notas Internas / Observaciones Generales</span>
                    <p className="text-sm text-ink leading-relaxed font-medium">
                      {selectedHistorial.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-outline-variant/15 bg-surface-soft/40 flex justify-end items-center gap-3">
                <button
                  onClick={handleCloseSoapDetail}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Cerrar Expediente SOAP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
