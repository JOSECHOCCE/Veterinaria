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
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM8pZR065mBN_zRsT0K-9h3W-ByY0dCkx1tJr6a_KXTKD63fcCW5FzMmFTzmcaQigIIqG5xFDGqXOQq0JWvRnTCq13J_DBfqi4QunaYKGRE_MqRX0DivSZ-mN9D_htDVybloxprk1_R1fFGlPD17YrWlt0_hwENNtVIaygWOCZ94AMIJnF7ZlEGmciyOTyS5OrBnA9vRzUw-nHhbN3CafZ-NxbGJNMglUBngYtJ7mo1oskzaYx3B6aoBIErCd0BxF692CDhzyjxZ8';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuADiZUuDOMsyo4M1wr15dg3fsL80rExV4tuKhka1NyJjHWVWLimgnT9wQsjQr8_z23jhtb7SlqFPuCp44eCRnKKZQ06tqmkTYPWibResnGBfH25z7mbfCkavRFdwIZBit8JTNFZcCBpO5k-6zKZHsK3WQP1gLKHSuIWd0CnTSc3wHEu4qXuEj0S3VP0RG_a0KFGMwEZw77fbutpjCXcTFhJs8POZ_CGRMzwVeiFkdXY9Top7gLGWkK9vmUQRl9Kbxy8J9jI4X9UToA';
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
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Header de la Página */}
      <PageHeader
        title="Mis Mascotas"
        description="Gestiona el perfil de tus compañeros de vida, revisa su historial médico y asegúrate de que estén al día con sus vacunas."
        actions={
          <button
            onClick={handleOpenModal}
            className="bg-primary hover:bg-primary-active text-on-primary font-button text-button py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 whitespace-nowrap self-start md:self-auto shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Registrar Nueva Mascota
          </button>
        }
        hasDivider={true}
      />

      {/* Grid de Mascotas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {mascotas.map((mascota) => (
          <article
            key={mascota.id}
            onClick={() => navigate(`/cliente/mascotas/${mascota.id}`)}
            className="bg-surface-card rounded-xl overflow-hidden group cursor-pointer border border-transparent hover:border-hairline hover:shadow-md transition-all duration-300"
          >
            <div className="h-56 overflow-hidden relative">
              <img
                src={getPetImage(mascota.especie)}
                alt={mascota.nombre}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-canvas/90 backdrop-blur-sm px-3 py-1 rounded-full border border-hairline flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="font-caption-caps text-[10px] text-ink font-bold uppercase">Al día</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold leading-tight">{mascota.nombre}</h3>
                  <p className="font-body-sm text-body-sm text-body-muted mt-1">
                    {mascota.especie} {mascota.raza ? `/ ${mascota.raza}` : ''}
                  </p>
                </div>
                <span className="font-title-md text-title-md text-primary font-bold">{getPetAge(mascota.fechaNacimiento)}</span>
              </div>
              <div className="pt-3.5 border-t border-hairline flex items-center justify-between">
                <span className="font-caption text-caption text-body-muted flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">monitor_weight</span>
                  {mascota.peso ? `${mascota.peso} kg` : 'S/P'}
                </span>
                <button className="text-primary hover:text-primary-active font-button text-button font-bold transition-colors">
                  Ver Perfil
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Tarjeta de añadir (Estilo Empty State) */}
        <div
          onClick={handleOpenModal}
          className="border-2 border-dashed border-hairline hover:border-primary/40 rounded-xl flex flex-col items-center justify-center p-6 min-h-[320px] bg-canvas/30 hover:bg-surface-soft/40 transition-colors cursor-pointer group shadow-inner"
        >
          <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors border border-hairline">
            <span className="material-symbols-outlined text-[28px] text-primary">pets</span>
          </div>
          <h3 className="font-title-md text-title-md text-ink text-center font-bold">¿Tienes un nuevo integrante?</h3>
          <p className="font-body-sm text-body-sm text-body-muted text-center max-w-[220px] mt-1 mb-6">
            Añade su información para mantener su historial médico al día.
          </p>
          <button className="bg-surface text-ink border border-hairline hover:border-primary hover:text-primary font-button text-button py-2 px-6 rounded-full transition-colors cursor-pointer">
            Registrar Mascota
          </button>
        </div>

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
              className="absolute inset-0 bg-[#141413]/40 backdrop-blur-sm"
            ></motion.div>

            {/* Contenido del Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-canvas border border-hairline w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center">
                <h3 className="font-title-lg text-title-lg text-ink font-bold">Registrar Nueva Mascota</h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-full text-body-muted hover:bg-surface-soft hover:text-ink transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                {formError && (
                  <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-sm border border-error/15">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label htmlFor="pet-name" className="font-label-sm text-ink font-semibold">
                    Nombre de la Mascota *
                  </label>
                  <input
                    id="pet-name"
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Bobby, Luna"
                    className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="pet-species" className="font-label-sm text-ink font-semibold">
                    Especie *
                  </label>
                  <select
                    id="pet-species"
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value)}
                    className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-surface-card border border-hairline hover:bg-surface-soft text-ink py-2.5 rounded-full font-button text-button cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary py-2.5 rounded-full font-button text-button flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
