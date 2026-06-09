import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px 9px 40px',
    border: '1px solid #e6dfd8',
    backgroundColor: '#faf9f5',
    fontSize: '14px',
    color: '#141413',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#faf9f5', fontFamily: 'Inter, sans-serif', position: 'relative' }}
    >
      {/* Background animado */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(204, 120, 92, 0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(204, 120, 92, 0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(204, 120, 92, 0.03) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* Panel izquierdo — imagen */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ display: 'none', position: 'relative', flex: '0 0 50%' }} 
        className="lg-image-panel"
      >
        <motion.img
          alt="Clínica veterinaria VetCare Pro"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLn0Pn2ZOZ-n7ij-V9klJiWe-AnBBH7uLJDbnVa5MNOfQI-swW-C1AzB1jIMHTXUFNJApUlJjcnpEQMv7jDs6BLXVv-CuIyR3vvk1mzULo_cS_lbCcP8ODnnXVRvLIJpsQJy0L0SODMldQvDqAIYeDpnHIBZr5xhfKYHkf72T643eClVj_0rRom34LIi-qJpa6_JzNOzpy8nWBt_nqN9V82MbLG3FsIlXLG4_U9FO6AfYexUoc3ixYS4CaFvhfK2L-XYsM39MAqY0"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)' }} />
      </motion.div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >

          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: '#cc785c' }}>
              <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
            </svg>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#141413', letterSpacing: '-0.3px' }}>
              VetCare <span style={{ color: '#cc785c', fontWeight: 700, fontStyle: 'italic' }}>Pro</span>
            </span>
          </motion.div>

          {/* Encabezado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '30px', fontWeight: 400, lineHeight: 1.1, color: '#141413', margin: '0 0 6px' }}>
              Iniciar sesión
            </h1>
            <p style={{ fontSize: '13px', color: '#3d3d3a', lineHeight: 1.5, margin: 0 }}>
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
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#ffdad6', color: '#93000a', fontSize: '13px' }}
              >
              <svg style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} fill="currentColor" viewBox="0 0 20 20">
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
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >

            {/* Email */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#87736d', pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <input
                  id="email" type="email" name="email" required autoComplete="email"
                  placeholder="doctor@vetcarepro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputBase}
                  onFocus={(e) => { e.target.style.borderColor = '#cc785c'; e.target.style.boxShadow = '0 0 0 1px #cc785c'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e6dfd8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                  Contraseña
                </label>
                <a href="#" style={{ fontSize: '12px', color: '#cc785c', textDecoration: 'none' }}>
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#87736d', pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
                <input
                  id="password" type="password" name="password" required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputBase}
                  onFocus={(e) => { e.target.style.borderColor = '#cc785c'; e.target.style.boxShadow = '0 0 0 1px #cc785c'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e6dfd8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </motion.div>

            {/* Checkbox */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <input
                id="remember" type="checkbox" name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#cc785c', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: '13px', color: '#3d3d3a', cursor: 'pointer', userSelect: 'none' }}>
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
              whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '11px 24px', backgroundColor: '#cc785c', color: '#ffffff', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px', transition: 'background-color 0.15s, box-shadow 0.2s', boxShadow: '0 2px 8px rgba(204, 120, 92, 0.2)' }}
              onMouseEnter={(e) => { 
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#924a31'; 
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(204, 120, 92, 0.4)';
                }
              }}
              onMouseLeave={(e) => { 
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#cc785c'; 
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(204, 120, 92, 0.2)';
                }
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Iniciando sesión...
                </motion.div>
              ) : (
                <>
                  Iniciar sesión
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Registro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e6dfd8' }}
          >
            <p style={{ fontSize: '13px', color: '#3d3d3a', margin: 0 }}>
              ¿No tiene una cuenta para su clínica?
            </p>
            <Link
              to="/register"
              style={{ textAlign: 'center', width: '100%', borderRadius: '4px', fontSize: '13px', fontWeight: 500, color: '#141413', border: '1px solid #c0b8b0', padding: '10px 24px', textDecoration: 'none', display: 'block', boxSizing: 'border-box', transition: 'background-color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0e8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Registro de cliente
            </Link>
          </motion.div>

          {/* Copyright */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            style={{ textAlign: 'center', fontSize: '11px', color: '#87736d', margin: 0 }}
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