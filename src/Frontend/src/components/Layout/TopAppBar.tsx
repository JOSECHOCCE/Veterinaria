import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TopAppBar() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount } = useNotifications();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Gatillo de animación de sacudida cuando llega una nueva notificación
  useEffect(() => {
    if (unreadCount > 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const bellVariants = {
    idle: { rotate: 0 },
    wiggle: {
      rotate: [0, -18, 15, -15, 12, -10, 8, -4, 4, 0],
      transition: { duration: 0.6 }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-gutter h-16 bg-surface border-b border-outline-variant shadow-sm md:pl-[calc(16rem+24px)]">
      <div className="flex items-center gap-md">
        <h1 className="text-headline-md font-headline-md font-semibold text-primary md:hidden">VetCare Pro</h1>
        <div className="hidden md:block">
          <h2 className="text-headline-md font-headline-md font-semibold text-on-surface">Panel de Control</h2>
        </div>
      </div>

      <div className="flex items-center gap-sm text-primary">
        {/* Campana de Notificaciones en Tiempo Real */}
        <motion.button
          animate={shouldAnimate ? "wiggle" : "idle"}
          variants={bellVariants}
          onClick={() => {
            setUnreadCount(0);
            navigate('/admin/cola');
          }}
          className="p-base rounded-full hover:bg-surface-container-high transition-colors relative cursor-pointer text-primary"
          title={`${unreadCount} notificaciones no leídas - Haz clic para ver cola`}
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 bg-error text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border border-surface shadow-sm leading-none"
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>

        <button onClick={() => navigate('/admin/triage')} className="p-base rounded-full hover:bg-surface-container-high transition-colors text-error cursor-pointer" title="Nueva Emergencia">
          <span className="material-symbols-outlined">emergency</span>
        </button>
        <button className="p-base rounded-full hover:bg-surface-container-high transition-colors cursor-pointer" title="Mi Cuenta">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}

