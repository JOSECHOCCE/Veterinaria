import { motion } from 'framer-motion';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

export default function ServiciosPublic() {
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

  const services = [
    {
      title: 'Diagnóstico Avanzado',
      icon: 'biotech',
      desc: 'Equipamiento de última generación para ecografías, radiografías digitales y análisis de laboratorio. Resultados rápidos y precisos para un tratamiento efectivo y oportuno de su mascota.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC52jqfuKHdWsADwP0VAyK84717tYG8Kk5XYyIYYcNWnQvXxsXq9UzULloi479an1JIRdg4b-Qh8EVGqsWGzosu0_dEv81HKd0YEzPrGZfhKVBxwghF03sHiyP0I8MJQ3aj0gUBji-wqpG6i5RckDR9iMjgazlTX5zyTXaXiWPbHij981na33H-28mRAUAW_9j6aHcUcGs5MQUUipdkmSuaPOADXrmtwDYWEFKgWVQKr2mjFo_9I1Wbdg',
    },
    {
      title: 'Especialidades Quirúrgicas',
      icon: 'medical_services',
      desc: 'Intervenciones quirúrgicas complejas realizadas por especialistas experimentados en quirófanos de alta seguridad. Desde cirugías preventivas hasta traumatología avanzada con monitoreo continuo.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCInqdcUqsJS4HUGXj11SuAmWQCnMkXqW-2jqI25x_EP7vATMXo2NVDwjT7JM8-pPWKTLVe_hIEKB9CcAyghsO53n_fGJDwSn1luRUAfd2wMYXN3cXYU_ZCxlsLOx8CQ_6B3HfnNNyJ_OFrAJuAVbc7yv_O6fg6BgOdwV4FynTy4AGZmdPSTMwDk9kcxO6FObj3qC9VMR49pnlTd5UD_aFjNpmPoRxaA19iQasnB6Z5sDae5CO9eXqKrA',
    },
    {
      title: 'Odontología Veterinaria',
      icon: 'dentistry',
      desc: 'Cuidado dental integral para prevenir enfermedades periodontales. Ofrecemos limpiezas profundas por ultrasonido, extracciones seguras y tratamientos orales especializados bajo anestesia controlada.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8zTkeMqnPB5FjkqeD1kslMKiI4IiUaqrtTU8-Zjh_pdRIA6BfsfZ1o8x3iLytixa25FBNSjUJi09P5poH77KffFtWqeW8ezZb1lK15O4188F9vnZO_Oy9Zn2Bh8ImmTiogVZygs3s5ZA1QfuYuCm14VIihrZSlFNhiJdADfhYfsZi1PftLAbCtGQF4JKCNZe232osuUvjKq4X5lW1VnFBUQw28T5mMXohYABT_-BJcFhsMsdZicu8Sw',
    },
    {
      title: 'Bienestar Animal',
      icon: 'favorite',
      desc: 'Programas de nutrición personalizada, fisioterapia y medicina preventiva. Nos enfocamos en mejorar la calidad de vida de su mascota a través de un enfoque holístico y preventivo a largo plazo.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXBFJq1X1iq8lCgV0-NDi8mNHVJ3s-WqS165aNq_SCdPzMMqombQ7e1-gVJyszCiseyu7nvOX-YRwtrgI5udL-k-stlOocMkAFzipjLnU6Hxe3BmecGxaC6hfYCdzY2yujGnu9pRZLx2-AFGB9wDiVYnfGPcWONGl0b51wMAdO1P2efeisW0jwjc8hodbr-mBeyyKQNV3jab--_MJnx4dcnUpLUIVqrI1fvGZeIsvv6VAXOQyysMrb9g',
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
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {services.map((svc) => (
            <motion.div 
              key={svc.title}
              variants={cardVariants}
              className="bg-canvas rounded-3xl border border-hairline/70 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group"
            >
              <div className="h-60 w-full overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={svc.img}
                  alt={svc.title}
                />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                    <span className="material-symbols-outlined text-[24px] font-bold">{svc.icon}</span>
                  </div>
                  <h2 className="font-title-lg text-[22px] text-ink font-bold">{svc.title}</h2>
                </div>
                <p className="font-body-sm text-body-sm text-body-muted leading-relaxed flex-grow mb-6">
                  {svc.desc}
                </p>
                <button className="text-primary hover:text-primary-active font-bold text-body-md inline-flex items-center gap-2 group-hover:translate-x-1 transition-transform cursor-pointer justify-start">
                  Saber más <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.section>

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
