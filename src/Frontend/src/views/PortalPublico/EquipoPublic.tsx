import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import { VeterinariosService, type VeterinarioConCitas } from '../../services/veterinarios.service';

const getVetImage = (nombre: string) => {
  const nameLower = nombre.toLowerCase();
  if (nameLower.includes('carlos') || nameLower.includes('mendoza')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGlZdgHpXK9UbKOSHlZCmPYjcU9BQ7ciOFU3TsncsNRubT5mQeP8gJ45kRufbV2PS3uIXUrS6UYg6m6TBwrhAtZgzNgzIoB55_iyFVsYDKxSAq--y3sWR2_QGL4rfIKwkY3VfLJEbvNsi3gF9zo9OmPBmqELdk9R7cJNZbmIcJCyg90SE8kqn8ZNNfkY_3C15VAbX3j2N7jWqUgCHcb8Mf7suIuIgvt67JFZhe085qc7sQrzaMKISQNw';
  }
  if (nameLower.includes('maría') || nameLower.includes('fernández') || nameLower.includes('maria')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDO3vaPV28qM9tIziM6cELz9FPawbkY9GBrZtqphGd9g3v8imudRD1Kq3BpjnKLe0rgy2G1zCL4WluKLuTHHidEIXMy_oi25v4n8N1R-J7hgSQ1cSYHNa3_oC7J1P4OftHIy6Ur-h_vCjIdlD2EUXfc10qpvcGwk36DvogtK_LmRx7GlAmaJQbQ7tJyKG61zSF5dFONM6HWygPZDuBJPqwAbHZ32fGSMpJpuBv9otSZGcOrEmnKjcELiw';
  }
  return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUlGxQowyaeYPLKnJ7UQpDHJORrA1z5yjli7-SPcLw8OhDQsAneAp6Q7Ovv6gJf-JQayGPFVCkD5InLqE-Vk4cyvXd_-y_pM_xsmRQaCiZzY5emdFBW9DaFKVzAY496uHgGmSrtx8nNC8vy1l86xck6aCaYkID2c5HCTMawI7RuhrYM1rJGx5yrkWbSJwAv0I6cqjREUAGB89336NmlBUHO_dZG1SJZtxkJwrcPpJDPTdQESuAa-sUsQ';
};

const getVetIcon = (especialidad: string) => {
  const espLower = especialidad.toLowerCase();
  if (espLower.includes('cirugía') || espLower.includes('quirúrgica')) return 'medical_services';
  if (espLower.includes('derm') || espLower.includes('piel')) return 'healing';
  if (espLower.includes('general')) return 'stethoscope';
  return 'favorite';
};

const getVetQuote = (nombre: string) => {
  const nameLower = nombre.toLowerCase();
  if (nameLower.includes('carlos')) {
    return '"En los momentos más críticos, ofrecemos dedicación absoluta y monitorización avanzada para asegurar su recuperación."';
  }
  if (nameLower.includes('maría') || nameLower.includes('maria')) {
    return '"Cada intervención es una promesa de darle a tu mejor amigo una vida más larga, feliz y sin dolor."';
  }
  return '"Comprometidos con brindar la mejor calidad de atención para la salud y tranquilidad de tu mascota."';
};

export default function EquipoPublic() {
  const [vets, setVets] = useState<VeterinarioConCitas[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const response = await VeterinariosService.getVeterinarios();
        if (response.success && response.data && Array.isArray(response.data.veterinarios)) {
          const activeVets = response.data.veterinarios.filter((v: VeterinarioConCitas) => v.veterinario.activo);
          setVets(activeVets);
        }
      } catch (err) {
        console.error('Error fetching veterinarians:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVets();
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
            Conoce a Nuestros Especialistas
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-body-lg text-body-lg text-body-muted max-w-2xl mx-auto leading-relaxed"
          >
            En VetCarePro, tu mascota está en las mejores manos. Nuestro equipo de profesionales combina experiencia médica de vanguardia con un amor incondicional por los animales.
          </motion.p>
        </section>

        {/* Bento Grid: The Team */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12">
            <div className="col-span-12 flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-body-sm text-body-muted animate-pulse">Cargando directorio de especialistas...</p>
            </div>
          </div>
        ) : vets.length === 0 ? (
          <div className="bg-surface-soft/40 rounded-3xl border border-hairline/60 p-12 text-center max-w-xl mx-auto my-6 shadow-sm">
            <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">group</span>
            </div>
            <h3 className="font-title-lg text-[20px] text-ink font-bold mb-2">No hay veterinarios registrados en este momento</h3>
            <p className="font-body-sm text-body-muted leading-relaxed">
              Nuestro directorio de especialistas médicos está siendo actualizado. Por favor regrese más tarde.
            </p>
          </div>
        ) : (
          <motion.section 
            key={`team-grid-${vets.length}`}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {vets.map((v) => {
              const img = getVetImage(v.veterinario.nombre);
              const icon = getVetIcon(v.veterinario.especialidad);
              const quote = getVetQuote(v.veterinario.nombre);

              return (
                <motion.article 
                  key={v.veterinario.id}
                  variants={cardVariants}
                  className="bg-white rounded-3xl ambient-shadow overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-lg border border-hairline/60 h-full"
                >
                  {/* Image box */}
                  <div className="h-[280px] relative overflow-hidden">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={img}
                      alt={v.veterinario.nombre}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Text box */}
                  <div className="p-8 flex flex-col flex-grow bg-white">
                    <div className="inline-flex items-center bg-[#e6fffa] text-primary px-4 py-2 rounded-full font-bold text-[12px] w-fit mb-4">
                      <span className="material-symbols-outlined text-[18px] mr-2 icon-fill">{icon}</span>
                      {v.veterinario.especialidad}
                    </div>
                    <h2 className="text-2xl font-bold text-ink mb-3 group-hover:text-primary transition-colors duration-300">{v.veterinario.nombre}</h2>
                    <p className="text-base text-body-muted italic leading-relaxed mb-6 flex-grow">
                      {quote}
                    </p>
                    
                    {(v.veterinario.email || v.veterinario.telefono) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-auto pt-4 border-t border-hairline/60 text-body-muted">
                        {v.veterinario.telefono && (
                          <a href={`tel:${v.veterinario.telefono}`} className="flex items-center gap-1.5 font-caption text-caption text-ink font-bold hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-secondary font-bold icon-fill">call</span>
                            {v.veterinario.telefono}
                          </a>
                        )}
                        {v.veterinario.email && (
                          <a href={`mailto:${v.veterinario.email}`} className="flex items-center gap-1.5 font-caption text-caption text-ink font-bold hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-secondary font-bold icon-fill">mail</span>
                            {v.veterinario.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </motion.section>
        )}

        {/* Recruitment CTA */}
        <section className="bg-surface-soft/60 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 border border-hairline/60 shadow-lg">
          <div className="md:w-2/3">
            <h3 className="text-[32px] leading-10 font-bold text-ink mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[32px] icon-fill">work</span>
              Únete a Nosotros
            </h3>
            <p className="text-lg text-body-muted leading-relaxed">
              ¿Compartes nuestra pasión por el cuidado animal y la excelencia médica? Estamos siempre en la búsqueda de talento excepcional para sumar a nuestra familia. Ofrecemos un entorno de trabajo colaborativo, tecnología de punta y oportunidades de crecimiento continuo.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-end w-full">
            <button className="w-full md:w-auto bg-primary hover:bg-primary-active text-on-primary font-bold py-3 px-8 rounded-full font-button text-button transition-all duration-200 shadow-md hover:scale-95 active:scale-95 whitespace-nowrap cursor-pointer">
              Ver Vacantes
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
