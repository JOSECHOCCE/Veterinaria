import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

export default function LandingPage() {
  const navigate = useNavigate();

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
      <section className="relative w-full py-16 md:py-24 overflow-hidden bg-surface-soft/40">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10 flex flex-col gap-6"
          >
            <h1 className="font-display-xl text-[44px] md:text-[56px] leading-[1.1] text-ink font-bold">
              Cuidado experto para tus <span className="text-primary">mejores amigos</span>
            </h1>
            <p className="font-body-lg text-body-lg text-body-muted max-w-lg leading-relaxed">
              En VetCarePro nos apasiona la salud y el bienestar de tus mascotas. Brindamos atención médica compasiva y precisa en un entorno diseñado para su tranquilidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary text-on-primary hover:bg-primary-active px-8 py-4 rounded-full font-button text-button transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                Reserva tu Cita
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </button>
              <button 
                onClick={() => navigate('/servicios')}
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-on-primary px-8 py-4 rounded-full font-button text-button transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                Conoce nuestros servicios
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 h-[350px] md:h-[480px] w-full rounded-3xl overflow-hidden shadow-xl border border-hairline"
          >
            <img 
              className="w-full h-full object-cover object-center" 
              alt="Veterinario profesional atendiendo a un perro"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWVxyXWDpUAYP8SkLNagaLrNO35ZSADQzHIhBd8Ku61MEhURo8UWabHba3HhmcEgBXZC4QocrunPElam--a_cMseOaVABWM7P6WQ0JWYgpfOrANM28ZTw9dAI9z-P8rmignWp8ETiKia_4Q4-GJrjfhGIZnPkvShlUNLA8k_nEYOVo7OHV6-8Vm3tkuBD94BvUk0O1Gl44k-KgG-uOfBuOnutHmidM2idtRlddXvnaw1ctyEudnZSd_A"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/10 to-transparent"></div>
          </motion.div>
        </div>
        {/* Decorative background orb */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-0"></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-canvas border-y border-hairline/80">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap justify-center md:justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px] font-bold">verified</span>
            </div>
            <div>
              <h3 className="font-title-lg text-title-lg text-ink font-bold">+10 Años</h3>
              <p className="font-body-sm text-body-sm text-body-muted">de experiencia clínica</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[28px] font-bold">pets</span>
            </div>
            <div>
              <h3 className="font-title-lg text-title-lg text-ink font-bold">+5000</h3>
              <p className="font-body-sm text-body-sm text-body-muted">Mascotas felices atendidas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-teal/10 flex items-center justify-center text-accent-teal">
              <span className="material-symbols-outlined text-[28px] font-bold">emergency</span>
            </div>
            <div>
              <h3 className="font-title-lg text-title-lg text-ink font-bold">24/7</h3>
              <p className="font-body-sm text-body-sm text-body-muted">Atención de urgencias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview (Bento Grid Style) */}
      <section className="py-20 bg-canvas">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display-lg text-[32px] md:text-[40px] text-ink font-bold mb-4">Servicios Integrales</h2>
            <p className="font-body-lg text-body-lg text-body-muted max-w-2xl mx-auto">
              Tecnología médica avanzada combinada con un trato cálido y humano para cubrir todas las necesidades de salud de tu mascota.
            </p>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Main Bento Card */}
            <motion.div 
              variants={itemVariants}
              className="md:col-span-2 bg-surface-soft/60 rounded-3xl p-8 border border-hairline/80 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group cursor-pointer"
              onClick={() => navigate('/servicios')}
            >
              <div className="z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">stethoscope</span>
                </div>
                <h3 className="font-title-lg text-[24px] text-ink font-bold mb-3">Medicina General</h3>
                <p className="font-body-md text-body-md text-body-muted max-w-md leading-relaxed">
                  Chequeos de rutina, diagnósticos precisos y planes de tratamiento personalizados para mantener a tu mascota en su mejor estado de salud a lo largo de su vida.
                </p>
              </div>
              <div className="mt-8 z-10">
                <span className="text-primary font-bold inline-flex items-center gap-2 hover:text-primary-active transition-colors">
                  Saber más <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
              {/* Decorative BG element */}
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-tl-full translate-x-10 translate-y-10 group-hover:scale-105 transition-transform duration-500"></div>
            </motion.div>

            {/* Secondary Card 1 */}
            <motion.div 
              variants={itemVariants}
              className="bg-surface-soft/40 rounded-3xl p-6 border border-hairline/60 flex flex-col justify-between hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/servicios')}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">healing</span>
                </div>
                <h3 className="font-title-lg text-[20px] text-ink font-bold mb-3">Cirugía</h3>
                <p className="font-body-sm text-body-sm text-body-muted leading-relaxed">
                  Quirófanos equipados con tecnología de punta para procedimientos seguros y efectivos.
                </p>
              </div>
              <div className="mt-6">
                <span className="text-secondary font-bold inline-flex items-center gap-2 hover:text-secondary/85 transition-colors text-[14px]">
                  Saber más <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </motion.div>

            {/* Secondary Card 2 */}
            <motion.div 
              variants={itemVariants}
              className="bg-surface-soft/40 rounded-3xl p-6 border border-hairline/60 flex flex-col justify-between hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/servicios')}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent-teal/10 text-accent-teal flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">vaccines</span>
                </div>
                <h3 className="font-title-lg text-[20px] text-ink font-bold mb-3">Vacunación</h3>
                <p className="font-body-sm text-body-sm text-body-muted leading-relaxed">
                  Esquemas preventivos completos para proteger a tu mascota contra las enfermedades más comunes.
                </p>
              </div>
              <div className="mt-6">
                <span className="text-accent-teal font-bold inline-flex items-center gap-2 hover:text-accent-teal/85 transition-colors text-[14px]">
                  Saber más <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </motion.div>

            {/* Secondary Bento Landscape Card */}
            <motion.div 
              variants={itemVariants}
              className="md:col-span-2 bg-surface-soft/40 rounded-3xl p-6 border border-hairline/60 flex flex-col sm:flex-row items-center gap-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/servicios')}
            >
              <div className="flex-shrink-0 w-full sm:w-1/3 h-40 rounded-2xl overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Perro poodle en peluquería"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuACA_f4gLaCH_JlDrVX8knDfyPo64MKSRH-Y4RpkJw7YyJaiD4wNdmSRsIlIAe-u3gDLWpTuIYSPtjoUpQVZZEAvK8v5r2_5-ZkAIfxfbFfBL0OPmPQiaoO8JCkjBNsxWPX8Ynu8KCz6j7cpZ8QsTK6ywR-YiEgkzHtjNfJry_Q_jUL_i13kUqajmFJ3LdoG4jYYLrZD88SpBkbuuZeSHoyB-0f0jlKvrFmhE-GCV--w_aAoPbdOdfU6Q"
                />
              </div>
              <div className="flex flex-col justify-center flex-1">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[20px]">content_cut</span>
                </div>
                <h3 className="font-title-lg text-[20px] text-ink font-bold mb-2">Peluquería y Spa</h3>
                <p className="font-body-sm text-body-sm text-body-muted mb-4 leading-relaxed">
                  Cuidados estéticos e higiene profesional para que tu mascota luzca y se sienta de maravilla.
                </p>
                <span className="text-secondary font-bold inline-flex items-center gap-2 hover:text-secondary-active transition-colors text-[14px]">
                  Ver galería <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-surface-soft/30 overflow-hidden relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display-lg text-[32px] text-ink font-bold mb-2">Lo que dicen nuestras familias</h2>
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap gap-6 justify-center">
            {/* Testimonial 1 */}
            <div className="w-full md:w-1/2 bg-canvas rounded-3xl p-8 border border-hairline shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-primary mb-4">
                  <span className="material-symbols-outlined text-[32px] font-bold">format_quote</span>
                </div>
                <p className="font-body-lg text-body-lg text-body-muted italic mb-6 leading-relaxed">
                  "El trato que recibió Max durante su cirugía fue excepcional. El equipo médico nos mantuvo informados en todo momento y nos dio mucha tranquilidad."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold">L</div>
                <div>
                  <p className="font-label-md text-ink font-bold">Laura M.</p>
                  <p className="font-caption text-caption text-body-muted">Mamá de Max (Golden Retriever)</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="w-full md:w-1/2 bg-canvas rounded-3xl p-8 border border-hairline shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-primary mb-4">
                  <span className="material-symbols-outlined text-[32px] font-bold">format_quote</span>
                </div>
                <p className="font-body-lg text-body-lg text-body-muted italic mb-6 leading-relaxed">
                  "Levó a mis dos gatos a VetCarePro desde hace años para sus chequeos. Las instalaciones son hermosas y siempre los tratan con mucho amor y cuidado."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">C</div>
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
      <section className="py-20 bg-primary text-on-primary relative overflow-hidden text-center">
        <div className="max-w-3xl mx-auto px-6 relative z-10 flex flex-col gap-6 items-center">
          <h2 className="font-display-xl text-[36px] md:text-[48px] text-on-primary leading-tight font-bold">
            ¿Listo para darle la mejor atención a tu mascota?
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary/95 max-w-xl leading-relaxed">
            Nuestro equipo está listo para recibirte. Agenda una consulta hoy mismo y únete a la familia VetCarePro.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-canvas text-primary hover:bg-surface-bright px-8 py-4 rounded-full font-button text-button transition-all duration-300 shadow-md font-bold hover:shadow-lg active:scale-95 text-lg mt-4 cursor-pointer"
          >
            Solicitar Cita Ahora
          </button>
        </div>
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-active to-primary opacity-50 mix-blend-multiply"></div>
      </section>

      <PublicFooter />
    </div>
  );
}
