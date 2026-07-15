import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [selectedOwner, setSelectedOwner] = useState<{ id: number; nombre: string; dni?: string; email?: string } | null>(null);
  const [searchingOwners, setSearchingOwners] = useState(false);

  // Verification checkbox and reason for owner change (Mandatory)
  const [motivo, setMotivo] = useState('');
  const [verificado, setVerificado] = useState(false);
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
    if (!verificado) {
      toast.error('Debes confirmar que verificaste la identidad del nuevo responsable.');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const auditLine = `\n[Titularidad - ${dateStr}]: Traspasado de "${mascota.usuarioNombre}" a "${selectedOwner.nombre}". Motivo: ${motivo.trim()}`;
      
      let updatedObservations = (mascota.observacionesGenerales || '').trim();
      if (updatedObservations.length + auditLine.length > 500) {
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
      toast.dismiss();
      setSubmitting(false);
    }
  };

  const getPetImageFallback = (esp: string) => {
    const species = esp.toLowerCase();
    if (species.includes('perro') || species.includes('canin') || species.includes('dog')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGLkyijdSwLz9sNJLIq6dXqSMLg7m059hATtoS8THg7KxR8B6reUjzOpGqTkxJyOU5D_Sx7fiCC8mojqsJy5Kv2inZGbezLKYxbg7Vqkxov7ZoTAX89CIO3_mpq_qDfTILJXaOSYeVdd6hm4SypuUBxzsdTzscYqhpktl61dAOxHWXDT7ZROF74Qpvd9jni4x4giQtJS1CPYXFwFrQL7S8AHa-YxX5t_GnmkNOR5DyfG08aFzYvaM5xg';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDASZYKUqOKnwyluB3xWyt7baBCtBuSw9BETDSt_dlgtD4GVmhbo5EvvrMteSdZGFSmqAMo4-t-uR7T_L5RNL0hh77brXif0AnV-VRntWmxCfJPhUS1zczqZO8RI0NOeCytiVRMAunB6Y-V-uZQtzlRxOpjXgzVvmsTqWlRwVw2OqHENFLi6AKM-LVDDUOKu3w2LbW8kzjKomZYT5jwJjlo7xqnGQ6_x_g7T4RluhFremQGwMJMs5xEJQ';
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="flex-grow p-6">
        <ErrorMessage message={error || 'La mascota no está disponible.'} onRetry={loadPet} />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto w-full">
      
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-body-muted font-bold text-xs mb-2">
          <button onClick={() => navigate(`/admin/mascotas/${petId}`)} className="hover:text-primary transition-colors cursor-pointer">
            Ficha de {mascota.nombre}
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-ink">Cambio de Responsable</span>
        </nav>
        <h1 className="font-headline-lg text-headline-lg text-ink">Transferencia de Propietario</h1>
        <p className="font-body-md text-body-md text-body-muted mt-1">
          Asigna el expediente a un nuevo tutor legal con auditoría interna.
        </p>
      </div>

      {/* Main Bento Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs overflow-hidden">
        
        {/* Patient Context Banner */}
        <div className="p-6 border-b border-outline-variant/15 bg-surface-bright flex items-center gap-4">
          <img
            src={mascota.fotoUrl || getPetImageFallback(mascota.especie)}
            alt={mascota.nombre}
            className="w-16 h-16 rounded-full object-cover shadow-xs border border-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getPetImageFallback(mascota.especie);
            }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-ink text-sm leading-tight">{mascota.nombre}</h2>
              <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                {mascota.especie}
              </span>
              {mascota.raza && (
                <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                  {mascota.raza}
                </span>
              )}
            </div>
            <p className="text-[11px] text-body-muted mt-1 font-semibold">
              ID Mascota: #PAC-{mascota.id} • El historial clínico completo (vacunas, recetas y notas) se mantendrá intacto.
            </p>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-outline-variant/15">
          
          {/* Current Owner Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-ink text-xs flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <span className="material-symbols-outlined text-outline text-[18px]">person_remove</span>
              Responsable Actual
            </h3>
            <div className="bg-rose-50/50 rounded-xl p-5 border border-rose-200/60 relative overflow-hidden flex items-start gap-3">
              <div className="absolute top-0 left-0 w-1 h-full bg-error" />
              <span className="material-symbols-outlined text-outline text-[24px]">account_circle</span>
              <div>
                <p className="font-bold text-ink text-xs">{mascota.usuarioNombre || 'No registrado'}</p>
                <p className="text-[10px] text-body-muted font-bold uppercase tracking-wider mt-1">Tutor Actual del Expediente</p>
                <p className="text-[11px] text-body-muted mt-1">ID Cliente: #{mascota.usuarioId}</p>
              </div>
            </div>
          </div>

          {/* New Owner Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-ink text-xs flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <span className="material-symbols-outlined text-primary text-[18px]">person_add</span>
              Nuevo Responsable
            </h3>

            {selectedOwner ? (
              <div className="bg-emerald-50/40 rounded-xl p-5 border border-emerald-200/60 relative overflow-hidden flex items-start justify-between gap-3">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary text-[24px]">how_to_reg</span>
                  <div>
                    <p className="font-bold text-ink text-xs">{selectedOwner.nombre}</p>
                    {selectedOwner.email && <p className="text-[11px] text-body-muted mt-0.5">{selectedOwner.email}</p>}
                    {selectedOwner.dni && <p className="text-[11px] text-body-muted mt-0.5">DNI: {selectedOwner.dni}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOwner(null);
                    setOwnerSearch('');
                  }}
                  className="text-body-muted hover:text-error transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-body-muted uppercase tracking-wider">
                  Buscar Nuevo Tutor
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    search
                  </span>
                  <input
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    placeholder="Nombre o DNI..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant/50 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body-sm text-body-sm text-ink outline-none"
                    type="text"
                  />

                  {/* Dropdown Overlay */}
                  {ownerResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                      {ownerResults.map((owner) => (
                        <div
                          key={owner.id}
                          onClick={() => {
                            setSelectedOwner({ id: owner.id, nombre: owner.nombre, dni: owner.dni, email: owner.email });
                            setOwnerResults([]);
                            setOwnerSearch('');
                          }}
                          className="p-3 hover:bg-surface-soft cursor-pointer border-b border-outline-variant/10 last:border-0 flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-bold text-ink">{owner.nombre}</p>
                            <p className="text-body-muted mt-0.5">DNI: {owner.dni || 'N/A'}</p>
                          </div>
                          <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
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
              </div>
            )}
          </div>

        </div>

        {/* Reason / Audit Trail */}
        <div className="p-8 space-y-6">
          <h3 className="font-bold text-ink text-xs flex items-center gap-2 border-b border-outline-variant/10 pb-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">edit_document</span>
            Detalles de Auditoría Interna
          </h3>

          <div>
            <label className="block font-bold text-ink text-xs mb-2" htmlFor="reason">
              Motivo y Notas de la Transferencia <span className="text-error font-extrabold">*</span>
            </label>
            <textarea
              id="reason"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Especifica detalladamente la justificación del cambio de titular legal..."
              className="w-full p-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body-sm text-body-sm text-ink outline-none resize-none"
              rows={3}
              required
            />
          </div>

          <label className="flex items-start gap-3 mt-4 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={verificado}
              onChange={(e) => setVerificado(e.target.checked)}
              className="mt-1 w-5 h-5 text-primary border-outline-variant focus:ring-primary rounded cursor-pointer"
            />
            <span className="text-body-sm text-body-muted group-hover:text-ink transition-colors leading-snug">
              Confirmo que he verificado la identificación del nuevo tutor responsable y procedo con la reasignación de expediente de forma voluntaria.
            </span>
          </label>
        </div>

        {/* Actions Footer */}
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
            disabled={submitting || !selectedOwner || !motivo.trim() || !verificado}
            className="px-8 h-12 rounded-xl font-bold text-xs bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {submitting ? 'Guardando...' : 'Confirmar Transferencia'}
          </button>
        </div>

      </form>

    </div>
  );
}
