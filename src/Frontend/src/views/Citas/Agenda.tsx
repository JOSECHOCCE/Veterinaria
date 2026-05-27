import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

interface Cita {
  id: number;
  mascotaId: number;
  mascotaNombre: string;
  mascotaEspecie: string;
  propietarioNombre: string;
  veterinarioId: number;
  veterinarioNombre: string;
  servicioId: number;
  servicioNombre: string;
  fechaHora: string;
  estado: string;
  motivo: string;
  montoTotal: number;
}

interface Veterinario {
  id: number;
  nombre: string;
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDateRange(start: Date, end: Date): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  if (start.getMonth() === end.getMonth()) {
    return `${months[start.getMonth()]} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
}

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function getEstadoStyle(estado: string) {
  switch (estado?.toLowerCase()) {
    case 'confirmada':
      return { bg: 'bg-secondary-container', border: 'border-secondary', text: 'text-on-secondary-container', dot: 'bg-secondary' };
    case 'pendiente':
      return { bg: 'bg-tertiary-container', border: 'border-tertiary', text: 'text-on-tertiary-container', dot: 'bg-tertiary' };
    case 'cancelada':
      return { bg: 'bg-surface-container', border: 'border-outline', text: 'text-on-surface-variant', dot: 'bg-outline' };
    case 'noasistio':
      return { bg: 'bg-surface-container-high', border: 'border-outline-variant', text: 'text-on-surface-variant', dot: 'bg-outline-variant' };
    case 'completada':
      return { bg: 'bg-primary-container', border: 'border-primary', text: 'text-on-primary-container', dot: 'bg-primary' };
    case 'emergencia':
    case 'urgencia':
      return { bg: 'bg-error-container', border: 'border-error', text: 'text-on-error-container', dot: 'bg-error' };
    default:
      return { bg: 'bg-surface-container-low', border: 'border-outline-variant', text: 'text-on-surface', dot: 'bg-outline' };
  }
}

export default function Agenda() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState<string[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedVeterinario, setSelectedVeterinario] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showVetDropdown, setShowVetDropdown] = useState(false);

  const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);

  useEffect(() => {
    fetchCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEstado, selectedVeterinario, currentDate]);

  async function fetchCitas() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedEstado) params.estado = selectedEstado;
      if (selectedVeterinario) params.veterinarioId = selectedVeterinario;

      const response = await api.get('/api/Citas', { params });
      if (response.data.success) {
        const data = response.data.data;
        setCitas(data.citas || []);
        if (data.estados) setEstados(data.estados);
        if (data.veterinarios) setVeterinarios(data.veterinarios);
      } else {
        toast.error(response.data.message || 'Error al cargar citas');
      }
    } catch (error) {
      console.error('Error fetching citas:', error);
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  // Group citas by day
  const citasByDay: Record<string, Cita[]> = {};
  citas.forEach((cita) => {
    const dayKey = new Date(cita.fechaHora).toISOString().split('T')[0];
    if (!citasByDay[dayKey]) citasByDay[dayKey] = [];
    citasByDay[dayKey].push(cita);
  });

  // Sort days
  const sortedDays = Object.keys(citasByDay).sort();

  // Sort citas within each day by time
  sortedDays.forEach((day) => {
    citasByDay[day].sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  });

  function navigateWeek(direction: number) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 pt-16 md:pt-0 h-full flex flex-col bg-surface"
    >
      {/* Header Actions Area */}
      <div className="px-gutter py-md flex flex-col lg:flex-row lg:items-center justify-between gap-md border-b border-outline-variant bg-surface-container-lowest z-10 sticky top-0 md:top-0">
        <div className="flex items-center gap-sm">
          <div
            onClick={() => navigateWeek(-1)}
            className="p-xs rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant"
          >
            <span className="material-symbols-outlined text-on-surface">chevron_left</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface min-w-[200px] text-center">
            {formatDateRange(weekStart, weekEnd)}
          </h2>
          <div
            onClick={() => navigateWeek(1)}
            className="p-xs rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant"
          >
            <span className="material-symbols-outlined text-on-surface">chevron_right</span>
          </div>
          <button
            onClick={goToToday}
            className="ml-sm px-sm py-xs rounded-lg border border-outline-variant text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors hidden sm:block"
          >
            Hoy
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          {/* Estado Filter */}
          <div className="flex bg-surface-container-low p-xs rounded-lg border border-outline-variant">
            <button
              onClick={() => setSelectedEstado('')}
              className={`px-md py-xs rounded-md font-label-sm text-label-sm transition-colors ${
                selectedEstado === ''
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold border border-outline-variant'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Todos
            </button>
            {estados.map((estado) => (
              <button
                key={estado}
                onClick={() => setSelectedEstado(estado)}
                className={`px-md py-xs rounded-md font-label-sm text-label-sm transition-colors ${
                  selectedEstado === estado
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-bold border border-outline-variant'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
          {/* Doctor Filter */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowVetDropdown(!showVetDropdown)}
              className="flex items-center gap-xs px-sm py-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              <span className="font-label-sm text-label-sm">
                {selectedVeterinario
                  ? veterinarios.find((v) => String(v.id) === selectedVeterinario)?.nombre || 'Doctor'
                  : 'Todos los Doctores'}
              </span>
              <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
            </button>
            {showVetDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-md z-50 min-w-[200px]">
                <button
                  onClick={() => { setSelectedVeterinario(''); setShowVetDropdown(false); }}
                  className={`w-full text-left px-md py-sm font-label-sm text-label-sm hover:bg-surface-container-low transition-colors ${
                    !selectedVeterinario ? 'text-primary font-bold' : 'text-on-surface'
                  }`}
                >
                  Todos los Doctores
                </button>
                {veterinarios.map((vet) => (
                  <button
                    key={vet.id}
                    onClick={() => { setSelectedVeterinario(String(vet.id)); setShowVetDropdown(false); }}
                    className={`w-full text-left px-md py-sm font-label-sm text-label-sm hover:bg-surface-container-low transition-colors ${
                      selectedVeterinario === String(vet.id) ? 'text-primary font-bold' : 'text-on-surface'
                    }`}
                  >
                    {vet.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link to="/admin/agenda/nueva" className="ml-auto flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva Cita
          </Link>
        </div>
      </div>

      {/* Citas List Workspace */}
      <div className="flex-1 overflow-auto p-gutter">
        {loading ? (
          /* Loading Skeleton */
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 animate-pulse">
                <div className="h-5 w-40 bg-surface-container-high rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
                      <div className="h-4 w-12 bg-surface-container-high rounded"></div>
                      <div className="h-4 w-32 bg-surface-container-high rounded"></div>
                      <div className="h-4 w-24 bg-surface-container-high rounded"></div>
                      <div className="h-4 w-20 bg-surface-container-high rounded ml-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : sortedDays.length === 0 ? (
          /* Empty State */
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant opacity-40 mb-4">calendar_month</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No hay citas</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              No se encontraron citas con los filtros seleccionados.
            </p>
            <Link to="/admin/agenda/nueva" className="flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Programar Nueva Cita
            </Link>
          </div>
        ) : (
          /* Citas grouped by day */
          <div className="space-y-6">
            {sortedDays.map((day) => {
              const dayCitas = citasByDay[day];
              const today = isToday(day);
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden"
                >
                  {/* Day Header */}
                  <div className={`px-6 py-3 border-b border-outline-variant flex items-center justify-between ${today ? 'bg-primary-container' : 'bg-surface-container-low'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-headline-sm text-headline-sm font-bold ${today ? 'text-on-primary-container' : 'text-on-surface'}`}>
                        {formatDayHeader(day)}
                      </span>
                      {today && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm text-[10px] uppercase tracking-wider">
                          Hoy
                        </span>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {dayCitas.length} cita{dayCitas.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Citas for this day */}
                  <div className="divide-y divide-outline-variant">
                    {dayCitas.map((cita) => {
                      const style = getEstadoStyle(cita.estado);
                      return (
                        <div
                          key={cita.id}
                          className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          {/* Time */}
                          <div className="flex items-center gap-2 min-w-[60px]">
                            <span className="font-label-md text-label-md text-on-surface font-bold">
                              {formatTime(cita.fechaHora)}
                            </span>
                          </div>

                          {/* Estado Badge */}
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${style.bg} border-l-4 ${style.border} min-w-[100px]`}>
                            <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                            <span className={`font-label-sm text-label-sm ${style.text} text-[11px] uppercase tracking-wider font-bold`}>
                              {cita.estado}
                            </span>
                          </div>

                          {/* Pet & Owner Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">pets</span>
                              <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                                {cita.mascotaNombre}
                              </span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">
                                ({cita.mascotaEspecie})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">person</span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                {cita.propietarioNombre}
                              </span>
                            </div>
                          </div>

                          {/* Service */}
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">medical_services</span>
                            <span className="font-label-sm text-label-sm text-on-surface truncate">
                              {cita.servicioNombre}
                            </span>
                          </div>

                          {/* Vet */}
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-sm text-[9px] font-bold">
                              {cita.veterinarioNombre?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                              {cita.veterinarioNombre}
                            </span>
                          </div>

                          {/* Motivo (hidden on small) */}
                          {cita.motivo && (
                            <div className="hidden lg:flex items-start gap-2 min-w-[150px] max-w-[200px]">
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant mt-0.5">notes</span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                {cita.motivo}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
