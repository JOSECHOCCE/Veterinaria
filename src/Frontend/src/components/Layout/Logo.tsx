import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export default function Logo({ className = '', showSubtitle = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-sm select-none ${className}`}>
      {/* Isotipo: Huella de mascota en botón marrón (bg-primary) */}
      <motion.div
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm border border-primary/20 shrink-0 cursor-pointer"
        whileHover={{ 
          scale: 1.08,
          rotate: 15,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <span 
          className="material-symbols-outlined text-[22px] select-none" 
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          pets
        </span>
      </motion.div>
      
      {/* Logotipo Texto */}
      <div className="flex flex-col">
        <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-ink">
          VetCare <span className="text-primary italic font-serif">Pro</span>
        </span>
        {showSubtitle && (
          <span className="font-caption text-[11px] text-body-muted tracking-wide mt-[2px] leading-none uppercase font-semibold">
            Premium Animal Health
          </span>
        )}
      </div>
    </div>
  );
}
