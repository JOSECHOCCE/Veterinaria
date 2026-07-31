import React from 'react';

export interface KpiCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  badgeText?: string;
  icon: React.ReactNode;
  variant: 'orange' | 'blue' | 'green' | 'purple' | 'rose';
  onClick?: () => void;
}

const variantStyles: Record<KpiCardProps['variant'], { cardBg: string; border: string; text: string; iconBg: string }> = {
  orange: {
    cardBg: 'bg-orange-50/80 hover:bg-orange-50',
    border: 'border-orange-200/60',
    text: 'text-orange-950',
    iconBg: 'bg-orange-500/10 text-orange-600',
  },
  blue: {
    cardBg: 'bg-blue-50/80 hover:bg-blue-50',
    border: 'border-blue-200/60',
    text: 'text-blue-950',
    iconBg: 'bg-blue-500/10 text-blue-600',
  },
  green: {
    cardBg: 'bg-emerald-50/80 hover:bg-emerald-50',
    border: 'border-emerald-200/60',
    text: 'text-emerald-950',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
  },
  purple: {
    cardBg: 'bg-purple-50/80 hover:bg-purple-50',
    border: 'border-purple-200/60',
    text: 'text-purple-950',
    iconBg: 'bg-purple-500/10 text-purple-600',
  },
  rose: {
    cardBg: 'bg-rose-50/80 hover:bg-rose-50',
    border: 'border-rose-200/60',
    text: 'text-rose-950',
    iconBg: 'bg-rose-500/10 text-rose-600',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  amount,
  subtitle,
  badgeText,
  icon,
  variant,
  onClick,
}) => {
  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer select-none flex flex-col justify-between ${style.cardBg} ${style.border} ${style.text}`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold uppercase tracking-wider opacity-75">{title}</span>
        <div className={`p-2.5 rounded-xl ${style.iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none">{amount}</h3>

        {(subtitle || badgeText) && (
          <div className="flex items-center justify-between mt-3 text-xs font-medium opacity-80">
            <span>{subtitle}</span>
            {badgeText && (
              <span className="px-2.5 py-1 rounded-full bg-white/90 shadow-2xs font-semibold">
                {badgeText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
