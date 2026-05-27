import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api';

interface MascotaOption {
  id: number;
  nombre: string;
}

interface VeterinarioOption {
  id: number;
  nombre: string;
}

interface ServicioOption {
  id: number;
  nombreConPrecio: string;
}

const NuevaCita: React.FC = () => {
    const navigate = useNavigate();

    // Template data from API
    const [mascotas, setMascotas] = useState<MascotaOption[]>([]);
    const [veterinarios, setVeterinarios] = useState<VeterinarioOption[]>([]);
    const [servicios, setServicios] = useState<ServicioOption[]>([]);
    const [loadingTemplate, setLoadingTemplate] = useState(true);

    // Form state
    const [mascotaId, setMascotaId] = useState<string>('');
    const [veterinarioId, setVeterinarioId] = useState<string>('');
    const [servicioId, setServicioId] = useState<string>('');
    const [fecha, setFecha] = useState<string>('');
    const [hora, setHora] = useState<string>('');
    const [motivo, setMotivo] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchTemplate() {
            try {
                const response = await api.get('/api/Citas/CreateTemplate');
                if (response.data.success) {
                    const data = response.data.data;
                    setMascotas(data.mascotas || []);
                    setVeterinarios(data.veterinarios || []);
                    setServicios(data.servicios || []);
                    // Pre-select first veterinario if available
                    if (data.veterinarios?.length > 0) {
                        setVeterinarioId(String(data.veterinarios[0].id));
                    }
                } else {
                    toast.error(response.data.message || 'Error al cargar el formulario');
                }
            } catch (error) {
                console.error('Error fetching create template:', error);
                toast.error('No se pudo conectar con el servidor.');
            } finally {
                setLoadingTemplate(false);
            }
        }
        fetchTemplate();
    }, []);

    async function handleSubmit() {
        // Validation
        if (!mascotaId) {
            toast.error('Seleccione una mascota.');
            return;
        }
        if (!servicioId) {
            toast.error('Seleccione un tipo de servicio.');
            return;
        }
        if (!fecha || !hora) {
            toast.error('Seleccione fecha y hora.');
            return;
        }
        if (!veterinarioId) {
            toast.error('Seleccione un veterinario.');
            return;
        }

        const fechaHora = `${fecha}T${hora}:00`;

        setSubmitting(true);
        try {
            const response = await api.post('/api/Citas', {
                mascotaId: Number(mascotaId),
                veterinarioId: Number(veterinarioId),
                servicioId: Number(servicioId),
                fechaHora,
                motivo,
                estado: 'Pendiente',
            });

            if (response.data.success) {
                toast.success('Cita programada exitosamente.');
                navigate('/admin/agenda');
            } else {
                toast.error(response.data.message || 'Error al guardar la cita.');
            }
        } catch (error: any) {
            console.error('Error creating cita:', error);
            const message = error.response?.data?.message || 'No se pudo guardar la cita.';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 pt-24 pb-12 px-4 sm:px-gutter lg:px-xl overflow-y-auto"
        >
            {/* Breadcrumb / Header */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center gap-4">
                <button onClick={() => navigate('/admin/agenda')} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h2 className="font-headline-xl text-headline-xl text-on-surface">Programar Cita</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">Complete los detalles para agendar una nueva visita clínica.</p>
                </div>
            </div>

            {/* Form Card (Single Column Model as per guidelines) */}
            <div className="max-w-3xl mx-auto bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0px_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-8">
                    {loadingTemplate ? (
                        /* Loading Skeleton */
                        <div className="space-y-8 animate-pulse">
                            <div>
                                <div className="h-6 w-48 bg-surface-container-high rounded mb-6"></div>
                                <div className="space-y-4">
                                    <div className="h-12 bg-surface-container-high rounded-lg"></div>
                                    <div className="h-12 bg-surface-container-high rounded-lg"></div>
                                </div>
                            </div>
                            <div>
                                <div className="h-6 w-40 bg-surface-container-high rounded mb-6"></div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-12 bg-surface-container-high rounded-lg"></div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="h-12 bg-surface-container-high rounded-lg"></div>
                                    <div className="h-12 bg-surface-container-high rounded-lg"></div>
                                </div>
                                <div className="h-12 bg-surface-container-high rounded-lg mb-6"></div>
                                <div className="h-24 bg-surface-container-high rounded-lg"></div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8 flex flex-col">
                            {/* Section: Identificación */}
                            <div className="space-y-6">
                                <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2 border-b border-surface-variant pb-2">
                                    <span className="material-symbols-outlined">person</span>
                                    Información del Paciente
                                </h3>

                                {/* Mascota (Selección) */}
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-md text-label-md text-on-surface" htmlFor="pet-select">Mascota</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">pets</span>
                                        <select
                                            className="w-full h-12 pl-12 pr-10 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all appearance-none cursor-pointer"
                                            id="pet-select"
                                            value={mascotaId}
                                            onChange={(e) => setMascotaId(e.target.value)}
                                        >
                                            <option disabled value="">Seleccione una mascota...</option>
                                            {mascotas.map((m) => (
                                                <option key={m.id} value={String(m.id)}>{m.nombre}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                                    </div>
                                    {mascotas.length === 0 && (
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">No hay mascotas registradas. Registre una mascota primero.</p>
                                    )}
                                </div>
                            </div>

                            {/* Section: Detalles de la Cita */}
                            <div className="space-y-6 pt-2">
                                <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2 border-b border-surface-variant pb-2">
                                    <span className="material-symbols-outlined">medical_services</span>
                                    Detalles Clínicos
                                </h3>

                                {/* Tipo de Servicio (Select from API) */}
                                <div className="flex flex-col gap-3">
                                    <label className="font-label-md text-label-md text-on-surface" htmlFor="service-select">Tipo de Servicio</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">stethoscope</span>
                                        <select
                                            className="w-full h-12 pl-12 pr-10 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all appearance-none cursor-pointer"
                                            id="service-select"
                                            value={servicioId}
                                            onChange={(e) => setServicioId(e.target.value)}
                                        >
                                            <option disabled value="">Seleccione un servicio...</option>
                                            {servicios.map((s) => (
                                                <option key={s.id} value={String(s.id)}>{s.nombreConPrecio}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                {/* Fecha y Hora (Row on desktop) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="font-label-md text-label-md text-on-surface" htmlFor="date-select">Fecha</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">calendar_month</span>
                                            <input
                                                className="w-full h-12 pl-12 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all cursor-pointer"
                                                id="date-select"
                                                type="date"
                                                value={fecha}
                                                onChange={(e) => setFecha(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-label-md text-label-md text-on-surface" htmlFor="time-select">Hora</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">schedule</span>
                                            <input
                                                className="w-full h-12 pl-12 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all cursor-pointer"
                                                id="time-select"
                                                type="time"
                                                value={hora}
                                                onChange={(e) => setHora(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Veterinario Asignado */}
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-md text-label-md text-on-surface" htmlFor="vet-select">Veterinario Asignado</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">clinical_notes</span>
                                        <select
                                            className="w-full h-12 pl-12 pr-10 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all appearance-none cursor-pointer"
                                            id="vet-select"
                                            value={veterinarioId}
                                            onChange={(e) => setVeterinarioId(e.target.value)}
                                        >
                                            <option disabled value="">Seleccione un veterinario...</option>
                                            {veterinarios.map((v) => (
                                                <option key={v.id} value={String(v.id)}>{v.nombre}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                {/* Notas */}
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-md text-label-md text-on-surface" htmlFor="notes">Motivo de Consulta / Notas adicionales</label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full p-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all resize-y"
                                            id="notes"
                                            placeholder="Describa brevemente el motivo de la visita o síntomas relevantes..."
                                            rows={4}
                                            value={motivo}
                                            onChange={(e) => setMotivo(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Actions */}
                {!loadingTemplate && (
                    <div className="bg-surface-container-low px-8 py-5 border-t border-surface-variant flex flex-col-reverse sm:flex-row justify-end gap-4">
                        <button onClick={() => navigate('/admin/agenda')} className="h-12 px-6 rounded-lg font-label-md text-primary border border-primary hover:bg-primary-container/20 transition-colors bg-transparent w-full sm:w-auto" type="button">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="h-12 px-8 rounded-lg font-label-md text-on-primary bg-primary hover:bg-primary/90 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            type="button"
                        >
                            {submitting ? (
                                <>
                                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    Guardar Cita
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default NuevaCita;
