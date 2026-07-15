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
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-[1400px] mx-auto w-full relative">
      
      {/* Fondo con Orbes Difuminados Tridimensionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[45%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-teal/5 blur-[120px]" />
      </div>

      {/* Header Area */}
      <header className="mb-8 pb-4 border-b border-surface-variant/40">
        <h2 className="text-3xl font-bold text-on-surface">Mi Perfil</h2>
        <p className="text-xs font-medium text-on-surface-variant mt-1">Administra tus datos personales, información de contacto y configuración de seguridad.</p>
      </header>

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Alertas */}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <p className="text-xs font-bold">{successMsg}</p>
          </div>
        )}
        {formError && (
          <div className="bg-error-container/85 text-on-error-container border border-error/15 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="text-xs font-bold">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Información Personal */}
          <div className="lg:col-span-8 bg-white border border-primary/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-background flex items-center gap-2 border-b border-surface-variant/30 pb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
              Información Personal
            </h3>

            {/* Foto de Perfil */}
            <div className="flex items-center gap-6 pb-6 border-b border-surface-variant/20">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md group shrink-0">
                <img
                  alt="Avatar del cliente"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                />
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                </button>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-background">Foto de Perfil</h4>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-normal font-medium">
                  Resolución recomendada: Cuadrada, JPG o PNG de al menos 400x400 píxeles.
                </p>
              </div>
            </div>

            {/* Campos del Formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface-variant">Nombre Completo</span>
                <input
                  type="text"
                  disabled
                  value={nombre}
                  className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface-variant font-medium text-xs cursor-not-allowed outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface-variant">Documento (DNI)</span>
                <input
                  type="text"
                  disabled
                  value={dni || '—'}
                  className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface-variant font-medium text-xs cursor-not-allowed outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs font-bold text-on-surface-variant flex justify-between items-center">
                  <span>Correo Electrónico</span>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-sm cursor-help" title="Contacta al soporte para cambiar tu correo">help</span>
                </span>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface-variant font-medium text-xs cursor-not-allowed outline-none"
                  />
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[18px]">lock</span>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface">Teléfono de Contacto *</span>
                <input
                  id="user-phone"
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-background font-medium text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface">Dirección de Domicilio</span>
                <input
                  id="user-address"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. Larco 123, Miraflores"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-background font-medium text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </label>

            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
              >
                {submitting ? 'Guardando...' : 'Actualizar Perfil'}
              </button>
            </div>
          </div>

          {/* Columna Derecha: Seguridad y Estado */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Tarjeta de Seguridad */}
            <div className="bg-white border border-primary/10 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-on-background flex items-center gap-2 border-b border-surface-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary text-[22px]">security</span>
                Seguridad
              </h3>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant">Contraseña Actual</span>
                  <input
                    id="curr-pass"
                    type="password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-background font-medium text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant">Nueva Contraseña</span>
                  <input
                    id="new-pass"
                    type="password"
                    value={passwordNuevo}
                    onChange={(e) => setPasswordNuevo(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-background font-medium text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant">Confirmar Contraseña</span>
                  <input
                    id="conf-pass"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Repite contraseña"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-background font-medium text-xs focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white hover:bg-surface-soft text-primary border-2 border-primary py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60 mt-2"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  Actualizar Contraseña
                </button>
              </div>
            </div>

            {/* Tarjeta de Estado de Cuenta */}
            <div className="bg-primary-container/10 text-on-primary-container border border-primary/15 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-sm">
              <div className="absolute -right-4 -top-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">verified_user</span>
              </div>
              <div className="relative z-10">
                <h4 className="font-bold text-sm mb-1">Estado de Cuenta</h4>
                <p className="text-xs font-medium text-on-surface-variant/80 leading-normal mb-4">
                  Tu cuenta está completamente verificada y protegida con seguridad premium.
                </p>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  Usuario Verificado
                </span>
              </div>
            </div>

          </div>

          {/* Preferencias de Comunicación (Ancho Completo) */}
          <div className="lg:col-span-12 bg-white border border-primary/10 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-on-background flex items-center gap-2 border-b border-surface-variant/30 pb-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[22px]">notifications</span>
              Preferencias de Comunicación
            </h3>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-surface-container-low/30 border border-outline-variant/30 rounded-2xl p-6">
              <div>
                <h4 className="font-bold text-sm text-on-background">Canales y Alertas</h4>
                <p className="text-xs text-on-surface-variant font-medium mt-1.5 max-w-2xl leading-relaxed">
                  Configura cómo y cuándo deseas recibir avisos de citas, campañas de vacunación y boletines informativos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/cliente/preferencias-notificaciones')}
                className="bg-transparent border border-primary text-primary hover:bg-primary/5 font-bold text-xs px-5 py-3 rounded-full transition-all shrink-0 cursor-pointer active:scale-95"
              >
                Configurar Notificaciones
              </button>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}
