import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import ServiciosService from '../../services/servicios.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';

export default function ConfigurarServicio() {
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);
  const isEdit = !isNaN(serviceId);
  const navigate = useNavigate();

  // Form states
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState('30');
  const [precio, setPrecio] = useState('');
  const [especialidadRequerida, setEspecialidadRequerida] = useState('');
  const [requiereVeterinario, setRequiereVeterinario] = useState(true);

  const [loading, setLoading] = useState<boolean>(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadService = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ServiciosService.getServicioDetails(serviceId);
      if (res.success && res.data) {
        const s = res.data.servicio;
        setNombre(s.nombre || '');
        setDescripcion(s.descripcion || '');
        setDuracionMinutos(String(s.duracionMinutos || 30));
        setPrecio(String(s.precio || ''));
        setEspecialidadRequerida(s.especialidadRequerida || '');
        setRequiereVeterinario(s.requiereVeterinario !== false);
      } else {
        setError(res.message || 'No se pudieron cargar los datos del servicio.');
      }
    } catch (err: any) {
      console.error('Error loading service:', err);
      setError('Error de conexión al obtener los datos del servicio.');
    } finally {
      setLoading(false);
    }
  }, [serviceId, isEdit]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre es requerido.');
      return;
    }

    const durationNum = Number(duracionMinutos);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
      toast.error('La duración debe estar entre 15 y 480 minutos.');
      return;
    }

    const priceNum = Number(precio);
    if (isNaN(priceNum) || priceNum < 0.01 || priceNum > 10000) {
      toast.error('El precio base debe estar entre $0.01 y $10,000.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        duracionMinutos: durationNum,
        precio: priceNum,
        requiereVeterinario,
        especialidadRequerida: especialidadRequerida || null,
      };

      let res;
      if (isEdit) {
        res = await ServiciosService.updateServicio(serviceId, { id: serviceId, ...payload });
      } else {
        res = await ServiciosService.createServicio(payload);
      }

      if (res.success) {
        toast.success(isEdit ? 'Servicio actualizado con éxito.' : 'Servicio configurado con éxito.');
        navigate('/admin/servicios');
      } else {
        toast.error(res.message || 'Ocurrió un error al guardar el servicio.');
      }
    } catch (err: any) {
      console.error('Error saving service:', err);
      const msg = err.response?.data?.message || 'Error de conexión con el servidor.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-lg">
        <ErrorMessage message={error} onRetry={loadService} />
      </div>
    );
  }

  return (
    <div className="flex-grow p-gutter md:p-xl max-w-[800px] w-full mx-auto">
      {/* Return link & Header */}
      <PageHeader
        title={isEdit ? 'Editar Servicio' : 'Configurar Servicio'}
        description={
          isEdit
            ? 'Actualiza los detalles comerciales, tarifas o especialidades del servicio.'
            : 'Define los detalles del nuevo servicio para incorporarlo al catálogo general.'
        }
        backLink={{ to: '/admin/servicios', label: 'Volver al Catálogo' }}
      />

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-card rounded-xl p-xl shadow-sm border border-hairline space-y-lg"
      >
        {/* Name */}
        <div>
          <label className="block font-title-sm text-title-sm text-ink mb-xs font-semibold" htmlFor="service-name">
            Nombre del servicio <span className="text-error">*</span>
          </label>
          <input
            id="service-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Consulta General, Vacunación Felina"
            className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            type="text"
            maxLength={100}
            required
          />
        </div>

        {/* Duration & Price base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label className="block font-title-sm text-title-sm text-ink mb-xs font-semibold" htmlFor="duration">
              Duración (minutos) <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                id="duration"
                value={duracionMinutos}
                onChange={(e) => setDuracionMinutos(e.target.value)}
                placeholder="30"
                min="15"
                max="480"
                step="5"
                className="w-full bg-canvas border border-hairline rounded-lg pl-md pr-10 py-sm font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                type="number"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary font-body-sm text-body-sm select-none">
                min
              </span>
            </div>
          </div>

          <div>
            <label className="block font-title-sm text-title-sm text-ink mb-xs font-semibold" htmlFor="price">
              Precio base ($) <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-body-md text-body-md select-none">
                $
              </span>
              <input
                id="price"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
                min="0.01"
                max="10000"
                step="0.01"
                className="w-full bg-canvas border border-hairline rounded-lg pl-8 pr-md py-sm font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                type="number"
                required
              />
            </div>
          </div>
        </div>

        {/* Required Specialty */}
        <div>
          <label className="block font-title-sm text-title-sm text-ink mb-xs font-semibold" htmlFor="specialty">
            Especialidad Requerida
          </label>
          <div className="relative">
            <select
              id="specialty"
              value={especialidadRequerida}
              onChange={(e) => setEspecialidadRequerida(e.target.value)}
              className="w-full bg-canvas border border-hairline rounded-lg pl-md pr-10 py-sm font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none text-on-surface"
            >
              <option value="">Ninguna especialidad (Medicina General)</option>
              <option value="Cirugía">Cirugía</option>
              <option value="Odontología">Odontología</option>
              <option value="Dermatología">Dermatología</option>
              <option value="Traumatología">Traumatología</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none select-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block font-title-sm text-title-sm text-ink mb-xs font-semibold" htmlFor="description">
            Descripción detallada
          </label>
          <textarea
            id="description"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe brevemente el procedimiento, materiales incluidos y recomendaciones previas para el paciente."
            className="w-full bg-canvas border border-hairline rounded-lg px-md py-sm font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y text-on-surface"
            rows={4}
            maxLength={500}
          />
        </div>

        {/* Requires Vet Toggle */}
        <div className="flex items-center justify-between py-sm border-t border-hairline mt-md select-none">
          <div>
            <h4 className="font-title-sm text-title-sm text-ink font-semibold">Requiere Veterinario</h4>
            <p className="font-body-sm text-body-sm text-body-muted mt-xxs">
              Asigna automáticamente este servicio solo a personal con licencia médica veterinaria.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={requiereVeterinario}
              onChange={(e) => setRequiereVeterinario(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-md pt-lg border-t border-hairline mt-xl">
          <button
            onClick={() => navigate('/admin/servicios')}
            disabled={submitting}
            className="px-6 py-2 rounded-full font-button text-button bg-canvas border border-ink text-ink hover:bg-surface-soft transition-colors cursor-pointer"
            type="button"
          >
            Cancelar
          </button>
          <button
            disabled={submitting}
            className="px-6 py-2 rounded-full font-button text-button bg-[#cc785c] hover:bg-primary text-white transition-colors shadow-sm cursor-pointer"
            type="submit"
          >
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
