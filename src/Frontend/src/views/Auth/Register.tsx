import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

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
        documento: form.documento || undefined,
        direccion: form.direccion || undefined,
      });
      navigate('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: '#faf9f5',
    border: '1px solid #e6dfd8',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#141413',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#8f482f';
    e.target.style.boxShadow = '0 0 0 1px #8f482f';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e6dfd8';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#faf9f5', fontFamily: 'Inter, sans-serif' }}>

      {/* Panel izquierdo — imagen */}
      <div style={{ display: 'none', position: 'relative', flex: '0 0 50%', overflow: 'hidden' }} className="lg-image-panel">
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)', pointerEvents: 'none' }} />
        <img
          alt="Profesional veterinario con paciente"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTCLSv-cpXo2R43qQ6AI9XXsXWH-RGzGv9B5MJvu305-mySiGG5dQnERZcCMgByeFSf6dG3T7U7OI0c4lu5SB9pRjEq2a2Ej89c-kE8C4oT-9PbYuJIA1XaCm2-Yp2ZyBldfyPb2R0PQB17SICLmBMw5SYs0NEYCVT9BT9SF0_0YwGL0ObANSVjC_MNg6Q-I6GD99ANXSBXG_XKKgoWlTNd7CPkAMapFssLoch8fZ1_1sMtipy9sR9ihNhvIg62sQulYCouxZcpJY"
        />
        {/* Card decorativo */}
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 20, maxWidth: '260px', padding: '14px 16px', borderRadius: '10px', backgroundColor: 'rgba(250,249,245,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(230,223,216,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8f482f', marginBottom: '6px' }}>
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Excelencia Clínica
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#141413', lineHeight: 1.5, margin: 0 }}>
            Únete a la red de profesionales dedicados al cuidado animal con herramientas de precisión y empatía.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Volver al Login */}
          <div>
            <Link
              to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: '#3d3d3a', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#8f482f')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#3d3d3a')}
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Volver al Login
            </Link>
          </div>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: '#8f482f' }}>
              <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
            </svg>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#141413' }}>
              VetCare <span style={{ color: '#8f482f', fontStyle: 'italic' }}>Pro</span>
            </span>
          </div>

          {/* Encabezado */}
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: 400, color: '#141413', lineHeight: 1.1, margin: '0 0 4px' }}>
              Crea tu cuenta
            </h1>
            <p style={{ fontSize: '12px', color: '#3d3d3a', lineHeight: 1.5, margin: 0 }}>
              Ingresa tus datos para gestionar el bienestar de tus pacientes.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#ffdad6', color: '#93000a', fontSize: '12px' }}>
              <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '1px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Nombre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label htmlFor="nombreCompleto" style={{ fontSize: '12px', fontWeight: 500, color: '#141413' }}>
                Nombre completo
              </label>
              <input id="nombreCompleto" name="nombreCompleto" type="text" required
                placeholder="Ej. Dra. Elena Silva"
                value={form.nombreCompleto} onChange={handleChange}
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label htmlFor="email" style={{ fontSize: '12px', fontWeight: 500, color: '#141413' }}>
                Correo electrónico
              </label>
              <input id="email" name="email" type="email" required autoComplete="email"
                placeholder="elena@clinicaveterinaria.com"
                value={form.email} onChange={handleChange}
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label htmlFor="password" style={{ fontSize: '12px', fontWeight: 500, color: '#141413' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  required autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: '36px' }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#87736d', padding: 0, display: 'flex' }}>
                  {showPassword ? (
                    <svg style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Teléfono */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label htmlFor="telefono" style={{ fontSize: '12px', fontWeight: 500, color: '#141413' }}>
                Teléfono
              </label>
              <input id="telefono" name="telefono" type="tel" required
                placeholder="+51 999 000 000"
                value={form.telefono} onChange={handleChange}
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Documento + Dirección — misma fila */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label htmlFor="documento" style={{ fontSize: '12px', fontWeight: 500, color: '#141413' }}>
                  Documento <span style={{ fontSize: '10px', fontWeight: 400, color: '#87736d' }}>(Opc.)</span>
                </label>
                <input id="documento" name="documento" type="text"
                  value={form.documento} onChange={handleChange}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label htmlFor="direccion" style={{ fontSize: '12px', fontWeight: 500, color: '#141413' }}>
                  Dirección <span style={{ fontSize: '10px', fontWeight: 400, color: '#87736d' }}>(Opc.)</span>
                </label>
                <input id="direccion" name="direccion" type="text"
                  value={form.direccion} onChange={handleChange}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            {/* Términos */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input id="terms" type="checkbox"
                checked={terms} onChange={(e) => setTerms(e.target.checked)}
                style={{ width: '14px', height: '14px', accentColor: '#8f482f', cursor: 'pointer', marginTop: '1px', flexShrink: 0 }}
              />
              <label htmlFor="terms" style={{ fontSize: '12px', color: '#3d3d3a', lineHeight: 1.5, cursor: 'pointer' }}>
                He leído y acepto la{' '}
                <a href="#" style={{ color: '#141413', textDecoration: 'underline' }}>Política de Privacidad</a>
                {' '}y los{' '}
                <a href="#" style={{ color: '#141413', textDecoration: 'underline' }}>Términos de Servicio</a>.
              </label>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '11px 24px', backgroundColor: '#8f482f', color: '#ffffff', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background-color 0.15s' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#ad5f45'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8f482f'; }}
            >
              {loading ? 'Registrando...' : (
                <>
                  Registrarse
                  <svg style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Copyright */}
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#87736d', margin: 0 }}>
            © 2024 VetCare Pro. Dedicated to Clinical Excellence.
          </p>

        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-image-panel { display: block !important; }
        }
      `}</style>
    </div>
  );
}