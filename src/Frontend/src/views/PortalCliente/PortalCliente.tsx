import React from 'react';
import { motion } from 'framer-motion';

const PortalCliente: React.FC = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <main className="flex-grow w-full max-w-7xl mx-auto px-margin py-lg flex flex-col gap-margin">
        {/* Hero Section */}
        <section className="w-full bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col md:flex-row items-center">
          <div className="p-lg md:w-1/2 flex flex-col gap-md">
            <div className="inline-flex items-center gap-xs px-sm py-xs bg-surface-container-high text-primary rounded-full w-fit">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="font-label-md text-label-md">Portal del Cliente</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">Bienvenido a tu Portal de Salud Veterinaria</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Gestiona las citas, el historial médico y el bienestar general de tus mascotas desde un solo lugar. Rápido, seguro y siempre disponible.
            </p>
            <div className="flex flex-col sm:flex-row gap-sm mt-sm">
              <button className="bg-primary text-on-primary px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                Solicitar Cita
              </button>
              <button className="bg-transparent border border-primary text-primary px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Registrar Mascota
              </button>
            </div>
          </div>
          <div className="md:w-1/2 h-64 md:h-full min-h-[300px] w-full relative bg-surface-container-high">
            <img alt="Perro feliz en la clínica veterinaria" className="absolute inset-0 w-full h-full object-cover" data-alt="A bright, professional photograph of a happy Golden Retriever sitting patiently in a clean, modern veterinary clinic reception area. The lighting is soft, natural, and high-key, highlighting the light-mode UI aesthetic with subtle cool blue tones. A smiling pet owner is gently petting the dog in the background. The mood is calm, trustworthy, and welcoming." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDopoN-RIkQ9grNUvSR1elUR8WTTG45NeVmOpZWsiULh8tDNkwPI8n-HuXGte5mF3YoyJ1SVjG4sxZP-5p8F7Pe7XKwI0nWTSfGMiPVOaFRKTe30XftM_pPe59UeBQl-ZmCmjRWSpJmkykvsqdqarQwxXUO_n9mCRod4YTfc3YrJG8vQTkJP2Yp54S7c-l7Sjjcq8M8I8v51sV5FoWgQmSGpcNK7J0t67LUdDuDPQNynTMG0vcdDIILyaCFxxdG5xzfBAmDPkCxTpwR" />
          </div>
        </section>
        {/* Bento Grid Content */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Upcoming Appointments (Span 2 cols on Desktop) */}
          <div className="md:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm">
            <div className="flex justify-between items-center mb-xs">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">event</span>
                Próximas Citas
              </h3>
              <button className="font-label-md text-label-md text-primary hover:underline">Ver todas</button>
            </div>
            <div className="bg-surface rounded-lg p-sm border border-surface-variant flex items-center justify-between hover:border-primary transition-colors group cursor-pointer">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>sound_detection_dog_barking</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-on-surface">Luna</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">Vacunación Anual • Dr. Smith</span>
                </div>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="font-label-md text-label-md text-primary">Mañana</span>
                <span className="font-body-md text-body-md text-on-surface-variant">10:30 AM</span>
              </div>
            </div>
          </div>
          {/* My Pets Summary */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm">
            <div className="flex justify-between items-center mb-xs">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">pets</span>
                Mis Mascotas
              </h3>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center">
                <span className="font-headline-xl text-headline-xl text-primary block">2</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Mascotas registradas</span>
              </div>
            </div>
            <button className="w-full bg-surface-container text-primary py-xs rounded-lg font-label-sm text-label-sm hover:bg-surface-container-high transition-colors">
              Gestionar Perfiles
            </button>
          </div>
          {/* Quick Actions */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex items-center gap-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">history</span>
              </div>
              <div>
                <h4 className="font-headline-md text-[16px] text-on-surface">Historial Médico</h4>
                <p className="font-body-md text-[12px] text-on-surface-variant">Ver registros anteriores</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex items-center gap-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">prescriptions</span>
              </div>
              <div>
                <h4 className="font-headline-md text-[16px] text-on-surface">Recetas</h4>
                <p className="font-body-md text-[12px] text-on-surface-variant">Medicamentos activos</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex items-center gap-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">chat</span>
              </div>
              <div>
                <h4 className="font-headline-md text-[16px] text-on-surface">Mensajes</h4>
                <p className="font-body-md text-[12px] text-on-surface-variant">Contactar a la clínica</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
};

export default PortalCliente;
