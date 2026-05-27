import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface ClinicaConfig {
  horaApertura: string;
  horaCierre: string;
  diasHabiles: number[];
  tiempoToleranciaMinutos: number;
  anticipacionCancelacionHoras: number;
}

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

export default function ConfiguracionView() {
  const [config, setConfig] = useState<ClinicaConfig>({
    horaApertura: '09:00',
    horaCierre: '18:00',
    diasHabiles: [1, 2, 3, 4, 5, 6],
    tiempoToleranciaMinutos: 15,
    anticipacionCancelacionHoras: 2
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/configuracion');
      if (response.data?.succeeded) {
        setConfig(response.data.data);
      } else {
        setError('No se pudo recuperar la configuración actual.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleDayChange = (dayValue: number) => {
    const isSelected = config.diasHabiles.includes(dayValue);
    let newDays: number[];
    if (isSelected) {
      // No permitir desmarcar todos los días
      if (config.diasHabiles.length <= 1) {
        showToast('Debes seleccionar al menos un día laborable.', 'error');
        return;
      }
      newDays = config.diasHabiles.filter(d => d !== dayValue);
    } else {
      newDays = [...config.diasHabiles, dayValue];
    }
    setConfig({ ...config, diasHabiles: newDays });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put('/api/configuracion', config);
      if (response.data?.succeeded) {
        showToast('¡Configuración del negocio guardada y aplicada con éxito!', 'success');
      } else {
        showToast(response.data?.message || 'Error al guardar la configuración.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error de conexión con el servidor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 6; i <= 22; i++) {
      const hStr = i < 10 ? `0${i}` : `${i}`;
      hours.push(`${hStr}:00`);
      hours.push(`${hStr}:30`);
    }
    return hours;
  };

  const hoursList = generateHours();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            <span className="material-symbols-outlined font-bold">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <p className="font-semibold text-sm">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Configuración General de la Clínica
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Ajusta las políticas del negocio, horarios de agendamientos y tolerancias del sistema.
        </p>
      </div>

      {loading ? (
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Cargando parámetros...</p>
        </div>
      ) : error ? (
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-20 text-center text-slate-500">
          <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
          <p className="font-semibold text-lg">{error}</p>
          <button 
            onClick={fetchConfig}
            className="mt-4 text-primary hover:underline text-sm font-bold flex items-center justify-center gap-1 mx-auto"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD HORARIOS */}
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined font-semibold text-[22px]">schedule</span>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Horario de Operación</h3>
              </div>
              <p className="text-xs text-slate-400">
                Define el rango horario en el cual los veterinarios pueden atender y los clientes pueden agendar citas.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Apertura</label>
                  <select
                    value={config.horaApertura}
                    onChange={(e) => setConfig({ ...config, horaApertura: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-sm transition-all"
                  >
                    {hoursList.map(h => (
                      <option key={`op-${h}`} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cierre</label>
                  <select
                    value={config.horaCierre}
                    onChange={(e) => setConfig({ ...config, horaCierre: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-sm transition-all"
                  >
                    {hoursList.map(h => (
                      <option key={`cl-${h}`} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CARD TOLERANCIAS Y CANCELACIONES */}
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined font-semibold text-[22px]">policy</span>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Políticas de Citas</h3>
              </div>
              <p className="text-xs text-slate-400">
                Configura tolerancias de ingreso y plazos mínimos de aviso para que los clientes anulen agendamientos.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tolerancia para Asistencia</label>
                  <select
                    value={config.tiempoToleranciaMinutos}
                    onChange={(e) => setConfig({ ...config, tiempoToleranciaMinutos: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-sm transition-all"
                  >
                    <option value={5}>5 minutos</option>
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos (Recomendado)</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Anticipación para Cancelación</label>
                  <select
                    value={config.anticipacionCancelacionHoras}
                    onChange={(e) => setConfig({ ...config, anticipacionCancelacionHoras: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-sm transition-all"
                  >
                    <option value={1}>1 hora antes</option>
                    <option value={2}>2 horas antes (Recomendado)</option>
                    <option value={4}>4 horas antes</option>
                    <option value={12}>12 horas antes</option>
                    <option value={24}>24 horas antes (1 día)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CARD DIAS LABORABLES */}
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-md space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined font-semibold text-[22px]">calendar_month</span>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Días Laborales</h3>
              </div>
              <p className="text-xs text-slate-400">
                Selecciona los días de la semana en los cuales la clínica estará abierta al público para agendamientos.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
                {DIAS_SEMANA.map((dia) => {
                  const isChecked = config.diasHabiles.includes(dia.value);
                  return (
                    <button
                      key={`day-${dia.value}`}
                      type="button"
                      onClick={() => handleDayChange(dia.value)}
                      className={`px-4 py-3 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 border cursor-pointer ${
                        isChecked
                          ? 'bg-primary/10 text-primary border-primary shadow-sm'
                          : 'bg-transparent text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]" style={isChecked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        {isChecked ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Guardar Parámetros
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
