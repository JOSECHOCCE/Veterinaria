import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { Duplicado } from '../../services/clientes.service';

export default function RegistrarCliente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Duplicate Check State
  const [duplicados, setDuplicados] = useState<Duplicado[]>([]);
  const [ignorarDuplicados, setIgnorarDuplicados] = useState(false);

  const handleFieldBlur = async (field: 'dni' | 'email' | 'telefono', value: string) => {
    if (!value.trim()) return;
    try {
      const params = {
        dni: field === 'dni' ? value : undefined,
        email: field === 'email' ? value : undefined,
        telefono: field === 'telefono' ? value : undefined,
      };
      const response = await ClientesService.checkDuplicates(params);
      if (response.success && response.data && response.data.length > 0) {
        // Merge duplicates avoiding repeats
        setDuplicados(prev => {
          const merged = [...prev];
          response.data.forEach((d: Duplicado) => {
            if (!merged.some(m => m.tipo === d.tipo && m.valor === d.valor)) {
              merged.push(d);
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error('Error al validar duplicados:', err);
    }
  };

  const handleSave = async (e: FormEvent, redirectFicha = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dto = {
        nombre,
        dni: dni.trim() || undefined,
        email: email.trim() || undefined,
        telefono,
        direccion: direccion.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        ignorarDuplicados,
      };

      const response = await ClientesService.registrarCliente(dto);
      if (response.success) {
        toast.success(response.message || 'Cliente registrado exitosamente.');
        if (redirectFicha && response.data?.id) {
          navigate(`/admin/clientes/${response.data.id}`);
        } else {
          navigate('/admin/clientes');
        }
      } else {
        toast.error(response.message || 'No se pudo guardar el cliente.');
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data && !data.success && data.data && Array.isArray(data.data)) {
        setDuplicados(data.data);
        toast.warning('Se detectaron posibles registros duplicados. Revise las advertencias.');
      } else {
        toast.error(data?.message || 'Error de red al guardar cliente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl w-full mx-auto px-gutter py-12"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Breadcrumb Back Link */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/clientes')}
          className="inline-flex items-center gap-1.5 text-body-muted hover:text-primary font-caption text-caption mb-4 transition-colors cursor-pointer bg-transparent border-none outline-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver a Clientes
        </button>
        <h2 className="font-display-lg text-display-lg text-ink mb-2">Registrar Cliente</h2>
        <p className="text-body-md text-body-muted max-w-2xl">
          Complete la información requerida para dar de alta a un nuevo propietario de mascota en el sistema clínico.
        </p>
      </div>

      {/* Warnings / Duplicates Alert */}
      {duplicados.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-title-sm text-amber-800 font-semibold mb-1">
                Advertencia de Duplicado Detectada
              </h4>
              <p className="text-body-sm text-amber-700 leading-relaxed mb-3">
                Los siguientes campos ingresados ya se encuentran registrados en la base de datos:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-body-sm text-amber-800">
                {duplicados.map((dup, idx) => (
                  <li key={idx}>
                    El <strong>{dup.tipo === 'DNI' ? 'DNI' : dup.tipo === 'Telefono' ? 'Teléfono' : 'Email'}</strong>{' '}
                    ({dup.valor}) pertenece al cliente{' '}
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/clientes/${dup.clienteExistenteId}`)}
                      className="underline text-primary hover:text-[#75331c] font-semibold cursor-pointer"
                    >
                      {dup.clienteExistenteNombre}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="h-[1px] bg-amber-200 my-1" />
          <div className="flex items-center gap-2">
            <input
              id="bypass"
              type="checkbox"
              checked={ignorarDuplicados}
              onChange={(e) => setIgnorarDuplicados(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              style={{ accentColor: '#8f482f' }}
            />
            <label htmlFor="bypass" className="text-body-sm text-amber-950 cursor-pointer font-medium select-none">
              Ignorar advertencias y guardar de todas formas
            </label>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={(e) => handleSave(e, false)} className="space-y-6">
        
        {/* Section 1: Datos Personales */}
        <div className="bg-surface-card rounded-xl p-6 md:p-8 shadow-sm border border-hairline relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant transition-colors group-hover:bg-primary/30" />
          <h3 className="font-title-lg text-title-lg text-ink mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Datos Personales
          </h3>
          <p className="text-body-sm text-body-muted mb-6">Información de identidad primaria del propietario.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Nombre Completo */}
            <div className="md:col-span-2">
              <label className="block font-title-sm text-ink mb-1" htmlFor="nombre">
                Nombre Completo <span className="text-error font-bold">*</span>
              </label>
              <input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Mariana de las Mercedes Gómez"
                required
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                type="text"
              />
            </div>

            {/* Documento DNI */}
            <div>
              <label className="block font-title-sm text-ink mb-1" htmlFor="dni">
                Documento (DNI/Pasaporte)
              </label>
              <input
                id="dni"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onBlur={() => handleFieldBlur('dni', dni)}
                placeholder="Ej. 34.567.890"
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                type="text"
              />
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="block font-title-sm text-ink mb-1" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleFieldBlur('email', email)}
                placeholder="mariana.gomez@ejemplo.com"
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                type="email"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Datos de Contacto */}
        <div className="bg-surface-card rounded-xl p-6 md:p-8 shadow-sm border border-hairline relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant transition-colors group-hover:bg-accent-amber/30" />
          <h3 className="font-title-lg text-title-lg text-ink mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-amber" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a20.373 20.373 0 0 1-6.708-6.708c-.154-.441.012-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Datos de Contacto
          </h3>
          <p className="text-body-sm text-body-muted mb-6">Información para notificaciones clínicas y facturación.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Teléfono */}
            <div className="md:col-span-1">
              <label className="block font-title-sm text-ink mb-1" htmlFor="telefono">
                Teléfono Principal <span className="text-error font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-body-muted pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a20.373 20.373 0 0 1-6.708-6.708c-.154-.441.012-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </span>
                <input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  onBlur={() => handleFieldBlur('telefono', telefono)}
                  placeholder="+34 600 000 000"
                  required
                  className="w-full bg-canvas border border-hairline rounded-lg pl-11 pr-4 py-3 text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                  type="tel"
                />
              </div>
            </div>

            {/* Dirección Residencial */}
            <div className="md:col-span-2">
              <label className="block font-title-sm text-ink mb-1" htmlFor="direccion">
                Dirección Residencial
              </label>
              <input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Av. del Libertador 1234, Piso 5A"
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                type="text"
              />
            </div>

            {/* Observaciones Administrativas */}
            <div className="md:col-span-2">
              <label className="block font-title-sm text-ink mb-1" htmlFor="observaciones">
                Observaciones Administrativas
              </label>
              <textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value.slice(0, 250))}
                placeholder="Ej. Prefiere contacto por WhatsApp para recordatorios..."
                rows={3}
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none"
              />
              <p className="text-caption text-body-muted mt-1 text-right">
                {observaciones.length} / 250
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-4 border-t border-hairline">
          <button
            type="button"
            onClick={() => navigate('/admin/clientes')}
            className="w-full sm:w-auto px-6 py-3 font-button text-button text-ink bg-transparent border border-ink rounded-lg hover:bg-surface-soft hover:shadow-sm transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 font-button text-button text-ink bg-transparent border border-ink rounded-lg hover:bg-surface-soft hover:shadow-sm transition-all cursor-pointer"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSave(e, true)}
            className="w-full sm:w-auto px-6 py-3 font-button text-button text-white bg-primary rounded-lg hover:bg-[#75331c] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {loading ? 'Procesando...' : 'Guardar y abrir ficha'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
