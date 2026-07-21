import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getHomeRouteForRole } from '../../context/AuthContext';

export default function PublicHeader() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Servicios', path: '/servicios' },
    { label: 'Equipo', path: '/equipo' },
    { label: 'Contacto', path: '/contacto' },
  ];

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate(getHomeRouteForRole(user?.role));
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="bg-canvas/80 backdrop-blur-md sticky top-0 w-full z-50 border-b border-hairline/30 shadow-sm">
      <div className="flex justify-between items-center px-6 lg:px-12 py-4 w-full max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-primary text-[36px] font-bold icon-fill">pets</span>
          <span className="font-display-sm text-[20px] font-bold text-ink tracking-tight">VetCarePro</span>
        </div>

        <nav className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-nav-link text-body-md pb-1 transition-all duration-300 ${
                isActive(link.path)
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-body-muted hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleCtaClick}
          className="hidden md:block bg-primary text-on-primary hover:bg-primary-active px-6 py-2.5 rounded-full font-button text-button transition-all duration-200 shadow-sm hover:scale-95 cursor-pointer font-bold"
        >
          {isAuthenticated ? 'Ir a mi Panel' : 'Iniciar Sesión'}
        </button>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-primary p-2 hover:bg-surface-soft rounded-full transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px]">
            {menuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <nav className="md:hidden bg-canvas border-t border-hairline px-6 py-4 flex flex-col gap-4 shadow-lg animate-modal-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`font-nav-link text-body-md py-2 border-b border-hairline/40 transition-colors ${
                isActive(link.path) ? 'text-primary font-bold' : 'text-body-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              handleCtaClick();
            }}
            className="w-full bg-primary text-on-primary hover:bg-primary-active py-3 rounded-full font-button text-button transition-colors font-bold shadow-md cursor-pointer"
          >
            {isAuthenticated ? 'Ir a mi Panel' : 'Iniciar Sesión'}
          </button>
        </nav>
      )}
    </header>
  );
}
