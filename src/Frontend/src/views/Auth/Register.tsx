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
    padding: '10px 12px',
    backgroundColor: '#faf9f5',
    border: '1px solid #e6dfd8',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#141413',
    outline: 'none',
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
    <main
      className="min-h-screen flex w-full"
      style={{ backgroundColor: '#faf9f5', fontFamily: 'Inter, sans-serif' }}
    >
      {/* ══════════════════ IZQUIERDA — imagen ══════════════════ */}
      <aside className="hidden lg:block lg:w-1/2 relative h-screen sticky top-0 overflow-hidden">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)' }}
        />
        <img
          alt="Profesional veterinario con paciente"
          className="absolute inset-0 w-full h-full object-cover object-center"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTCLSv-cpXo2R43qQ6AI9XXsXWH-RGzGv9B5MJvu305-mySiGG5dQnERZcCMgByeFSf6dG3T7U7OI0c4lu5SB9pRjEq2a2Ej89c-kE8C4oT-9PbYuJIA1XaCm2-Yp2ZyBldfyPb2R0PQB17SICLmBMw5SYs0NEYCVT9BT9SF0_0YwGL0ObANSVjC_MNg6Q-I6GD99ANXSBXG_XKKgoWlTNd7CPkAMapFssLoch8fZ1_1sMtipy9sR9ihNhvIg62sQulYCouxZcpJY"
        />
        {/* Card decorativo */}
        <div
          className="absolute bottom-8 left-8 z-20 max-w-xs p-4 rounded-lg"
          style={{
            backgroundColor: 'rgba(250,249,245,0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(230,223,216,0.6)',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5" style={{ color: '#8f482f' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Excelencia Clínica
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#141413', lineHeight: 1.5, margin: 0 }}>
            Únete a la red de profesionales dedicados al cuidado animal con herramientas de precisión y empatía.
          </p>
        </div>
      </aside>

      {/* ══════════════════ DERECHA — formulario ══════════════════ */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-12 lg:px-12 min-h-screen">
        <div className="w-full max-w-sm flex flex-col gap-5">

          {/* Volver al Login */}
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 transition-colors"
              style={{ fontSize: '13px', fontWeight: 500, color: '#3d3d3a', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#8f482f')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#3d3d3a')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Volver al Login
            </Link>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-7 h-7" style={{ fill: '#8f482f' }}>
              <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
            </svg>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#141413', letterSpacing: '-0.3px' }}>
              VetCare <span style={{ color: '#8f482f', fontStyle: 'italic' }}>Pro</span>
            </span>
          </div>

          {/* Encabezado */}
          <div className="flex flex-col gap-1.5">
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 400, color: '#141413', lineHeight: 1.15, letterSpacing: '-0.3px', margin: 0 }}>
              Crea tu cuenta
            </h1>
            <p style={{ fontSize: '13px', color: '#3d3d3a', lineHeight: 1.6, margin: 0 }}>
              Ingresa tus datos para comenzar a gestionar el bienestar de tus pacientes con excelencia clínica.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: '#ffdad6', color: '#93000a', fontSize: '13px' }}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label htmlFor="nombreCompleto" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                Nombre completo
              </label>
              <input
                id="nombreCompleto" name="nombreCompleto" type="text" required
                placeholder="Ej. Dra. Elena Silva"
                value={form.nombreCompleto}
                onChange={handleChange}
                style={inputStyle}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                Correo electrónico
              </label>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                placeholder="elena@clinicaveterinaria.com"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  required autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#87736d' }}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex flex-col gap-1">
              <label htmlFor="telefono" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                Teléfono
              </label>
              <input
                id="telefono" name="telefono" type="tel" required
                placeholder="+51 999 000 000"
                value={form.telefono}
                onChange={handleChange}
                style={inputStyle}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Documento + Dirección */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="documento" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                  Documento{' '}
                  <span style={{ fontSize: '11px', fontWeight: 400, color: '#87736d' }}>(Opcional)</span>
                </label>
                <input
                  id="documento" name="documento" type="text"
                  value={form.documento}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="direccion" style={{ fontSize: '13px', fontWeight: 500, color: '#141413' }}>
                  Dirección{' '}
                  <span style={{ fontSize: '11px', fontWeight: 400, color: '#87736d' }}>(Opcional)</span>
                </label>
                <input
                  id="direccion" name="direccion" type="text"
                  value={form.direccion}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            {/* Términos */}
            <div className="flex items-start gap-2.5 py-1">
              <input
                id="terms" type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 shrink-0 cursor-pointer"
                style={{ accentColor: '#8f482f' }}
              />
              <label htmlFor="terms" className="cursor-pointer" style={{ fontSize: '13px', color: '#3d3d3a', lineHeight: 1.55 }}>
                He leído y acepto la{' '}
                <a href="#" style={{ color: '#141413', textDecoration: 'underline' }}>Política de Privacidad</a>
                {' '}y los{' '}
                <a href="#" style={{ color: '#141413', textDecoration: 'underline' }}>Términos de Servicio</a>.
              </label>
            </div>

            {/* Botón Registrarse */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded transition-colors"
              style={{
                padding: '12px 24px',
                backgroundColor: '#8f482f',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#ad5f45'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8f482f'; }}
            >
              {loading ? 'Registrando...' : (
                <>
                  Registrarse
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Copyright */}
          <p className="text-center" style={{ fontSize: '11px', color: '#87736d', margin: 0 }}>
            © 2024 VetCare Pro. Dedicated to Clinical Excellence.
          </p>

        </div>
      </div>
    </main>
  );
}