import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import MascotasService from '../../services/mascotas.service';
import ClientesService from '../../services/clientes.service';

export default function RegistrarMascota() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultOwnerIdStr = searchParams.get('clienteId');

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

  // Owner search states
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerResults, setOwnerResults] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<{ id: number; nombre: string; dni?: string } | null>(null);
  const [searchingOwners, setSearchingOwners] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If a default owner ID was passed via query parameter (e.g. from FichaClienteDetalle)
  useEffect(() => {
    if (defaultOwnerIdStr) {
      const ownerId = Number(defaultOwnerIdStr);
      if (!isNaN(ownerId)) {
        ClientesService.getClienteDetails(ownerId)
          .then((res) => {
            if (res.success && res.data) {
              const u = res.data.usuario;
              setSelectedOwner({ id: u.id, nombre: u.nombre, dni: u.dni });
            }
          })
          .catch((err) => console.error('Error fetching preselected owner details:', err));
      }
    }
  }, [defaultOwnerIdStr]);

  // Debounced search for owners
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
          setOwnerResults(res.data.usuarios || []);
        }
      } catch (err) {
        console.error('Error searching owners:', err);
      } finally {
        setSearchingOwners(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [ownerSearch, selectedOwner]);

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
    if (!selectedOwner) {
      toast.error('Debes asociar la mascota a un cliente responsable.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        especie,
        raza: raza.trim() || null,
        sexo: sexo || null,
        color: color.trim() || null,
        fechaNacimiento: fechaNacimiento || null,
        peso: peso ? parseFloat(peso) : null,
        alergiasConocidas: alergiasConocidas.trim() || null,
        observacionesGenerales: observacionesGenerales.trim() || null,
        usuarioId: selectedOwner.id,
      };

      const res = await MascotasService.createMascota(payload);
      if (res.success) {
        toast.success('Mascota registrada correctamente.');
        if (defaultOwnerIdStr) {
          navigate(`/admin/clientes/${defaultOwnerIdStr}`);
        } else {
          navigate('/admin/mascotas');
        }
      } else {
        toast.error(res.message || 'Error al guardar el registro.');
      }
    } catch (err: any) {
      console.error('Error registering pet:', err);
      toast.error(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-xl max-w-4xl mx-auto w-full">
      <div className="mb-lg select-none">
        <h2 className="font-display-sm text-display-sm text-ink mb-xs">Registrar Mascota</h2>
        <p className="font-body-sm text-body-sm text-body-muted">
          Ingresa los datos del nuevo paciente para vincularlo a un cliente responsable.
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
                placeholder="Ej. Luna"
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
                <option value="" disabled>Selecciona especie</option>
                <option value="Canino">Canino</option>
                <option value="Felino">Felino</option>
                <option value="Exótico">Exótico</option>
              </select>
            </div>

            {/* Owner Selector */}
            <div className="md:col-span-2">
              <label className="block font-title-sm text-title-sm text-ink mb-xs">
                Cliente Responsable <span className="text-error">*</span>
              </label>

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
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-body-muted">
                    search
                  </span>
                  <input
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    placeholder="Buscar por nombre o DNI del dueño..."
                    className="w-full pl-10 pr-md py-sm font-body-md text-body-md border border-hairline rounded-md bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="text"
                  />

                  {/* Search Results Dropdown Overlay */}
                  {ownerResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest border border-hairline rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
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
                            <p className="font-caption text-caption text-body-muted">DNI: {owner.dni || 'No registrado'}</p>
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

                  {!searchingOwners && ownerSearch.trim() && ownerResults.length === 0 && (
                    <p className="font-caption text-caption text-error mt-1 ml-1">
                      No se encontraron clientes activos con ese criterio.
                    </p>
                  )}

                  <p className="font-caption text-caption text-body-muted mt-1 ml-1">
                    Comienza a escribir el nombre o DNI para vincular obligatoriamente al responsable.
                  </p>
                </div>
              )}
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
                placeholder="Ej. Golden Retriever"
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
                placeholder="Ej. Dorado claro"
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
                Peso inicial (kg)
              </label>
              <input
                id="weight"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="0.0"
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
                placeholder="Ej. Reacción alérgica a la Penicilina..."
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
                placeholder="Notas sobre temperamento, marcas distintivas, etc..."
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
            {submitting ? 'Guardando...' : 'Guardar Registro'}
          </button>
        </div>
      </form>
    </div>
  );
}
