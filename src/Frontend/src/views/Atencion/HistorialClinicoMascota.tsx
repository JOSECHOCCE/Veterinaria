import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import MascotasService from '../../services/mascotas.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

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
        <Spinner size="lg" message="Cargando historial médico..." />
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

  return (
    <div className="flex-grow flex flex-col min-w-0 pb-section" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Breadcrumb Header */}
      <header className="flex justify-between items-center pb-md border-b border-hairline mb-xl select-none">
        <button
          onClick={() => navigate(isStaff ? `/admin/mascotas/${mascota.id}` : `/cliente/mascotas/${mascota.id}`)}
          className="flex items-center gap-xs text-secondary hover:text-ink transition-colors font-button text-button group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Volver a la Ficha
        </button>
        <div className="font-title-sm text-title-sm text-ink font-semibold">Historial Clínico</div>
      </header>

      {/* Patient Header Card */}
      <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col md:flex-row items-center md:items-start gap-lg mb-xl select-none">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-surface-soft bg-surface-soft flex items-center justify-center shrink-0">
          <img
            alt={mascota.nombre}
            className="w-full h-full object-cover"
            src={mascota.fotoUrl || getPetImageFallback(mascota.especie)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getPetImageFallback(mascota.especie);
            }}
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-sm mb-xs">
            <h1 className="font-display-md text-display-md text-ink font-bold" style={{ fontFamily: 'Georgia, serif' }}>
              {mascota.nombre}
            </h1>
            <span className="bg-surface-soft text-secondary font-caption-caps text-caption-caps px-3 py-1 rounded-full border border-hairline text-xs font-semibold">
              PACIENTE: #PAC-{mascota.id}
            </span>
          </div>
          <p className="font-body-md text-body-md text-secondary">
            {mascota.especie} • {mascota.raza || 'Sin raza'} • {mascota.sexo || 'Sexo no especificado'} • {getPetAge(mascota.fechaNacimiento)}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-md mt-sm text-body-sm text-body-muted">
            {mascota.peso && (
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">weight</span>
                Peso: {mascota.peso} kg
              </span>
            )}
            {alertas?.ultimaVacuna && alertas.ultimaVacuna !== 'Ninguna registrada' && (
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">vaccines</span>
                Última Vacuna: {alertas.ultimaVacuna}
              </span>
            )}
            <span className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">person</span>
              Responsable: {mascota.usuarioNombre || 'No asignado'}
            </span>
          </div>
        </div>
      </section>

      {/* Medical History Timeline */}
      <section className="bg-surface-container-lowest border border-hairline rounded-xl p-lg shadow-xs flex flex-col gap-lg">
        <h2 className="font-title-lg text-title-lg text-ink font-semibold flex items-center gap-xs pb-sm border-b border-hairline-soft">
          <span className="material-symbols-outlined text-secondary">history</span>
          Historial Médico Completo
        </h2>

        {historiales.length === 0 ? (
          <EmptyState
            title="Sin atenciones clínicas registradas"
            description="Esta mascota no posee expedientes médicos o consultas registradas en su historial."
          />
        ) : (
          <div className="relative pl-6 ml-4 border-l border-hairline flex flex-col gap-lg">
            {historiales.map((h) => (
              <article key={h.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[35px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center bg-canvas">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                {/* Card */}
                <div className="bg-canvas border border-hairline rounded-xl p-lg shadow-xs hover:border-outline-variant transition-colors flex flex-col gap-md">
                  <div className="flex justify-between items-start flex-wrap gap-sm">
                    <div>
                      <h3 className="font-title-md text-title-md text-ink font-bold">
                        {formatDate(h.fechaRegistro)}
                      </h3>
                      <p className="font-body-sm text-body-sm text-secondary flex items-center gap-xs mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                        Atendido por: Dr(a). {h.veterinarioNombre}
                      </p>
                    </div>
                    <span className="bg-primary-container/10 text-primary border border-primary/20 font-caption-caps text-caption-caps px-3 py-1 rounded-full text-xs font-semibold">
                      {h.servicioNombre}
                    </span>
                  </div>

                  <div className="flex flex-col gap-xs mt-xs">
                    <span className="font-caption-caps text-caption-caps text-secondary text-xs uppercase tracking-wider font-semibold">
                      Diagnóstico
                    </span>
                    <p className="font-body-md text-body-md text-ink font-medium leading-relaxed">
                      {h.diagnostico || 'Borrador clínico en evolución.'}
                    </p>
                  </div>

                  {h.tratamiento && (
                    <div className="flex flex-col gap-xs">
                      <span className="font-caption-caps text-caption-caps text-secondary text-xs uppercase tracking-wider font-semibold">
                        Tratamiento en Clínica
                      </span>
                      <p className="font-body-sm text-body-sm text-body-strong leading-relaxed">
                        {h.tratamiento}
                      </p>
                    </div>
                  )}

                  <div className="mt-md pt-md border-t border-hairline flex flex-col sm:flex-row justify-between sm:items-center gap-sm">
                    {h.proximoControl ? (
                      <span className="inline-flex items-center gap-xs font-body-sm text-body-sm text-primary font-medium bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                        <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                        Próximo Control: {formatDate(h.proximoControl)}
                      </span>
                    ) : (
                      <span />
                    )}

                    <button
                      onClick={() => handleOpenSoapDetail(h)}
                      className="font-button text-button text-primary hover:text-primary-active transition-colors flex items-center gap-xxs hover:underline cursor-pointer font-bold self-end sm:self-auto"
                    >
                      Ver Detalle Completo
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Read-only SOAP Detail Modal */}
      <AnimatePresence>
        {showModal && selectedHistorial && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-canvas border border-hairline rounded-xl max-w-3xl w-full shadow-lg overflow-hidden flex flex-col my-lg"
            >
              {/* Modal Header */}
              <div className="px-lg py-md border-b border-hairline bg-surface-soft/40 flex justify-between items-center">
                <div>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold">
                    Expediente SOAP — {selectedHistorial.servicioNombre}
                  </h3>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    {formatDate(selectedHistorial.fechaRegistro)} • Dr(a). {selectedHistorial.veterinarioNombre}
                  </p>
                </div>
                <button
                  onClick={handleCloseSoapDetail}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-soft text-secondary hover:text-ink transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-lg flex flex-col gap-lg max-h-[60vh] overflow-y-auto pr-md">
                
                {/* S: Subjective */}
                <div className="border-b border-hairline pb-md">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs mb-sm">
                    <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption text-xs">S</span>
                    Subjetivo (Anamnesis)
                  </h4>
                  <p className="font-body-sm text-body-sm text-body-strong leading-relaxed bg-surface-soft/30 p-md rounded-lg border border-hairline-soft whitespace-pre-line">
                    {selectedHistorial.motivoConsulta || 'No se registraron observaciones subjetivas iniciales.'}
                  </p>
                </div>

                {/* O: Objective */}
                <div className="border-b border-hairline pb-md">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs mb-sm">
                    <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption text-xs">O</span>
                    Objetivo (Constantes Vitales y Examen Físico)
                  </h4>
                  
                  {/* Vital signs cards */}
                  <div className="grid grid-cols-3 gap-sm mb-md">
                    <div className="bg-surface-soft/40 border border-hairline-soft p-sm rounded-lg text-center">
                      <span className="block font-caption text-[11px] text-secondary uppercase tracking-wider">Peso Actual</span>
                      <span className="font-title-sm text-title-sm text-ink font-bold">
                        {selectedHistorial.pesoActual ? `${selectedHistorial.pesoActual} kg` : '---'}
                      </span>
                    </div>
                    <div className="bg-surface-soft/40 border border-hairline-soft p-sm rounded-lg text-center">
                      <span className="block font-caption text-[11px] text-secondary uppercase tracking-wider">Temperatura</span>
                      <span className="font-title-sm text-title-sm text-ink font-bold">
                        {selectedHistorial.temperatura ? `${selectedHistorial.temperatura} °C` : '---'}
                      </span>
                    </div>
                    <div className="bg-surface-soft/40 border border-hairline-soft p-sm rounded-lg text-center">
                      <span className="block font-caption text-[11px] text-secondary uppercase tracking-wider">Freq. Cardíaca</span>
                      <span className="font-title-sm text-title-sm text-ink font-bold">
                        {selectedHistorial.frecuenciaCardiaca ? `${selectedHistorial.frecuenciaCardiaca} lpm` : '---'}
                      </span>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-body-strong leading-relaxed bg-surface-soft/30 p-md rounded-lg border border-hairline-soft whitespace-pre-line">
                    {selectedHistorial.hallazgos || 'No se detallaron hallazgos clínicos específicos en el examen físico.'}
                  </p>
                </div>

                {/* A: Analysis */}
                <div className="border-b border-hairline pb-md">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs mb-sm">
                    <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption text-xs">A</span>
                    Análisis (Diagnóstico Clínico)
                  </h4>
                  <p className="font-body-sm text-body-sm text-ink font-semibold bg-surface-soft/50 p-md rounded-lg border border-hairline-soft">
                    {selectedHistorial.diagnostico || 'Borrador clínico.'}
                  </p>
                </div>

                {/* P: Plan */}
                <div className="flex flex-col gap-md">
                  <h4 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-xs">
                    <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-caption text-xs">P</span>
                    Plan (Tratamiento, Receta y Recomendaciones)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                    <div className="bg-surface-soft/30 p-md rounded-lg border border-hairline-soft">
                      <span className="font-caption text-[11px] text-secondary uppercase tracking-wider block mb-1">Procedimientos en Consultorio</span>
                      <p className="font-body-sm text-body-sm text-body-strong whitespace-pre-line">
                        {selectedHistorial.tratamiento || 'Ninguno registrado.'}
                      </p>
                    </div>

                    <div className="bg-surface-soft/30 p-md rounded-lg border border-hairline-soft">
                      <span className="font-caption text-[11px] text-secondary uppercase tracking-wider block mb-1">Medicamentos / Indicación de Cuidado</span>
                      <p className="font-body-sm text-body-sm text-body-strong whitespace-pre-line">
                        {selectedHistorial.medicamentos || 'Ninguno prescrito.'}
                      </p>
                    </div>
                  </div>

                  {selectedHistorial.recomendaciones && (
                    <div className="bg-surface-soft/30 p-md rounded-lg border border-hairline-soft">
                      <span className="font-caption text-[11px] text-secondary uppercase tracking-wider block mb-1">Indicaciones y Dieta</span>
                      <p className="font-body-sm text-body-sm text-body-strong">
                        {selectedHistorial.recomendaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Internal Observations (Staff only rule) */}
                {isStaff && selectedHistorial.observaciones && (
                  <div className="bg-error/5 border border-error/10 p-md rounded-lg flex items-start gap-xs mt-xs">
                    <span className="material-symbols-outlined text-error text-[20px] mt-0.5">lock_open</span>
                    <div>
                      <span className="font-caption text-[11px] text-error uppercase tracking-wider block font-bold">Observación Interna (Solo Personal Médico)</span>
                      <p className="font-body-sm text-body-sm text-ink mt-1">
                        {selectedHistorial.observaciones}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-lg py-md border-t border-hairline bg-surface-soft/20 flex justify-between items-center">
                {selectedHistorial.proximoControl ? (
                  <span className="font-body-sm text-body-sm text-primary font-medium flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">event_repeat</span>
                    Control sugerido: {formatDate(selectedHistorial.proximoControl)}
                  </span>
                ) : (
                  <span />
                )}
                <button
                  onClick={handleCloseSoapDetail}
                  className="bg-primary hover:bg-primary-active text-on-primary font-button text-button px-6 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
