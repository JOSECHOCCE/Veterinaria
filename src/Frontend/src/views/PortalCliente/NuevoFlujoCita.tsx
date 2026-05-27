import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza?: string;
}

interface Veterinario {
  id: number;
  nombre: string;
  especie?: string; // Especialidad
}

interface Servicio {
  id: number;
  nombreConPrecio: string; // Devuelto por el backend
  idReal?: number;
  nombre: string;
  precio: number;
}

interface HorarioSlot {
  value: string; // ISO yyyy-MM-ddTHH:mm
  text: string;  // HH:mm
}

const NuevoFlujoCita: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Mascota, 2: Servicio, 3: Vet & Fecha, 4: Hora, 5: Resumen
  
  // Datos del backend
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  
  // Selección del cliente
  const [selectedMascotaId, setSelectedMascotaId] = useState<number | null>(null);
  const [selectedServicioId, setSelectedServicioId] = useState<number | null>(null);
  const [selectedVeterinarioId, setSelectedVeterinarioId] = useState<number | null>(null);
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedHoraSlot, setSelectedHoraSlot] = useState<string>(''); // ISO date-time string
  const [motivo, setMotivo] = useState('');

  // Registro de mascota rápida
  const [showAddPet, setShowAddPet] = useState(false);
  const [newPetNombre, setNewPetNombre] = useState('');
  const [newPetEspecie, setNewPetEspecie] = useState('Perro');
  const [newPetRaza, setNewPetRaza] = useState('');
  const [newPetFechaNacimiento, setNewPetFechaNacimiento] = useState('');
  const [newPetPeso, setNewPetPeso] = useState('');
  const [newPetColor, setNewPetColor] = useState('');
  const [savingPet, setSavingPet] = useState(false);

  // Slots de hora dinámicos
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioSlot[]>([]);
  
  // Cargando
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cargar plantilla del backend (CreateTemplate)
  useEffect(() => {
    async function loadTemplate() {
      try {
        const response = await api.get('/api/Citas/CreateTemplate');
        if (response.data.success) {
          const data = response.data.data;
          setMascotas(data.mascotas || []);
          setVeterinarios(data.veterinarios || []);
          
          // Mapear los servicios correctamente. El backend los devuelve con Id y NombreConPrecio.
          // Parsearemos el nombre y precio
          const servicesParsed = (data.servicios || []).map((s: any) => {
            const parts = s.nombreConPrecio.split(' - S/. ');
            return {
              id: s.id,
              nombreConPrecio: s.nombreConPrecio,
              nombre: parts[0] || 'Servicio',
              precio: Number(parts[1]?.replace(',', '')) || 0
            };
          });
          setServicios(servicesParsed);
        }
      } catch (error) {
        console.error('Error al cargar plantilla de cita:', error);
        toast.error('No se pudo cargar la información necesaria para programar la cita.');
      } finally {
        setLoadingTemplate(false);
      }
    }

    loadTemplate();
  }, []);

  // Cargar slots de hora cuando cambian veterinario y fecha
  useEffect(() => {
    if (!selectedVeterinarioId || !selectedFecha) {
      setHorariosDisponibles([]);
      setSelectedHoraSlot('');
      return;
    }

    async function loadSlots() {
      setLoadingHorarios(true);
      setSelectedHoraSlot('');
      try {
        const response = await api.get(`/api/Citas/HorariosDisponibles?veterinarioId=${selectedVeterinarioId}&fecha=${selectedFecha}`);
        if (response.data.success) {
          setHorariosDisponibles(response.data.data || []);
        }
      } catch (error) {
        console.error('Error al cargar horarios disponibles:', error);
        toast.error('No se pudieron obtener los horarios disponibles.');
      } finally {
        setLoadingHorarios(false);
      }
    }

    loadSlots();
  }, [selectedVeterinarioId, selectedFecha]);

  const handleAddMascotaRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetNombre.trim() || !newPetEspecie) {
      toast.error('Nombre y Especie son obligatorios.');
      return;
    }

    setSavingPet(true);
    try {
      const response = await api.post('/api/Mascotas', {
        nombre: newPetNombre,
        especie: newPetEspecie,
        raza: newPetRaza || null,
        fechaNacimiento: newPetFechaNacimiento || null,
        peso: newPetPeso ? Number(newPetPeso) : null,
        color: newPetColor || null,
        activo: true
      });

      if (response.data.success) {
        const newPet = response.data.data;
        // Ahora newPet es el DTO retornado que contiene las propiedades id, nombre, especie reales.
        setMascotas((prev) => [...prev, { id: newPet.id, nombre: newPet.nombre, especie: newPet.especie }]);
        setSelectedMascotaId(newPet.id);
        
        // Resetear campos del formulario
        setNewPetNombre('');
        setNewPetRaza('');
        setNewPetFechaNacimiento('');
        setNewPetPeso('');
        setNewPetColor('');
        setShowAddPet(false);
        toast.success(`🐾 ¡Mascota "${newPet.nombre}" registrada con éxito!`);
      }
    } catch (error) {
      console.error('Error al crear mascota:', error);
      toast.error('Ocurrió un error al registrar la mascota rápida.');
    } finally {
      setSavingPet(false);
    }
  };

  const handleSubmitCita = async () => {
    if (!selectedMascotaId || !selectedServicioId || !selectedVeterinarioId || !selectedHoraSlot) {
      toast.error('Faltan seleccionar parámetros requeridos.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/Citas', {
        mascotaId: selectedMascotaId,
        servicioId: selectedServicioId,
        veterinarioId: selectedVeterinarioId,
        fechaHora: selectedHoraSlot,
        motivo: motivo,
        estado: 'Pendiente'
      });

      if (response.data.success) {
        const citaId = response.data.data.citaId;
        toast.success('¡Cita solicitada exitosamente! Proceda a pagar para confirmarla.');
        // Redirigir a la pantalla de pago
        navigate(`/cliente/mis-citas`);
      }
    } catch (error: any) {
      console.error('Error al solicitar cita:', error);
      toast.error(error.response?.data?.message || 'No se pudo reservar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const getEspecieIcon = (especie?: string) => {
    switch ((especie || '').toLowerCase()) {
      case 'perro':
        return '🐶';
      case 'gato':
        return '🐱';
      case 'ave':
        return '🐦';
      default:
        return '🐾';
    }
  };

  if (loadingTemplate) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-sm">Preparando el asistente de reservas...</p>
      </div>
    );
  }

  // Buscar selecciones para el resumen
  const mascotaSelec = mascotas.find(m => m.id === selectedMascotaId);
  const servicioSelec = servicios.find(s => s.id === selectedServicioId);
  const veterinarioSelec = veterinarios.find(v => v.id === selectedVeterinarioId);
  const horaTexto = horariosDisponibles.find(h => h.value === selectedHoraSlot)?.text;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="flex-grow w-full bg-background min-h-screen pt-24 pb-margin"
    >
      <main className="flex-grow w-full max-w-4xl mx-auto px-margin flex flex-col gap-md">
        
        {/* Barra de Progreso del Wizard */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-sm flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary font-bold">calendar_month</span>
            <span className="font-label-md text-label-md text-on-surface font-extrabold uppercase">Nueva Cita Paso a Paso</span>
          </div>
          <div className="flex gap-xs items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  step === i 
                    ? 'bg-primary text-on-primary border-transparent' 
                    : step > i 
                      ? 'bg-primary/20 text-primary border-primary/20' 
                      : 'bg-surface text-outline border-outline-variant/30'
                }`}
              >
                {step > i ? '✓' : i}
              </div>
            ))}
          </div>
        </section>

        {/* Contenido del Asistente */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-md min-h-[400px]">
          
          <AnimatePresence mode="wait">
            
            {/* PASO 1: SELECCIÓN DE MASCOTA */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-sm text-left"
              >
                <div>
                  <h3 className="font-headline-md text-xl text-on-surface font-extrabold flex items-center gap-xs">
                    <span>🐾</span>
                    Paso 1: ¿Quién es el paciente?
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Selecciona a la mascota que recibirá la atención médica veterinaria.</p>
                </div>

                {/* Grid de Mascotas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm mt-xs">
                  {mascotas.map((pet) => (
                    <div 
                      key={pet.id}
                      onClick={() => setSelectedMascotaId(pet.id)}
                      className={`p-sm rounded-xl border flex flex-col items-center justify-center text-center gap-xs cursor-pointer transition-all shadow-sm ${
                        selectedMascotaId === pet.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-outline-variant/40 bg-surface hover:border-primary'
                      }`}
                    >
                      <span className="text-[32px]">{getEspecieIcon(pet.especie)}</span>
                      <span className="font-headline-md text-[16px] font-bold text-on-surface">{pet.nombre}</span>
                      <span className="font-label-sm text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{pet.especie || 'Mascota'} {pet.raza ? `(${pet.raza})` : ''}</span>
                    </div>
                  ))}
                  
                  {/* Card Agregar Nueva Mascota */}
                  <div 
                    onClick={() => setShowAddPet(!showAddPet)}
                    className="p-sm rounded-xl border border-dashed border-primary/40 bg-transparent flex flex-col items-center justify-center text-center gap-xs cursor-pointer hover:bg-primary/5 transition-all text-primary"
                  >
                    <span className="material-symbols-outlined text-[36px]">add_circle</span>
                    <span className="font-headline-md text-[14px] font-bold">Registrar nueva mascota</span>
                  </div>
                </div>

                {/* Modal / Formulario Inline de Registro rápido */}
                <AnimatePresence>
                  {showAddPet && (
                    <motion.form 
                      onSubmit={handleAddMascotaRapida}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border border-outline-variant rounded-xl p-sm bg-surface flex flex-col gap-sm mt-xs"
                    >
                      <h4 className="font-headline-md text-sm font-bold text-primary flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[18px]">add_task</span>
                        Agregar Mascota al Instante
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                        <div className="flex flex-col gap-xs">
                          <label className="font-label-sm text-xs font-semibold text-on-surface ml-1">Nombre</label>
                          <input 
                            type="text" 
                            className="h-10 border border-outline-variant/40 bg-surface-container-lowest rounded-lg px-xs focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface"
                            value={newPetNombre}
                            onChange={(e) => setNewPetNombre(e.target.value)}
                            placeholder="Ej. Firulais"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-xs">
                          <label className="font-label-sm text-xs font-semibold text-on-surface ml-1">Especie</label>
                          <select 
                            className="h-10 border border-outline-variant/40 bg-surface-container-lowest rounded-lg px-xs focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface"
                            value={newPetEspecie}
                            onChange={(e) => setNewPetEspecie(e.target.value)}
                          >
                            <option value="Perro">Perro 🐶</option>
                            <option value="Gato">Gato 🐱</option>
                            <option value="Ave">Ave 🐦</option>
                            <option value="Otro">Otro 🐾</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-xs">
                          <label className="font-label-sm text-xs font-semibold text-on-surface ml-1">Raza (Opcional)</label>
                          <input 
                            type="text" 
                            className="h-10 border border-outline-variant/40 bg-surface-container-lowest rounded-lg px-xs focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface"
                            value={newPetRaza}
                            onChange={(e) => setNewPetRaza(e.target.value)}
                            placeholder="Ej. Labrador"
                          />
                        </div>
                      </div>

                      {/* Campos Adicionales solicitados */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm mt-xs">
                        <div className="flex flex-col gap-xs">
                          <label className="font-label-sm text-xs font-semibold text-on-surface ml-1">Fecha de Nacimiento (Opcional)</label>
                          <input 
                            type="date" 
                            className="h-10 border border-outline-variant/40 bg-surface-container-lowest rounded-lg px-xs focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface"
                            value={newPetFechaNacimiento}
                            onChange={(e) => setNewPetFechaNacimiento(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="flex flex-col gap-xs">
                          <label className="font-label-sm text-xs font-semibold text-on-surface ml-1">Peso en kg (Opcional)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            className="h-10 border border-outline-variant/40 bg-surface-container-lowest rounded-lg px-xs focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface"
                            value={newPetPeso}
                            onChange={(e) => setNewPetPeso(e.target.value)}
                            placeholder="Ej. 12.5"
                          />
                        </div>
                        <div className="flex flex-col gap-xs">
                          <label className="font-label-sm text-xs font-semibold text-on-surface ml-1">Color (Opcional)</label>
                          <input 
                            type="text" 
                            className="h-10 border border-outline-variant/40 bg-surface-container-lowest rounded-lg px-xs focus:outline-none focus:border-primary font-body-md text-body-md text-on-surface"
                            value={newPetColor}
                            onChange={(e) => setNewPetColor(e.target.value)}
                            placeholder="Ej. Dorado, Negro"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-xs mt-xs">
                        <button 
                          type="button" 
                          onClick={() => setShowAddPet(false)}
                          className="bg-transparent border border-outline px-sm py-xs rounded-lg font-label-md text-xs hover:bg-surface-container-high cursor-pointer h-9 text-on-surface"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          disabled={savingPet}
                          className="bg-primary text-on-primary px-sm py-xs rounded-lg font-label-md text-xs hover:bg-surface-tint shadow-sm cursor-pointer h-9 flex items-center gap-xs"
                        >
                          {savingPet && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                          Guardar Mascota
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Botones Navegación */}
                <div className="flex justify-end gap-sm mt-md border-t border-surface-variant/30 pt-sm">
                  <button 
                    disabled={!selectedMascotaId}
                    onClick={() => setStep(2)}
                    className={`px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs cursor-pointer h-10 ${
                      selectedMascotaId 
                        ? 'bg-primary text-on-primary hover:bg-surface-tint' 
                        : 'bg-primary/20 text-on-primary/50 cursor-not-allowed'
                    }`}
                  >
                    <span>Paso Siguiente</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 2: SELECCIÓN DE SERVICIO */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-sm text-left"
              >
                <div>
                  <h3 className="font-headline-md text-xl text-on-surface font-extrabold flex items-center gap-xs">
                    <span>🛠️</span>
                    Paso 2: ¿Qué servicio requiere?
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Selecciona el tipo de consulta o atención del catálogo de la veterinaria.</p>
                </div>

                {/* Grid de Servicios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-xs">
                  {servicios.map((s) => (
                    <div 
                      key={s.id}
                      onClick={() => setSelectedServicioId(s.id)}
                      className={`p-sm rounded-xl border flex items-center gap-sm cursor-pointer transition-all shadow-sm ${
                        selectedServicioId === s.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-outline-variant/40 bg-surface hover:border-primary'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                        <span className="material-symbols-outlined text-[20px] font-semibold">clinical_notes</span>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="font-headline-md text-body-md font-extrabold text-on-surface">{s.nombre}</span>
                        <span className="font-label-sm text-[12px] text-primary font-bold mt-0.5">Precio: S/. {s.precio.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botones Navegación */}
                <div className="flex justify-between gap-sm mt-md border-t border-surface-variant/30 pt-sm">
                  <button 
                    onClick={() => setStep(1)}
                    className="bg-transparent border border-outline text-on-surface px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-container-high transition-colors cursor-pointer h-10"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Anterior</span>
                  </button>
                  <button 
                    disabled={!selectedServicioId}
                    onClick={() => setStep(3)}
                    className={`px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs cursor-pointer h-10 ${
                      selectedServicioId 
                        ? 'bg-primary text-on-primary hover:bg-surface-tint' 
                        : 'bg-primary/20 text-on-primary/50 cursor-not-allowed'
                    }`}
                  >
                    <span>Paso Siguiente</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 3: SELECCIÓN DE VETERINARIO & FECHA */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-sm text-left"
              >
                <div>
                  <h3 className="font-headline-md text-xl text-on-surface font-extrabold flex items-center gap-xs">
                    <span>📅</span>
                    Paso 3: ¿Quién y cuándo lo atenderá?
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Selecciona al médico veterinario preferido e indica la fecha de la cita.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-xs">
                  {/* Sub-Columna: Veterinarios */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Elegir Veterinario</label>
                    <div className="flex flex-col gap-xs">
                      {veterinarios.map((v) => (
                        <div 
                          key={v.id}
                          onClick={() => setSelectedVeterinarioId(v.id)}
                          className={`p-sm rounded-xl border flex items-center gap-sm cursor-pointer transition-all shadow-sm ${
                            selectedVeterinarioId === v.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'border-outline-variant/40 bg-surface hover:border-primary'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">stethoscope</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-headline-md text-body-md font-bold text-on-surface">{v.nombre}</span>
                            <span className="font-label-sm text-[11px] text-on-surface-variant bg-surface-container-high px-2 rounded-full w-fit mt-0.5">Especialista</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-Columna: Fecha */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="fecha-cita">Elegir Fecha</label>
                    <div className="relative rounded-xl border border-outline-variant/30 bg-surface shadow-sm focus-within:border-primary transition-all duration-200">
                      <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">calendar_today</span>
                      <input 
                        className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface focus:outline-none" 
                        id="fecha-cita" 
                        type="date"
                        value={selectedFecha}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Fecha mínima: mañana
                        max={new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]} // Máximo 3 meses (RF-21)
                        onChange={(e) => setSelectedFecha(e.target.value)}
                      />
                    </div>
                    <span className="font-label-sm text-[10px] text-outline ml-1">Nota: La clínica permanece cerrada los domingos.</span>
                  </div>
                </div>

                {/* Botones Navegación */}
                <div className="flex justify-between gap-sm mt-md border-t border-surface-variant/30 pt-sm">
                  <button 
                    onClick={() => setStep(2)}
                    className="bg-transparent border border-outline text-on-surface px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-container-high transition-colors cursor-pointer h-10"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Anterior</span>
                  </button>
                  <button 
                    disabled={!selectedVeterinarioId || !selectedFecha}
                    onClick={() => setStep(4)}
                    className={`px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs cursor-pointer h-10 ${
                      selectedVeterinarioId && selectedFecha
                        ? 'bg-primary text-on-primary hover:bg-surface-tint' 
                        : 'bg-primary/20 text-on-primary/50 cursor-not-allowed'
                    }`}
                  >
                    <span>Paso Siguiente</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 4: SELECCIÓN DE HORA */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-sm text-left"
              >
                <div>
                  <h3 className="font-headline-md text-xl text-on-surface font-extrabold flex items-center gap-xs">
                    <span>⏰</span>
                    Paso 4: Selecciona el Horario
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Elige uno de los bloques horarios de consulta disponibles en tiempo real.</p>
                </div>

                {/* Lista de horas */}
                <div className="min-h-[120px] flex flex-col justify-center mt-xs">
                  {loadingHorarios ? (
                    <div className="text-center py-sm flex flex-col items-center">
                      <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
                      <p className="font-label-sm text-label-sm text-outline mt-xs">Consultando bloques horarios libres...</p>
                    </div>
                  ) : horariosDisponibles.length === 0 ? (
                    <div className="text-center py-xs opacity-65 flex flex-col items-center justify-center bg-surface-container p-sm rounded-xl border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[32px] text-error font-bold">warning</span>
                      <p className="font-body-md text-body-md font-bold mt-1 text-on-surface">No hay horarios disponibles</p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 text-center">El veterinario seleccionado no cuenta con slots libres para la fecha elegida. Regresa al paso anterior y cambia de fecha o veterinario.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-xs">
                      {horariosDisponibles.map((h) => (
                        <div 
                          key={h.value}
                          onClick={() => setSelectedHoraSlot(h.value)}
                          className={`h-11 rounded-xl border font-label-md text-label-md flex items-center justify-center font-bold cursor-pointer transition-all shadow-sm ${
                            selectedHoraSlot === h.value 
                              ? 'bg-primary text-on-primary border-transparent' 
                              : 'bg-surface hover:border-primary text-on-surface border-outline-variant/40'
                          }`}
                        >
                          {h.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botones Navegación */}
                <div className="flex justify-between gap-sm mt-md border-t border-surface-variant/30 pt-sm">
                  <button 
                    onClick={() => setStep(3)}
                    className="bg-transparent border border-outline text-on-surface px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-container-high transition-colors cursor-pointer h-10"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Anterior</span>
                  </button>
                  <button 
                    disabled={!selectedHoraSlot}
                    onClick={() => setStep(5)}
                    className={`px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs cursor-pointer h-10 ${
                      selectedHoraSlot 
                        ? 'bg-primary text-on-primary hover:bg-surface-tint' 
                        : 'bg-primary/20 text-on-primary/50 cursor-not-allowed'
                    }`}
                  >
                    <span>Paso Siguiente</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 5: RESUMEN Y CONFIRMACIÓN */}
            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-sm text-left"
              >
                <div>
                  <h3 className="font-headline-md text-xl text-on-surface font-extrabold flex items-center gap-xs">
                    <span>📄</span>
                    Paso 5: Resumen & Confirmación
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Revisa los datos de la consulta antes de registrar la reservación en la base de datos.</p>
                </div>

                {/* Tarjeta de Resumen Premium */}
                <div className="bg-surface rounded-xl border border-outline-variant p-sm shadow-sm flex flex-col gap-sm mt-xs">
                  <div className="grid grid-cols-2 gap-sm">
                    {/* Paciente */}
                    <div className="flex flex-col bg-surface-container-low p-xs rounded-lg">
                      <span className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Mascota (Paciente)</span>
                      <span className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-xs mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">pets</span>
                        {mascotaSelec?.nombre}
                      </span>
                    </div>

                    {/* Servicio */}
                    <div className="flex flex-col bg-surface-container-low p-xs rounded-lg">
                      <span className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Servicio Solicitado</span>
                      <span className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-xs mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                        {servicioSelec?.nombre}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-sm">
                    {/* Profesional */}
                    <div className="flex flex-col bg-surface-container-low p-xs rounded-lg">
                      <span className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Médico Veterinario</span>
                      <span className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-xs mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                        {veterinarioSelec?.nombre}
                      </span>
                    </div>

                    {/* Fecha y hora */}
                    <div className="flex flex-col bg-surface-container-low p-xs rounded-lg">
                      <span className="font-label-sm text-[10px] text-outline font-bold uppercase tracking-wider">Horario Reservado</span>
                      <span className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-xs mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">alarm</span>
                        {selectedFecha} a las {horaTexto}
                      </span>
                    </div>
                  </div>

                  {/* Fila del Precio */}
                  <div className="flex justify-between items-center bg-primary/10 border border-primary/20 p-sm rounded-lg mt-xs">
                    <div className="text-left">
                      <span className="font-headline-md text-headline-md text-primary font-bold">Monto Total Estimado</span>
                      <p className="font-body-sm text-[11px] text-on-surface-variant leading-none mt-1">El cobro definitivo se registra en caja al completar la cita.</p>
                    </div>
                    <span className="font-headline-xl text-[24px] font-extrabold text-primary">S/. {servicioSelec?.precio.toFixed(2)}</span>
                  </div>
                </div>

                {/* Motivo de Consulta */}
                <div className="flex flex-col gap-xs mt-xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold ml-1" htmlFor="motivo-consulta">Indica el Motivo o Síntomas (Opcional)</label>
                  <div className="relative rounded-xl border border-outline-variant/30 bg-surface shadow-sm focus-within:border-primary transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-sm top-[18px] -translate-y-1/2 text-outline">description</span>
                    <textarea 
                      className="w-full pl-10 pr-sm pt-xs bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none min-h-[72px] resize-none" 
                      id="motivo-consulta" 
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ej. Control de vacunas mensual, decaimiento..."
                      maxLength={300}
                    />
                  </div>
                </div>

                {/* Botones Navegación */}
                <div className="flex justify-between gap-sm mt-md border-t border-surface-variant/30 pt-sm">
                  <button 
                    onClick={() => setStep(4)}
                    className="bg-transparent border border-outline text-on-surface px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-container-high transition-colors cursor-pointer h-10"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Anterior</span>
                  </button>
                  <button 
                    disabled={submitting}
                    onClick={handleSubmitCita}
                    className={`px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs cursor-pointer h-10 ${
                      submitting 
                        ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/20 hover:shadow-lg'
                    }`}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                        <span>Reservando Cita...</span>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Confirmar & Reservar</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </section>

      </main>
    </motion.div>
  );
};

export default NuevoFlujoCita;
