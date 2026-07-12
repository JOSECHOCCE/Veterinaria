import { motion } from 'framer-motion';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

export default function EquipoPublic() {
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

  const team = [
    {
      name: 'Dra. Elena Valdés',
      role: 'Cirujana Principal',
      icon: 'medical_services',
      desc: '"Cada intervención es una promesa de darle a tu mejor amigo una vida más larga, feliz y sin dolor."',
      detailIcon: 'school',
      detail: 'Especialista en Traumatología',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDO3vaPV28qM9tIziM6cELz9FPawbkY9GBrZtqphGd9g3v8imudRD1Kq3BpjnKLe0rgy2G1zCL4WluKLuTHHidEIXMy_oi25v4n8N1R-J7hgSQ1cSYHNa3_oC7J1P4OftHIy6Ur-h_vCjIdlD2EUXfc10qpvcGwk36DvogtK_LmRx7GlAmaJQbQ7tJyKG61zSF5dFONM6HWygPZDuBJPqwAbHZ32fGSMpJpuBv9otSZGcOrEmnKjcELiw',
      size: 'md:col-span-8 flex-col md:flex-row',
    },
    {
      name: 'Dr. Martín Rojas',
      role: 'Dermatólogo',
      icon: 'healing',
      desc: '"La piel refleja la salud interior; mi misión es devolverles el confort."',
      detailIcon: 'spa',
      detail: 'Dermatología Avanzada',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqpaFbKSibfXNEig7VHJ54k9N9-Lntn6Qv8Nm8YnASTqET4xYm3fE-R-Own0s8ckDUzmQ_y3TtwKq2Umpn6l_IHFg_rj3bzW5QwPFphILAECY_xKSc085hR-_8HMm5k-u7EYQM2cVupbJtiA4oHJxDOyp7sTP_KExVLOeYUtweIdoQSxEMGIgCddxUUt4EcKGZL_2s5Zh6WgCXclPhomcv5FgPU8OviRA8iEIK9ivJbjydsZHSzbbz5Q',
      size: 'md:col-span-4 flex-col',
    },
    {
      name: 'Dra. Sofía Castro',
      role: 'Medicina Interna',
      icon: 'biotech',
      desc: '"Investigar hasta encontrar la causa exacta, para brindar el tratamiento más efectivo."',
      detailIcon: 'clinical_notes',
      detail: 'Diagnóstico Clínico',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUlGxQowyaeYPLKnJ7UQpDHJORrA1z5yjli7-SPcLw8OhDQsAneAp6Q7Ovv6gJf-JQayGPFVCkD5InLqE-Vk4cyvXd_-y_pM_xsmRQaCiZzY5emdFBW9DaFKVzAY496uHgGmSrtx8nNC8vy1l86xck6aCaYkID2c5HCTMawI7RuhrYM1rJGx5yrkWbSJwAv0I6cqjREUAGB89336NmlBUHO_dZG1SJZtxkJwrcPpJDPTdQESuAa-sUsQ',
      size: 'md:col-span-4 flex-col',
    },
    {
      name: 'Dr. Carlos Mendoza',
      role: 'Cuidados Intensivos',
      icon: 'favorite',
      desc: '"En los momentos más críticos, ofrecemos dedicación absoluta y monitorización avanzada para asegurar su recuperación."',
      detailIcon: 'monitor_heart',
      detail: 'UCI Veterinaria 24/7',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGlZdgHpXK9UbKOSHlZCmPYjcU9BQ7ciOFU3TsncsNRubT5mQeP8gJ45kRufbV2PS3uIXUrS6UYg6m6TBwrhAtZgzNgzIoB55_iyFVsYDKxSAq--y3sWR2_QGL4rfIKwkY3VfLJEbvNsi3gF9zo9OmPBmqELdk9R7cJNZbmIcJCyg90SE8kqn8ZNNfkY_3C15VAbX3j2N7jWqUgCHcb8Mf7suIuIgvt67JFZhe085qc7sQrzaMKISQNw',
      size: 'md:col-span-8 flex-col md:flex-row-reverse',
    },
  ];

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
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8"
        >
          {team.map((member) => (
            <motion.article 
              key={member.name}
              variants={cardVariants}
              className={`bg-canvas rounded-3xl border border-hairline/70 shadow-sm overflow-hidden flex hover:shadow-lg transition-all duration-300 group ${member.size}`}
            >
              {/* Image box */}
              <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden relative min-h-[220px]">
                <img 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  src={member.img}
                  alt={member.name}
                />
              </div>

              {/* Text box */}
              <div className="p-8 flex flex-col justify-center flex-1">
                <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full font-caption text-caption w-fit mb-4 font-bold">
                  <span className="material-symbols-outlined text-[16px] mr-1.5 font-bold">{member.icon}</span>
                  {member.role}
                </div>
                <h2 className="font-title-lg text-[22px] text-ink font-bold mb-3">{member.name}</h2>
                <p className="font-body-md text-body-md text-body-muted italic mb-6 leading-relaxed">
                  {member.desc}
                </p>
                {member.detail && (
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-hairline/60 text-body-muted">
                    <span className="material-symbols-outlined text-[18px] text-secondary font-bold">{member.detailIcon}</span>
                    <span className="font-caption text-caption text-ink font-bold">{member.detail}</span>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </motion.section>

        {/* Recruitment CTA */}
        <section className="bg-surface-soft/40 rounded-3xl p-8 md:p-12 mt-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-hairline/60 shadow-sm">
          <div className="md:w-2/3">
            <h3 className="font-title-lg text-[24px] text-ink font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px] font-bold">work</span>
              Únete a Nosotros
            </h3>
            <p className="font-body-md text-body-md text-body-muted leading-relaxed">
              ¿Compartes nuestra pasión por el cuidado animal y la excelencia médica? Estamos siempre en la búsqueda de talento excepcional para sumar a nuestra familia. Ofrecemos un entorno de trabajo colaborativo, tecnología de punta y oportunidades de crecimiento continuo.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-end w-full">
            <button className="w-full md:w-auto bg-primary hover:bg-primary-active text-on-primary font-bold py-3 px-8 rounded-full font-button text-button transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap cursor-pointer">
              Ver Vacantes
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
