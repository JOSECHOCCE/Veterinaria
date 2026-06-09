import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalClienteService from '../../services/portalCliente.service';
import notificacionesService from '../../services/notificaciones.service';
import { toast } from 'sonner';
import PageHeader from '../../components/common/PageHeader';

export default function PreferenciasNotificacion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [recibirRecordatorios, setRecibirRecordatorios] = useState(true);
  const [initialValue, setInitialValue] = useState(true);

  const fetchPreferencias = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PortalClienteService.getMiPerfil();
      if (res.success && res.data) {
        const val = res.data.recibirRecordatorios ?? true;
        setRecibirRecordatorios(val);
        setInitialValue(val);
      } else {
        setError(res.message || 'Error al obtener tus preferencias de notificación.');
      }
    } catch (err: any) {
      console.error('Error fetching profile preferences:', err);
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferencias();
  }, []);

  const handleDiscard = () => {
    setRecibirRecordatorios(initialValue);
    toast.info('Cambios descartados');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await notificacionesService.actualizarPreferencias(recibirRecordatorios);
      if (res.success) {
        setInitialValue(recibirRecordatorios);
        toast.success(res.message || 'Preferencias guardadas correctamente');
      } else {
        toast.error(res.message || 'Error al guardar las preferencias');
      }
    } catch (err: any) {
      console.error('Error saving notification preferences:', err);
      toast.error(err.response?.data?.message || 'Error al guardar los cambios en el servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4 max-w-3xl mx-auto">
        <div className="h-20 bg-surface-card rounded-lg w-full"></div>
        <div className="h-64 bg-surface-card rounded-xl w-full mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6 max-w-3xl mx-auto">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Error al cargar preferencias</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={fetchPreferencias}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-10 select-none">
      
      {/* Page Header */}
      <PageHeader
        title="Preferencias de Notificación"
        description="Gestiona cómo y cuándo VetCare Pro se comunica contigo. Ajusta tus alertas para mantenerte informado sobre la salud de tus mascotas sin saturar tu bandeja de entrada."
        backLink={{ to: '/cliente/mi-perfil', label: 'Volver a Mi Perfil' }}
        hasDivider={true}
      />

      {/* Settings Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* Card Container */}
        <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden shadow-sm">
          
          {/* Item 1: Citas y Atención (Locked) */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-hairline bg-surface-soft/40">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-title-md text-title-md text-ink font-bold">Citas y Atención</h3>
                <span className="material-symbols-outlined text-body-muted text-[18px]" title="Obligatorio para la operación">
                  lock
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-body-muted leading-relaxed max-w-xl">
                Recordatorios esenciales de citas programadas, confirmaciones y avisos de llegada. Estas notificaciones son necesarias para el correcto funcionamiento de nuestro servicio clínico y no pueden desactivarse.
              </p>
            </div>
            
            <div className="flex items-center h-full pt-1">
              {/* Toggle Switch Bloqueado Activo */}
              <div className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-primary/40">
                <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-5 rounded-full bg-surface-card shadow ring-0 transition duration-200 ease-in-out" />
              </div>
            </div>
          </div>

          {/* Item 2: Comunicaciones Clínicas (Editable) */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-hairline hover:bg-surface-soft/30 transition-colors duration-200">
            <div className="flex-1">
              <h3 className="font-title-md text-title-md text-ink font-bold mb-1.5">Comunicaciones Clínicas</h3>
              <p className="font-body-sm text-body-sm text-body-muted leading-relaxed max-w-xl">
                Recibe alertas sobre campañas de vacunación estacionales, consejos de salud preventiva, boletines informativos y recomendaciones personalizadas para tus mascotas.
              </p>
            </div>
            
            <div className="flex items-center h-full pt-1">
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setRecibirRecordatorios(!recibirRecordatorios)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  recibirRecordatorios ? 'bg-primary' : 'bg-secondary-fixed-dim'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    recibirRecordatorios ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Item 3: Administración de Cuenta (Locked) */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 bg-surface-soft/40 hover:bg-surface-soft/30 transition-colors duration-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-title-md text-title-md text-ink font-bold">Administración de Cuenta</h3>
                <span className="material-symbols-outlined text-body-muted text-[18px]" title="Obligatorio para la cuenta">
                  lock
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-body-muted leading-relaxed max-w-xl">
                Alertas relacionadas con el estado de tu cuenta, avisos de saldos pendientes, resúmenes de facturación y cambios importantes en nuestras políticas de servicio.
              </p>
            </div>
            
            <div className="flex items-center h-full pt-1">
              {/* Toggle Switch Bloqueado Activo */}
              <div className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-primary/40">
                <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-5 rounded-full bg-surface-card shadow ring-0 transition duration-200 ease-in-out" />
              </div>
            </div>
          </div>

        </div>

        {/* Action Area */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 mt-4 pt-6 border-t border-hairline">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-full font-button text-button text-ink bg-transparent border border-ink hover:bg-surface-card transition-colors duration-200 cursor-pointer disabled:opacity-50"
          >
            Descartar cambios
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 rounded-full font-button text-button text-on-primary bg-primary hover:bg-surface-tint transition-colors duration-200 shadow-sm cursor-pointer disabled:bg-primary-disabled"
          >
            {saving ? 'Guardando preferencias...' : 'Guardar preferencias'}
          </button>
        </div>

      </form>
    </div>
  );
}
