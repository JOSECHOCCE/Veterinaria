import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface Auditoria {
  id: number;
  usuarioId?: string;
  usuarioEmail?: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle?: string;
  fecha: string;
}

export default function AuditoriaView() {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterEntidad, setFilterEntidad] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');

  // Fila expandida
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchAuditorias = async () => {
    try {
      setLoading(true);
      setError(null);

      // Armar query params
      const params: any = {};
      if (filterEmail) params.usuarioEmail = filterEmail;
      if (filterAccion) params.accion = filterAccion;
      if (filterEntidad) params.entidad = filterEntidad;
      if (filterFechaInicio) params.fechaInicio = filterFechaInicio;
      if (filterFechaFin) params.fechaFin = filterFechaFin;

      const response = await api.get('/api/auditorias', { params });
      if (response.data?.succeeded) {
        setAuditorias(response.data.data);
      } else {
        setError('No se pudo recuperar la bitácora de auditorías.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorias();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditorias();
  };

  const handleLimpiar = () => {
    setFilterEmail('');
    setFilterAccion('');
    setFilterEntidad('');
    setFilterFechaInicio('');
    setFilterFechaFin('');
    // Al limpiar, volvemos a consultar sin parámetros
    setTimeout(() => {
      fetchAuditorias();
    }, 50);
  };

  const getAccionBadgeClass = (accion: string) => {
    const act = accion.toLowerCase();
    if (act.includes('crear') || act.includes('registrar') || act.includes('guardar')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
    }
    if (act.includes('editar') || act.includes('actualizar') || act.includes('modificar') || act.includes('reprogramar')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
    }
    if (act.includes('eliminar') || act.includes('anular') || act.includes('cancelar')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
    }
    if (act.includes('desactivar') || act.includes('inactivar')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700/50';
  };

  const getEntidadIcon = (entidad: string) => {
    switch (entidad.toLowerCase()) {
      case 'usuario':
        return 'person';
      case 'cita':
        return 'calendar_today';
      case 'pago':
        return 'payments';
      case 'mascota':
        return 'pets';
      case 'historial':
      case 'historialclinico':
        return 'clinical_notes';
      default:
        return 'policy';
    }
  };

  const toggleRow = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Bitácora de Auditoría del Sistema
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Registro cronológico e inmutable de las operaciones, modificaciones y cancelaciones críticas en la clínica.
        </p>
      </div>

      {/* Formulario de Filtros */}
      <form onSubmit={handleBuscar} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario / Email</label>
            <input
              type="text"
              placeholder="Ej. admin@test.com"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acción</label>
            <input
              type="text"
              placeholder="Ej. Crear, Desactivar"
              value={filterAccion}
              onChange={(e) => setFilterAccion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entidad</label>
            <select
              value={filterEntidad}
              onChange={(e) => setFilterEntidad(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
            >
              <option value="">Todas las entidades</option>
              <option value="Usuario">Usuario / Cuenta</option>
              <option value="Cita">Cita Médica</option>
              <option value="Pago">Pago / Transacción</option>
              <option value="Mascota">Mascota</option>
              <option value="Historial">Historial Clínico</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desde Fecha</label>
            <input
              type="date"
              value={filterFechaInicio}
              onChange={(e) => setFilterFechaInicio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hasta Fecha</label>
            <input
              type="date"
              value={filterFechaFin}
              onChange={(e) => setFilterFechaFin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200/30 dark:border-slate-800/30">
          <button
            type="button"
            onClick={handleLimpiar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">clear_all</span>
            Limpiar Filtros
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-bold shadow transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filtrar Bitácora
          </button>
        </div>
      </form>

      {/* Bitácora Lista */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-semibold animate-pulse">Cargando registros de auditoría...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
            <p className="font-semibold text-lg">{error}</p>
            <button 
              onClick={fetchAuditorias}
              className="mt-4 text-primary hover:underline text-sm font-bold flex items-center justify-center gap-1 mx-auto"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
            </button>
          </div>
        ) : auditorias.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">policy</span>
            <p className="font-semibold text-lg">Bitácora limpia</p>
            <p className="text-sm text-slate-400">No se encontraron registros de auditoría con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 w-8"></th>
                  <th className="py-4 px-6 w-48">Fecha y Hora</th>
                  <th className="py-4 px-6">Usuario Responsable</th>
                  <th className="py-4 px-6">Acción</th>
                  <th className="py-4 px-6">Entidad</th>
                  <th className="py-4 px-6">ID Afectado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {auditorias.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleRow(log.id)}
                        className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-all cursor-pointer group"
                      >
                        <td className="py-4 px-6 text-slate-400 group-hover:text-primary transition-all">
                          <span className="material-symbols-outlined transform transition-all duration-200" style={isExpanded ? { transform: 'rotate(90deg)' } : {}}>
                            chevron_right
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {new Date(log.fecha).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {log.usuarioEmail}
                            </span>
                            {log.usuarioId && (
                              <span className="text-[10px] text-slate-400 tracking-wider truncate max-w-[200px]">
                                ID: {log.usuarioId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getAccionBadgeClass(log.accion)}`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">
                              {getEntidadIcon(log.entidad)}
                            </span>
                            <span className="font-semibold">{log.entidad}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 font-mono">
                          #{log.entidadId}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/50 dark:bg-slate-950/20 px-10 py-4 border-l-4 border-primary">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-sm text-slate-600 dark:text-slate-400 space-y-2 overflow-hidden"
                            >
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle Técnico del Suceso</span>
                                <p className="font-mono text-xs bg-white dark:bg-slate-950 p-4 border border-slate-200/50 dark:border-slate-800/50 rounded-xl shadow-inner leading-relaxed whitespace-pre-wrap">
                                  {log.detalle || 'No se registraron metadatos adicionales para esta acción.'}
                                </p>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
