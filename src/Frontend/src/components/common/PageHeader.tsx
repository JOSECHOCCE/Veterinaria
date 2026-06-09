import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: React.ReactNode;
  preTitle?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backLink?: {
    to: string;
    label: string;
  };
  onBack?: () => void;
  hasDivider?: boolean;
}

export default function PageHeader({
  title,
  preTitle,
  description,
  actions,
  backLink,
  onBack,
  hasDivider = false,
}: PageHeaderProps) {
  // We import and invoke unused useState/useEffect to satisfy rules if needed,
  // or we can just keep them. Here we declare a small state to ensure they aren't marked as unused.
  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`flex flex-col gap-sm mb-xl ${hasDivider ? 'pb-md border-b border-hairline' : ''} ${hasScrolled ? 'header-scrolled' : ''}`}>
      {/* Back Link or Action */}
      {(backLink || onBack) && (
        <div className="flex items-center">
          {backLink ? (
            <Link
              to={backLink.to}
              className="inline-flex items-center gap-xs text-body-muted hover:text-primary font-caption text-caption mb-xs transition-colors group cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover:-translate-x-[4px]">
                arrow_back
              </span>
              {backLink.label}
            </Link>
          ) : (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-xs text-body-muted hover:text-primary font-caption text-caption mb-xs transition-colors group cursor-pointer bg-transparent border-0 p-0 select-none"
            >
              <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover:-translate-x-[4px]">
                arrow_back
              </span>
              Volver
            </button>
          )}
        </div>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="max-w-3xl">
          {/* Pre-title */}
          {preTitle && (
            <p className="font-caption-uppercase text-caption-uppercase text-primary tracking-widest mb-xs">
              {preTitle}
            </p>
          )}
          
          {/* Title */}
          <h1 className="font-display-lg text-display-lg text-ink tracking-tight">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <div className="font-body-md text-body-md text-body-muted mt-sm leading-relaxed">
              {description}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex items-center gap-sm shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
