import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

export default function ServiciosPublic() {
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
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-body-md antialiased overflow-x-hidden">
      <PublicHeader />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-6 py-16 flex flex-col gap-16">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display-xl text-[36px] md:text-[48px] leading-tight text-primary font-bold"
          >
            Servicios Especializados
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-body-lg text-body-lg text-body-muted max-w-2xl mx-auto"
          >
            Cuidado veterinario de vanguardia diseñado para el bienestar y la salud integral de tu mascota. Ofrecemos soluciones médicas avanzadas con un trato compasivo.
          </motion.p>
        </section>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12">
            <div className="col-span-2 flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-body-sm text-body-muted animate-pulse">Cargando catálogo de servicios médicos...</p>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-surface-soft/40 rounded-3xl border border-hairline/60 p-12 text-center max-w-xl mx-auto my-6 shadow-sm">
            <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">medical_services</span>
            </div>
            <h3 className="font-title-lg text-[20px] text-ink font-bold mb-2">No hay servicios disponibles en este momento</h3>
            <p className="font-body-sm text-body-muted leading-relaxed">
              Nuestro catálogo de especialidades está siendo actualizado. Por favor regrese más tarde o contáctese con recepción para más información.
            </p>
          </div>
        ) : (
          <motion.section 
            key={`services-grid-${services.length}`}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {services.map((svc) => {
              const icon = getServiceIcon(svc.nombre);
              const img = getServiceImage(svc.nombre);

              return (
                <motion.div 
                  key={svc.id}
                  variants={cardVariants}
                  className="bg-canvas rounded-3xl border border-hairline/70 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  <div className="h-60 w-full overflow-hidden relative">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={img}
                      alt={svc.nombre}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2.5 rounded-xl group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                          <span className="material-symbols-outlined text-[24px] font-bold">{icon}</span>
                        </div>
                        <h2 className="font-title-lg text-[22px] text-ink font-bold">{svc.nombre}</h2>
                      </div>
                      <span className="text-primary font-bold text-title-lg bg-primary/5 px-3 py-1 rounded-xl border border-primary/20">
                        S/ {typeof svc.precio === 'number' ? svc.precio.toFixed(2) : Number(svc.precio || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="font-body-sm text-body-sm text-body-muted leading-relaxed flex-grow mb-6">
                      {svc.descripcion || 'Especialidad veterinaria de alta calidad con atención personalizada para el bienestar de su mascota.'}
                    </p>

                    <div className="flex items-center justify-between border-t border-hairline/60 pt-4 mt-auto">
                      <span className="text-body-sm text-body-muted flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
                        {svc.duracionMinutos} min
                      </span>
                      <button className="text-primary hover:text-primary-active font-bold text-body-md inline-flex items-center gap-2 group-hover:translate-x-1 transition-transform cursor-pointer justify-start">
                        Saber más <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.section>
        )}

        {/* Urgencias & Guía Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Urgencias 24h */}
          <div className="lg:col-span-2 bg-error-container/40 text-on-error-container rounded-3xl p-8 md:p-10 border border-error/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -top-16 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[200px]">emergency</span>
            </div>
            <div className="relative z-10 flex-grow">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-error text-[20px] font-bold">notification_important</span>
                <span className="font-caption text-[11px] text-error font-bold uppercase tracking-wider">Servicio Urgente</span>
              </div>
              <h2 className="font-display-lg text-[28px] md:text-[32px] text-ink font-bold mb-4">Urgencias 24h</h2>
              <p className="font-body-md text-body-md text-body-muted max-w-xl leading-relaxed mb-6">
                Atención veterinaria inmediata y crítica en cualquier momento del día o de la noche. Nuestro equipo especializado está siempre preparado para estabilizar y tratar a su mascota en situaciones de emergencia vital.
              </p>
              <a 
                href="tel:+123456789"
                className="inline-flex items-center justify-center bg-error hover:bg-error/95 text-on-primary font-bold px-8 py-3 rounded-full font-button text-button transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">call</span> Llamar a Urgencias
              </a>
            </div>
          </div>

          {/* Guía Descarga */}
          <div className="bg-surface-soft/40 rounded-3xl p-8 border border-hairline/60 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="bg-secondary/10 text-secondary w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[32px] font-bold">download</span>
            </div>
            <h3 className="font-title-lg text-[20px] text-ink font-bold mb-3">Guía de Cuidados</h3>
            <p className="font-body-sm text-body-sm text-body-muted mb-8 leading-relaxed max-w-[220px]">
              Descargue nuestra guía gratuita con consejos esenciales para mantener a su mascota sana y feliz en casa.
            </p>
            <button className="border border-primary hover:bg-primary hover:text-on-primary text-primary font-bold py-3 px-6 rounded-full font-button text-button transition-all w-full flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span> Descargar PDF
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
