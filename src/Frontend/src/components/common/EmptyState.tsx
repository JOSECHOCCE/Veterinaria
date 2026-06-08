interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'folder_open',
  title = 'No hay registros',
  description = 'No se encontró información que coincida con los criterios de búsqueda.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-xl text-center max-w-md mx-auto my-xl bg-surface-card rounded-2xl border border-hairline shadow-sm">
      <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center text-body-muted mb-md border border-hairline shadow-inner">
        <span className="material-symbols-outlined text-[32px] text-body-muted/60">{icon}</span>
      </div>
      <h3 className="font-title-lg text-title-lg text-ink mb-xs">{title}</h3>
      <p className="font-body-sm text-body-sm text-body-muted mb-lg leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-primary-active text-on-primary font-button text-button px-lg py-2.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-xs cursor-pointer hover:-translate-y-[1px]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
