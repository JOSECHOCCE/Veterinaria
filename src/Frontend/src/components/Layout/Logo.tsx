import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export default function Logo({ className = '', showSubtitle = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-sm select-none ${className}`}>
      {/* Isotipo: Huella SVG inline en botón marrón */}
      <motion.div
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm border border-primary/20 shrink-0 cursor-pointer"
        whileHover={{ scale: 1.08, rotate: 15 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current select-none">
          <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
        </svg>
      </motion.div>

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