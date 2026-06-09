import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalClienteService from '../../services/portalCliente.service';
import type { ActualizarPerfilPortalDto } from '../../services/portalCliente.service';
import PageHeader from '../../components/common/PageHeader';

export default function MiPerfil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  // Password change states
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PortalClienteService.getMiPerfil();
      if (res.success && res.data) {
        const p = res.data;
        setNombre(p.nombre || '');
        setEmail(p.email || '');
        setDni(p.documentoIdentidad || '');
        setTelefono(p.telefono || '');
        setDireccion(p.direccion || '');
      } else {
        setError(res.message || 'Error al obtener la información de tu perfil.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfil();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setFormError(null);

    // Validación de contraseñas si el usuario intenta cambiarlas
    if (passwordNuevo || passwordConfirm || passwordActual) {
      if (!passwordActual) {
        setFormError('Debes ingresar tu contraseña actual para realizar cambios de seguridad.');
        return;
      }
      if (!passwordNuevo) {
        setFormError('Debes ingresar la nueva contraseña.');
        return;
      }
      if (passwordNuevo !== passwordConfirm) {
        setFormError('La nueva contraseña y su confirmación no coinciden.');
        return;
      }
      if (passwordNuevo.length < 6) {
        setFormError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: ActualizarPerfilPortalDto = {
        telefono: telefono.trim(),
        direccion: direccion.trim()
      };

      if (passwordActual && passwordNuevo) {
        payload.passwordActual = passwordActual;
        payload.passwordNuevo = passwordNuevo;
      }

      const res = await PortalClienteService.actualizarPerfil(payload);
      if (res.success) {
        setSuccessMsg(res.message || 'Perfil actualizado exitosamente.');
        // Limpiar campos de contraseña
        setPasswordActual('');
        setPasswordNuevo('');
        setPasswordConfirm('');
      } else {
        setFormError(res.message || 'Error al actualizar el perfil.');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar los cambios en el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-20 bg-surface-card rounded-lg w-full"></div>
        <div className="h-96 bg-surface-card rounded-xl w-full mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 flex flex-col items-center gap-4 text-center my-6">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <div>
          <h3 className="font-title-lg text-title-lg font-bold">Error al cargar perfil</h3>
          <p className="font-body-md text-body-md mt-1">{error}</p>
        </div>
        <button
          onClick={fetchPerfil}
          className="bg-error text-on-error font-button text-button px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Header */}
      <PageHeader
        title="Mi Perfil"
        description="Administra tus datos de contacto y actualiza tu contraseña de acceso de forma segura."
        hasDivider={true}
      />

      {/* Formulario de Perfil */}
      <div className="bg-surface-card border border-hairline rounded-xl p-6 shadow-sm max-w-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Alertas */}
          {successMsg && (
            <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              {successMsg}
            </div>
          )}
          {formError && (
            <div className="bg-error-container border border-error/15 text-on-error-container p-4 rounded-lg text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {formError}
            </div>
          )}

          {/* Sección: Datos Personales (Lectura) */}
          <div>
            <h3 className="font-title-md text-title-md text-primary font-bold border-b border-hairline pb-2 mb-4">
              Información de la Cuenta
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-body-muted uppercase tracking-wider">Nombre Completo</span>
                <span className="bg-canvas border border-hairline/60 text-body-muted px-4 py-2.5 rounded-lg text-body-md font-semibold select-all">
                  {nombre}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-body-muted uppercase tracking-wider">Documento (DNI)</span>
                <span className="bg-canvas border border-hairline/60 text-body-muted px-4 py-2.5 rounded-lg text-body-md font-semibold select-all">
                  {dni || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[12px] font-bold text-body-muted uppercase tracking-wider">Correo Electrónico (Solo Lectura)</span>
                <span className="bg-canvas border border-hairline/60 text-body-muted px-4 py-2.5 rounded-lg text-body-md font-semibold select-all">
                  {email}
                </span>
              </div>
            </div>
          </div>

          {/* Sección: Datos de Contacto (Editables) */}
          <div>
            <h3 className="font-title-md text-title-md text-primary font-bold border-b border-hairline pb-2 mb-4">
              Datos de Contacto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="user-phone" className="font-label-sm text-ink font-semibold">
                  Teléfono de Contacto *
                </label>
                <input
                  id="user-phone"
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="user-address" className="font-label-sm text-ink font-semibold">
                  Dirección de Domicilio
                </label>
                <input
                  id="user-address"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. Larco 123, Miraflores"
                  className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sección: Cambio de Contraseña */}
          <div>
            <h3 className="font-title-md text-title-md text-primary font-bold border-b border-hairline pb-2 mb-4">
              Seguridad y Contraseña
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="curr-pass" className="font-label-sm text-ink font-semibold">
                  Contraseña Actual
                </label>
                <input
                  id="curr-pass"
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="new-pass" className="font-label-sm text-ink font-semibold">
                  Nueva Contraseña
                </label>
                <input
                  id="new-pass"
                  type="password"
                  value={passwordNuevo}
                  onChange={(e) => setPasswordNuevo(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="conf-pass" className="font-label-sm text-ink font-semibold">
                  Confirmar Contraseña
                </label>
                <input
                  id="conf-pass"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repite contraseña"
                  className="w-full bg-surface border border-hairline rounded-lg px-4 py-2.5 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sección: Preferencias de Notificación */}
          <div>
            <h3 className="font-title-md text-title-md text-primary font-bold border-b border-hairline pb-2 mb-4">
              Preferencias de Comunicación
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-soft border border-hairline rounded-lg p-4">
              <div>
                <h4 className="font-semibold text-ink text-body-md">Canales y Alertas</h4>
                <p className="text-body-sm text-body-muted mt-1">
                  Configura cómo y cuándo deseas recibir avisos de citas, campañas de vacunación y boletines informativos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/cliente/preferencias-notificaciones')}
                className="bg-transparent border border-primary text-primary hover:bg-primary/5 font-button text-button px-5 py-2.5 rounded-full transition-all shrink-0 cursor-pointer"
              >
                Configurar Notificaciones
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="pt-4 border-t border-hairline flex justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-active disabled:bg-primary-disabled text-on-primary font-button text-button px-8 py-3 rounded-full transition-all shadow-sm cursor-pointer"
            >
              {submitting ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
