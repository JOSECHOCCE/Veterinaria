import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import { ServiciosService, type Servicio } from '../../services/servicios.service';
import consultaGeneralImg from '../../assets/Consulta General.png';
import vacunacionImg from '../../assets/Vacunación.png';
import cirugiaMenorImg from '../../assets/Cirugía Menor.png';
import banoPeluqueriaImg from '../../assets/Baño y Peluquería.png';
import desparasitacionImg from '../../assets/Desparacitación.png';

const serviceImages: Record<string, string> = {
  'Consulta General': consultaGeneralImg,
  'Vacunación': vacunacionImg,
  'Cirugía Menor': cirugiaMenorImg,
  'Baño y Peluquería': banoPeluqueriaImg,
  'Desparasitación': desparasitacionImg,
};

const serviceIcons: Record<string, string> = {
  'Consulta General': 'stethoscope',
  'Vacunación': 'vaccines',
  'Cirugía Menor': 'healing',
  'Baño y Peluquería': 'content_cut',
  'Desparasitación': 'favorite',
};

const getServiceImage = (nombre: string) => {
  return serviceImages[nombre] || consultaGeneralImg;
};

const getServiceIcon = (nombre: string) => {
  return serviceIcons[nombre] || 'medical_services';
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await ServiciosService.getServicios();
        if (response.success && response.data && Array.isArray(response.data.servicios)) {
          const activeServices = response.data.servicios.filter((s: Servicio) => s.activo);
          setServices(activeServices);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-body-md antialiased overflow-x-hidden">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-20 overflow-hidden bg-canvas">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-surface-soft/60 rounded-[32px] ambient-shadow p-8 lg:p-16 relative z-10 border border-hairline/60">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="z-10 flex flex-col gap-6"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full w-fit">
                <span className="material-symbols-outlined text-sm icon-fill">verified</span>
                <span className="font-bold text-[13px]">Clínica Veterinaria Premium</span>
              </div>
              <h1 className="font-display-xl text-[40px] md:text-[56px] leading-[1.1] text-primary font-bold">
                Cuidado experto para tus <span className="text-primary-container">mejores amigos</span>
              </h1>
              <p className="font-body-lg text-body-lg text-body-muted max-w-lg leading-relaxed">
                Brindamos atención médica veterinaria de excelencia con un enfoque empático y tecnología de vanguardia. Porque su bienestar es nuestra prioridad absoluta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-primary text-on-primary hover:bg-primary-active px-8 py-4 rounded-full font-button text-button transition-all duration-200 shadow-md hover:scale-95 active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  Reserva tu Cita
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </button>
                <button 
                  onClick={() => navigate('/servicios')}
                  className="border-2 border-secondary text-secondary hover:bg-secondary/5 px-8 py-4 rounded-full font-button text-button transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  Nuestros Servicios
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10 h-[350px] lg:h-[450px] w-full rounded-2xl overflow-hidden shadow-md border border-hairline/60"
            >
              <img 
                className="w-full h-full object-cover object-center" 
                alt="Veterinaria premium atendiendo a un perro"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcEJ_kBvOX4-7QMLXjmSruRRgOS6XBpwpab0qg6BFjDAnvbNLcCncDQePDl9bDkdsPTboF0Lc0ymdkI-mHYPPTRMvhTNJ-dVakut_aCVnGEa7E5VV1subBPciA9dwDHyhJ6wmj4gJvO68FJ3CxmqJCktYyhwVUGUUQ-oVS3jyKJc0q3IrQWh2p-Y_Va0v2Rhi1ff5k2vVJO8AAqtDwAwOb8oaWpqY1PGb4SvKkYM2a0aneTugvRSooCQ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 pb-16 max-w-[1200px] mx-auto">
        <div className="bg-white rounded-2xl ambient-shadow border border-hairline/60 p-8 flex flex-wrap justify-center md:justify-around items-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined text-3xl icon-fill">military_tech</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-primary">+10 Años</span>
            <span className="text-sm text-body-muted">de experiencia</span>
          </div>
          
          <div className="hidden md:block w-px h-16 bg-hairline/80"></div>
          
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined text-3xl icon-fill">favorite</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-primary">+5000</span>
            <span className="text-sm text-body-muted">Mascotas atendidas</span>
          </div>
          
          <div className="hidden md:block w-px h-16 bg-hairline/80"></div>
          
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined text-3xl icon-fill">emergency</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-primary">24/7</span>
            <span className="text-sm text-body-muted">Atención de urgencias</span>
          </div>
        </div>
      </section>

      {/* Services Overview (Bento Grid Style) */}
      <section className="py-20 bg-canvas">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display-lg text-[32px] md:text-[40px] text-primary font-bold mb-4">Servicios Destacados</h2>
            <p className="font-body-md text-body-md text-body-muted max-w-2xl mx-auto">
              Cuidado integral diseñado para cubrir todas las necesidades de salud y bienestar de tu mascota en un entorno de ultra-premium.
            </p>
          </div>
          
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-body-sm text-body-muted animate-pulse">Cargando especialidades médicas...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="bg-surface-soft/40 rounded-3xl border border-hairline/60 p-12 text-center max-w-xl mx-auto my-6 shadow-sm">
              <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">medical_services</span>
              </div>
              <h3 className="font-title-lg text-[20px] text-ink font-bold mb-2">No hay servicios disponibles en este momento</h3>
              <p className="font-body-sm text-body-muted leading-relaxed">
                Nuestro catálogo está siendo actualizado. Por favor regrese más tarde.
              </p>
            </div>
          ) : (
            <motion.div 
              key={`landing-bento-${services.length}`}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {services.slice(0, 4).map((svc) => {
                const icon = getServiceIcon(svc.nombre);
                const img = getServiceImage(svc.nombre);

                return (
                  <motion.div 
                    key={svc.id}
                    variants={itemVariants}
                    className="bg-white rounded-[16px] ambient-shadow border border-hairline/60 overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        alt={svc.nombre} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        src={img}
                      />
                      <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-300"></div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined icon-fill text-[20px]">{icon}</span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="font-title-lg text-[20px] text-primary font-bold mb-2 border-b border-surface-soft pb-3">{svc.nombre}</h3>
                      <p className="font-body-sm text-body-sm text-body-muted mb-6 flex-grow">{svc.descripcion || 'Sin descripción disponible.'}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-primary font-bold text-sm">S/ {typeof svc.precio === 'number' ? svc.precio.toFixed(2) : Number(svc.precio || 0).toFixed(2)}</span>
                        <button 
                          onClick={() => navigate('/servicios')}
                          className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary-active transition-colors cursor-pointer"
                        >
                          Saber más <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-surface-soft/30 overflow-hidden relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display-lg text-[32px] text-primary font-bold mb-2">Lo que dicen nuestras familias</h2>
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap gap-6 justify-center">
            {/* Testimonial 1 */}
            <div className="w-full md:w-1/2 bg-white rounded-3xl p-8 border border-hairline/60 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-primary mb-4">
                  <span className="material-symbols-outlined text-[32px] font-bold">format_quote</span>
                </div>
                <p className="font-body-lg text-body-lg text-body-muted italic mb-6 leading-relaxed">
                  "El trato que recibió Max durante su cirugía fue excepcional. El equipo médico nos mantuvo informados en todo momento y nos dio mucha tranquilidad."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold">L</div>
                <div>
                  <p className="font-label-md text-ink font-bold">Laura M.</p>
                  <p className="font-caption text-caption text-body-muted">Mamá de Max (Golden Retriever)</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="w-full md:w-1/2 bg-white rounded-3xl p-8 border border-hairline/60 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-primary mb-4">
                  <span className="material-symbols-outlined text-[32px] font-bold">format_quote</span>
                </div>
                <p className="font-body-lg text-body-lg text-body-muted italic mb-6 leading-relaxed">
                  "Llevo a mis dos gatos a VetCarePro desde hace años para sus chequeos. Las instalaciones son hermosas y siempre los tratan con mucho amor y cuidado."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">C</div>
                <div>
                  <p className="font-label-md text-ink font-bold">Carlos R.</p>
                  <p className="font-caption text-caption text-body-muted">Dueño de Luna y Sol</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-16 max-w-[1200px] mx-auto w-full">
        <div className="bg-primary rounded-[24px] overflow-hidden relative ambient-shadow border border-primary-container/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10 px-8 py-16 md:py-24 text-center flex flex-col items-center gap-6">
            <span className="material-symbols-outlined text-white text-5xl mb-2 icon-fill">health_and_safety</span>
            <h2 className="font-display-xl text-[36px] md:text-[44px] text-white leading-tight font-bold max-w-2xl">
              ¿Listo para brindarle el mejor cuidado?
            </h2>
            <p className="font-body-lg text-body-lg text-white/80 max-w-xl leading-relaxed">
              Agenda una consulta hoy mismo y descubre por qué miles de familias confían la salud de sus mascotas a nuestros especialistas.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary-container text-on-primary font-bold px-10 py-4 rounded-full hover:bg-white hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
            >
              Solicitar Cita Ahora
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
