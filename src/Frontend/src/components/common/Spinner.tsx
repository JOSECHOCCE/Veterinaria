import { motion } from 'framer-motion';

interface SpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Spinner({ message = 'Cargando...', size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-xl gap-md w-full my-xl">
      <div className="relative">
        {/* Spinner animado */}
        <motion.div
          className={`${sizeClasses[size]} border-hairline border-t-primary rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        {/* Icono central de huella latiendo */}
        <span className="material-symbols-outlined text-primary/30 absolute inset-0 flex items-center justify-center text-[18px] animate-pulse">
          pets
        </span>
      </div>
      {message && (
        <p className="font-caption text-caption text-body-muted animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
