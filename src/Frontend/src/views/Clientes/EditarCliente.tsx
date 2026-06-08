import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { Duplicado } from '../../services/clientes.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function EditarCliente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = Number(id);

  // Form Fields
  const [nombre, setNombre] = useState<string>('');
  const [dni, setDni] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Operational states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicados, setDuplicados] = useState<Duplicado[]>([]);
  const [ignorarDuplicados, setIgnorarDuplicados] = useState<boolean>(false);

  // Load client details to edit
  const loadClient = useCallback(async () => {
    if (isNaN(clientId)) {
      setError('Identificador de cliente no válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await ClientesService.getClienteDetails(clientId);
      if (response.success && response.data?.usuario) {
        const u = response.data.usuario;
        setNombre(u.nombre || '');
        setDni(u.dni || '');
        setEmail(u.email || '');
        setTelefono(u.telefono || '');
        setDireccion(u.direccion || '');
        setObservaciones(u.observaciones || '');
      } else {
        setError(response.message || 'No se pudieron recuperar los datos del cliente.');
      }
    } catch (err: any) {
      console.error('Error fetching client details for edit:', err);
      setError('Error al obtener la información de cliente desde el servidor.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !telefono.trim() || !dni.trim()) {
      toast.error('Por favor, rellene todos los campos obligatorios (*).');
      return;
    }

    setSaving(true);
    setDuplicados([]);

    try {
      // 1. Check for duplicates (excluding the current client ID) if bypass is not checked
      if (!ignorarDuplicados) {
        const dupRes = await ClientesService.checkDuplicates({
          dni: dni.trim(),
          email: email.trim() || undefined,
          telefono: telefono.trim(),
          excluirId: clientId,
        });

        const dups = dupRes.data || [];
        if (dups.length > 0) {
          setDuplicados(dups);
          setSaving(false);
          toast.warning('Se detectaron coincidencias con otros clientes.');
          return;
        }
      }

      // 2. Submit update
      await ClientesService.editarCliente(clientId, {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        dni: dni.trim(),
        direccion: direccion.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        ignorarDuplicados: ignorarDuplicados,
      });

      toast.success('Cambios guardados correctamente');
      navigate(`/admin/clientes/${clientId}`);
    } catch (err: any) {
      console.error('Error updating client:', err);
      const errorMsg = err.response?.data?.message || 'No se pudo guardar la información en el servidor.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner message="Obteniendo datos del propietario..." />;
  }

  if (error) {
    return <ErrorMessage title="Error de Carga" message={error} onRetry={loadClient} />;
  }

  return (
    <div className="max-w-4xl w-full mx-auto py-md flex-1">
      {/* Page Header */}
      <div className="mb-xl">
        <Link
          to={`/admin/clientes/${clientId}`}
          className="inline-flex items-center gap-xs text-body-muted hover:text-primary font-caption text-caption mb-md transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver a la Ficha
        </Link>
        <h2 className="font-display-lg text-display-lg text-ink">Editar Cliente</h2>
        <p className="font-body-md text-body-md text-body-muted mt-2 max-w-2xl">
          Modifique los campos correspondientes para actualizar la ficha de {nombre}.
        </p>
      </div>

      {/* Warning Box for Duplicates */}
      {duplicados.length > 0 && (
        <motion.div
          className="mb-lg p-lg bg-accent-amber/10 border border-accent-amber rounded-xl flex flex-col gap-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-sm text-accent-amber">
            <span className="material-symbols-outlined text-[24px]">warning</span>
            <h4 className="font-title-md text-title-md font-bold">Advertencia de Coincidencias</h4>
          </div>
          <p className="font-body-sm text-body-sm text-body-strong leading-relaxed">
            Los datos modificados coinciden con otros clientes del sistema:
          </p>
          <ul className="list-disc list-inside font-body-sm text-body-muted space-y-xxs pl-xs">
            {duplicados.map((dup, idx) => (
              <li key={idx}>
                El <strong className="text-ink">{dup.tipo}</strong> ({dup.valor}) ya está registrado por{' '}
                <Link
                  to={`/admin/clientes/${dup.clienteExistenteId}`}
                  className="text-primary hover:underline font-semibold"
                  target="_blank"
                >
                  {dup.clienteExistenteNombre}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-md flex items-center gap-sm">
            <label className="flex items-center gap-xs font-body-sm text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignorarDuplicados}
                onChange={(e) => setIgnorarDuplicados(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary border-hairline rounded"
              />
              Ignorar advertencia de duplicados y proceder
            </label>
          </div>
        </motion.div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Section 1: Datos Personales (Bento Card Style) */}
        <div className="bg-surface-card rounded-xl p-xl shadow-sm border border-hairline relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant transition-colors group-hover:bg-primary/20" />
          <h3 className="font-title-lg text-title-lg text-ink mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
            Datos Personales
          </h3>
          <p className="font-body-sm text-body-sm text-body-muted mb-lg">
            Información de identidad primaria del propietario.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-lg gap-y-md">
            {/* Nombre Completo */}
            <div className="md:col-span-2">
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="nombre">
                Nombre Completo <span className="text-error">*</span>
              </label>
              <input
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 font-body-md text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                id="nombre"
                placeholder="Ej. Mariana de las Mercedes Gómez"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            {/* Documento */}
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="documento">
                Documento (DNI/Pasaporte) <span className="text-error">*</span>
              </label>
              <input
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 font-body-md text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                id="documento"
                placeholder="Ej. 34.567.890"
                type="text"
                required
                value={dni}
                onChange={(e) => {
                  setDni(e.target.value);
                  setIgnorarDuplicados(false);
                }}
              />
            </div>
            {/* Correo Electrónico */}
            <div>
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 font-body-md text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                id="email"
                placeholder="mariana.gomez@ejemplo.com"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIgnorarDuplicados(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Datos de Contacto (Bento Card Style) */}
        <div className="bg-surface-card rounded-xl p-xl shadow-sm border border-hairline relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant transition-colors group-hover:bg-accent-amber/20" />
          <h3 className="font-title-lg text-title-lg text-ink mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-accent-amber" style={{ fontVariationSettings: "'FILL' 1" }}>
              contact_phone
            </span>
            Datos de Contacto
          </h3>
          <p className="font-body-sm text-body-sm text-body-muted mb-lg">
            Información para notificaciones clínicas y facturación.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-lg gap-y-md">
            {/* Teléfono */}
            <div className="md:col-span-1">
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="telefono">
                Teléfono Principal <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-body-muted">
                  <span className="material-symbols-outlined text-lg">call</span>
                </span>
                <input
                  className="w-full bg-canvas border border-hairline rounded-lg pl-12 pr-4 py-3 font-body-md text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                  id="telefono"
                  placeholder="+34 600 000 000"
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setIgnorarDuplicados(false);
                  }}
                />
              </div>
            </div>
            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block font-title-sm text-title-sm text-ink mb-xs" htmlFor="direccion">
                Dirección Residencial
              </label>
              <input
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 font-body-md text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                id="direccion"
                placeholder="Calle Mayor 42, 3ºB. Madrid"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
            {/* Observaciones */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-xs">
                <label className="block font-title-sm text-title-sm text-ink" htmlFor="observaciones">
                  Observaciones Administrativas
                </label>
                <span className="font-caption text-caption text-body-muted">
                  {observaciones.length} / 250
                </span>
              </div>
              <textarea
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 font-body-md text-body-md text-ink placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none"
                id="observaciones"
                placeholder="Ej. Prefiere contacto por WhatsApp para recordatorios..."
                maxLength={250}
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-md pt-md border-t border-hairline">
          <Link to={`/admin/clientes/${clientId}`}>
            <button
              className="w-full sm:w-auto px-lg py-3 font-button text-button text-ink bg-transparent border border-outline rounded-lg hover:bg-surface-soft hover:shadow-sm transition-all cursor-pointer"
              type="button"
            >
              Cancelar
            </button>
          </Link>
          <button
            disabled={saving}
            className="w-full sm:w-auto px-lg py-3 font-button text-button text-on-primary bg-primary rounded-lg hover:bg-primary-active shadow-sm hover:shadow transition-all flex items-center justify-center gap-sm disabled:opacity-50 cursor-pointer"
            type="submit"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
