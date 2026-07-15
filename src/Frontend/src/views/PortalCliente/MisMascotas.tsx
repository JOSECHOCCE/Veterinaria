import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PortalClienteService from '../../services/portalCliente.service';
import type { RegistrarMascotaPortalDto } from '../../services/portalCliente.service';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza?: string;
  fechaNacimiento?: string;
  sexo?: string;
  color?: string;
  alergiasConocidas?: string;
  peso?: number;
}

export default function MisMascotas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form fields
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('Perro');

  const fetchMascotas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PortalClienteService.getMisMascotas();
      if (res.success && res.data) {
        setMascotas(res.data);
      } else {
        setError(res.message || 'Error al obtener la lista de mascotas.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMascotas();
    
    // Si viene con el parámetro ?action=new, abrir modal
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleOpenModal = () => {
    setNombre('');
    setEspecie('Perro');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Limpiar parámetro de URL si existe
    if (searchParams.get('action') === 'new') {
      setSearchParams({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError(null);
      const payload: RegistrarMascotaPortalDto = {
        nombre: nombre.trim(),
        especie
      };
      
      const res = await PortalClienteService.registrarMascota(payload);
      if (res.success) {
        handleCloseModal();
        fetchMascotas();
      } else {
        setFormError(res.message || 'No se pudo registrar la mascota.');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error de red al procesar el registro.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper de fotos predeterminadas
  const getPetImage = (esp: string) => {
    const species = esp.toLowerCase();
    if (species.includes('perro') || species.includes('dog')) {
      return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';
    }
    return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600';
  };

  const getPetAge = (fechaNac: string | undefined) => {
    if (!fechaNac) return 'Edad no registrada';
    const birth = new Date(fechaNac);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age === 1 ? '1 año' : age <= 0 ? 'Cachorro' : `${age} años`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-20 bg-surface-card rounded-lg w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="h-80 bg-surface-card rounded-xl"></div>
          <div className="h-80 bg-surface-card rounded-xl"></div>
          <div className="h-80 bg-surface-card rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Error al cargar mascotas</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={fetchMascotas}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto w-full relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[45%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-teal/5 blur-[120px]" />
      </div>

      {/* Header de la Página */}
      <PageHeader
        title={
          <span className="bg-gradient-to-r from-primary to-[#b86d5c] bg-clip-text text-transparent">
            Mis Mascotas
          </span>
        }
        description="Gestiona el perfil de tus compañeros de vida, revisa su historial médico y asegúrate de que estén al día con sus vacunas."
        actions={
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-primary to-primary-active hover:shadow-lg hover:shadow-primary/20 text-on-primary px-6 py-3 rounded-full font-button text-button transition-all flex items-center justify-center gap-2 whitespace-nowrap self-start md:self-auto shadow-md cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Registrar Mascota
          </button>
        }
        hasDivider={true}
      />

      {/* Bento Grid / Card Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        
        {/* Register New Pet Card (Prominent Action) */}
        <button
          onClick={handleOpenModal}
          className="group h-full min-h-[320px] bg-white rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-surface-soft transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="w-20 h-20 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-primary/10">
            <span className="material-symbols-outlined text-4xl">add</span>
          </div>
          <span className="text-xl font-bold text-primary block mb-2">+ Registrar Nueva Mascota</span>
          <span className="text-xs font-medium text-on-surface-variant max-w-[220px]">
            Agrega un nuevo compañero a tu perfil en VetCarePro.
          </span>
        </button>

        {/* Mascotas Cards */}
        {mascotas.map((mascota) => {
          const isCat = mascota.especie.toLowerCase().includes('gato') || mascota.especie.toLowerCase().includes('cat');
          const blobClass = isCat ? 'bg-tertiary-container/30' : 'bg-secondary-container/50';
          const ringClass = isCat ? 'ring-tertiary-container/60' : 'ring-primary-container/60';

          return (
            <motion.div
              key={mascota.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/cliente/mascotas/${mascota.id}`)}
              className="bg-white rounded-2xl p-6 flex flex-col relative overflow-hidden group cursor-pointer border border-primary/10 hover:border-primary-container/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm"
            >
              {/* Decorative top-right corner background blob */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${blobClass} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500`} />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Circular Profile Avatar */}
                <div className={`w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-white shadow-sm ring-2 ${ringClass} p-1 bg-white`}>
                  <img
                    src={getPetImage(mascota.especie)}
                    alt={mascota.nombre}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                
                {/* Name & Breed */}
                <h3 className="text-xl font-bold text-on-background group-hover:text-primary transition-colors mb-1">
                  {mascota.nombre}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {mascota.raza || 'Sin Raza'}
                  </span>
                  <span className="w-1.5 h-1.5 bg-primary/20 rounded-full" />
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {mascota.especie}
                  </span>
                </div>
                
                {/* Stat Box */}
                <div className="w-full flex justify-between bg-surface-container-low rounded-xl p-4 mt-2 border border-outline-variant/30">
                  <div className="text-center flex-1">
                    <span className="block text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1">Edad</span>
                    <span className="block text-xs text-on-surface font-bold">
                      {getPetAge(mascota.fechaNacimiento)}
                    </span>
                  </div>
                  <div className="w-px bg-outline-variant/60" />
                  <div className="text-center flex-1">
                    <span className="block text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1">Peso</span>
                    <span className="block text-xs text-on-surface font-bold">
                      {mascota.peso ? `${mascota.peso} kg` : 'S/P'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reveal Hover View History */}
              <div className="mt-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  Ver Historial Clínico <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de Registro */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-[#141413]/40 backdrop-blur-md"
            />

            {/* Contenido del Modal Glassmorphic */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              className="bg-white/90 backdrop-blur-lg border border-white/60 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-outline-variant/40 flex justify-between items-center bg-white/40">
                <h3 className="text-lg font-bold text-on-background flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">pets</span>
                  Registrar Mascota
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-soft hover:text-on-background transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                {formError && (
                  <div className="bg-error-container/85 backdrop-blur-sm text-on-error-container p-3.5 rounded-xl text-xs border border-error/15 font-bold">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-2 relative">
                  <label htmlFor="pet-name" className="text-xs font-bold text-on-surface">
                    Nombre de la Mascota *
                  </label>
                  <input
                    id="pet-name"
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Bobby, Luna"
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="pet-species" className="text-xs font-bold text-on-surface">
                    Especie *
                  </label>
                  <select
                    id="pet-species"
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value)}
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="Perro">Perro 🐶</option>
                    <option value="Gato">Gato 🐱</option>
                    <option value="Ave">Ave 🦜</option>
                    <option value="Conejo">Conejo 🐰</option>
                    <option value="Otro">Otro 🐾</option>
                  </select>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-white border border-outline-variant hover:bg-surface-soft text-on-surface py-3 rounded-full font-button text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-active hover:shadow-lg hover:shadow-primary/15 disabled:bg-primary-disabled text-white py-3 rounded-full font-button text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    {submitting ? 'Guardando...' : 'Registrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
