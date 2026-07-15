import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { Duplicado } from '../../services/clientes.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';

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
    <div className="flex-1 flex flex-col min-w-0 p-6 md:pt-4 md:px-10 md:pb-10 max-w-4xl w-full mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Editar Cliente"
        description={`Modifique los campos correspondientes para actualizar la ficha de ${nombre}.`}
        backLink={{ to: `/admin/clientes/${clientId}`, label: 'Volver a la Ficha' }}
      />

      {/* Warning Box for Duplicates */}
      {duplicados.length > 0 && (
        <motion.div
          className="mb-6 p-4 bg-tertiary-fixed rounded-lg border border-tertiary-fixed-dim flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="material-symbols-outlined text-on-tertiary-fixed mt-0.5">warning</span>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-on-tertiary-fixed mb-1">Posible Cliente Duplicado</h4>
            <p className="text-xs text-on-tertiary-fixed-variant mb-2">
              Los datos modificados coinciden con otros clientes del sistema:
            </p>
            <ul className="list-disc list-inside text-xs text-on-tertiary-fixed-variant space-y-1 pl-1 mb-3">
              {duplicados.map((dup, idx) => (
                <li key={idx}>
                  El <strong className="text-on-tertiary-fixed">{dup.tipo}</strong> ({dup.valor}) ya está registrado por{' '}
                  <Link
                    to={`/admin/clientes/${dup.clienteExistenteId}`}
                    className="underline font-semibold hover:text-primary"
                    target="_blank"
                  >
                    {dup.clienteExistenteNombre}
                  </Link>
                </li>
              ))}
            </ul>
            <label className="flex items-center gap-2 text-xs text-on-tertiary-fixed font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignorarDuplicados}
                onChange={(e) => setIgnorarDuplicados(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary border-outline-variant rounded"
              />
              Ignorar advertencia de duplicados y proceder
            </label>
          </div>
        </motion.div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Datos Personales (Bento Card Style) */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 md:p-8 shadow-sm">
          <h3 className="font-bold text-lg text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined icon-fill">person</span>
            Información Principal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Completo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-on-surface-variant mb-2" htmlFor="nombre">
                Nombre Completo <span className="text-error">*</span>
              </label>
              <input
                className="w-full h-12 px-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors text-sm"
                id="nombre"
                placeholder="Ej. María González Pérez"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2" htmlFor="telefono">
                Teléfono de Contacto <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  call
                </span>
                <input
                  className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors text-sm"
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
            {/* Documento (DNI/NIE) */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2" htmlFor="documento">
                Documento de Identidad (DNI/NIE) <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  badge
                </span>
                <input
                  className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors text-sm"
                  id="documento"
                  placeholder="Ej. 00000000A"
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => {
                    setDni(e.target.value);
                    setIgnorarDuplicados(false);
                  }}
                />
              </div>
            </div>
            {/* Correo Electrónico */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-on-surface-variant mb-2" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  mail
                </span>
                <input
                  className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors text-sm"
                  id="email"
                  placeholder="maria.gonzalez@ejemplo.com"
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
        </div>

        {/* Section 2: Detalles Adicionales (Bento Card Style) */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 md:p-8 shadow-sm">
          <h3 className="font-bold text-lg text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined icon-fill">home</span>
            Detalles Adicionales
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {/* Dirección */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2" htmlFor="direccion">
                Dirección Residencial
              </label>
              <input
                className="w-full h-12 px-4 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors text-sm"
                id="direccion"
                placeholder="Calle Ejemplo 123, Piso 4A, Ciudad"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
            {/* Observaciones */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-on-surface-variant" htmlFor="observaciones">
                  Notas / Observaciones de Recepción
                </label>
                <span className="text-xs text-on-surface-variant font-medium">
                  {observaciones.length} / 250
                </span>
              </div>
              <textarea
                className="w-full min-h-[100px] px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant transition-colors text-sm resize-y"
                id="observaciones"
                placeholder="Información relevante sobre el cliente, preferencias de contacto, etc."
                maxLength={250}
                rows={4}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-surface-variant">
          <Link to={`/admin/clientes/${clientId}`} className="w-full sm:w-auto">
            <button
              className="w-full h-12 px-6 rounded-lg font-medium text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              type="button"
            >
              Cancelar
            </button>
          </Link>
          <button
            disabled={saving}
            className="w-full sm:w-auto h-12 px-8 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-active transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 duration-200"
            type="submit"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
