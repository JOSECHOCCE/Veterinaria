import React from 'react';
import { motion } from 'framer-motion';

export default function HistoriaClinicaSOAP() {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 pt-16 flex flex-col w-full">
            {/* Sticky Patient Header */}
            <div className="sticky top-16 z-30 bg-surface-container-lowest px-gutter py-4 border-b border-outline-variant shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-surface-variant border border-outline-variant flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-3xl icon-fill" data-icon="dog">pets</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-headline-lg text-headline-lg text-on-surface">Max</h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-container text-on-primary-container border border-primary/20">
                                En Consulta
                            </span>
                        </div>
                        <div className="text-on-surface-variant font-body-md mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Golden Retriever, 5 Años</span>
                            <span className="w-1 h-1 rounded-full bg-outline"></span>
                            <span>Macho (Castrado)</span>
                            <span className="w-1 h-1 rounded-full bg-outline"></span>
                            <span className="font-medium text-on-surface">Propietario: Roberto Silva</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button className="h-10 px-4 rounded-lg border border-primary text-primary font-label-md text-label-md hover:bg-primary-container transition-colors bg-surface-container-lowest">
                        Ver Historial
                    </button>
                    <button className="h-10 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]" data-icon="save">save</span>
                        Guardar SOAP
                    </button>
                </div>
            </div>
            {/* SOAP Form Content */}
            <div className="p-gutter max-w-5xl mx-auto w-full pb-32">
                <div className="mb-lg">
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Registro Clínico (SOAP)</h2>
                    <p className="text-on-surface-variant text-body-md">Complete los campos secuencialmente. Todos los datos ingresados se guardan automáticamente como borrador.</p>
                </div>
                <form className="flex flex-col gap-margin">
                    {/* S - Subjective */}
                    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-surface-variant group-focus-within:bg-primary transition-colors"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold font-headline-md">S</div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Subjetivo</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="motivo">Motivo de Consulta principal</label>
                                <input className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" id="motivo" placeholder="Ej: Vómitos persistentes y letargo" type="text" />
                            </div>
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="anamnesis">Anamnesis / Historia clínica reciente</label>
                                <textarea className="w-full p-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y min-h-[120px]" id="anamnesis" placeholder="Detalle los síntomas reportados por el propietario, inicio, frecuencia, cambios en dieta, etc." rows={4}></textarea>
                            </div>
                        </div>
                    </section>
                    {/* O - Objective */}
                    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-surface-variant group-focus-within:bg-secondary transition-colors"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold font-headline-md">O</div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Objetivo</h3>
                            <button className="ml-auto text-primary text-label-md font-label-md hover:underline flex items-center gap-1" type="button">
                                <span className="material-symbols-outlined text-[16px]" data-icon="history">history</span>
                                Cargar últimas constantes
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-surface-bright rounded-lg border border-outline-variant/50">
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">Temperatura (°C)</label>
                                <input className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium" placeholder="38.5" step="0.1" type="number" />
                            </div>
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">FC (lpm)</label>
                                <input className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium" placeholder="80" type="number" />
                            </div>
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">FR (rpm)</label>
                                <input className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium" placeholder="24" type="number" />
                            </div>
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">Peso (kg)</label>
                                <input className="w-full h-12 px-3 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium" placeholder="32.4" step="0.1" type="number" />
                            </div>
                        </div>
                        <div>
                            <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="examen_fisico">Hallazgos del Examen Físico</label>
                            <textarea className="w-full p-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all resize-y min-h-[140px]" id="examen_fisico" placeholder="Condición corporal, mucosas, TLLC, palpación abdominal, auscultación cardiopulmonar, etc." rows={5}></textarea>
                        </div>
                    </section>
                    {/* A - Analysis */}
                    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-surface-variant group-focus-within:bg-tertiary transition-colors"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold font-headline-md">A</div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Análisis (Diagnóstico)</h3>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="relative">
                                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">Buscador de Diagnósticos (CIE-10 Vet / SNOMED)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant" data-icon="search">search</span>
                                    <input className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-tertiary focus:ring-2 focus:ring-tertiary/20 outline-none transition-all" placeholder="Escriba para buscar patologías..." type="text" />
                                </div>
                                {/* Simulated Dropdown List */}
                                <div className="hidden absolute z-10 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg">
                                    <ul className="py-1">
                                        <li className="px-4 py-2 hover:bg-surface-variant cursor-pointer text-body-md">Gastroenteritis aguda (K52.9)</li>
                                        <li className="px-4 py-2 hover:bg-surface-variant cursor-pointer text-body-md">Gastritis crónica (K29.5)</li>
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">Diagnósticos Seleccionados</label>
                                <div className="flex flex-wrap gap-2 p-4 min-h-[80px] bg-surface-bright rounded-lg border border-outline-variant border-dashed">
                                    {/* Selected Chip */}
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant">
                                        <span className="text-body-md text-on-surface">Gastroenteritis aguda (Presuntivo)</span>
                                        <button className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-error-container text-on-surface-variant hover:text-error transition-colors" type="button">
                                            <span className="material-symbols-outlined text-[16px]" data-icon="close">close</span>
                                        </button>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant">
                                        <span className="text-body-md text-on-surface">Deshidratación leve (Definitivo)</span>
                                        <button className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-error-container text-on-surface-variant hover:text-error transition-colors" type="button">
                                            <span className="material-symbols-outlined text-[16px]" data-icon="close">close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* P - Plan */}
                    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-surface-variant group-focus-within:bg-primary transition-colors"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold font-headline-md">P</div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Plan Terapéutico</h3>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block" htmlFor="procedimientos">Procedimientos Clínicos / Pruebas Solicitadas</label>
                                <textarea className="w-full p-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y" id="procedimientos" placeholder="Ej: Hemograma completo, Bioquímica básica, Ecografía abdominal programada..." rows={3}></textarea>
                            </div>
                            <div className="border-t border-outline-variant pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="font-headline-md text-headline-md text-on-surface block">Receta Médica</label>
                                    <button className="text-primary text-label-md font-label-md hover:underline flex items-center gap-1" type="button">
                                        <span className="material-symbols-outlined text-[18px]" data-icon="add_circle">add_circle</span>
                                        Añadir Medicamento
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {/* Prescription Item 1 */}
                                    <div className="p-4 bg-surface-bright rounded-lg border border-outline-variant">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-4">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Fármaco</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none" type="text" defaultValue="Maropitant (Cerenia) 16mg" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Dosis</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none" type="text" defaultValue="1 comp" />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Frecuencia</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none" type="text" defaultValue="Cada 24 hs" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Duración</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none" type="text" defaultValue="4 días" />
                                            </div>
                                            <div className="md:col-span-1 flex items-end justify-center pb-1">
                                                <button className="w-8 h-8 rounded text-error hover:bg-error-container transition-colors flex items-center justify-center" type="button">
                                                    <span className="material-symbols-outlined" data-icon="delete">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Indicaciones extra para el propietario</label>
                                            <input className="w-full h-8 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm" type="text" defaultValue="Administrar preferentemente con un poco de comida." />
                                        </div>
                                    </div>
                                    {/* Empty Prescription Item (Template) */}
                                    <div className="p-4 bg-surface-bright rounded-lg border border-outline-variant border-dashed opacity-70 focus-within:opacity-100 transition-opacity">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-4">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Fármaco</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none placeholder:text-outline" placeholder="Nombre comercial o principio activo" type="text" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Dosis</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none placeholder:text-outline" placeholder="Ej: 5ml" type="text" />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Frecuencia</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none placeholder:text-outline" placeholder="Ej: c/12 hs" type="text" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Duración</label>
                                                <input className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none placeholder:text-outline" placeholder="Ej: 7 días" type="text" />
                                            </div>
                                            <div className="md:col-span-1 flex items-end justify-center pb-1">
                                                <button className="w-8 h-8 rounded text-on-surface-variant opacity-50 cursor-not-allowed flex items-center justify-center" type="button">
                                                    <span className="material-symbols-outlined" data-icon="delete">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </motion.div>
    );
}
