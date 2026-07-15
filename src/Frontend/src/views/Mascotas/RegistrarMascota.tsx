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

  // Load default owner if provided via search parameter
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
      toast.dismiss();
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto w-full">
      
      {/* Breadcrumb Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-body-muted font-bold text-xs mb-2">
          <button onClick={() => navigate('/admin/mascotas')} className="hover:text-primary transition-colors cursor-pointer">
            Pacientes
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-ink">Nuevo Registro</span>
        </nav>
        <h1 className="font-headline-lg text-headline-lg text-ink">Registro de Nuevo Paciente</h1>
        <p className="font-body-md text-body-md text-body-muted mt-1">
          Ingresa los detalles médicos y físicos del animal para crear su expediente.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-outline-variant/20 shadow-xs overflow-hidden">
        
        {/* Client Assignment Segment */}
        <div className="p-8 border-b border-outline-variant/15 bg-surface-bright flex flex-col md:flex-row gap-6">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">person_alert</span>
          </div>
          <div className="flex-1">
            <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-1.5">
              Asociación de Cliente Responsable <span className="text-error font-extrabold">*</span>
            </h3>
            <p className="font-body-md text-body-md text-body-muted mt-1 mb-6">
              Toda mascota en la clínica debe estar vinculada obligatoriamente a un tutor legal.
            </p>

            <div className="relative max-w-xl">
              {selectedOwner ? (
                <div className="bg-white border border-primary/30 rounded-xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-bold text-ink text-sm block">{selectedOwner.nombre}</span>
                    {selectedOwner.dni && (
                      <span className="font-semibold text-body-muted text-xs block mt-0.5">DNI: {selectedOwner.dni}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOwner(null);
                      setOwnerSearch('');
                    }}
                    className="text-error hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    Remover
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-body-muted text-[18px]">
                    search
                  </span>
                  <input
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    placeholder="Escribe el nombre o DNI del cliente..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant/50 rounded-xl font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                    type="text"
                  />

                  {/* Dropdown Overlay */}
                  {ownerResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-outline-variant/30 rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto">
                      {ownerResults.map((owner) => (
                        <div
                          key={owner.id}
                          onClick={() => {
                            setSelectedOwner({ id: owner.id, nombre: owner.nombre, dni: owner.dni });
                            setOwnerResults([]);
                            setOwnerSearch('');
                          }}
                          className="p-3 hover:bg-surface-soft cursor-pointer border-b border-outline-variant/10 last:border-0 flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-bold text-ink">{owner.nombre}</p>
                            <p className="text-body-muted mt-0.5">DNI: {owner.dni || 'No registrado'}</p>
                          </div>
                          <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchingOwners && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full block" />
                    </div>
                  )}

                  {!searchingOwners && ownerSearch.trim() && ownerResults.length === 0 && (
                    <p className="text-xs text-error mt-2 font-bold pl-1">
                      No se encontraron tutores activos que coincidan.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pet Form Body */}
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
                  placeholder="Ej. Bella"
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
                    <option value="" disabled>Selecciona la especie</option>
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
                  placeholder="Ej. Golden Retriever"
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
                  placeholder="Ej. Dorado claro, negro con blanco"
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
                <div className="relative">
                  <input
                    id="pet-dob"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/50 bg-white py-3 px-4 font-body-sm text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink text-xs mb-2" htmlFor="pet-weight">Peso Inicial</label>
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
            {submitting ? 'Guardando...' : 'Guardar Mascota'}
          </button>
        </div>

      </form>

    </div>
  );
}
