import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados locales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      // Redirigir al dashboard al ingresar correctamente
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-gutter relative overflow-hidden">
      {/* Elementos decorativos luminosos traseros (Glow effects) */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
      
      {/* Panel de cristal esmerilado translúcido */}
      <motion.main 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] bg-surface-container-lowest/60 backdrop-blur-xl rounded-2xl shadow-xl border border-outline-variant/20 p-lg flex flex-col gap-lg z-10"
      >
        {/* Header / Branding */}
        <header className="flex flex-col items-center gap-sm text-center">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-md"
          >
            <span className="material-symbols-outlined text-[32px] font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
          </motion.div>
          <div>
            <h1 className="font-headline-xl text-headline-xl font-extrabold text-on-surface tracking-tight leading-none mb-1">
              VetCare <span className="text-primary font-bold">Pro</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant font-medium">Gestión Clínica y Administrativa</p>
          </div>
        </header>

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
              <p className="font-body-md text-body-md text-error-container font-medium text-left leading-tight">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {/* Email Field */}
          <div className="flex flex-col gap-xs text-left">
            <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="email">Correo Electrónico</label>
            <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-high/20 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input 
                className="w-full h-12 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0" 
                id="email" 
                name="email" 
                placeholder="admin@veterinaria.com" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-xs text-left">
            <div className="flex justify-between items-center px-1">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="password">Contraseña</label>
              <a className="font-label-md text-[11px] text-primary hover:underline font-semibold transition-colors" href="#">¿Olvidó su contraseña?</a>
            </div>
            <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-high/20 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-xs ml-1 text-left">
            <input 
              type="checkbox" 
              id="rememberMe" 
              className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary bg-transparent cursor-pointer"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="rememberMe" className="font-body-md text-body-md text-on-surface-variant font-medium select-none cursor-pointer">
              Recordar mi sesión
            </label>
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
                <span>Autenticando...</span>
              </div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <span className="material-symbols-outlined text-[18px] font-bold">arrow_forward</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Info */}
        <div className="text-center mt-xs">
          <p className="font-label-sm text-label-sm text-outline-variant/75 font-semibold">Uso exclusivo para personal clínico autorizado.</p>
        </div>
      </motion.main>
    </div>
  );
};

export default Login;
