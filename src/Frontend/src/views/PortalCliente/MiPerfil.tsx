import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MiPerfil: React.FC = () => {
  const { user, setUser } = useAuth();
  
  // Estados para datos de perfil
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [direccion, setDireccion] = useState('');
  
  // Estados para contraseñas
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Mostrar/Ocultar contraseñas
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Cargar perfil
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get('/api/Auth/profile');
        if (response.data.success) {
          const profile = response.data.data;
          setNombreCompleto(profile.nombreCompleto || '');
          setEmail(profile.email || '');
          setTelefono(profile.telefono || '');
          setDni(profile.dni || '');
          setDireccion(profile.direccion || '');
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        toast.error('No se pudo cargar la información del perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) {
      toast.error('El nombre completo es requerido.');
      return;
    }

    setUpdatingProfile(true);
    try {
      const response = await api.put('/api/Auth/profile', {
        nombreCompleto,
        telefono,
        dni,
        direccion
      });

      if (response.data.success) {
        toast.success('¡Perfil actualizado con éxito!');
        // Actualizar el estado de AuthContext para reflejar el cambio de nombre
        if (user) {
          const updatedUser = { ...user, nombreCompleto };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el perfil.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor completa todos los campos de contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await api.post('/api/Auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        toast.success('¡Contraseña actualizada correctamente!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar la contraseña. Revisa tu contraseña actual.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-sm">Cargando tu información de perfil...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="flex-grow w-full bg-background min-h-screen pt-24 pb-margin"
    >
      <main className="flex-grow w-full max-w-5xl mx-auto px-margin flex flex-col gap-md">
        
        {/* Cabecera del Perfil */}
        <section className="flex flex-col sm:flex-row items-center justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md gap-sm">
          <div className="flex items-center gap-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[40px] font-medium">person</span>
            </div>
            <div className="flex flex-col text-left">
              <h2 className="font-headline-xl text-headline-xl text-on-surface">{nombreCompleto || 'Cargando...'}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{email} • Rol: Cliente 🐾</p>
            </div>
          </div>
          <div className="flex items-center gap-xs px-sm py-xs bg-primary/10 text-primary rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-[16px]">security</span>
            <span className="font-label-md text-label-md">Cuenta Protegida</span>
          </div>
        </section>

        {/* Dos Columnas de Formularios */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-md">
          
          {/* Columna Izquierda: Datos Personales */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm"
          >
            <div className="border-b border-surface-variant pb-xs">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">badge</span>
                Datos Personales
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant">Mantén tus datos de contacto al día para la clínica.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-sm text-left">
              {/* Campo Nombre */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="nombre">Nombre Completo</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">person</span>
                  <input 
                    className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                    id="nombre" 
                    type="text" 
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    required
                    disabled={updatingProfile}
                  />
                </div>
              </div>

              {/* Campo Correo (Solo Lectura) */}
              <div className="flex flex-col gap-xs opacity-75">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="email-input">Correo Electrónico</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-high cursor-not-allowed">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">mail</span>
                  <input 
                    className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none cursor-not-allowed" 
                    id="email-input" 
                    type="email" 
                    value={email}
                    readOnly
                    disabled
                  />
                </div>
                <span className="font-label-sm text-[10px] text-outline ml-1">Por seguridad, el correo electrónico no puede cambiarse en línea.</span>
              </div>

              {/* Fila DNI y Teléfono */}
              <div className="grid grid-cols-2 gap-sm">
                {/* Campo DNI */}
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="dni">Documento (DNI)</label>
                  <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">fingerprint</span>
                    <input 
                      className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                      id="dni" 
                      type="text" 
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      disabled={updatingProfile}
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Campo Teléfono */}
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="telefono">Teléfono</label>
                  <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">call</span>
                    <input 
                      className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                      id="telefono" 
                      type="tel" 
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      disabled={updatingProfile}
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              {/* Campo Dirección */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="direccion">Dirección Domiciliaria</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">home_pin</span>
                  <input 
                    className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                    id="direccion" 
                    type="text" 
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    disabled={updatingProfile}
                  />
                </div>
              </div>

              {/* Botón Guardar Datos */}
              <motion.button 
                whileHover={!updatingProfile ? { scale: 1.01 } : {}}
                whileTap={!updatingProfile ? { scale: 0.99 } : {}}
                className={`w-full h-11 mt-xs font-label-md text-label-md rounded-xl flex items-center justify-center gap-xs transition-all shadow-sm font-bold cursor-pointer ${
                  updatingProfile 
                    ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/10 hover:shadow-md'
                }`}
                type="submit"
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                    <span>Actualizando...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Columna Derecha: Seguridad y Contraseña */}
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm"
          >
            <div className="border-b border-surface-variant pb-xs">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">lock_reset</span>
                Seguridad & Acceso
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant">Actualiza tu contraseña periódicamente para asegurar tu cuenta.</p>
            </div>

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-sm text-left">
              {/* Campo Contraseña Actual */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="curr-password">Contraseña Actual</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input 
                    className="w-full h-11 pl-10 pr-12 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                    id="curr-password" 
                    type={showCurrent ? 'text' : 'password'} 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={updatingPassword}
                    placeholder="••••••••"
                  />
                  <button 
                    className="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer" 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    disabled={updatingPassword}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showCurrent ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Campo Nueva Contraseña */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="new-password">Nueva Contraseña</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">password</span>
                  <input 
                    className="w-full h-11 pl-10 pr-12 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                    id="new-password" 
                    type={showNew ? 'text' : 'password'} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={updatingPassword}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button 
                    className="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer" 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    disabled={updatingPassword}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNew ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Campo Confirmar Contraseña */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="conf-password">Confirmar Contraseña</label>
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">shield_lock</span>
                  <input 
                    className="w-full h-11 pl-10 pr-12 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none" 
                    id="conf-password" 
                    type={showConfirm ? 'text' : 'password'} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={updatingPassword}
                    placeholder="Repite la nueva contraseña"
                  />
                  <button 
                    className="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer" 
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    disabled={updatingPassword}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirm ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Botón Guardar Contraseña */}
              <motion.button 
                whileHover={!updatingPassword ? { scale: 1.01 } : {}}
                whileTap={!updatingPassword ? { scale: 0.99 } : {}}
                className={`w-full h-11 mt-xs font-label-md text-label-md rounded-xl flex items-center justify-center gap-xs transition-all shadow-sm font-bold cursor-pointer ${
                  updatingPassword 
                    ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/10 hover:shadow-md'
                }`}
                type="submit"
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                    <span>Actualizando...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                    <span>Cambiar Contraseña</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

        </section>

      </main>
    </motion.div>
  );
};

export default MiPerfil;
