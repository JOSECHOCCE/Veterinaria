import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MascotasService from '../../services/mascotas.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function EditarMascota() {
  const { id } = useParams<{ id: string }>();
  const petId = Number(id);
  const navigate = useNavigate();

  // Form states
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('');
  const [color, setColor] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [alergiasConocidas, setAlergiasConocidas] = useState('');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [usuarioId, setUsuarioId] = useState<number>(0);
  const [ownerName, setOwnerName] = useState('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadPet = useCallback(async () => {
    if (isNaN(petId)) {
      setError('Identificador de mascota no válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await MascotasService.getMascotaEdit(petId);
      if (res.success && res.data) {
        const m = res.data.mascota;
        setNombre(m.nombre || '');
        setEspecie(m.especie || '');
        setRaza(m.raza || '');
        setSexo(m.sexo || '');
        setColor(m.color || '');
        if (m.fechaNacimiento) {
          setFechaNacimiento(m.fechaNacimiento.split('T')[0]);
        }
        setPeso(m.peso ? String(m.peso) : '');
        setAlergiasConocidas(m.alergiasConocidas || '');
        setObservacionesGenerales(m.observacionesGenerales || '');
        setUsuarioId(m.usuarioId || 0);
        setOwnerName(m.usuarioNombre || 'No asignado');
      } else {
        setError(res.message || 'No se pudieron cargar los datos de la mascota.');
      }
    } catch (err: any) {
      console.error('Error loading pet details for edit:', err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }
    if (!especie) {
      toast.error('La especie es obligatoria.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: petId,
        nombre: nombre.trim(),
        especie,
        raza: raza.trim() || null,
        sexo: sexo || null,
        color: color.trim() || null,
        fechaNacimiento: fechaNacimiento || null,
        peso: peso ? parseFloat(peso) : null,
        alergiasConocidas: alergiasConocidas.trim() || null,
        observacionesGenerales: observacionesGenerales.trim() || null,
        usuarioId, // Retain owner (owner change has its own dedicated flow)
      };

      const res = await MascotasService.updateMascota(petId, payload);
      if (res.success) {
        toast.success('Mascota actualizada correctamente.');
        navigate(`/admin/mascotas/${petId}`);
      } else {
        toast.error(res.message || 'Error al guardar los cambios.');
      }
    } catch (err: any) {
      console.error('Error updating pet:', err);
      toast.error(err.response?.data?.message || 'Error de conexión con el servidor.');
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
        <ErrorMessage message={error} onRetry={loadPet} />
      </div>
    );
  }

  return (
    <div className="p-xl max-w-4xl mx-auto w-full">
      <div className="mb-lg select-none">
        <h2 className="font-display-sm text-display-sm text-ink mb-xs">Editar Mascota</h2>
        <p className="font-body-sm text-body-sm text-body-muted font-medium">
          Modifica los detalles físicos, biométricos o notas médicas del paciente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-xl bg-surface-card p-xl rounded-xl border border-hairline shadow-sm">
        {/* Section 1: Basic Info */}
        <section>
          <h3 className="font-title-sm text-title-sm text-ink mb-md border-b border-hairline pb-xs font-semibold">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="pet-name">
                Nombre <span className="text-error">*</span>
              </label>
              <input
                id="pet-name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                type="text"
                required
              />
            </div>
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="species">
                Especie <span className="text-error">*</span>
              </label>
              <select
                id="species"
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              >
                <option value="Canino">Canino</option>
                <option value="Felino">Felino</option>
                <option value="Exótico">Exótico</option>
              </select>
            </div>

            {/* Read-only Owner Display (with link to transfer flow) */}
            <div className="md:col-span-2">
              <label className="block font-title-sm text-title-sm text-ink mb-xs">
                Cliente Responsable
              </label>
              <div className="bg-canvas border border-hairline rounded-lg p-md flex items-center justify-between">
                <div>
                  <span className="font-title-md text-title-md text-ink font-semibold">{ownerName}</span>
                  <span className="font-body-sm text-body-sm text-body-muted ml-md">(Titular del expediente)</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/mascotas/${petId}/cambiar-responsable`)}
                  className="text-primary hover:text-surface-tint font-button text-[13px] flex items-center gap-xxs cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                  Transferir Titularidad
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Physical Characteristics */}
        <section>
          <h3 className="font-title-sm text-title-sm text-ink mb-md border-b border-hairline pb-xs font-semibold">
            Características Físicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="breed">
                Raza
              </label>
              <input
                id="breed"
                value={raza}
                onChange={(e) => setRaza(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                type="text"
              />
            </div>
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="sex">
                Sexo
              </label>
              <select
                id="sex"
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Seleccionar</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="color">
                Color
              </label>
              <input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                type="text"
              />
            </div>
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="dob">
                Fecha de nacimiento
              </label>
              <input
                id="dob"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md text-ink border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                type="date"
              />
            </div>
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="weight">
                Peso (kg)
              </label>
              <input
                id="weight"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                step="0.1"
                min="0"
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                type="number"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Medical Notes */}
        <section>
          <h3 className="font-title-sm text-title-sm text-ink mb-md border-b border-hairline pb-xs font-semibold">
            Historial y Observaciones
          </h3>
          <div className="space-y-md">
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="allergies">
                Alergias conocidas
              </label>
              <textarea
                id="allergies"
                value={alergiasConocidas}
                onChange={(e) => setAlergiasConocidas(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="observations">
                Observaciones generales (Resumen Clínico)
              </label>
              <textarea
                id="observations"
                value={observacionesGenerales}
                onChange={(e) => setObservacionesGenerales(e.target.value)}
                className="w-full rounded-md px-md py-sm font-body-md text-body-md border border-hairline bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                rows={4}
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end pt-lg border-t border-hairline gap-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="px-lg py-2.5 rounded-md font-button text-button text-ink bg-canvas border border-ink hover:bg-surface-soft transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-lg py-2.5 rounded-md font-button text-button text-on-primary bg-primary hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
          >
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
