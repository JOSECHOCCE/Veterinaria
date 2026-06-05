import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

  return (
    <main className="min-h-screen flex w-full bg-[#faf9f5]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Panel izquierdo — imagen */}
      <div className="hidden lg:block lg:w-1/2 relative h-screen">
        <img
          alt="Clínica veterinaria VetCare Pro"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLn0Pn2ZOZ-n7ij-V9klJiWe-AnBBH7uLJDbnVa5MNOfQI-swW-C1AzB1jIMHTXUFNJApUlJjcnpEQMv7jDs6BLXVv-CuIyR3vvk1mzULo_cS_lbCcP8ODnnXVRvLIJpsQJy0L0SODMldQvDqAIYeDpnHIBZr5xhfKYHkf72T643eClVj_0rRom34LIi-qJpa6_JzNOzpy8nWBt_nqN9V82MbLG3FsIlXLG4_U9FO6AfYexUoc3ixYS4CaFvhfK2L-XYsM39MAqY0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-16 lg:px-16 min-h-screen">
        <div className="w-full max-w-sm flex flex-col gap-7">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#cc785c]" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
            </svg>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '26px', color: '#141413', letterSpacing: '-0.3px' }}>
              VetCare <span style={{ color: '#cc785c', fontWeight: 700, fontStyle: 'italic' }}>Pro</span>
            </span>
          </div>

          {/* Encabezado */}
          <div className="flex flex-col gap-2">
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '34px', fontWeight: 400, lineHeight: 1.15, color: '#141413', margin: 0 }}>
              Iniciar sesión
            </h1>
            <p style={{ fontSize: '15px', color: '#3d3d3a', lineHeight: 1.6, margin: 0 }}>
              Bienvenido de nuevo a VetCare Pro. Por favor, introduzca sus credenciales para acceder al sistema.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#ffdad6', color: '#93000a' }}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 500, color: '#141413' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#87736d' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <input
                  id="email" type="email" name="email" required autoComplete="email"
                  placeholder="doctor@vetcarepro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full outline-none transition-all rounded"
                  style={{ paddingLeft: '40px', paddingRight: '12px', paddingTop: '11px', paddingBottom: '11px', border: '1px solid #e6dfd8', backgroundColor: '#faf9f5', fontSize: '15px', color: '#141413' }}
                  onFocus={(e) => { e.target.style.borderColor = '#cc785c'; e.target.style.boxShadow = '0 0 0 1px #cc785c'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e6dfd8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500, color: '#141413' }}>
                  Contraseña
                </label>
                <a href="#" style={{ fontSize: '13px', color: '#cc785c', textDecoration: 'none' }}>
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#87736d' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
                <input
                  id="password" type="password" name="password" required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full outline-none transition-all rounded"
                  style={{ paddingLeft: '40px', paddingRight: '12px', paddingTop: '11px', paddingBottom: '11px', border: '1px solid #e6dfd8', backgroundColor: '#faf9f5', fontSize: '15px', color: '#141413' }}
                  onFocus={(e) => { e.target.style.borderColor = '#cc785c'; e.target.style.boxShadow = '0 0 0 1px #cc785c'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e6dfd8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember" type="checkbox" name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: '#cc785c' }}
              />
              <label htmlFor="remember" className="cursor-pointer select-none" style={{ fontSize: '14px', color: '#3d3d3a' }}>
                Mantener sesión iniciada
              </label>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded transition-colors"
              style={{ padding: '13px 24px', backgroundColor: '#cc785c', color: '#ffffff', fontSize: '14px', fontWeight: 500, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#924a31'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#cc785c'; }}
            >
              {loading ? (
                <span style={{ fontSize: '14px' }}>Iniciando sesión...</span>
              ) : (
                <>
                  Iniciar sesión
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Registro */}
          <div className="flex flex-col items-center gap-3 pt-6" style={{ borderTop: '1px solid #e6dfd8' }}>
            <p style={{ fontSize: '14px', color: '#3d3d3a', margin: 0 }}>
              ¿No tiene una cuenta para su clínica?
            </p>
            <Link
              to="/register"
              className="text-center w-full rounded transition-colors"
              style={{ fontSize: '14px', fontWeight: 500, color: '#141413', border: '1px solid #c0b8b0', padding: '11px 24px', textDecoration: 'none', display: 'block' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0e8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Registro de cliente
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-center" style={{ fontSize: '12px', color: '#87736d', margin: 0 }}>
            © 2024 VetCare Pro. Dedicated to Clinical Excellence.
          </p>

        </div>
      </div>
    </main>
  );
}