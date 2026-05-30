import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import MascotasService from '../../services/mascotas.service';

interface UsuarioMin {
  id: number;
  nombre: string;
  email?: string;
}

interface HistorialClinico {
  id: number;
  diagnostico: string;
  tratamiento?: string;
  medicamentos?: string;
  observaciones?: string;
  motivoConsulta?: string;
  hallazgos?: string;
  recomendaciones?: string;
  proximoControl?: string;
  fechaRegistro: string;
}

interface VeterinarioMin {
  id: number;
  nombre: string;
}

interface ServicioMin {
  id: number;
  nombre: string;
  precio: number;
}

interface Cita {
  id: number;
  fechaHora: string;
  estado: string;
  motivo?: string;
  tipoPago: string;
  montoTotal: number;
  montoPagado: number;
  estadoPago: string;
  mascotaId: number;
  veterinarioId: number;
  servicioId: number;
  veterinario?: VeterinarioMin;
  servicio?: ServicioMin;
  historial?: HistorialClinico;
}

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  peso: number | null;
  color: string | null;
  fotoUrl: string | null;
  fechaNacimiento: string | null;
  activo: boolean;
  usuarioId: number;
  usuarioNombre?: string;
  usuarioEmail?: string;
  alergiasConocidas?: string | null;
  observacionesGenerales?: string | null;
  sexo?: string | null;
  edad?: number | null;
}

export default function DetalleMascota() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaff = user?.role === 'Admin' || user?.role === 'Recepcionista' || user?.role === 'Veterinario';
  const isAdmin = user?.role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);

  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selector de Propietario
  const [owners, setOwners] = useState<UsuarioMin[]>([]);
  const [searchOwnerQuery, setSearchOwnerQuery] = useState('');

  // Formularios
  const [editForm, setEditForm] = useState({
    nombre: '',
    especie: 'Perro',
    raza: '',
    peso: '',
    color: '',
    fechaNacimiento: '',
    usuarioId: '',
    fotoUrl: '',
    sexo: 'Macho',
    alergiasConocidas: '',
    observacionesGenerales: '',
    activo: true
  });

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await MascotasService.getMascotaDetails(parseInt(id));
      if (data.success) {
        setMascota(data.data.mascota);
        setCitas(data.data.citas || []);
      } else {
        toast.error(data.message || 'Error al cargar los detalles de la mascota.');
        navigate('/admin/mascotas');
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadOwners = useCallback(async () => {
    try {
      const data = await MascotasService.getPropietariosDropdown();
      if (data.success) {
        setOwners(data.data.usuarios || []);
      }
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  }, []);

  useEffect(() => {
    fetchDetails();
    if (isStaff) {
      loadOwners();
    }
  }, [fetchDetails, loadOwners, isStaff]);

  const handleEditClick = () => {
    if (!mascota) return;
    setEditForm({
      nombre: mascota.nombre,
      especie: mascota.especie || 'Perro',
      raza: mascota.raza || '',
      peso: mascota.peso ? String(mascota.peso) : '',
      color: mascota.color || '',
      fechaNacimiento: mascota.fechaNacimiento ? mascota.fechaNacimiento.split('T')[0] : '',
      usuarioId: String(mascota.usuarioId),
      fotoUrl: mascota.fotoUrl || '',
      sexo: mascota.sexo || 'Macho',
      alergiasConocidas: mascota.alergiasConocidas || '',
      observacionesGenerales: mascota.observacionesGenerales || '',
      activo: mascota.activo
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mascota) return;

    if (!editForm.nombre || !editForm.especie) {
      toast.error('El nombre y la especie son requeridos.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: mascota.id,
        nombre: editForm.nombre,
        especie: editForm.especie,
        raza: editForm.raza || null,
        peso: editForm.peso ? parseFloat(editForm.peso) : null,
        color: editForm.color || null,
        fechaNacimiento: editForm.fechaNacimiento || null,
        usuarioId: parseInt(editForm.usuarioId),
        fotoUrl: editForm.fotoUrl || null,
        sexo: editForm.sexo || null,
        alergiasConocidas: editForm.alergiasConocidas || null,
        observacionesGenerales: editForm.observacionesGenerales || null,
        activo: editForm.activo
      };

      const data = await MascotasService.updateMascota(mascota.id, payload);
      if (data.success) {
        toast.success('Mascota actualizada correctamente.');
        setShowEditModal(false);
        fetchDetails();
      } else {
        toast.error(data.message || 'Error al guardar los cambios.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerTransfer = async (newOwnerId: number, newOwnerName: string) => {
    if (!mascota) return;

    setSubmitting(true);
    try {
      const payload = {
        ...mascota,
        usuarioId: newOwnerId,
        raza: mascota.raza || null,
        peso: mascota.peso || null,
        color: mascota.color || null,
        fotoUrl: mascota.fotoUrl || null,
        fechaNacimiento: mascota.fechaNacimiento || null
      };

      const data = await MascotasService.updateMascota(mascota.id, payload);
      if (data.success) {
        toast.success(`Responsabilidad transferida a ${newOwnerName} exitosamente.`);
        setShowOwnerModal(false);
        fetchDetails();
      } else {
        toast.error(data.message || 'Error al transferir propietario.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en la petición de transferencia.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSpeciesIcon = (especie: string) => {
    const lower = especie?.toLowerCase() || '';
    if (lower.includes('canino') || lower.includes('perro')) return 'pets';
    if (lower.includes('felino') || lower.includes('gato')) return 'cruelty_free';
    if (lower.includes('ave') || lower.includes('pájaro')) return 'flutter';
    if (lower.includes('conejo')) return 'comedy_mask';
    return 'pets';
  };

  const calculateAge = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return 'N/D';
    try {
      const birth = new Date(fechaNacimiento);
      const now = new Date();
      const diffMs = now.getTime() - birth.getTime();
      const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
      const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
      if (years > 0) return `${years} año${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} mes${months !== 1 ? 'es' : ''}` : ''}`;
      if (months > 0) return `${months} mes${months !== 1 ? 'es' : ''}`;
      return 'Recién nacido';
    } catch {
      return 'N/D';
    }
  };

  const formatFecha = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatFechaShort = (dateString: string) => {
    const d = new Date(dateString);
    return {
      day: d.getDate(),
      month: d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
    };
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 w-full min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#cc785c] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-semibold animate-pulse">Cargando expediente clínico...</p>
      </div>
    );
  }

  if (!mascota) {
    return (
      <div className="py-20 text-center space-y-md">
        <span className="material-symbols-outlined text-[48px] text-[#cc785c]">error</span>
        <h3 className="text-xl font-bold">No se encontró el paciente</h3>
        <button onClick={() => navigate(-1)} className="text-primary font-semibold hover:underline">
          Regresar
        </button>
      </div>
    );
  }

  // Filtrar citas
  const ahora = new Date();
  const proximasCitas = citas
    .filter(c => c.estado !== 'Cancelada' && c.estado !== 'Completada' && new Date(c.fechaHora) >= ahora)
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

  const historialCitas = citas
    .filter(c => c.estado === 'Completada' || c.estado === 'Cancelada' || c.estado === 'NoAsistio')
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

  const atencionesClinicas = citas
    .filter(c => c.estado === 'Completada' && c.historial)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

  // Propietarios filtrados para el modal de transferencia
  const filteredOwners = owners.filter(o =>
    o.id !== mascota.usuarioId &&
    o.nombre.toLowerCase().includes(searchOwnerQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full text-left max-w-container-max mx-auto px-margin-desktop py-8 bg-[#faf9f5]"
    >
      {/* Breadcrumbs & Navigation Action */}
      <div className="flex justify-between items-center mb-10 pb-4 border-b border-[#141413]/5">
        <nav className="flex items-center gap-2 text-[#6c6a64] font-semibold text-[10px] uppercase tracking-widest">
          <Link className="hover:text-[#cc785c]" to={isStaff ? "/admin/mascotas" : "/cliente/mis-mascotas"}>Mascotas</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#141413]">Detalle de {mascota.nombre}</span>
        </nav>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 border border-[#141413]/25 px-4 py-2 hover:bg-[#faf9f5] transition-all font-semibold text-xs uppercase tracking-wider text-[#141413] rounded-[4px]"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver
        </button>
      </div>

      {/* Profile Header Block */}
      <section className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white border border-[#141413]/10 p-8 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.02)]">
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#cc785c] p-0.5 bg-[#faf9f5]">
            {mascota.fotoUrl ? (
              <img src={mascota.fotoUrl} alt={mascota.nombre} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-[#cc785c]/5 text-[#cc785c]">
                <span className="material-symbols-outlined text-[48px]">{getSpeciesIcon(mascota.especie)}</span>
              </div>
            )}
          </div>
          <div
            className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${mascota.activo ? 'bg-[#5db872]' : 'bg-[#6c6a64]/40'}`}
            title={mascota.activo ? 'Paciente Activo' : 'Paciente Inactivo'}
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
            <h1 className="font-display-lg text-4xl text-[#141413] font-semibold">{mascota.nombre}</h1>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-[#cc785c]/5 text-[#cc785c] font-bold text-[10px] rounded-full uppercase tracking-wider">
                {mascota.especie}
              </span>
              {mascota.raza && (
                <span className="px-3 py-1 bg-[#141413]/5 text-[#6c6a64] font-bold text-[10px] rounded-full uppercase tracking-wider">
                  {mascota.raza}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3 text-[#6c6a64] font-medium text-sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">
                {mascota.sexo === 'Hembra' ? 'female' : 'male'}
              </span>
              {mascota.sexo || 'Macho'}
            </span>
            <span className="w-1.5 h-1.5 bg-[#141413]/10 rounded-full"></span>
            <span>{calculateAge(mascota.fechaNacimiento)}</span>
          </div>
        </div>
        
        {isStaff && (
          <button
            onClick={handleEditClick}
            className="border border-[#141413]/25 px-6 py-3 font-semibold text-xs uppercase tracking-widest text-[#141413] hover:bg-[#141413] hover:text-white transition-colors duration-200 rounded-[4px]"
          >
            Editar Expediente
          </button>
        )}
      </section>

      {/* Medical Alerts Bar Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#fdf2f2] border-l-4 border-[#c64545] p-5 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.01)]">
          <div className="text-[#c64545] font-bold text-[10px] uppercase tracking-widest mb-1.5">ALERGIAS</div>
          <p className="font-body-md text-[#141413] font-semibold text-sm">
            {mascota.alergiasConocidas || 'Ninguna alergia registrada'}
          </p>
        </div>
        <div className="bg-[#fefce8] border-l-4 border-[#d4a017] p-5 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.01)]">
          <div className="text-[#d4a017] font-bold text-[10px] uppercase tracking-widest mb-1.5">CONDICIÓN CRÓNICA</div>
          <p className="font-body-md text-[#141413] font-semibold text-sm">
            {(mascota.observacionesGenerales ?? '').toLowerCase().includes('cronic') || 
             (mascota.observacionesGenerales ?? '').toLowerCase().includes('crónic')
              ? mascota.observacionesGenerales 
              : 'Ninguna condición crónica identificada'}
          </p>
        </div>
        <div className="bg-[#f0fdf4] border-l-4 border-[#5db872] p-5 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.01)]">
          <div className="text-[#5db872] font-bold text-[10px] uppercase tracking-widest mb-1.5">ÚLTIMA VACUNACIÓN</div>
          <p className="font-body-md text-[#141413] font-semibold text-sm">
            {atencionesClinicas.find(c => (c.servicio?.nombre ?? '').toLowerCase().includes('vacuna'))
              ? `Vacuna - ${formatFecha(atencionesClinicas.find(c => (c.servicio?.nombre ?? '').toLowerCase().includes('vacuna'))!.fechaHora)}`
              : 'Ninguna vacuna registrada'}
          </p>
        </div>
      </section>

      {/* Main Details and History Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Client & Stats */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Propietario Card */}
          <div className="bg-white border border-[#141413]/10 p-8 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.02)]">
            <h3 className="font-headline-sm text-lg text-[#141413] font-semibold border-b border-[#141413]/5 pb-4 mb-6">Propietario</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#cc785c]/10 text-[#cc785c] rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-[#cc785c]/20">
                {(mascota.usuarioNombre ?? 'SP').substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-body-lg text-sm font-semibold text-[#141413] truncate">{mascota.usuarioNombre || 'Sin propietario'}</div>
                <div className="text-[#6c6a64] text-xs font-semibold">Cliente Registrado</div>
              </div>
            </div>
            <div className="space-y-4 mb-8 text-xs text-[#3d3d3a]">
              {mascota.usuarioEmail && (
                <div className="flex items-start gap-3 min-w-0">
                  <span className="material-symbols-outlined text-[#6c6a64] text-[18px]">mail</span>
                  <span className="truncate">{mascota.usuarioEmail}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#6c6a64] text-[18px]">call</span>
                <span>Propietario Activo</span>
              </div>
            </div>
            
            {isAdmin && (
              <button
                onClick={async () => {
                  try {
                    const data = await MascotasService.getPropietariosDropdown();
                    if (data.success) {
                      setOwners(data.data.usuarios || []);
                    }
                  } catch (err) {
                    console.error('Error loading owners:', err);
                  }
                  setShowOwnerModal(true);
                }}
                className="w-full py-3 border border-[#141413]/25 hover:bg-[#141413]/5 transition-colors font-semibold text-xs uppercase tracking-wider text-[#141413] rounded-[4px]"
              >
                Cambiar Propietario
              </button>
            )}
          </div>

          {/* Datos Fisiológicos */}
          <div className="bg-white border border-[#141413]/10 p-8 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.02)]">
            <h3 className="font-headline-sm text-lg text-[#141413] font-semibold border-b border-[#141413]/5 pb-4 mb-6">Datos Fisiológicos</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-2">
              <div>
                <div className="text-[#6c6a64] font-bold text-[10px] uppercase tracking-widest mb-1">Peso</div>
                <div className="font-body-lg text-sm font-semibold text-[#141413]">
                  {mascota.peso ? `${mascota.peso} kg` : 'Sin registrar'}
                </div>
              </div>
              <div>
                <div className="text-[#6c6a64] font-bold text-[10px] uppercase tracking-widest mb-1">Manto/Color</div>
                <div className="font-body-lg text-sm font-semibold text-[#141413] truncate">
                  {mascota.color || 'Sin registrar'}
                </div>
              </div>
              <div>
                <div className="text-[#6c6a64] font-bold text-[10px] uppercase tracking-widest mb-1">Nacimiento</div>
                <div className="font-body-lg text-sm font-semibold text-[#141413]">
                  {mascota.fechaNacimiento ? new Date(mascota.fechaNacimiento).toLocaleDateString('es-ES') : 'N/D'}
                </div>
              </div>
              <div>
                <div className="text-[#6c6a64] font-bold text-[10px] uppercase tracking-widest mb-1">Edad Estimada</div>
                <div className="font-body-lg text-sm font-semibold text-[#141413]">
                  {calculateAge(mascota.fechaNacimiento)}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Timeline & Atenciones */}
        <div className="lg:col-span-8 space-y-10">
          {/* Citas Timeline Section */}
          <div className="space-y-5 bg-white border border-[#141413]/10 p-8 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.02)]">
            <h3 className="font-headline-sm text-xl text-[#141413] font-semibold border-b border-[#141413]/5 pb-4 mb-4">Citas Programadas</h3>
            
            {proximasCitas.length === 0 ? (
              <p className="text-sm text-[#6c6a64] italic py-3 text-center">No hay citas futuras programadas para este paciente.</p>
            ) : (
              <div className="space-y-4">
                {proximasCitas.map(c => {
                  const shortDate = formatFechaShort(c.fechaHora);
                  return (
                    <div key={c.id} className="bg-[#cc785c]/5 border border-[#cc785c]/10 p-5 rounded-[4px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex gap-4">
                        <div className="bg-[#cc785c] text-white w-14 h-14 flex flex-col items-center justify-center rounded-[4px] shrink-0 font-bold shadow-md">
                          <span className="text-[10px] tracking-wider">{shortDate.month}</span>
                          <span className="text-lg -mt-1">{shortDate.day}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#cc785c] text-sm">{c.servicio?.nombre || 'Consulta General'}</div>
                          <div className="text-[#6c6a64] text-xs font-semibold mt-0.5">
                            {c.veterinario?.nombre || 'Veterinario Staff'} — {new Date(c.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <span className="bg-[#cc785c]/15 text-[#cc785c] text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full uppercase">
                        {c.estado}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {historialCitas.length > 0 && (
              <div className="pt-4 border-t border-[#141413]/5 mt-4 space-y-2.5">
                <p className="text-[10px] font-bold text-[#6c6a64]/50 uppercase tracking-widest mb-2">Visitas Pasadas</p>
                {historialCitas.slice(0, 3).map(c => (
                  <div key={c.id} className="flex justify-between items-center py-2 border-b border-[#141413]/5 last:border-b-0 text-xs">
                    <div className="flex gap-4 items-center min-w-0">
                      <span className="text-[#6c6a64] font-semibold">{new Date(c.fechaHora).toLocaleDateString('es-ES')}</span>
                      <span className="font-semibold text-[#141413] truncate">{c.servicio?.nombre || 'Visita Clínica'}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${c.estado === 'Completada' ? 'bg-[#5db872]/10 text-[#5db872]' : 'bg-[#6c6a64]/10 text-[#6c6a64]'}`}>
                      {c.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial Clínico Accordion Block */}
          <div className="space-y-6 bg-white border border-[#141413]/10 p-8 rounded-[4px] shadow-[0_4px_20px_rgba(20,20,19,0.02)]">
            <div className="flex justify-between items-center border-b border-[#141413]/5 pb-4 mb-4">
              <h3 className="font-headline-sm text-xl text-[#141413] font-semibold">Historial Clínico</h3>
            </div>

            {atencionesClinicas.length === 0 ? (
              <div className="py-8 text-center text-[#6c6a64] italic text-sm">
                No hay atenciones clínicas ni diagnósticos registrados para Maximus.
              </div>
            ) : (
              <div className="space-y-4">
                {atencionesClinicas.map((c) => {
                  const hist = c.historial!;
                  return (
                    <div key={hist.id} className="border border-[#141413]/10 rounded-[4px] bg-white overflow-hidden shadow-[0_4px_12px_rgba(20,20,19,0.01)] transition-all hover:border-[#cc785c]/20">
                      <div className="w-full flex justify-between items-center p-6 text-left bg-[#faf9f5]/50 border-b border-[#141413]/5">
                        <div className="min-w-0">
                          <span className="text-[#6c6a64] font-bold text-[9px] uppercase tracking-widest block mb-1">
                            {formatFecha(c.fechaHora).toUpperCase()}
                          </span>
                          <h4 className="font-headline-sm text-sm font-bold text-[#141413] truncate">
                            Motivo: {hist.motivoConsulta || c.motivo || 'Revisión General'}
                          </h4>
                          <span className="text-[10px] text-[#6c6a64] font-semibold mt-0.5 block">
                            Atendido por: {c.veterinario?.nombre || 'Dr. Principal'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-5 text-xs text-[#3d3d3a]">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-[#6c6a64] font-bold text-[9px] uppercase tracking-widest mb-1.5">Diagnóstico Clínico</div>
                            <p className="font-medium text-[#141413] leading-relaxed">{hist.diagnostico}</p>
                          </div>
                          {hist.hallazgos && (
                            <div>
                              <div className="text-[#6c6a64] font-bold text-[9px] uppercase tracking-widest mb-1.5">Hallazgos Físicos</div>
                              <p className="leading-relaxed">{hist.hallazgos}</p>
                            </div>
                          )}
                        </div>

                        {(hist.tratamiento || hist.medicamentos) && (
                          <div className="border-t border-[#141413]/5 pt-4">
                            <div className="text-[#6c6a64] font-bold text-[9px] uppercase tracking-widest mb-2">Tratamiento & Receta</div>
                            <div className="grid md:grid-cols-2 gap-4">
                              {hist.tratamiento && (
                                <div className="bg-[#faf9f5] border border-[#141413]/5 p-4 rounded-[4px]">
                                  <p className="text-[#6c6a64] font-bold text-[8px] uppercase tracking-widest mb-1">Recomendaciones</p>
                                  <p className="leading-relaxed">{hist.tratamiento}</p>
                                </div>
                              )}
                              {hist.medicamentos && (
                                <div className="bg-[#faf9f5] border border-[#141413]/5 p-4 rounded-[4px]">
                                  <p className="text-[#cc785c] font-bold text-[8px] uppercase tracking-widest mb-1">Medicamentos prescritos</p>
                                  <p className="font-semibold text-[#141413] leading-relaxed">{hist.medicamentos}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {hist.observaciones && (
                          <div className="border-t border-[#141413]/5 pt-4">
                            <div className="text-[#6c6a64] font-bold text-[9px] uppercase tracking-widest mb-1.5">Notas adicionales</div>
                            <p className="italic text-[#6c6a64] leading-relaxed">"{hist.observaciones}"</p>
                          </div>
                        )}

                        {hist.proximoControl && (
                          <div className="border-t border-[#141413]/5 pt-4 flex items-center gap-1.5 text-[#cc785c] font-semibold">
                            <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                            <span>Próximo control clínico sugerido: {formatFecha(hist.proximoControl)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL EDITAR MASCOTA EXPEDIENTE */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#141413]/30 backdrop-blur-[2px]"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md rounded-[4px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-left z-10 bg-[#faf9f5] border border-[#141413]/10"
            >
              <div className="p-6 border-b border-[#141413]/10 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-headline-sm text-2xl text-[#141413]">Editar Expediente</h3>
                  <p className="font-body-md text-xs text-[#6c6a64] italic mt-0.5">Actualizar perfil del paciente</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-[#faf9f5] rounded-full transition-colors cursor-pointer text-[#141413]"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">NOMBRE DEL PACIENTE *</label>
                  <input
                    type="text"
                    required
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">ESPECIE *</label>
                    <select
                      value={editForm.especie}
                      onChange={(e) => setEditForm({ ...editForm, especie: e.target.value })}
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    >
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Ave">Ave</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Roedor">Roedor</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">SEXO</label>
                    <select
                      value={editForm.sexo}
                      onChange={(e) => setEditForm({ ...editForm, sexo: e.target.value })}
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">PESO (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.peso}
                      onChange={(e) => setEditForm({ ...editForm, peso: e.target.value })}
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">COLOR</label>
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">FECHA NACIMIENTO</label>
                  <input
                    type="date"
                    value={editForm.fechaNacimiento}
                    onChange={(e) => setEditForm({ ...editForm, fechaNacimiento: e.target.value })}
                    className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">ALERGIAS CONOCIDAS</label>
                  <input
                    type="text"
                    value={editForm.alergiasConocidas}
                    onChange={(e) => setEditForm({ ...editForm, alergiasConocidas: e.target.value })}
                    className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[10px] text-[#6c6a64] mb-2 uppercase tracking-widest">HISTORIAL CLÍNICO / OBSERVACIONES GENERALES</label>
                  <textarea
                    rows={3}
                    value={editForm.observacionesGenerales}
                    onChange={(e) => setEditForm({ ...editForm, observacionesGenerales: e.target.value })}
                    className="w-full bg-white border border-[#141413]/10 rounded-[4px] px-4 py-3 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none text-[#141413] resize-none"
                  />
                </div>

                {/* Toggle Activo */}
                <div className="flex justify-between items-center bg-white border border-[#141413]/10 p-4 rounded-[4px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[10px] text-[#6c6a64] uppercase tracking-wider">Estado Clínico</span>
                    <span className="text-[10px] text-[#6c6a64]/70">Marcar como paciente activo del hospital.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, activo: !editForm.activo })}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{ backgroundColor: editForm.activo ? '#cc785c' : '#e6dfd8' }}
                  >
                    <span
                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      style={{ transform: editForm.activo ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                <div className="pt-6 border-t border-[#141413]/10 flex gap-4 bg-white -mx-6 px-6 pb-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#cc785c] text-white font-semibold text-sm py-4 rounded-[4px] hover:bg-[#a9583e] transition-colors cursor-pointer flex justify-center items-center gap-2"
                  >
                    {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>Guardar Cambios</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 border border-[#141413]/25 text-[#6c6a64] font-semibold text-sm py-4 rounded-[4px] hover:bg-[#141413]/5 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TRANSFERENCIA DE PROPIETARIO */}
      <AnimatePresence>
        {showOwnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#141413]/30 backdrop-blur-[2px]"
              onClick={() => setShowOwnerModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md rounded-[4px] p-8 shadow-2xl flex flex-col space-y-4 text-left z-10 max-h-[85vh] bg-[#faf9f5] border border-[#141413]/10"
            >
              <div className="flex items-center gap-3 text-[#cc785c]">
                <span className="material-symbols-outlined text-3xl font-bold p-2 bg-[#cc785c]/10 rounded-[8px] border border-[#cc785c]/20">
                  swap_horiz
                </span>
                <div>
                  <h3 className="editorial-title text-xl text-[#141413] font-semibold">Transferir Responsabilidad</h3>
                  <p className="text-xs text-[#6c6a64] italic mt-0.5">Asignar esta mascota a otro cliente.</p>
                </div>
              </div>

              <div className="space-y-4 flex-1 flex flex-col min-h-0 text-[#6c6a64] text-xs">
                <p>
                  Asociarás a <strong className="text-[#141413]">{mascota.nombre}</strong> a un nuevo propietario. El historial clínico y de citas se conservarán íntegros en el expediente de la mascota de forma legal.
                </p>

                {/* Search owner input */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6c6a64]/50 text-[18px]">search</span>
                  <input
                    type="text"
                    value={searchOwnerQuery}
                    onChange={(e) => setSearchOwnerQuery(e.target.value)}
                    placeholder="Buscar clientes por nombre..."
                    className="w-full bg-white border border-[#141413]/10 rounded-[4px] pl-9 pr-4 py-2 text-[#141413] placeholder:text-[#6c6a64]/40 focus:ring-1 focus:ring-[#cc785c] focus:border-[#cc785c] outline-none transition-all text-xs"
                  />
                </div>

                {/* List owners */}
                <div className="flex flex-col gap-2 overflow-y-auto border border-[#141413]/10 rounded-[4px] p-2 max-h-[220px] bg-white">
                  {filteredOwners.length === 0 ? (
                    <p className="text-[#6c6a64]/50 text-center py-6">Ningún cliente coincide con la búsqueda.</p>
                  ) : (
                    filteredOwners.map(owner => (
                      <div
                        key={owner.id}
                        onClick={() => handleOwnerTransfer(owner.id, owner.nombre)}
                        className="flex justify-between items-center p-3 rounded-[4px] cursor-pointer hover:bg-[#cc785c]/5 border border-transparent hover:border-[#cc785c]/10 transition-all group"
                      >
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <p className="text-sm font-semibold text-[#141413] group-hover:text-[#cc785c] transition-colors">{owner.nombre}</p>
                          <p className="text-[10px] text-[#6c6a64]">{owner.email || 'Sin correo'}</p>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-[#6c6a64] group-hover:translate-x-1 group-hover:text-[#cc785c] transition-all">chevron_right</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#141413]/5 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setShowOwnerModal(false)}
                  className="btn-editorial-secondary px-5 py-2 text-xs"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
