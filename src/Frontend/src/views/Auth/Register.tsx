import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import vetBg from '../../assets/vet-login-bg.jpg';

const Register: React.FC = () => {
  const navigate = useNavigate();

  // Estados locales
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nombreCompleto) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/auth/register', {
        nombreCompleto,
        email,
        password,
        dni,
        telefono
      });

      if (response.data.success) {
        // Redirigir al login para que inicie sesión con su nueva cuenta
        navigate('/login', { replace: true });
      } else {
        setErrorMsg(response.data.message || 'Error al registrar.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error de conexión. Inténtalo de nuevo.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Panel Izquierdo: Branding & Ilustración Premium (Solo en Escritorio) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-xl overflow-hidden">
        {/* Imagen de Fondo Premium */}
        <img 
          src={vetBg} 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Veterinaria y mascotas" 
        />
        
        {/* Capa de Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-container/90 mix-blend-multiply pointer-events-none" />
        
        {/* Contenido Visual */}
        <div className="flex flex-col gap-lg max-w-[500px] z-10 text-left text-on-primary">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="w-16 h-16 rounded-2xl bg-surface-bright/15 backdrop-blur-md flex items-center justify-center text-on-primary border border-surface-bright/25 shadow-lg"
          >
            <span className="material-symbols-outlined text-[36px] font-bold text-white">pets</span>
          </motion.div>
          
          <div className="space-y-sm">
            <h1 className="font-headline-xl text-[44px] font-extrabold tracking-tight leading-[48px] flex items-center gap-sm">
              <span className="material-symbols-outlined text-[44px] font-bold text-white">pets</span>
              <span>VetCare <span className="opacity-80">Pro</span></span>
            </h1>
            <p className="font-body-lg text-lg opacity-90 leading-relaxed font-light">
              Únete a nuestra plataforma clínica y obtén acceso directo al historial, citas y cuidado de tu mascota.
            </p>
          </div>
        </div>
      </div>

      {/* Panel Derecho: Formulario de Registro */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-md bg-surface-bright relative z-10">
        <div className="absolute top-12 left-12 lg:hidden flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-outlined text-[22px] font-bold">pets</span>
          </div>
          <h1 className="font-headline-xl text-xl font-extrabold text-on-surface tracking-tight">
            VetCare <span className="text-primary font-bold">Pro</span>
          </h1>
        </div>

        <motion.main 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[420px] flex flex-col gap-md text-left"
        >
          {/* Header del Formulario */}
          <div>
            <h2 className="font-headline-xl text-[28px] font-extrabold text-on-surface tracking-tight leading-none mb-2">
              Crear Cuenta
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant font-medium">
              Regístrate para gestionar a tus mascotas.
            </p>
          </div>

          {/* Error Alert Box con animación */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-error-container/30 border border-error/20 rounded-xl p-sm flex items-center gap-sm overflow-hidden"
              >
                <span className="material-symbols-outlined text-error text-[20px] font-semibold">warning</span>
                <p className="font-body-md text-body-md text-error-container font-medium leading-tight">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            
            {/* Full Name */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="nombreCompleto">Nombre Completo *</label>
              <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">person</span>
                <input 
                  className="w-full h-12 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0" 
                  id="nombreCompleto" 
                  name="nombreCompleto" 
                  placeholder="Ej. Juan Pérez" 
                  type="text" 
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="email">Correo Electrónico *</label>
              <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input 
                  className="w-full h-12 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0" 
                  id="email" 
                  name="email" 
                  placeholder="correo@ejemplo.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="password">Contraseña *</label>
              <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input 
                  className="w-full h-12 pl-10 pr-12 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button 
                  className="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-md">
              {/* DNI */}
              <div className="flex flex-col gap-xs w-1/2">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="dni">DNI</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">badge</span>
                  <input 
                    className="w-full h-12 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0" 
                    id="dni" 
                    name="dni" 
                    placeholder="Documento" 
                    type="text" 
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Telefono */}
              <div className="flex flex-col gap-xs w-1/2">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="telefono">Teléfono</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">phone</span>
                  <input 
                    className="w-full h-12 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0" 
                    id="telefono" 
                    name="telefono" 
                    placeholder="Teléfono" 
                    type="text" 
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button 
              whileHover={!isSubmitting ? { scale: 1.01 } : {}}
              whileTap={!isSubmitting ? { scale: 0.99 } : {}}
              className={`w-full h-12 mt-xs font-label-md text-label-md rounded-xl flex items-center justify-center gap-xs transition-all shadow-md font-bold cursor-pointer ${
                isSubmitting 
                  ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/20 hover:shadow-lg'
              }`} 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-sm">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Registrando...</span>
                </div>
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <span className="material-symbols-outlined text-[18px] font-bold">person_add</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Enlace de Login */}
          <div className="text-center mt-sm">
            <p className="font-body-md text-body-md text-on-surface-variant">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline transition-all">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Register;
