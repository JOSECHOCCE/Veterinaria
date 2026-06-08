import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import MascotasService from '../../services/mascotas.service';
import ClientesService from '../../services/clientes.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

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

export default function CambioResponsable() {
  const { id } = useParams<{ id: string }>();
  const petId = Number(id);
  const navigate = useNavigate();

  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and selector states for new owner
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerResults, setOwnerResults] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<{ id: number; nombre: string; dni?: string } | null>(null);
  const [searchingOwners, setSearchingOwners] = useState(false);

  // Reason for owner change (Mandatory)
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        setMascota(res.data.mascota);
      } else {
        setError(res.message || 'No se pudieron cargar los datos de la mascota.');
      }
    } catch (err: any) {
      console.error('Error loading pet for owner change:', err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  // Debounced search for new owners
  useEffect(() => {
    if (!ownerSearch.trim() || selectedOwner) {
      setOwnerResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setSearchingOwners(true);
      try {
        const res = await ClientesService.getClientes(ownerSearch, false, 1);
        if (res.success && res.data) {
          // Filter out the current owner from results
          const list = (res.data.usuarios || []).filter((u: any) => u.id !== mascota?.usuarioId);
          setOwnerResults(list);
        }
      } catch (err) {
        console.error('Error searching owners:', err);
      } finally {
        setSearchingOwners(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [ownerSearch, selectedOwner, mascota?.usuarioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mascota) return;
    if (!selectedOwner) {
      toast.error('Debes seleccionar un nuevo cliente responsable.');
      return;
    }
    if (!motivo.trim()) {
      toast.error('El motivo del cambio de titularidad es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      // Option 1: Append reason to general clinical notes for auditing
      const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const auditLine = `\n[Titularidad - ${dateStr}]: Traspasado de "${mascota.usuarioNombre}" a "${selectedOwner.nombre}". Motivo: ${motivo.trim()}`;
      
      let updatedObservations = (mascota.observacionesGenerales || '').trim();
      if (updatedObservations.length + auditLine.length > 500) {
        // Safe limit check to avoid DB schema truncation (MaxLength is 500)
        updatedObservations = updatedObservations.substring(0, 500 - auditLine.length);
      }
      updatedObservations += auditLine;

      const payload = {
        id: mascota.id,
        nombre: mascota.nombre,
        especie: mascota.especie,
        raza: mascota.raza || null,
        sexo: mascota.sexo || null,
        color: mascota.color || null,
        fechaNacimiento: mascota.fechaNacimiento || null,
        peso: mascota.peso || null,
        alergiasConocidas: mascota.alergiasConocidas || null,
        observacionesGenerales: updatedObservations,
        usuarioId: selectedOwner.id, // The new owner
      };

      const res = await MascotasService.updateMascota(petId, payload);
      if (res.success) {
        toast.success(`La titularidad de ${mascota.nombre} se transfirió a ${selectedOwner.nombre}.`);
        navigate(`/admin/mascotas/${petId}`);
      } else {
        toast.error(res.message || 'Error al guardar los cambios.');
      }
    } catch (err: any) {
      console.error('Error changing owner:', err);
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

  if (error || !mascota) {
    return (
      <div className="flex-1 p-lg">
        <ErrorMessage message={error || 'La mascota no está disponible.'} onRetry={loadPet} />
      </div>
    );
  }

  return (
    <div className="p-section max-w-4xl mx-auto flex flex-col gap-lg w-full">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-xs mb-lg select-none">
        <div className="flex items-center gap-xs text-body-muted font-caption text-caption">
          <Link to="/admin/mascotas" className="hover:text-primary transition-colors">Expedientes</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link to={`/admin/mascotas/${petId}`} className="hover:text-primary transition-colors">{mascota.nombre}</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-medium">Cambio de Titularidad</span>
        </div>
        <h2 className="font-display-sm text-display-sm text-ink mt-sm">Cambio de Titularidad</h2>
        <p className="font-body-md text-body-md text-body-muted">
          Gestiona el traspaso de responsabilidad para <strong className="text-ink">"{mascota.nombre}"</strong>.
        </p>
      </div>

      {/* Main Bento Form Card */}
      <div className="bg-surface-card rounded-xl p-xl border border-hairline shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-xl relative z-10">
          
          {/* Left Column: Current Owner */}
          <div className="flex flex-col gap-lg border-r-0 md:border-r border-hairline md:pr-xl">
            <div>
              <h3 className="font-title-sm text-title-sm text-ink mb-md flex items-center gap-xs font-semibold">
                <span className="material-symbols-outlined text-secondary">person</span>
                Responsable Actual
              </h3>
              <div className="bg-canvas border border-hairline rounded-lg p-md flex items-start gap-md">
                <div className="w-12 h-12 rounded-full bg-surface-soft flex-shrink-0 flex items-center justify-center text-primary font-bold text-lg border border-hairline">
                  {mascota.usuarioNombre ? mascota.usuarioNombre.substring(0, 2).toUpperCase() : 'PR'}
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-ink font-semibold">{mascota.usuarioNombre}</span>
                  <span className="font-body-sm text-body-sm text-body-muted">Propietario del expediente</span>
                  <span className="font-body-sm text-body-sm text-body-muted mt-xxs">ID Propietario: #{mascota.usuarioId}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <div className="bg-surface-soft border border-hairline rounded-lg p-md flex gap-md items-start">
                <span className="material-symbols-outlined text-accent-teal mt-0.5">info</span>
                <p className="font-body-sm text-body-sm text-ink">
                  <strong className="font-medium text-tertiary">Nota importante:</strong> El historial clínico, vacunas y tratamientos pasados de {mascota.nombre} se conservarán íntegramente tras el cambio de titular.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: New Owner Selector */}
          <div className="flex flex-col gap-lg">
            <div>
              <h3 className="font-title-sm text-title-sm text-ink mb-md flex items-center gap-xs font-semibold">
                <span className="material-symbols-outlined text-primary">person_add</span>
                Nuevo Responsable
              </h3>

              {selectedOwner ? (
                <div className="bg-canvas border border-hairline rounded-lg p-md flex items-center justify-between">
                  <div>
                    <span className="font-title-md text-title-md text-ink font-semibold">{selectedOwner.nombre}</span>
                    {selectedOwner.dni && (
                      <span className="font-body-sm text-body-sm text-body-muted ml-md">DNI: {selectedOwner.dni}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOwner(null);
                      setOwnerSearch('');
                    }}
                    className="text-error hover:text-red-700 font-button text-[13px] flex items-center gap-xxs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Remover
                  </button>
                </div>
              ) : (
                <div className="relative flex flex-col gap-xs mb-md">
                  <label className="font-caption-uppercase text-caption-uppercase text-body-muted">Buscar cliente activo</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-body-muted">
                      search
                    </span>
                    <input
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      placeholder="Nombre, DNI o teléfono..."
                      className="w-full pl-10 pr-md py-sm bg-canvas border border-hairline rounded-md font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      type="text"
                    />

                    {/* Results Overlay */}
                    {ownerResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest border border-hairline rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                        {ownerResults.map((owner) => (
                          <div
                            key={owner.id}
                            onClick={() => {
                              setSelectedOwner({ id: owner.id, nombre: owner.nombre, dni: owner.dni });
                              setOwnerResults([]);
                              setOwnerSearch('');
                            }}
                            className="p-sm hover:bg-surface-soft cursor-pointer border-b border-hairline last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-body-md text-body-md text-ink font-semibold">{owner.nombre}</p>
                              <p className="font-caption text-caption text-body-muted">DNI: {owner.dni || 'N/A'}</p>
                            </div>
                            <span className="material-symbols-outlined text-body-muted text-[18px]">add</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchingOwners && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full block" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-md my-sm select-none">
                    <div className="flex-1 h-px bg-hairline"></div>
                    <span className="font-caption text-caption text-body-muted">O</span>
                    <div className="flex-1 h-px bg-hairline"></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/clientes/nuevo')}
                    className="w-full bg-canvas border border-ink text-ink py-2 px-md rounded font-button text-button hover:bg-surface-soft transition-colors flex items-center justify-center gap-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Registrar Nuevo Cliente
                  </button>
                </div>
              )}
            </div>

            {/* Reason Field */}
            <div className="flex flex-col gap-xs mt-auto">
              <label className="font-caption-uppercase text-caption-uppercase text-body-muted flex items-center gap-xs" htmlFor="motivo">
                Motivo del cambio <span className="text-error">*</span>
              </label>
              <textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Cambio de domicilio, adopción, tutoría legal..."
                className="w-full p-sm bg-canvas border border-hairline rounded font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="md:col-span-2 flex justify-end gap-md mt-md pt-md border-t border-hairline">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="bg-transparent border border-transparent text-ink py-2.5 px-lg rounded font-button text-button hover:bg-surface-soft transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedOwner || !motivo.trim()}
              className="bg-primary text-on-primary py-2.5 px-xl rounded font-button text-button hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-xs cursor-pointer shadow-sm"
            >
              {submitting ? 'Guardando...' : 'Confirmar Cambio de Titularidad'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
