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
    <div className="flex flex-col gap-8 w-full pb-12 relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/4 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[45%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-teal/3 blur-[120px]" />
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
            className="bg-gradient-to-r from-primary to-primary-active hover:shadow-lg hover:shadow-primary/20 text-on-primary font-button text-button py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 whitespace-nowrap self-start md:self-auto shadow-md cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Registrar Mascota
          </button>
        }
        hasDivider={true}
      />

      {/* Grid de Mascotas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
        
        {mascotas.map((mascota) => (
          <motion.article
            key={mascota.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/cliente/mascotas/${mascota.id}`)}
            className="bg-canvas/60 backdrop-blur-sm rounded-2xl overflow-hidden group cursor-pointer border border-hairline/40 hover:border-primary/20 hover:shadow-xl transition-all duration-300 shadow-sm relative flex flex-col"
          >
            {/* Foto de mascota */}
            <div className="h-56 overflow-hidden relative shadow-inner">
              <img
                src={getPetImage(mascota.especie)}
                alt={mascota.nombre}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-canvas/90 backdrop-blur-sm px-3 py-1 rounded-full border border-hairline/70 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span className="font-caption-caps text-[9px] text-ink font-bold uppercase tracking-wider">Al día</span>
              </div>
            </div>

            {/* Contenido en cuadrantes */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-title-lg text-[20px] text-ink font-bold leading-tight group-hover:text-primary transition-colors">
                      {mascota.nombre}
                    </h3>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="font-semibold text-secondary-container px-2 py-0.5 rounded bg-surface-soft text-[10px] font-sans">
                        {mascota.especie}
                      </span>
                      {mascota.raza && (
                        <span className="text-[11px] text-body-muted font-medium truncate max-w-[120px]">
                          {mascota.raza}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Anillo de salud (Activity/Health Ring) */}
                  <div className="relative flex items-center justify-center shrink-0" title="Cuidado Clínico: 90%">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle cx="20" cy="20" r="15" className="stroke-surface-soft" strokeWidth="2.5" fill="transparent" />
                      <circle cx="20" cy="20" r="15" className="stroke-primary" strokeWidth="2.5" fill="transparent"
                        strokeDasharray={94}
                        strokeDashoffset={9.4} // Representa el 90%
                      />
                    </svg>
                    <span className="absolute text-[8px] font-bold text-primary">90%</span>
                  </div>
                </div>
              </div>

              {/* Ficha Inferior */}
              <div className="pt-4 mt-4 border-t border-hairline/60 flex items-center justify-between">
                <div className="flex items-center gap-3 text-body-muted text-[12px] font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">monitor_weight</span>
                    {mascota.peso ? `${mascota.peso} kg` : 'S/P'}
                  </span>
                  <span className="flex items-center gap-1 border-l border-hairline/60 pl-3">
                    <span className="material-symbols-outlined text-[16px] text-accent-teal">schedule</span>
                    {getPetAge(mascota.fechaNacimiento)}
                  </span>
                </div>
                <button className="bg-primary/5 group-hover:bg-primary group-hover:text-on-primary text-primary px-4 py-1.5 rounded-full font-button text-[12px] font-bold transition-all shadow-sm">
                  Ver Ficha
                </button>
              </div>
            </div>
          </motion.article>
        ))}

        {/* Tarjeta de añadir (Bento Empty State) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleOpenModal}
          className="border-2 border-dashed border-hairline/60 hover:border-primary/45 rounded-2xl flex flex-col items-center justify-center p-6 min-h-[320px] bg-canvas/30 hover:bg-surface-soft/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="w-14 h-14 rounded-full bg-canvas flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors border border-hairline shadow-sm text-primary">
            <span className="material-symbols-outlined text-[28px]">pets</span>
          </div>
          <h3 className="font-title-md text-title-md text-ink text-center font-bold">¿Nuevo integrante en la familia?</h3>
          <p className="font-body-sm text-body-sm text-body-muted text-center max-w-[210px] mt-1.5 mb-6 leading-relaxed">
            Registra a tu mascota para llevar su control clínico e historial médico.
          </p>
          <button className="bg-canvas border border-hairline group-hover:border-primary group-hover:text-primary font-button text-button py-2 px-6 rounded-full transition-all cursor-pointer shadow-sm font-bold">
            Registrar Ahora
          </button>
        </motion.div>

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
              className="absolute inset-0 bg-[#141413]/50 backdrop-blur-md"
            ></motion.div>

            {/* Contenido del Modal Glassmorphic */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              className="bg-canvas/90 backdrop-blur-lg border border-hairline/60 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-hairline/60 flex justify-between items-center bg-canvas/40">
                <h3 className="font-title-lg text-title-lg text-ink font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">pets</span>
                  Registrar Mascota
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full text-body-muted hover:bg-surface-soft hover:text-ink transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                {formError && (
                  <div className="bg-error-container/80 backdrop-blur-sm text-on-error-container p-3.5 rounded-xl text-body-sm border border-error/15 font-medium shadow-sm">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-2 relative">
                  <label htmlFor="pet-name" className="font-label-sm text-ink font-bold text-[12px]">
                    Nombre de la Mascota *
                  </label>
                  <input
                    id="pet-name"
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Bobby, Luna"
                    className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="pet-species" className="font-label-sm text-ink font-bold text-[12px]">
                    Especie *
                  </label>
                  <select
                    id="pet-species"
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value)}
                    className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer font-medium"
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
                    className="flex-1 bg-surface-card border border-hairline hover:bg-surface-soft text-ink py-3 rounded-full font-button text-button font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-active hover:shadow-lg hover:shadow-primary/15 disabled:bg-primary-disabled text-on-primary py-3 rounded-full font-button text-button font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
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
