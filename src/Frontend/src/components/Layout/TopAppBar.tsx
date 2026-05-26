import { useNavigate } from 'react-router-dom';

export default function TopAppBar() {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-gutter h-16 bg-surface border-b border-outline-variant shadow-sm md:pl-[calc(16rem+24px)]">
      <div className="flex items-center gap-md">
        <h1 className="text-headline-md font-headline-md font-semibold text-primary md:hidden">VetCare Pro</h1>
        <div className="hidden md:block">
          {/* Aquí podríamos inyectar el título de la página activa dinámicamente si quisiéramos */}
          <h2 className="text-headline-md font-headline-md font-semibold text-on-surface">Panel de Control</h2>
        </div>
      </div>

      <div className="flex items-center gap-sm text-primary">
        <button className="p-base rounded-full hover:bg-surface-container-high transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-ping"></span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <button onClick={() => navigate('/triage')} className="p-base rounded-full hover:bg-surface-container-high transition-colors text-error" title="Nueva Emergencia">
          <span className="material-symbols-outlined">emergency</span>
        </button>
        <button className="p-base rounded-full hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
