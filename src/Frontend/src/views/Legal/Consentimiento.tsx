import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

const Consentimiento: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mascotaIdParam = searchParams.get('mascotaId');
  const tipoParam = searchParams.get('tipo') || 'Anestesia General y Cirugía';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [documentoId, setDocumentoId] = useState('');
  const [tipoConsentimiento, setTipoConsentimiento] = useState(tipoParam);
  const [nombrePropietario, setNombrePropietario] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [aceptado, setAceptado] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  // Canvas ref for digital signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // 1. Fetch template & prefill client/pet data on mount
  useEffect(() => {
    async function loadTemplateAndData() {
      try {
        // Fetch document template
        const templateResponse = await api.get(
          `/api/Consentimientos/CreateTemplate?tipo=${encodeURIComponent(tipoParam)}${
            mascotaIdParam ? `&mascotaId=${mascotaIdParam}` : ''
          }`
        );

        if (templateResponse.data.success) {
          const template = templateResponse.data.data;
          setDocumentoId(template.documentoId || '');
          setTipoConsentimiento(template.tipoConsentimiento || tipoParam);
        }

        // Fetch pet & owner details to prefill if mascotaId is provided
        if (mascotaIdParam) {
          const petResponse = await api.get(`/api/Mascotas/${mascotaIdParam}`);
          if (petResponse.data.success) {
            const data = petResponse.data.data;
            setNombrePaciente(data.mascota?.nombre || '');
            setNombrePropietario(data.mascota?.propietarioNombre || '');
          }
        }
      } catch (error) {
        console.error('Error loading template or pet details:', error);
        toast.error('No se pudo pre-cargar la información del consentimiento.');
      } finally {
        setLoading(false);
      }
    }

    loadTemplateAndData();
  }, [mascotaIdParam, tipoParam]);

  // Setup Canvas high DPI resolution and line properties on render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set styling for smooth high-fidelity digital pen stroke
    ctx.strokeStyle = '#074469'; // Clinical Blue
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [loading]);

  // Drawing mouse/touch handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    
    // Support mouse or touch coordinates
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling on touch
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // Submit Handler
  const handleConfirm = async () => {
    if (!nombrePropietario.trim()) {
      toast.error('Por favor, ingrese el nombre del propietario.');
      return;
    }

    if (!nombrePaciente.trim()) {
      toast.error('Por favor, ingrese el nombre del paciente/mascota.');
      return;
    }

    if (!aceptado) {
      toast.error('Debe aceptar expresamente los términos del documento.');
      return;
    }

    if (!hasSigned) {
      toast.error('Por favor, dibuje su firma digital en el recuadro indicado.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSubmitting(true);

    try {
      // Extract signature as base64 PNG string
      const base64Signature = canvas.toDataURL('image/png');

      const body = {
        mascotaId: mascotaIdParam ? Number(mascotaIdParam) : null,
        tipoConsentimiento,
        nombrePropietario: nombrePropietario.trim(),
        nombrePaciente: nombrePaciente.trim(),
        documentoId,
        aceptado: true,
        firmaDigital: base64Signature,
        observaciones: observaciones.trim() || null
      };

      const response = await api.post('/api/Consentimientos', body);
      
      if (response.data.success) {
        toast.success('Consentimiento Informado registrado y firmado con éxito.');
        navigate(-1);
      } else {
        toast.error(response.data.message || 'Error al guardar el consentimiento.');
      }
    } catch (error: any) {
      console.error('Error saving consent:', error);
      const msg = error.response?.data?.message || 'No se pudo guardar el consentimiento. Verifique la conexión.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-sm">Preparando documento legal...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="flex-grow flex justify-center py-lg px-md w-full bg-background pt-24 md:pl-64"
    >
      {/* Form Container Level 1 Elevation */}
      <article className="w-full max-w-[800px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Document Header */}
        <header className="p-lg border-b border-outline-variant bg-surface-bright flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Consentimiento Informado</h1>
            <div className="flex items-center gap-sm">
              <span className="font-label-md text-label-md px-sm py-xs bg-error-container text-on-error-container rounded-full uppercase tracking-widest font-semibold">Documento Legal</span>
              <span className="font-body-md text-body-md text-on-surface-variant">Procedimiento: {tipoConsentimiento}</span>
            </div>
          </div>
          <div className="text-right flex flex-col gap-xs opacity-70">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">ID Documento: {documentoId}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Fecha: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Form Body (Single Column Layout for Clinical Precision) */}
        <div className="p-lg flex flex-col gap-xl">
          {/* Section 1: Identification */}
          <section className="flex flex-col gap-md">
            <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-xs border-b border-surface-variant pb-xs">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
              Identificación
            </h2>
            <div className="flex flex-col gap-md">
              {/* Owner Name */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="owner_name">Nombre del Propietario / Representante Legal <span className="text-error">*</span></label>
                <input 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-sm py-sm font-body-lg text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all h-[48px]" 
                  id="owner_name" 
                  placeholder="Ej. Ana García López" 
                  required 
                  type="text" 
                  value={nombrePropietario}
                  onChange={(e) => setNombrePropietario(e.target.value)}
                />
              </div>

              {/* Pet Name */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="pet_name">Nombre del Paciente <span className="text-error">*</span></label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-sm text-outline">pets</span>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-xl pr-sm py-sm font-body-lg text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all h-[48px]" 
                    id="pet_name" 
                    placeholder="Ej. Luna" 
                    required 
                    type="text" 
                    value={nombrePaciente}
                    onChange={(e) => setNombrePaciente(e.target.value)}
                  />
                </div>
              </div>

              {/* Extra Observations/Conditions */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="obs">Observaciones o Notas de Procedimiento (Opcional)</label>
                <input 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-sm py-sm font-body-lg text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all h-[48px]" 
                  id="obs" 
                  placeholder="Ej. Alergias o condiciones específicas..." 
                  type="text" 
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Legal Text */}
          <section className="flex flex-col gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-xs border-b border-surface-variant pb-xs">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              Términos y Condiciones
            </h2>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md h-[250px] overflow-y-auto legal-scroll text-on-surface-variant font-body-md text-body-md flex flex-col gap-sm">
              <p>
                Yo, el abajo firmante, certifico que soy el propietario o el agente autorizado del propietario del paciente descrito anteriormente. Por la presente, doy mi consentimiento libre y voluntario, y autorizo a los médicos veterinarios de VetCare Pro a realizar el procedimiento de anestesia general y la intervención quirúrgica acordada.
              </p>
              <p>
                Entiendo plenamente que, aunque el equipo médico tomará todas las precauciones necesarias y aplicará los más altos estándares de cuidado clínico, la anestesia general y la cirugía implican riesgos inherentes y complicaciones potenciales imprevisibles, incluyendo pero no limitándose a: depresión respiratoria, insuficiencia cardiovascular, reacciones alérgicas adversas o, en circunstancias excepcionales, la muerte del paciente.
              </p>
              <p>
                Confirmo que el médico veterinario responsable me ha explicado detalladamente la naturaleza del procedimiento, los riesgos involucrados, las posibles complicaciones, el pronóstico estimado y las alternativas terapéuticas disponibles. He tenido la oportunidad de hacer preguntas y todas mis dudas han sido resueltas a mi entera satisfacción.
              </p>
              <p>
                Adicionalmente, autorizo al personal clínico a proveer cuidado de emergencia, administrar medicamentos adicionales, realizar procedimientos diagnósticos imprevistos o alterar el plan quirúrgico si, a su juicio profesional, lo consideran médicamente necesario para salvaguardar la vida o la salud de mi mascota durante el transcurso del procedimiento.
              </p>
              <p>
                Comprendo que la medicina veterinaria no es una ciencia exacta y, por lo tanto, reconozco que no se me ha ofrecido ninguna garantía absoluta respecto al éxito clínico del tratamiento o procedimiento. Asumo la responsabilidad financiera total por todos los servicios prestados, materiales utilizados y honorarios profesionales generados, los cuales me comprometo a liquidar al momento de dar de alta al paciente.
              </p>
            </div>
          </section>

          {/* Section 3: Consent Checkbox */}
          <section className="bg-surface-container p-md rounded-lg border border-transparent hover:border-outline-variant transition-colors group cursor-pointer">
            <label className="flex items-start gap-sm cursor-pointer w-full">
              <div className="mt-1 flex-shrink-0">
                <input 
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-surface-container bg-surface cursor-pointer" 
                  type="checkbox" 
                  checked={aceptado}
                  onChange={(e) => setAceptado(e.target.checked)}
                />
              </div>
              <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                <strong>He leído detenidamente, comprendo en su totalidad y acepto los términos descritos en este documento legal.</strong> Doy mi consentimiento expreso para que se proceda con la intervención planificada bajo las condiciones estipuladas.
              </span>
            </label>
          </section>

          {/* Section 4: Signature Pad Area (HTML5 Drawing Canvas) */}
          <section className="flex flex-col gap-sm">
            <div className="flex justify-between items-end border-b border-surface-variant pb-xs">
              <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
                Firma Digital
              </h2>
              <button 
                className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors uppercase tracking-wider flex items-center gap-xs cursor-pointer" 
                type="button"
                onClick={clearCanvas}
              >
                <span className="material-symbols-outlined text-[16px]">ink_eraser</span>
                Borrar Lienzo
              </button>
            </div>
            <div className="bg-surface border-2 border-dashed border-outline-variant rounded-xl h-[200px] relative cursor-crosshair hover:border-primary transition-colors group overflow-hidden">
              {/* Drawing Canvas */}
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="absolute inset-0 w-full h-full z-10 touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              
              {/* Canvas Placeholder Instruction */}
              {!hasSigned && (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 group-hover:opacity-20 transition-opacity pointer-events-none z-0">
                  <span className="material-symbols-outlined text-headline-xl mb-xs">gesture</span>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-center px-lg">
                    Utilice el ratón, lápiz óptico o su dedo para firmar dentro de este recuadro
                  </span>
                </div>
              )}
              {/* Signature Line Anchor */}
              <div className="absolute bottom-md left-md right-md border-b border-outline opacity-30 pointer-events-none z-0"></div>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <footer className="p-lg bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row justify-end items-center gap-md">
          <button 
            className="w-full sm:w-auto px-lg py-sm rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors flex justify-center items-center gap-xs h-[48px] cursor-pointer" 
            type="button"
            onClick={() => window.print()}
          >
            <span className="material-symbols-outlined">print</span>
            Imprimir Documento
          </button>
          <button 
            className="w-full sm:w-auto px-lg py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors flex justify-center items-center gap-xs h-[48px] shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {submitting ? 'Confirmando...' : 'Confirmar Firma'}
          </button>
        </footer>
      </article>
    </motion.div>
  );
};

export default Consentimiento;
