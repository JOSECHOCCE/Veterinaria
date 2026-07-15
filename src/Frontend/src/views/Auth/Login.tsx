import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getHomeRouteForRole } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import loginHero from '../../assets/login-hero.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      navigate(getHomeRouteForRole(loggedUser?.role));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
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
            'radial-gradient(circle at 20% 50%, rgba(0, 106, 99, 0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(0, 106, 99, 0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(0, 106, 99, 0.02) 0%, transparent 50%)',
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
          alt="Clínica veterinaria VetCare Pro"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover object-center"
          src={loginHero}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-canvas/10" />
      </motion.div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-8 overflow-hidden relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-[360px] flex flex-col gap-5"
        >

          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-primary">
              <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
            </svg>
            <span className="font-display-md text-title-md text-ink tracking-tight font-medium">
              VetCare <span className="text-primary font-bold italic">Pro</span>
            </span>
          </motion.div>

          {/* Encabezado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h1 className="font-display-lg text-[30px] font-normal leading-tight text-ink mb-1.5">
              Iniciar sesión
            </h1>
            <p className="text-[13px] text-body-muted leading-relaxed">
              Bienvenido de nuevo a VetCare Pro. Introduce tus credenciales para acceder.
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
                className="flex items-start gap-2 p-2.5 rounded bg-error-container text-error text-[13px]"
              >
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
            transition={{ duration: 0.5, delay: 0.6 }}
            onSubmit={handleSubmit} 
            className="flex flex-col gap-3.5"
          >

            {/* Email */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="flex flex-col gap-1"
            >
              <label htmlFor="email" className="text-[13px] font-medium text-ink">
                Correo electrónico
              </label>
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-body-muted/60 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <input
                  id="email" type="email" name="email" required autoComplete="email"
                  placeholder="doctor@vetcarepro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-[9px] border border-hairline rounded bg-canvas text-ink text-[14px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="flex flex-col gap-1"
            >
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[13px] font-medium text-ink">
                  Contraseña
                </label>
                <a href="#" className="text-[12px] text-primary hover:text-primary-active transition-colors">
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-body-muted/60 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
                <input
                  id="password" type="password" name="password" required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-[9px] border border-hairline rounded bg-canvas text-ink text-[14px] placeholder:text-body-muted/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-150"
                />
              </div>
            </motion.div>

            {/* Checkbox */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              className="flex items-center gap-2"
            >
              <input
                id="remember" type="checkbox" name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-[15px] h-[15px] accent-primary cursor-pointer border border-hairline rounded bg-canvas"
              />
              <label htmlFor="remember" className="text-[13px] text-body-muted cursor-pointer user-select-none">
                Mantener sesión iniciada
              </label>
            </motion.div>

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1 }}
              className="w-full display-flex justify-center items-center gap-2 py-2.5 px-6 bg-primary hover:bg-primary-active text-white text-[14px] font-medium border-0 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 mt-1 shadow-md transition-all duration-150"
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
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full">
                  <span>Iniciar sesión</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              )}
            </motion.button>
          </motion.form>

          {/* Registro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex flex-col items-center gap-2.5 pt-4 border-t border-hairline"
          >
            <p className="text-[13px] text-body-muted margin-0">
              ¿No tiene una cuenta para su clínica?
            </p>
            <Link
              to="/register"
              className="text-center w-full rounded text-[13px] font-medium text-ink border border-hairline hover:bg-surface-soft py-2.5 px-6 no-underline block box-border transition-colors duration-150"
            >
              Registro de cliente
            </Link>
          </motion.div>

          {/* Copyright */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-center text-[11px] text-body-muted margin-0"
          >
            © 2024 VetCare Pro. Dedicated to Clinical Excellence.
          </motion.p>

        </motion.div>
      </div>

      {/* CSS para el panel imagen en lg */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-image-panel { display: block !important; }
        }
      `}</style>
    </motion.div>
  );
}