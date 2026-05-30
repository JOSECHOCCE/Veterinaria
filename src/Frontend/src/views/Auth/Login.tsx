import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados locales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      // Redirección se maneja de forma automática al redirigir al Root o Dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#faf9f5', // Canvas cream
      color: '#141413', // Ink
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* Panel Izquierdo: Ilustración/Branding Editorial (Solo en pantallas medianas/grandes) */}
      <section style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#efe9de', // Surface card cream
        borderRight: '1px solid #e6dfd8', // Hairline
        padding: '64px',
        display: window.innerWidth > 768 ? 'flex' : 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2, maxWidth: '460px', textAlign: 'left' }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#cc785c', // Accent primary coral
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(204, 120, 92, 0.2)',
              marginBottom: '32px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>pets</span>
          </motion.div>
          
          <h1 style={{
            fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
            fontSize: '48px',
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-1px',
            color: '#141413',
            marginBottom: '24px'
          }}>
            VetCare Pro
          </h1>
          
          <p style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#3d3d3a', // Body color
            fontWeight: 400
          }}>
            Excelencia médica, cuidado compasivo. Accede a tu portal de gestión veterinaria y digitaliza el cuidado diario de tus mascotas.
          </p>
        </div>

        {/* Ambient background decoration */}
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,120,92,0.08) 0%, rgba(204,120,92,0) 70%)',
          pointerEvents: 'none'
        }} />
      </section>

      {/* Panel Derecho: Formulario de Login */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 24px',
        backgroundColor: '#faf9f5' // Canvas
      }}>
        
        {/* Mobile branding */}
        <div style={{
          display: window.innerWidth <= 768 ? 'flex' : 'none',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '32px',
          alignSelf: 'flex-start'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#cc785c' }}>pets</span>
          <span style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.5px' }}>VetCare Pro</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '400px', textAlign: 'left' }}
        >
          {/* Header */}
          <header style={{ marginBottom: '36px' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
              fontSize: '36px',
              fontWeight: 500,
              letterSpacing: '-0.5px',
              color: '#141413',
              marginBottom: '12px'
            }}>
              Bienvenido de nuevo
            </h2>
            <p style={{ fontSize: '16px', color: '#6c6a64' }}>
              Accede a tu portal de gestión veterinaria.
            </p>
          </header>

          {/* Error Alert Box */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  backgroundColor: 'rgba(198, 69, 69, 0.1)',
                  border: '1px solid rgba(198, 69, 69, 0.2)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '24px',
                  color: '#c64545',
                  fontSize: '14px',
                  overflow: 'hidden'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="email" style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                color: '#8e8b82'
              }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8e8b82',
                  fontSize: '20px'
                }}>
                  mail
                </span>
                <input 
                  id="email" 
                  name="email" 
                  placeholder="veterinario@vetcare.pro" 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    backgroundColor: 'transparent',
                    border: '1px solid #e6dfd8',
                    borderRadius: '8px',
                    outline: 'none',
                    color: '#141413',
                    fontSize: '15px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#cc785c'}
                  onBlur={e => e.target.style.borderColor = '#e6dfd8'}
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                  color: '#8e8b82'
                }}>
                  Contraseña
                </label>
                <a href="#" style={{ fontSize: '12px', color: '#cc785c', fontWeight: 600, textDecoration: 'none' }}
                   onMouseOver={e => e.currentTarget.style.color = '#a9583e'}
                   onMouseOut={e => e.currentTarget.style.color = '#cc785c'}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8e8b82',
                  fontSize: '20px'
                }}>
                  lock
                </span>
                <input 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
                    backgroundColor: 'transparent',
                    border: '1px solid #e6dfd8',
                    borderRadius: '8px',
                    outline: 'none',
                    color: '#141413',
                    fontSize: '15px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#cc785c'}
                  onBlur={e => e.target.style.borderColor = '#e6dfd8'}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8e8b82',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input id="remember" type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#cc785c', cursor: 'pointer' }}/>
              <label htmlFor="remember" style={{ fontSize: '14px', color: '#6c6a64', cursor: 'pointer' }}>Mantener sesión iniciada</label>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <motion.button 
                whileHover={!isLoading ? { scale: 1.01 } : {}}
                whileTap={!isLoading ? { scale: 0.99 } : {}}
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: isLoading ? '#e6dfd8' : '#cc785c', // Coral o deshabilitado
                  color: isLoading ? '#6c6a64' : '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isLoading ? 'none' : '0 4px 12px rgba(204, 120, 92, 0.15)',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={e => { if(!isLoading) e.currentTarget.style.backgroundColor = '#a9583e'; }}
                onMouseOut={e => { if(!isLoading) e.currentTarget.style.backgroundColor = '#cc785c'; }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid #6c6a64',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </>
                )}
              </motion.button>
              
              <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0' }}>
                <div style={{ flex: 1, borderTop: '1px solid #e6dfd8' }}></div>
                <span style={{ padding: '0 16px', fontSize: '12px', color: '#8e8b82' }}>O</span>
                <div style={{ flex: 1, borderTop: '1px solid #e6dfd8' }}></div>
              </div>
              
              <button 
                type="button"
                onClick={() => navigate('/register')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: 'transparent',
                  color: '#141413',
                  border: '1px solid #141413',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#141413'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#141413'; }}
              >
                Registrarse
              </button>
            </div>
          </form>

          {/* Footer note */}
          <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e6dfd8', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#8e8b82', margin: 0 }}>
              © 2026 VetCare Pro. Modern Editorial Veterinary Management.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
              <a href="#" style={{ fontSize: '12px', color: '#8e8b82', textDecoration: 'none' }}>Privacidad</a>
              <a href="#" style={{ fontSize: '12px', color: '#8e8b82', textDecoration: 'none' }}>Términos</a>
            </div>
          </footer>
        </motion.div>
      </section>

      {/* Spinner keyframes inject */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
