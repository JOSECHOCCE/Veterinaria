import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import VeterinariosService from '../../services/veterinarios.service';
import type { Veterinario } from '../../services/veterinarios.service';
import Spinner from '../../components/common/Spinner';
import PageHeader from '../../components/common/PageHeader';

interface ClinicDay {
  day: string;
  active: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
}

interface ManualBlock {
  id: number;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
}

export default function ConfiguracionView() {
  const [activeSubTab, setActiveSubTab] = useState<'clinica' | 'veterinarios' | 'bloqueos'>('clinica');
  const [loading, setLoading] = useState<boolean>(true);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<number | 'all'>('all');

  // Clinic Hours State (Saved in LocalStorage as fallback)
  const [clinicHours, setClinicHours] = useState<ClinicDay[]>(() => {
    const saved = localStorage.getItem('vetcare_clinic_hours');
    if (saved) return JSON.parse(saved);
    return [
      { day: 'Lunes', active: true, open: '08:00', close: '20:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'Martes', active: true, open: '08:00', close: '20:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'Miércoles', active: true, open: '08:00', close: '20:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'Jueves', active: true, open: '08:00', close: '20:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'Viernes', active: true, open: '08:00', close: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'Sábado', active: true, open: '09:00', close: '14:00', breakStart: '', breakEnd: '' },
      { day: 'Domingo', active: false, open: '', close: '', breakStart: '', breakEnd: '' },
    ];
  });

  // Veterinarians Hours State
  const [vetHours, setVetHours] = useState<Record<number, ClinicDay[]>>({});

  // Manual Blocks State
  const [manualBlocks, setManualBlocks] = useState<ManualBlock[]>(() => {
    const saved = localStorage.getItem('vetcare_manual_blocks');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        title: 'Mantenimiento HVAC',
        type: 'Facility Closure / Holiday',
        startDate: '2026-07-20',
        endDate: '2026-07-20',
        allDay: false,
        startTime: '13:00',
        endTime: '17:00',
        reason: 'Impacto: Cierre total de recepción y 3 salas de consulta por mantenimiento de aire acondicionado.',
      },
      {
        id: 2,
        title: 'Capacitación del Personal',
        type: 'Other Event',
        startDate: '2026-07-28',
        endDate: '2026-07-28',
        allDay: false,
        startTime: '08:00',
        endTime: '11:00',
        reason: 'Uso de nuevo módulo clínico SOAP para médicos veterinarios.',
      }
    ];
  });

  // Modal State for adding block
  const [showAddBlockModal, setShowAddBlockModal] = useState<boolean>(false);
  const [blockTitle, setBlockTitle] = useState<string>('');
  const [blockType, setBlockType] = useState<string>('Facility Closure / Holiday');
  const [blockStartDate, setBlockStartDate] = useState<string>('');
  const [blockEndDate, setBlockEndDate] = useState<string>('');
  const [blockAllDay, setBlockAllDay] = useState<boolean>(true);
  const [blockStartTime, setBlockStartTime] = useState<string>('08:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('18:00');
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    const loadVets = async () => {
      setLoading(true);
      try {
        const res = await VeterinariosService.getVeterinarios();
        if (res.success && res.data) {
          const list = res.data.veterinarios.map((v: any) => v.veterinario) || [];
          setVeterinarios(list);

          // Populate initial vet hours
          const initialVetHours: Record<number, ClinicDay[]> = {};
          list.forEach((v: Veterinario) => {
            initialVetHours[v.id] = [
              { day: 'Lunes', active: true, open: '08:00', close: '16:00', breakStart: '12:00', breakEnd: '13:00' },
              { day: 'Martes', active: true, open: '08:00', close: '16:00', breakStart: '12:00', breakEnd: '13:00' },
              { day: 'Miércoles', active: true, open: '08:00', close: '16:00', breakStart: '12:00', breakEnd: '13:00' },
              { day: 'Jueves', active: true, open: '08:00', close: '16:00', breakStart: '12:00', breakEnd: '13:00' },
              { day: 'Viernes', active: true, open: '08:00', close: '16:00', breakStart: '12:00', breakEnd: '13:00' },
              { day: 'Sábado', active: false, open: '', close: '', breakStart: '', breakEnd: '' },
              { day: 'Domingo', active: false, open: '', close: '', breakStart: '', breakEnd: '' },
            ];
          });
          setVetHours(initialVetHours);
        }
      } catch (err) {
        console.error('Error loading veterinarians:', err);
        toast.error('No se pudo cargar la lista de veterinarios.');
      } finally {
        setLoading(false);
      }
    };
    loadVets();
  }, []);

  const saveClinicHours = () => {
    localStorage.setItem('vetcare_clinic_hours', JSON.stringify(clinicHours));
    toast.success('Horario de la clínica guardado exitosamente.');
  };

  const saveVetHours = () => {
    toast.success('Horarios individuales de los veterinarios guardados con éxito.');
  };

  const handleDeleteBlock = (id: number) => {
    const updated = manualBlocks.filter((b) => b.id !== id);
    setManualBlocks(updated);
    localStorage.setItem('vetcare_manual_blocks', JSON.stringify(updated));
    toast.success('Bloqueo eliminado exitosamente.');
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim() || !blockStartDate) {
      toast.error('Debe completar el título y la fecha de inicio.');
      return;
    }

    const newBlock: ManualBlock = {
      id: Date.now(),
      title: blockTitle,
      type: blockType,
      startDate: blockStartDate,
      endDate: blockEndDate || blockStartDate,
      allDay: blockAllDay,
      startTime: blockAllDay ? '' : blockStartTime,
      endTime: blockAllDay ? '' : blockEndTime,
      reason: blockReason,
    };

    const updated = [newBlock, ...manualBlocks];
    setManualBlocks(updated);
    localStorage.setItem('vetcare_manual_blocks', JSON.stringify(updated));

    // Reset Form
    setBlockTitle('');
    setBlockType('Facility Closure / Holiday');
    setBlockStartDate('');
    setBlockEndDate('');
    setBlockAllDay(true);
    setBlockReason('');
    setShowAddBlockModal(false);
    toast.success('Bloqueo de agenda registrado correctamente.');
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none p-gutter">
      {/* Page Header */}
      <PageHeader
        title="Configuración de Horarios"
        description="Gestiona los horarios operativos de la clínica, veterinarios y bloqueos de agenda."
        actions={
          <button
            onClick={() => setShowAddBlockModal(true)}
            className="flex items-center justify-center gap-xs px-lg py-2.5 bg-primary text-on-primary rounded-lg font-button text-button hover:bg-primary-active transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Añadir Bloqueo
          </button>
        }
        hasDivider={true}
      />

      {/* Tabs */}
      <div className="flex border-b border-hairline mb-lg overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('clinica')}
          className={`px-lg py-3 font-title-sm text-title-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'clinica' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          Horario Clínica
        </button>
        <button
          onClick={() => setActiveSubTab('veterinarios')}
          className={`px-lg py-3 font-title-sm text-title-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'veterinarios' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          Horarios Veterinarios
        </button>
        <button
          onClick={() => setActiveSubTab('bloqueos')}
          className={`px-lg py-3 font-title-sm text-title-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'bloqueos' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          Bloqueos Manuales
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg items-start">
        {/* Main Configuration Card (8 cols) */}
        <div className="xl:col-span-8 bg-surface-card rounded-xl border border-hairline p-lg shadow-sm flex flex-col">
          {activeSubTab === 'clinica' && (
            <div className="flex flex-col gap-md">
              <div className="flex justify-between items-center border-b border-hairline pb-3">
                <div>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold">Matriz de Apertura de la Clínica</h3>
                  <p className="font-body-sm text-body-sm text-secondary">Horarios generales de operación comercial.</p>
                </div>
                <button
                  onClick={saveClinicHours}
                  className="bg-primary text-on-primary font-button text-button px-5 py-2 rounded-lg hover:bg-primary-active transition-all cursor-pointer shadow-xs"
                >
                  Guardar Plantilla
                </button>
              </div>

              <div className="border border-hairline rounded-lg overflow-hidden bg-canvas">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-soft">
                    <tr className="border-b border-hairline">
                      <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Día</th>
                      <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Apertura</th>
                      <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Cierre</th>
                      <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Descanso (Inicio - Fin)</th>
                      <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted text-right w-20">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {clinicHours.map((hc, idx) => (
                      <tr key={hc.day} className={`hover:bg-surface-soft/40 transition-colors ${!hc.active ? 'bg-surface-container/20 opacity-60' : ''}`}>
                        <td className="py-3.5 px-4 font-body-sm text-ink font-semibold">{hc.day}</td>
                        <td className="py-3.5 px-4">
                          <input
                            type="time"
                            disabled={!hc.active}
                            value={hc.open}
                            onChange={(e) => {
                              const updated = [...clinicHours];
                              updated[idx].open = e.target.value;
                              setClinicHours(updated);
                            }}
                            className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-body-sm text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="time"
                            disabled={!hc.active}
                            value={hc.close}
                            onChange={(e) => {
                              const updated = [...clinicHours];
                              updated[idx].close = e.target.value;
                              setClinicHours(updated);
                            }}
                            className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-body-sm text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                          />
                        </td>
                        <td className="py-3.5 px-4 flex items-center gap-xs">
                          <input
                            type="time"
                            disabled={!hc.active}
                            value={hc.breakStart}
                            onChange={(e) => {
                              const updated = [...clinicHours];
                              updated[idx].breakStart = e.target.value;
                              setClinicHours(updated);
                            }}
                            className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-caption text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                          />
                          <span className="text-secondary">-</span>
                          <input
                            type="time"
                            disabled={!hc.active}
                            value={hc.breakEnd}
                            onChange={(e) => {
                              const updated = [...clinicHours];
                              updated[idx].breakEnd = e.target.value;
                              setClinicHours(updated);
                            }}
                            className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-caption text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hc.active}
                              onChange={() => {
                                const updated = [...clinicHours];
                                updated[idx].active = !updated[idx].active;
                                if (updated[idx].active) {
                                  updated[idx].open = '08:00';
                                  updated[idx].close = '20:00';
                                  updated[idx].breakStart = '13:00';
                                  updated[idx].breakEnd = '14:00';
                                } else {
                                  updated[idx].open = '';
                                  updated[idx].close = '';
                                  updated[idx].breakStart = '';
                                  updated[idx].breakEnd = '';
                                }
                                setClinicHours(updated);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-surface-container-high rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'veterinarios' && (
            <div className="flex flex-col gap-md">
              <div className="flex justify-between items-center border-b border-hairline pb-3">
                <div className="flex items-center gap-md">
                  <div>
                    <h3 className="font-title-lg text-title-lg text-ink font-bold">Disponibilidad de Médicos</h3>
                    <p className="font-body-sm text-body-sm text-secondary">Ajusta los horarios semanales por veterinario.</p>
                  </div>
                  <div className="relative ml-md">
                    <select
                      value={selectedVetId}
                      onChange={(e) => setSelectedVetId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="bg-canvas border border-hairline rounded-lg pl-3 pr-8 py-2 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer appearance-none min-w-[200px]"
                    >
                      <option value="all">Todos los Veterinarios</option>
                      {veterinarios.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre} ({v.especialidad})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
                <button
                  onClick={saveVetHours}
                  className="bg-primary text-on-primary font-button text-button px-5 py-2 rounded-lg hover:bg-primary-active transition-all cursor-pointer shadow-xs"
                >
                  Guardar Horarios
                </button>
              </div>

              {selectedVetId === 'all' ? (
                <div className="space-y-md">
                  {veterinarios.map((vet) => (
                    <div key={vet.id} className="p-md bg-canvas border border-hairline rounded-xl flex flex-col gap-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-title-sm text-title-sm text-ink font-bold">{vet.nombre}</span>
                        <span className="text-caption font-caption text-secondary">{vet.especialidad}</span>
                      </div>
                      <div className="flex flex-wrap gap-xs">
                        {(vetHours[vet.id] || []).map((day) => (
                          <span
                            key={day.day}
                            className={`px-3 py-1 rounded-full text-caption font-caption border ${
                              day.active
                                ? 'bg-primary-container/20 text-on-primary-container border-primary/20 font-semibold'
                                : 'bg-surface-dim/40 text-secondary border-hairline'
                            }`}
                          >
                            {day.day.slice(0, 2)}: {day.active ? `${day.open}-${day.close}` : 'Cerrado'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-hairline rounded-lg overflow-hidden bg-canvas">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-soft">
                      <tr className="border-b border-hairline">
                        <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Día</th>
                        <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Entrada</th>
                        <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Salida</th>
                        <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted w-1/4">Descanso (Inicio - Fin)</th>
                        <th className="py-3 px-4 font-caption-uppercase text-caption-uppercase text-body-muted text-right w-20">Activo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {(vetHours[selectedVetId] || []).map((hc, idx) => (
                        <tr key={hc.day} className={`hover:bg-surface-soft/40 transition-colors ${!hc.active ? 'bg-surface-container/20 opacity-60' : ''}`}>
                          <td className="py-3.5 px-4 font-body-sm text-ink font-semibold">{hc.day}</td>
                          <td className="py-3.5 px-4">
                            <input
                              type="time"
                              disabled={!hc.active}
                              value={hc.open}
                              onChange={(e) => {
                                const updated = { ...vetHours };
                                updated[selectedVetId][idx].open = e.target.value;
                                setVetHours(updated);
                              }}
                              className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-body-sm text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="time"
                              disabled={!hc.active}
                              value={hc.close}
                              onChange={(e) => {
                                const updated = { ...vetHours };
                                updated[selectedVetId][idx].close = e.target.value;
                                setVetHours(updated);
                              }}
                              className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-body-sm text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                          </td>
                          <td className="py-3.5 px-4 flex items-center gap-xs">
                            <input
                              type="time"
                              disabled={!hc.active}
                              value={hc.breakStart}
                              onChange={(e) => {
                                const updated = { ...vetHours };
                                updated[selectedVetId][idx].breakStart = e.target.value;
                                setVetHours(updated);
                              }}
                              className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-caption text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                            <span className="text-secondary">-</span>
                            <input
                              type="time"
                              disabled={!hc.active}
                              value={hc.breakEnd}
                              onChange={(e) => {
                                const updated = { ...vetHours };
                                updated[selectedVetId][idx].breakEnd = e.target.value;
                                setVetHours(updated);
                              }}
                              className="bg-canvas border border-hairline rounded-lg py-1.5 px-2 text-caption text-ink focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hc.active}
                                onChange={() => {
                                  const updated = { ...vetHours };
                                  updated[selectedVetId][idx].active = !updated[selectedVetId][idx].active;
                                  if (updated[selectedVetId][idx].active) {
                                    updated[selectedVetId][idx].open = '08:00';
                                    updated[selectedVetId][idx].close = '16:00';
                                    updated[selectedVetId][idx].breakStart = '12:00';
                                    updated[selectedVetId][idx].breakEnd = '13:00';
                                  } else {
                                    updated[selectedVetId][idx].open = '';
                                    updated[selectedVetId][idx].close = '';
                                    updated[selectedVetId][idx].breakStart = '';
                                    updated[selectedVetId][idx].breakEnd = '';
                                  }
                                  setVetHours(updated);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-surface-container-high rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'bloqueos' && (
            <div className="flex flex-col gap-md">
              <div className="flex justify-between items-center border-b border-hairline pb-3">
                <div>
                  <h3 className="font-title-lg text-title-lg text-ink font-bold">Bloqueos de Agenda</h3>
                  <p className="font-body-sm text-body-sm text-secondary">Visualiza y gestiona los bloqueos temporales de disponibilidad.</p>
                </div>
              </div>

              <div className="space-y-sm">
                {manualBlocks.length === 0 ? (
                  <div className="py-xl text-center text-secondary">No hay bloqueos manuales activos en el sistema.</div>
                ) : (
                  manualBlocks.map((block) => (
                    <div key={block.id} className="p-md bg-canvas border border-hairline rounded-xl flex items-center justify-between gap-md">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-sm">
                          <span className="font-title-sm text-title-sm text-ink font-bold">{block.title}</span>
                          <span className="text-caption font-caption bg-surface-container px-2 py-0.5 rounded text-secondary font-semibold">{block.type}</span>
                        </div>
                        <span className="font-caption text-caption text-primary mt-1 flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {block.startDate === block.endDate ? block.startDate : `${block.startDate} al ${block.endDate}`}
                          {!block.allDay && ` | ${block.startTime} - ${block.endTime}`}
                        </span>
                        {block.reason && <p className="font-body-sm text-body-sm text-body-muted mt-2">{block.reason}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-error hover:bg-error-container/20 p-2 rounded-full cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Bloqueos Activos Summary (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-md">
          <div className="bg-surface-card rounded-xl border border-hairline p-lg shadow-sm">
            <div className="flex justify-between items-center mb-md border-b border-hairline/50 pb-2">
              <h3 className="font-title-md text-title-md text-ink font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_busy</span>
                Bloqueos Activos
              </h3>
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2.5 py-0.5 rounded-full">
                {manualBlocks.length}
              </span>
            </div>
            <div className="space-y-sm max-h-[350px] overflow-y-auto pr-1">
              {manualBlocks.map((block) => (
                <div key={block.id} className="p-3 border-l-4 border-error bg-canvas rounded-r-lg shadow-xs flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-sm">
                    <span className="font-title-sm text-title-sm text-ink font-semibold truncate">{block.title}</span>
                    <span className="text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded uppercase font-bold shrink-0">
                      {block.allDay ? 'Todo el día' : 'Temporal'}
                    </span>
                  </div>
                  <p className="text-caption font-caption text-secondary">
                    {block.startDate} {block.startTime && `| ${block.startTime} - ${block.endTime}`}
                  </p>
                  {block.reason && <p className="text-[11px] text-body-muted italic line-clamp-2 mt-1">"{block.reason}"</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-soft p-lg border border-hairline rounded-xl flex flex-col gap-sm">
            <h3 className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-amber">security</span>
              Nota de Seguridad
            </h3>
            <p className="font-body-sm text-body-sm text-secondary">
              Los cambios en la matriz de horarios y los bloqueos manuales modifican automáticamente y en tiempo real la disponibilidad de citas visibles tanto para los recepcionistas como en el portal web de los clientes.
            </p>
          </div>
        </div>
      </div>

      {/* Modal - Añadir Bloqueo */}
      <AnimatePresence>
        {showAddBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-card w-full max-w-md rounded-xl border border-hairline shadow-lg overflow-hidden"
            >
              <div className="flex justify-between items-center p-md border-b border-hairline">
                <h3 className="font-title-md text-title-md text-ink font-bold">Añadir Bloqueo de Agenda</h3>
                <button
                  onClick={() => setShowAddBlockModal(false)}
                  className="text-secondary hover:text-ink cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddBlock} className="p-md space-y-md">
                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1">Título del Bloqueo</label>
                  <input
                    type="text"
                    required
                    value={blockTitle}
                    onChange={(e) => setBlockTitle(e.target.value)}
                    placeholder="Ej: Mantenimiento Quirófano"
                    className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1">Tipo de Evento</label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value)}
                    className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Facility Closure / Holiday">Cierre de Clínica / Festivo</option>
                    <option value="Staff Absence / Medical">Ausencia de Personal / Médica</option>
                    <option value="Equipment Maintenance">Mantenimiento de Equipos</option>
                    <option value="Other Event">Otro Evento / Bloqueo Especial</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block font-label-md text-label-md text-ink mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      required
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-ink mb-1">Fecha de Cierre</label>
                    <input
                      type="date"
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                      className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={blockAllDay}
                      onChange={(e) => setBlockAllDay(e.target.checked)}
                      className="rounded border-hairline text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="font-body-sm text-body-sm text-ink">Evento de todo el día</span>
                  </label>
                </div>

                {!blockAllDay && (
                  <div className="grid grid-cols-2 gap-md">
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1">Hora Inicio</label>
                      <input
                        type="time"
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                        className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-ink mb-1">Hora Cierre</label>
                      <input
                        type="time"
                        value={blockEndTime}
                        onChange={(e) => setBlockEndTime(e.target.value)}
                        className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-label-md text-label-md text-ink mb-1">Motivo / Notas de Impacto</label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Describa el motivo o el impacto de este bloqueo..."
                    rows={3}
                    className="w-full bg-canvas border border-hairline rounded-lg p-2.5 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary resize-none"
                  ></textarea>
                </div>

                <div className="border-t border-hairline pt-md flex justify-end gap-sm">
                  <button
                    type="button"
                    onClick={() => setShowAddBlockModal(false)}
                    className="px-4 py-2 border border-hairline text-secondary rounded-lg font-button text-button hover:bg-canvas transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-button text-button hover:bg-primary-active transition-colors cursor-pointer shadow-xs"
                  >
                    Registrar Bloqueo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
