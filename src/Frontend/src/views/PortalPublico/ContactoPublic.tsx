import { motion } from 'framer-motion';
import { useState } from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

export default function ContactoPublic() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    petName: '',
    subject: 'Información general',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        petName: '',
        subject: 'Información general',
        message: '',
      });
    }, 3000);
  };

  const faqs = [
    {
      q: '¿Necesito cita previa para urgencias?',
      a: 'No. Para urgencias puedes acudir directamente a la clínica en cualquier momento (24h). Sin embargo, te recomendamos llamar en el camino al +34 900 11 22 33 para que el equipo esté preparado para recibir a tu mascota.',
    },
    {
      q: '¿Atienden animales exóticos?',
      a: 'Sí, contamos con un especialista en pequeños mamíferos, aves y reptiles. Por favor, especifica el tipo de animal al solicitar la cita para derivarte al profesional adecuado.',
    },
    {
      q: '¿Cuánto tardan en responder los mensajes?',
      a: 'Respondemos a todas las consultas a través del formulario en un plazo máximo de 24 horas hábiles. Si tu consulta es urgente, por favor llámanos por teléfono.',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-body-md antialiased overflow-x-hidden">
      <PublicHeader />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-6 py-16 flex flex-col gap-16">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display-xl text-[36px] md:text-[48px] leading-tight text-primary font-bold"
          >
            Estamos aquí para ti y tu mascota
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-body-lg text-body-lg text-body-muted max-w-2xl mx-auto leading-relaxed"
          >
            Contáctanos para resolver cualquier duda, programar una cita o en caso de emergencia. Nuestro equipo está listo para ayudar.
          </motion.p>
        </section>

        {/* Bento Grid Contact Info & Form */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Contact Info Cards */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Urgencias 24h */}
            <div className="bg-canvas p-8 rounded-3xl border border-error/15 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300">
              <div className="bg-error-container text-error p-3 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-[24px] font-bold">emergency</span>
              </div>
              <div>
                <h3 className="font-title-lg text-[20px] text-ink font-bold mb-2">Urgencias 24h</h3>
                <p className="text-body-muted font-body-sm text-body-sm mb-3">
                  Atención veterinaria inmediata para casos críticos.
                </p>
                <a className="text-error font-bold text-title-sm hover:underline" href="tel:+34900112233">
                  +34 900 11 22 33
                </a>
              </div>
            </div>

            {/* Direct Info */}
            <div className="bg-canvas p-8 rounded-3xl border border-hairline shadow-sm flex-grow flex flex-col gap-8 justify-center">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] font-bold">location_on</span>
                </div>
                <div>
                  <h4 className="font-label-md text-ink font-bold">Dirección</h4>
                  <p className="text-body-muted font-body-sm text-body-sm leading-relaxed mt-1">
                    Av. de los Animales Felices 123,<br />28001 Madrid, España
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] font-bold">schedule</span>
                </div>
                <div>
                  <h4 className="font-label-md text-ink font-bold">Horario de Consultas</h4>
                  <p className="text-body-muted font-body-sm text-body-sm leading-relaxed mt-1">
                    Lunes a Viernes: 09:00 - 20:00<br />Sábados: 10:00 - 14:00
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] font-bold">mail</span>
                </div>
                <div>
                  <h4 className="font-label-md text-ink font-bold">Email General</h4>
                  <a className="text-primary font-bold font-body-sm text-body-sm hover:underline mt-1 block" href="mailto:hola@vetcarepro.es">
                    hola@vetcarepro.es
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-canvas p-8 rounded-3xl border border-hairline shadow-sm flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="font-title-lg text-[24px] text-primary font-bold mb-2">Envíanos un Mensaje</h2>
              <p className="text-body-muted font-body-sm text-body-sm">
                Completa el formulario y te responderemos lo antes posible.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted && (
                <div className="bg-success/10 text-success p-4 rounded-2xl border border-success/20 text-body-sm font-bold shadow-sm">
                  ¡Mensaje enviado con éxito! Te responderemos pronto.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-ink font-bold text-[12px]" htmlFor="name">Nombre y Apellidos</label>
                  <input 
                    className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-ink text-body-md placeholder-body-muted/50" 
                    id="name" 
                    placeholder="Ej. Ana García" 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-ink font-bold text-[12px]" htmlFor="email">Correo Electrónico</label>
                  <input 
                    className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-ink text-body-md placeholder-body-muted/50" 
                    id="email" 
                    placeholder="ana@ejemplo.com" 
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-ink font-bold text-[12px]" htmlFor="petName">Nombre de la Mascota (Opcional)</label>
                  <input 
                    className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-ink text-body-md placeholder-body-muted/50" 
                    id="petName" 
                    placeholder="Ej. Luna" 
                    type="text"
                    value={formData.petName}
                    onChange={(e) => setFormData({...formData, petName: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-ink font-bold text-[12px]" htmlFor="subject">Asunto</label>
                  <select 
                    className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-ink text-body-md cursor-pointer font-bold" 
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  >
                    <option>Información general</option>
                    <option>Programar cita no urgente</option>
                    <option>Dudas sobre presupuestos</option>
                    <option>Otros</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-ink font-bold text-[12px]" htmlFor="message">Mensaje</label>
                <textarea 
                  className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-ink text-body-md resize-none" 
                  id="message" 
                  placeholder="¿En qué podemos ayudarte?" 
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button 
                className="w-full bg-primary hover:bg-primary-active text-on-primary font-bold h-12 rounded-full font-button text-button shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95" 
                type="submit"
              >
                <span>Enviar Mensaje</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>
        </section>

        {/* Location Map & FAQ Bento */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Map */}
          <div className="lg:col-span-6 bg-canvas rounded-3xl border border-hairline shadow-sm overflow-hidden flex flex-col h-96 relative group">
            <div className="absolute inset-0 z-0 bg-surface-soft">
              <img 
                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-103" 
                alt="Mapa de Madrid indicando ubicación" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSvjk72uwDNFrDgJlqFu_HKx8lahDjijROdl5zL1K5-igbTh00YwUIyags6s2g0GBf03LZq1Ncilhnffooh5pgbcURdT4biyU4K9n2EvR-dC4ZzTT88sbWrmuccAJFiPW6-jpK8VxE0MVSBU99riOvJYhpRMCYSM34zFlS-qJPPaU26A31D0C7ALfwVncK7iDGxC7OP4Ls0fz0bTIs0UiXhfx9FL1h0GMHnpxGwK6a_rDlnZyfJBZHrw"
              />
            </div>
            <div className="relative z-10 p-6 bg-gradient-to-b from-canvas/90 via-canvas/60 to-transparent flex-shrink-0">
              <h3 className="font-title-lg text-[22px] text-primary font-bold">Nuestra Ubicación</h3>
              <p className="text-body-muted font-body-sm text-body-sm mt-1">Fácil acceso y parking disponible para clientes.</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="lg:col-span-6 bg-canvas p-8 rounded-3xl border border-hairline shadow-sm flex flex-col justify-between">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px] font-bold">forum</span>
              <h2 className="font-title-lg text-[22px] text-primary font-bold">Preguntas Frecuentes</h2>
            </div>
            
            <div className="space-y-4 flex-grow flex flex-col justify-center">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group bg-surface-soft/30 rounded-2xl border border-hairline overflow-hidden transition-all duration-300">
                  <summary className="flex justify-between items-center font-label-md text-body-md text-ink p-4 cursor-pointer select-none font-bold hover:bg-surface-soft/50 transition-colors">
                    {faq.q}
                    <span className="material-symbols-outlined text-[20px] transition-transform group-open:rotate-180 text-primary">expand_more</span>
                  </summary>
                  <div className="px-4 pb-4 text-body-sm text-body-muted leading-relaxed font-medium">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
