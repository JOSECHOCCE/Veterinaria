import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

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

      if (response.data?.success) {
        // Redirigir al login para que inicie sesión con su nueva cuenta
        navigate('/login', { replace: true });
      } else {
        setErrorMsg(response.data?.message || 'Error al registrar.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error de conexión. Inténtalo de nuevo.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
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
            Bienvenido a una nueva era de cuidado veterinario. Regístrate en nuestra plataforma clínica y obtén acceso directo al historial, citas y cuidado de tu mascota.
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

      {/* Panel Derecho: Formulario de Registro */}
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
          style={{ width: '100%', maxWidth: '420px', textAlign: 'left' }}
        >
          {/* Header */}
          <header style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
              fontSize: '36px',
              fontWeight: 500,
              letterSpacing: '-0.5px',
              color: '#141413',
              marginBottom: '12px'
            }}>
              Crear Cuenta
            </h2>
            <p style={{ fontSize: '16px', color: '#6c6a64' }}>
              Regístrate para gestionar a tus mascotas de forma digital.
            </p>
          </header>

          {/* Error Alert Box */}
          <AnimatePresence>
            {errorMsg && (
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
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Nombre Completo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="nombreCompleto" style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                color: '#8e8b82'
              }}>
                Nombre Completo *
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
                  person
                </span>
                <input 
                  id="nombreCompleto"
                  name="nombreCompleto"
                  placeholder="Ej. Juan Pérez"
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  disabled={isSubmitting}
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

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="email" style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                color: '#8e8b82'
              }}>
                Correo Electrónico *
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
                  placeholder="correo@ejemplo.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
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

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="password" style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                color: '#8e8b82'
              }}>
                Contraseña *
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
                  lock
                </span>
                <input 
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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

            {/* DNI & Teléfono */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="dni" style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                  color: '#8e8b82'
                }}>
                  DNI
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8e8b82',
                    fontSize: '18px'
                  }}>
                    badge
                  </span>
                  <input 
                    id="dni"
                    name="dni"
                    placeholder="Documento"
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '10px 10px 10px 38px',
                      backgroundColor: 'transparent',
                      border: '1px solid #e6dfd8',
                      borderRadius: '8px',
                      outline: 'none',
                      color: '#141413',
                      fontSize: '14px',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#cc785c'}
                    onBlur={e => e.target.style.borderColor = '#e6dfd8'}
                  />
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="telefono" style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                  color: '#8e8b82'
                }}>
                  Teléfono
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8e8b82',
                    fontSize: '18px'
                  }}>
                    phone
                  </span>
                  <input 
                    id="telefono"
                    name="telefono"
                    placeholder="Contacto"
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '10px 10px 10px 38px',
                      backgroundColor: 'transparent',
                      border: '1px solid #e6dfd8',
                      borderRadius: '8px',
                      outline: 'none',
                      color: '#141413',
                      fontSize: '14px',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#cc785c'}
                    onBlur={e => e.target.style.borderColor = '#e6dfd8'}
                  />
                </div>
              </div>
            </div>

            {/* Botón de Registro */}
            <motion.button 
              whileHover={!isSubmitting ? { scale: 1.01 } : {}}
              whileTap={!isSubmitting ? { scale: 0.99 } : {}}
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '44px',
                marginTop: '12px',
                backgroundColor: isSubmitting ? '#e6dfd8' : '#cc785c', // Coral o deshabilitado
                color: isSubmitting ? '#6c6a64' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(204, 120, 92, 0.15)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => { if(!isSubmitting) e.currentTarget.style.backgroundColor = '#a9583e'; }}
              onMouseOut={e => { if(!isSubmitting) e.currentTarget.style.backgroundColor = '#cc785c'; }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid #6c6a64',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>Registrando...</span>
                </div>
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Enlace de Login */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ fontSize: '14px', color: '#6c6a64' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{
                color: '#cc785c',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.color = '#a9583e'}
              onMouseOut={e => e.currentTarget.style.color = '#cc785c'}
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
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
};

export default Register;
