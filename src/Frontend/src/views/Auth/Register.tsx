import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { motion, AnimatePresence } from 'framer-motion';
import registerHero from '../../assets/register-hero.png';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    telefono: '',
    documento: '',
    direccion: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!terms) { setError('Debes aceptar los términos de servicio.'); return; }
    setError(null);
    setLoading(true);
    try {
      await authService.register({
        nombreCompleto: form.nombreCompleto,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
        dni: form.documento || undefined,
        direccion: form.direccion || undefined,
      });
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al registrarse';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen overflow-hidden bg-canvas font-title-sm relative"
    >
      {/* Background animado */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 80% 20%, rgba(0, 106, 99, 0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 80%, rgba(0, 106, 99, 0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, rgba(0, 106, 99, 0.02) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Panel izquierdo — imagen */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:block relative flex-[0_0_50%] overflow-hidden lg-image-panel"
      >
        <motion.img
          alt="Profesional veterinario con paciente"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover object-center"
          src={registerHero}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-canvas/10" />
        {/* Card decorativo */}
        <div className="absolute bottom-6 left-6 z-20 max-w-[260px] p-3.5 rounded-lg bg-canvas/90 backdrop-blur-md border border-hairline shadow-md">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
            </svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">
              Excelencia Clínica
            </span>
          </div>
          <p className="text-[12px] text-ink leading-relaxed m-0">
            Únete a la red de profesionales dedicados al cuidado animal con herramientas de precisión y empatía.
          </p>
        </div>
      </motion.div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-8 overflow-hidden relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-[360px] flex flex-col gap-3.5 mt-6 md:mt-0"
        >

          {/* Volver al Login */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link to="/login" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-body-muted hover:text-primary transition-colors no-underline">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Volver al Login
            </Link>
          </motion.div>

          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-primary">
              <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
            </svg>
            <span className="font-display-md text-[20px] text-ink font-bold">
              VetCare <span className="text-primary italic">Pro</span>
            </span>
          </motion.div>

          {/* Encabezado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h1 className="font-display-lg text-[26px] font-normal leading-none text-ink mb-1">
              Crea tu cuenta
            </h1>
            <p className="text-[12px] text-body-muted leading-tight">
              Ingresa tus datos para gestionar el bienestar de tus pacientes.
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  transition: { duration: 0.3 }
                }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="flex items-start gap-2 p-2 rounded bg-error-container text-error text-[12px]"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
                </svg>
                <motion.span
                  animate={{ x: [0, -5, 5, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {error}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            onSubmit={handleSubmit} 
            className="flex flex-col gap-2.5"
          >

            {/* Nombre */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="flex flex-col gap-0.5"
            >
              <label htmlFor="nombreCompleto" className="text-[12px] font-medium text-ink">
                Nombre completo
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-body-muted/60 pointer-events-none flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </span>
                <input 
                  id="nombreCompleto" name="nombreCompleto" type="text" required
                  placeholder="Ej. Dra. Elena Silva"
                  value={form.nombreCompleto} onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-hairline rounded bg-canvas text-ink text-[13px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.85 }}
              className="flex flex-col gap-0.5"
            >
              <label htmlFor="email" className="text-[12px] font-medium text-ink">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-body-muted/60 pointer-events-none flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </span>
                <input 
                  id="email" name="email" type="email" required autoComplete="email"
                  placeholder="elena@clinicaveterinaria.com"
                  value={form.email} onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-hairline rounded bg-canvas text-ink text-[13px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              className="flex flex-col gap-0.5"
            >
              <label htmlFor="password" className="text-[12px] font-medium text-ink">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-body-muted/60 pointer-events-none flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </span>
                <input 
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  required autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-hairline rounded bg-canvas text-ink text-[13px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-0 cursor-pointer text-body-muted/60 p-0 flex hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Teléfono */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.95 }}
              className="flex flex-col gap-0.5"
            >
              <label htmlFor="telefono" className="text-[12px] font-medium text-ink">
                Teléfono
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-body-muted/60 pointer-events-none flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">phone</span>
                </span>
                <input 
                  id="telefono" name="telefono" type="tel" required
                  placeholder="+51 999 000 000"
                  value={form.telefono} onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-hairline rounded bg-canvas text-ink text-[13px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                />
              </div>
            </motion.div>

            {/* Documento + Dirección — misma fila en una cuadrícula */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1 }}
              className="grid grid-cols-2 gap-2.5"
            >
              <div className="flex flex-col gap-0.5">
                <label htmlFor="documento" className="text-[12px] font-medium text-ink">
                  Documento <span className="text-[10px] font-normal text-body-muted/80">(Opc.)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-body-muted/60 pointer-events-none flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                  </span>
                  <input 
                    id="documento" name="documento" type="text"
                    value={form.documento} onChange={handleChange}
                    className="block w-full pl-8 pr-2 py-1.5 border border-hairline rounded bg-canvas text-ink text-[12px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label htmlFor="direccion" className="text-[12px] font-medium text-ink">
                  Dirección <span className="text-[10px] font-normal text-body-muted/80">(Opc.)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-body-muted/60 pointer-events-none flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">home</span>
                  </span>
                  <input 
                    id="direccion" name="direccion" type="text"
                    value={form.direccion} onChange={handleChange}
                    className="block w-full pl-8 pr-2 py-1.5 border border-hairline rounded bg-canvas text-ink text-[12px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                  />
                </div>
              </div>
            </motion.div>

            {/* Términos */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.05 }}
              className="flex items-start gap-2 mt-0.5"
            >
              <input 
                id="terms" type="checkbox"
                checked={terms} onChange={(e) => setTerms(e.target.checked)}
                className="w-[14px] h-[14px] accent-primary cursor-pointer border border-hairline rounded bg-canvas mt-0.5 flex-shrink-0"
              />
              <label htmlFor="terms" className="text-[11px] text-body-muted leading-tight cursor-pointer">
                He leído y acepto la{' '}
                <a href="#" className="text-ink underline hover:text-primary transition-colors">Política de Privacidad</a>
                {' '}y los{' '}
                <a href="#" className="text-ink underline hover:text-primary transition-colors">Términos de Servicio</a>.
              </label>
            </motion.div>

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1 }}
              className="w-full display-flex justify-center items-center gap-2 py-2 px-6 bg-primary hover:bg-primary-active text-white text-[13px] font-medium border-0 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 mt-1 shadow-md transition-all duration-150"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={2} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </motion.svg>
                  Registrando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 w-full">
                  <span>Registrarse</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              )}
            </motion.button>
          </motion.form>

          {/* Copyright */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-center text-[10px] text-body-muted margin-0 mt-0.5"
          >
            © 2024 VetCare Pro. Dedicated to Clinical Excellence.
          </motion.p>

        </motion.div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-image-panel { display: block !important; }
        }
      `}</style>
    </motion.div>
  );
}