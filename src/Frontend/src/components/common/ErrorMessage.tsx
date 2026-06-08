interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  title = 'Ha ocurrido un error',
  message = 'No pudimos obtener la información en este momento. Por favor, compruebe su conexión de red e intente nuevamente.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-xl text-center max-w-md mx-auto my-xl bg-error-container/20 rounded-2xl border border-error-container">
      <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error mb-md shadow-sm">
        <span className="material-symbols-outlined text-[24px]">warning</span>
      </div>
      <h3 className="font-title-lg text-title-lg text-ink mb-xs">{title}</h3>
      <p className="font-body-sm text-body-sm text-body-muted mb-lg leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-primary hover:bg-primary-active text-on-primary font-button text-button px-lg py-2.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Reintentar
        </button>
      )}
    </div>
  );
}
