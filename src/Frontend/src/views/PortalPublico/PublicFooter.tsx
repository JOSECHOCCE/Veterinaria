import { useNavigate } from 'react-router-dom';

export default function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="bg-canvas border-t border-hairline w-full">
      <div className="w-full max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div 
          className="flex items-center gap-2 cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
          onClick={() => navigate('/')}
        >
          <span className="material-symbols-outlined text-primary text-[28px] font-bold">pets</span>
          <span className="font-display-sm text-[18px] font-bold text-ink">VetCarePro</span>
        </div>
        
        <div className="font-caption text-caption text-body-muted text-center md:text-left">
          © 2026 VetCarePro Clínica Veterinaria. Todos los derechos reservados.
        </div>
        
        <div className="flex gap-6 font-caption text-caption">
          <a className="text-body-muted hover:text-primary transition-colors duration-300" href="#">Privacidad</a>
          <a className="text-body-muted hover:text-primary transition-colors duration-300" href="#">Términos de Servicio</a>
          <a className="text-primary font-bold hover:text-primary-active transition-colors duration-300" href="#">Urgencias 24h</a>
        </div>
      </div>
    </footer>
  );
}
