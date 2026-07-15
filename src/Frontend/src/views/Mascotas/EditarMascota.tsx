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
      toast.dismiss();
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow p-6">
        <ErrorMessage message={error} onRetry={loadPet} />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto w-full">
      
      {/* Breadcrumb Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-body-muted font-bold text-xs mb-2">
          <button onClick={() => navigate(`/admin/mascotas/${petId}`)} className="hover:text-primary transition-colors cursor-pointer">
            Ficha de {nombre}
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-ink">Editar Detalles</span>
        </nav>
        <h1 className="font-headline-lg text-headline-lg text-ink">Modificar Expediente</h1>
        <p className="font-body-md text-body-md text-body-muted mt-1">
          Actualiza los datos físicos, biométricos y observaciones médicas de la mascota.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs overflow-hidden">
        
        {/* Tutor Read-Only Display with Transfer Link */}
        <div className="p-8 border-b border-outline-variant/15 bg-surface-bright flex flex-col md:flex-row gap-6">
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">person</span>
          </div>
          <div className="flex-grow">
            <h3 className="font-title-md text-title-md text-ink font-bold">Tutor Responsable</h3>
            <p className="font-body-md text-body-md text-body-muted mt-1 mb-4">
              El cambio de titular se maneja a través de un flujo con auditoría interna.
            </p>
            <div className="bg-white border border-outline-variant/40 rounded-xl p-4 flex items-center justify-between shadow-xs max-w-xl">
              <div>
                <span className="font-bold text-ink text-sm block">{ownerName}</span>
                <span className="font-semibold text-body-muted text-xs block mt-0.5">Tutor Registrado</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/admin/mascotas/${petId}/cambiar-responsable`)}
                className="text-primary hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                Cambiar Titular
              </button>
            </div>
          </div>
        </div>

        {/* Pet Details Inputs */}
        <div className="p-8 space-y-8">
          
          {/* Section 1: Basic Information */}
          <div>
            <h3 className="font-title-sm text-title-sm text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/15 pb-2 font-bold">
              <span className="material-symbols-outlined text-[20px]">info</span>
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-name">
                  Nombre de la Mascota <span className="text-error">*</span>
                </label>
                <input
                  id="pet-name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/50 bg-white py-3 px-4 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  type="text"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-species">
                  Especie <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    id="pet-species"
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-white py-3 pl-4 pr-10 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer"
                    required
                  >
                    <option value="Canino">Canino</option>
                    <option value="Felino">Felino</option>
                    <option value="Exótico">Exótico</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-body-muted pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-breed">Raza</label>
                <input
                  id="pet-breed"
                  value={raza}
                  onChange={(e) => setRaza(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/50 bg-white py-3 px-4 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  type="text"
                />
              </div>

              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-color">Color o Pelaje</label>
                <input
                  id="pet-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/50 bg-white py-3 px-4 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Physical Profile */}
          <div>
            <h3 className="font-title-sm text-title-sm text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/15 pb-2 font-bold">
              <span className="material-symbols-outlined text-[20px]">vital_signs</span>
              Perfil Físico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-bold text-ink text-xs mb-3">Sexo <span className="text-error">*</span></label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      name="pet-sex"
                      type="radio"
                      value="Macho"
                      checked={sexo === 'Macho'}
                      onChange={() => setSexo('Macho')}
                      className="w-5 h-5 text-primary border-outline-variant focus:ring-primary bg-white cursor-pointer"
                      required
                    />
                    <span className="text-body-sm text-ink group-hover:text-primary transition-colors font-medium">Macho</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      name="pet-sex"
                      type="radio"
                      value="Hembra"
                      checked={sexo === 'Hembra'}
                      onChange={() => setSexo('Hembra')}
                      className="w-5 h-5 text-primary border-outline-variant focus:ring-primary bg-white cursor-pointer"
                    />
                    <span className="text-body-sm text-ink group-hover:text-primary transition-colors font-medium">Hembra</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-dob">Fecha de Nacimiento</label>
                <input
                  id="pet-dob"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/50 bg-white py-3 px-4 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-weight">Peso (kg)</label>
                <div className="relative flex items-center border border-outline-variant/50 bg-white rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary pr-4 transition-colors">
                  <input
                    id="pet-weight"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    className="w-full py-3 px-4 bg-transparent border-none outline-none font-body-sm text-body-sm text-ink focus:ring-0"
                  />
                  <span className="text-xs text-body-muted font-bold">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Medical Notes */}
          <div>
            <h3 className="font-title-sm text-title-sm text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/15 pb-2 font-bold">
              <span className="material-symbols-outlined text-[20px]">medical_information</span>
              Notas y Observaciones Clínicas
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-allergies">Alergias Conocidas</label>
                <div className="flex items-start border border-outline-variant/50 bg-white rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary p-3 transition-colors">
                  <span className="material-symbols-outlined text-outline mr-2 mt-0.5 text-[20px]">warning</span>
                  <textarea
                    id="pet-allergies"
                    placeholder="Especificar alergias a alimentos, vacunas o medicamentos..."
                    value={alergiasConocidas}
                    onChange={(e) => setAlergiasConocidas(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-body-sm text-ink font-body-sm resize-none outline-none"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-observations">Observaciones Generales</label>
                <textarea
                  id="pet-observations"
                  placeholder="Temperamento, condiciones preexistentes o notas generales..."
                  value={observacionesGenerales}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/50 bg-white p-4 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-y"
                  rows={4}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Form Actions Footer */}
        <div className="p-6 border-t border-outline-variant/15 bg-surface flex justify-end gap-4 items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="px-6 h-12 rounded-xl font-bold text-xs text-secondary hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 h-12 rounded-xl font-bold text-xs bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </form>

    </div>
  );
}
