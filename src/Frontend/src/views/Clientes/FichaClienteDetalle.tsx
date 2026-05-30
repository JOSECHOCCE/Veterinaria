import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ClientesService from '../../services/clientes.service';
import type { ClienteDetalle } from '../../services/clientes.service';

export default function FichaClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState<ClienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal para editar datos
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    dni: '',
    telefono: '',
    direccion: '',
    observaciones: ''
  });

  const fetchDetalle = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await ClientesService.getClienteDetails(Number(id));
      if (response.success) {
        setDetalle(response.data);
      } else {
        toast.error(response.message || 'Error al obtener ficha de cliente');
        navigate('/admin/clientes');
      }
    } catch (err: any) {
      toast.error('No se pudo establecer conexión para obtener la ficha detallada.');
      navigate('/admin/clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '100px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', width: '100%' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-hairline)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Cargando ficha del cliente...</p>
      </div>
    );
  }

  if (!detalle) return null;

  const { usuario, totalCitas, citasCompletadas, citasCanceladas, citasPendientes, totalGastado, pagosPendientes, citas } = detalle;
  const isTempEmail = usuario.email && usuario.email.startsWith('sin_correo_');

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleEditClick = () => {
    setEditForm({
      nombre: usuario.nombre,
      email: usuario.email && !usuario.email.startsWith('sin_correo_') ? usuario.email : '',
      dni: usuario.dni || '',
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || '',
      observaciones: ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dto = {
        nombre: editForm.nombre,
        telefono: editForm.telefono,
        email: editForm.email || undefined,
        dni: editForm.dni || undefined,
        direccion: editForm.direccion || undefined,
        observaciones: editForm.observaciones || undefined,
        ignorarDuplicados: true
      };
      const response = await ClientesService.editarCliente(usuario.id, dto);
      if (response.success) {
        toast.success('Cliente actualizado correctamente.');
        setShowEditModal(false);
        fetchDetalle();
      } else {
        toast.error(response.message || 'Error al actualizar cliente.');
      }
    } catch (err: any) {
      toast.error('Error del servidor al actualizar cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = async () => {
    try {
      const response = await ClientesService.toggleActivo(usuario.id);
      if (response.success) {
        toast.success(`Cliente ${usuario.nombre} ${usuario.activo ? 'desactivado' : 'activado'} correctamente.`);
        fetchDetalle();
      } else {
        toast.error(response.message || 'Error al cambiar estado.');
      }
    } catch (err: any) {
      toast.error('Error al cambiar el estado del cliente.');
    }
  };

  const getEstadoBadgeStyle = (estado: string) => {
    const est = (estado || '').trim().toLowerCase();
    
    if (est === 'confirmada' || est === 'confirmado') {
      return 'badge-editorial-pill badge-editorial-coral';
    } else if (est === 'completada' || est === 'completado') {
      return 'badge-editorial-pill badge-editorial-success';
    } else if (est === 'cancelada' || est === 'cancelado') {
      return 'badge-editorial-pill badge-editorial-error';
    }
    return 'badge-editorial-pill badge-editorial-default';
  };

  const getPagoBadgeStyle = (estado: string) => {
    const est = (estado || '').trim().toLowerCase();
    if (est === 'pagado') {
      return 'badge-editorial-pill badge-editorial-success';
    } else if (est === 'parcial') {
      return 'badge-editorial-pill badge-editorial-coral';
    }
    return 'badge-editorial-pill badge-editorial-error';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left', width: '100%' }}>
      
      {/* BREADCRUMBS Y ACCIÓN DE RETORNO */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xxs)', color: 'var(--color-outline-variant)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Link to="/admin/clientes" style={{ color: 'inherit', textDecoration: 'none' }}>Clientes</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
            <span style={{ color: 'var(--color-primary)' }}>Ficha de Cliente</span>
          </div>
          
          <h1 className="display-lg editorial-title" style={{ marginTop: 'var(--spacing-xxs)', fontWeight: 300 }}>
            Ficha del Cliente
          </h1>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '14px' }}>
            ID del Cliente: <strong>#{usuario.id}</strong> · Perfil operativo y legal
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/clientes')}
          className="btn-editorial-secondary"
          style={{ padding: '10px 18px', fontSize: '13px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Volver al Directorio
        </button>
      </header>

      {/* REJILLA EN DOS COLUMNAS EDITORIAL */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }} className="editorial-grid">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN Y CONTACTO (1/3 en pantalla ancha) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', gridColumn: 'span 1' }}>
          
          <div className="editorial-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
            {/* Cabecera del Perfil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: usuario.activo ? 'rgba(204, 120, 92, 0.08)' : 'var(--color-hairline-soft)',
                color: usuario.activo ? 'var(--color-primary)' : 'var(--color-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '24px',
                border: '1px solid var(--color-hairline)'
              }}>
                {usuario.nombre.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="title-md" style={{ margin: 0, fontWeight: 600, color: 'var(--color-ink)', fontSize: '18px' }}>
                  {usuario.nombre}
                </h2>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  Miembro desde: {formatDate(usuario.fechaRegistro)}
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--color-hairline-soft)' }} />

            {/* Ficha Técnica */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '4px' }}>
                  Documento de Identidad (DNI)
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-ink)', fontWeight: 500 }}>
                  {usuario.dni || <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>No registrado</span>}
                </span>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '4px' }}>
                  Teléfono de Contacto
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-ink)', fontWeight: 500 }}>
                  {usuario.telefono}
                </span>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '4px' }}>
                  Correo Electrónico
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-ink)', fontWeight: 500 }}>
                  {isTempEmail ? (
                    <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>Sin correo electrónico (Sin portal)</span>
                  ) : (
                    usuario.email
                  )}
                </span>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '4px' }}>
                  Dirección Habitual
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-ink)', fontWeight: 500 }}>
                  {usuario.direccion || <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>Sin dirección registrada</span>}
                </span>
              </div>

              {usuario.observaciones && (
                <div>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '4px' }}>
                    Notas Administrativas
                  </span>
                  <p style={{ fontSize: '13px', color: 'var(--color-body)', margin: 0, padding: '10px', backgroundColor: 'var(--color-canvas-soft)', borderRadius: '8px', border: '1px solid var(--color-hairline-soft)' }}>
                    {usuario.observaciones}
                  </p>
                </div>
              )}
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--color-hairline-soft)' }} />

            {/* Estado de Cuenta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-body)' }}>
                  Estado de cuenta
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', display: 'block' }}>
                  {usuario.activo ? 'Habilitado para agendar' : 'Acceso deshabilitado'}
                </span>
              </div>
              <span className={`badge-editorial-pill ${usuario.activo ? 'badge-editorial-success' : 'badge-editorial-default'}`}>
                {usuario.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Acciones del Perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={handleEditClick}
                className="btn-editorial-primary"
                style={{ width: '100%', fontWeight: 600 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                Editar Datos Personales
              </button>

              <button
                onClick={handleToggleEstado}
                className="btn-editorial-secondary"
                style={{ width: '100%', color: usuario.activo ? 'var(--color-semantic-error)' : 'var(--color-semantic-success)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {usuario.activo ? 'block' : 'check_circle'}
                </span>
                {usuario.activo ? 'Desactivar Cliente' : 'Activar Cliente'}
              </button>
            </div>

          </div>

        </div>

        {/* COLUMNA DERECHA: MÉTRICAS Y LISTAS RELACIONADAS (2/3 en pantalla ancha) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', gridColumn: 'span 1' }} className="col-derecha-detalle">
          
          {/* Tarjetas de Métricas de Pago y Citas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--spacing-sm)' }}>
            
            <div className="editorial-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Citas</span>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{totalCitas}</h4>
            </div>

            <div className="editorial-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completadas</span>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-semantic-success)', margin: 0 }}>{citasCompletadas}</h4>
            </div>

            <div className="editorial-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Canceladas</span>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-semantic-error)', margin: 0 }}>{citasCanceladas}</h4>
            </div>

            <div className="editorial-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Invertido</span>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-semantic-success)', margin: 0 }}>
                {formatMoney(totalGastado)}
              </h4>
            </div>

            <div className="editorial-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', borderColor: pagosPendientes > 0 ? 'var(--color-primary)' : 'var(--color-hairline)' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Por Pagar</span>
              <h4 style={{ fontSize: '20px', fontWeight: 600, color: pagosPendientes > 0 ? 'var(--color-primary)' : 'var(--color-body)', margin: 0 }}>
                {formatMoney(pagosPendientes)}
              </h4>
            </div>

          </div>

          {/* Sección de Mascotas */}
          <div className="editorial-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontSize: '20px', fontWeight: 500, margin: 0, color: 'var(--color-ink)' }}>
                Mascotas Asociadas ({usuario.mascotas?.length || 0})
              </h3>
              
              <Link to="/admin/mascotas" className="btn-editorial-secondary" style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '12px', height: '30px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                Registrar Mascota
              </Link>
            </div>

            {(!usuario.mascotas || usuario.mascotas.length === 0) ? (
              <p style={{ margin: 0, padding: '16px', textAlign: 'center', color: 'var(--color-muted)', fontStyle: 'italic', fontSize: '14px' }}>
                No hay mascotas registradas bajo este cliente responsable. Toda mascota requiere obligatoriamente un cliente.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {usuario.mascotas.map((mascota) => (
                  <div
                    key={mascota.id}
                    onClick={() => navigate(`/admin/mascotas/${mascota.id}`)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--color-hairline-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: mascota.activo ? 'white' : 'var(--color-canvas-soft)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-hairline-soft)';
                      e.currentTarget.style.backgroundColor = mascota.activo ? 'white' : 'var(--color-canvas-soft)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(204,120,92,0.06)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                          {mascota.especie.toLowerCase().includes('perro') ? 'pets' : 'cat'}
                        </span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{mascota.nombre}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                          {mascota.especie} {mascota.raza ? `· ${mascota.raza}` : ''}
                        </span>
                      </div>
                    </div>
                    
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-muted)', fontSize: '18px' }}>
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de Citas del Cliente */}
          <div className="editorial-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontSize: '20px', fontWeight: 500, margin: 0, color: 'var(--color-ink)' }}>
              Historial de Citas Clínicas
            </h3>

            {(!citas || citas.length === 0) ? (
              <p style={{ margin: 0, padding: '24px', textAlign: 'center', color: 'var(--color-muted)', fontStyle: 'italic', fontSize: '14px' }}>
                Este cliente no registra atenciones o citas históricas en el sistema.
              </p>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--color-hairline-soft)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-hairline-soft)', backgroundColor: 'var(--color-canvas-soft)', fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 14px' }}>Fecha / Hora</th>
                      <th style={{ padding: '12px 14px' }}>Paciente</th>
                      <th style={{ padding: '12px 14px' }}>Servicio</th>
                      <th style={{ padding: '12px 14px' }}>Veterinario</th>
                      <th style={{ padding: '12px 14px' }}>Estado</th>
                      <th style={{ padding: '12px 14px' }}>Monto</th>
                      <th style={{ padding: '12px 14px' }}>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citas.map((cita) => (
                      <tr
                        key={cita.id}
                        onClick={() => navigate(`/admin/citas` /* O página de detalle de cita si existiera */)}
                        style={{
                          borderBottom: '1px solid var(--color-hairline-soft)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-canvas-soft)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{formatDate(cita.fechaHora)}</span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>{formatTime(cita.fechaHora)}</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-primary)', fontWeight: 600 }}>
                          {cita.mascota?.nombre}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-ink)' }}>
                          {cita.servicio?.nombre}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-body)' }}>
                          {cita.veterinario?.nombre}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={getEstadoBadgeStyle(cita.estado)}>
                            {cita.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          {formatMoney(cita.montoTotal)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={getPagoBadgeStyle(cita.estadoPago)}>
                            {cita.estadoPago}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </section>

      {/* MODAL / PANEL DE EDICIÓN FLOTANTE (REPLICADO DE STITCH) */}
      {createPortal(
        <AnimatePresence>
          {showEditModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20, 20, 19, 0.4)', backdropFilter: 'blur(6px)' }}
                onClick={() => setShowEditModal(false)}
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '540px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid var(--color-hairline)',
                  boxShadow: '0 24px 60px -15px rgba(20,20,19,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 40px)',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}
              >
                <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--color-hairline-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif", fontSize: '22px', fontWeight: 500, margin: 0, color: 'var(--color-ink)' }}>
                      Editar Perfil de Cliente
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-muted)' }}>Actualiza datos de contacto y facturación</p>
                  </div>
                  <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', display: 'flex' }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Nombre Completo <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Teléfono <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="editorial-input"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Documento Identidad (DNI)
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        value={editForm.dni}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dni: e.target.value }))}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Correo Electrónico (Opcional)
                      </label>
                      <input
                        type="email"
                        className="editorial-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
                        Si ingresas un correo nuevo a un cliente que no tenía, se le creará acceso al portal automáticamente.
                      </span>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Dirección Habitual
                      </label>
                      <input
                        type="text"
                        className="editorial-input"
                        value={editForm.direccion}
                        onChange={(e) => setEditForm(prev => ({ ...prev, direccion: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '20px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="btn-editorial-secondary"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-editorial-primary"
                      disabled={submitting}
                      style={{ minWidth: '140px' }}
                    >
                      {submitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
