import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PagosService from '../../services/pagos.service';
import type { PagoDto, CitaPendientePagoDto } from '../../services/pagos.service';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import AnularPagoModal from '../../components/Pagos/AnularPagoModal';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';

export default function GestionPagos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');

  // Tab 1: Pending Collections States
  const [citasPendientes, setCitasPendientes] = useState<CitaPendientePagoDto[]>([]);
  const [loadingPendientes, setLoadingPendientes] = useState(true);
  const [errorPendientes, setErrorPendientes] = useState<string | null>(null);
  const [buscarPendiente, setBuscarPendiente] = useState('');
  const [filtroVencimiento, setFiltroVencimiento] = useState<'all' | 'vencido' | 'hoy' | 'proximo'>('all');

  // Tab 2: Transaction History States
  const [pagosHistorial, setPagosHistorial] = useState<PagoDto[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [buscarHistorial, setBuscarHistorial] = useState('');
  const [metodoFiltro, setMetodoFiltro] = useState('Todos');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos'); // "Todos", "Válido", "Anulado"
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [totalPagosCount, setTotalPagosCount] = useState(0);

  // Voiding Modal States
  const [selectedPagoForAnulacion, setSelectedPagoForAnulacion] = useState<PagoDto | null>(null);
  const [isAnulacionModalOpen, setIsAnulacionModalOpen] = useState(false);

  // Download PDF Handler
  const handleDescargarComprobante = async (pagoId: number, referencia?: string) => {
    try {
      toast.loading('Generando comprobante PDF...');
      const res = await PagosService.descargarComprobante(pagoId);
      if (res && res.fileBase64) {
        const byteCharacters = atob(res.fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: res.contentType || 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = res.fileName || `Comprobante_Pago_${referencia || pagoId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Comprobante descargado con éxito.');
      } else {
        toast.dismiss();
        toast.error('No se pudo generar el archivo de comprobante.');
      }
    } catch (err: any) {
      toast.dismiss();
      console.error('Error downloading receipt:', err);
      toast.error('Error al descargar el comprobante PDF.');
    }
  };

  // Load Pending Collections
  const fetchPendientes = useCallback(async () => {
    try {
      setLoadingPendientes(true);
      setErrorPendientes(null);
      const res = await PagosService.getPendientesPago();
      setCitasPendientes(res || []);
    } catch (err: any) {
      console.error('Error fetching pending collections:', err);
      setErrorPendientes('No pudimos cargar la lista de cobros pendientes.');
    } finally {
      setLoadingPendientes(false);
    }
  }, []);

  // Load Payments History
  const fetchHistorial = useCallback(async () => {
    try {
      setLoadingHistorial(true);
      setErrorHistorial(null);

      const params: any = {
        page
      };

      if (metodoFiltro !== 'Todos') params.metodoPago = metodoFiltro;
      if (estadoFiltro !== 'Todos') {
        params.tipoPago = estadoFiltro === 'Anulado' ? 'Anulado' : '';
      }
      if (fechaDesde) params.fechaDesde = `${fechaDesde}T00:00:00`;
      if (fechaHasta) params.fechaHasta = `${fechaHasta}T23:59:59`;

      const res = await PagosService.getPagos(params);
      if (res) {
        let list: PagoDto[] = res.pagos || [];
        if (estadoFiltro === 'Válido') {
          list = list.filter((p) => p.tipoPago !== 'Anulado');
        }

        setPagosHistorial(list);
        setTotalPagosCount(res.totalPagos || list.length);
      }
    } catch (err: any) {
      console.error('Error fetching transaction history:', err);
      setErrorHistorial('No pudimos cargar el historial de pagos.');
    } finally {
      setLoadingHistorial(false);
    }
  }, [page, metodoFiltro, estadoFiltro, fechaDesde, fechaHasta]);

  // Load dynamic data on mount / tab change
  useEffect(() => {
    if (activeTab === 'pendientes') {
      fetchPendientes();
    } else {
      fetchHistorial();
    }
  }, [activeTab, fetchPendientes, fetchHistorial]);

  // Filter Pending Collections locally
  const getFilteredPendientes = () => {
    return citasPendientes.filter((c) => {
      if (buscarPendiente.trim()) {
        const query = buscarPendiente.toLowerCase();
        const clientMatch = c.mascota?.usuario?.nombre.toLowerCase().includes(query);
        const petMatch = c.mascota?.nombre.toLowerCase().includes(query);
        const serviceMatch = c.servicio?.nombre.toLowerCase().includes(query);
        if (!clientMatch && !petMatch && !serviceMatch) return false;
      }

      const now = new Date();
      const citaDate = new Date(c.fechaHora);
      const isToday = citaDate.toDateString() === now.toDateString();
      const isPast = citaDate < now && !isToday;

      if (filtroVencimiento === 'vencido' && !isPast) return false;
      if (filtroVencimiento === 'hoy' && !isToday) return false;
      if (filtroVencimiento === 'proximo' && (isPast || isToday)) return false;

      return true;
    });
  };

  // Filter History locally by search query
  const getFilteredHistorial = () => {
    return pagosHistorial.filter((p) => {
      if (!buscarHistorial.trim()) return true;
      const query = buscarHistorial.toLowerCase();
      const clientMatch = p.propietarioNombre?.toLowerCase().includes(query);
      const petMatch = p.mascotaNombre?.toLowerCase().includes(query);
      const refMatch = p.referencia?.toLowerCase().includes(query);
      return clientMatch || petMatch || refMatch;
    });
  };

  // Void/Anular Pago Execution
  const handleConfirmAnulacion = async (motivo: string) => {
    if (!selectedPagoForAnulacion) return;
    await PagosService.anularPago(selectedPagoForAnulacion.id, motivo);
    toast.success('El pago ha sido anulado con éxito.');
    fetchHistorial();
  };

  const getPetIcon = (especie: string) => {
    const esp = especie.toLowerCase();
    if (esp.includes('perro') || esp.includes('canin') || esp.includes('dog')) {
      return 'pets';
    }
    return 'cruelty_free';
  };

  const getPetIconColor = (especie: string) => {
    const esp = especie.toLowerCase();
    if (esp.includes('perro') || esp.includes('canin') || esp.includes('dog')) {
      return 'bg-tertiary-container/30 text-on-tertiary-container';
    }
    return 'bg-secondary-container/50 text-on-secondary-container';
  };

  // Stats calculation for Bento Cards (Pending Tab)
  const totalPendingMonto = citasPendientes.reduce((acc, c) => acc + (c.montoTotal - c.montoPagado), 0);
  const now = new Date();
  const vencidosCount = citasPendientes.filter((c) => {
    const citaDate = new Date(c.fechaHora);
    return citaDate < now && citaDate.toDateString() !== now.toDateString();
  });
  const vencidosMonto = vencidosCount.reduce((acc, c) => acc + (c.montoTotal - c.montoPagado), 0);

  const hoyCount = citasPendientes.filter((c) => new Date(c.fechaHora).toDateString() === now.toDateString());
  const hoyMonto = hoyCount.reduce((acc, c) => acc + (c.montoTotal - c.montoPagado), 0);

  const filteredPendientes = getFilteredPendientes();
  const filteredHistorial = getFilteredHistorial();

  const isUserAdmin = user?.role === 'Admin';

  return (
    <div className="flex-grow flex flex-col min-w-0 select-none p-gutter">
      {/* Header */}
      <PageHeader
        title={activeTab === 'pendientes' ? 'Cobros Pendientes' : 'Historial de Pagos'}
        description={
          activeTab === 'pendientes'
            ? 'Gestión de cuentas por cobrar y facturación pendiente de consultas finalizadas.'
            : 'Gestión y auditoría de transacciones financieras registradas en caja.'
        }
        actions={
          <div className="flex gap-xs bg-surface-container-high p-1 rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-4 py-2 font-button text-button rounded-md transition-all cursor-pointer ${
                activeTab === 'pendientes'
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-secondary hover:text-ink'
              }`}
            >
              Cobros Pendientes
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2 font-button text-button rounded-md transition-all cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-secondary hover:text-ink'
              }`}
            >
              Historial de Pagos
            </button>
          </div>
        }
        hasDivider={true}
      />

      {/* RENDER TAB 1: PENDING COLLECTIONS */}
      {activeTab === 'pendientes' && (
        <div className="flex flex-col gap-lg animate-fadeIn">
          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-hairline flex justify-between items-center shadow-xs">
              <div>
                <span className="block font-caption text-caption text-secondary uppercase tracking-wider">Total Pendiente</span>
                <span className="font-display-sm text-display-sm text-ink font-bold mt-1">
                  S/. {totalPendingMonto.toFixed(2)}
                </span>
                <p className="font-caption text-caption text-secondary mt-1">
                  {citasPendientes.length} consultas sin liquidar
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              </div>
            </div>

            <div className="bg-error/5 rounded-xl p-6 border border-error/15 flex justify-between items-center shadow-xs">
              <div>
                <span className="block font-caption text-caption text-error uppercase tracking-wider">Cobros Vencidos</span>
                <span className="font-display-sm text-display-sm text-error font-bold mt-1">
                  S/. {vencidosMonto.toFixed(2)}
                </span>
                <p className="font-caption text-caption text-error mt-1">
                  {vencidosCount.length} citas atrasadas
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-error-container/30 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
            </div>

            <div className="bg-accent-amber/5 rounded-xl p-6 border border-accent-amber/20 flex justify-between items-center shadow-xs">
              <div>
                <span className="block font-caption text-caption text-accent-amber uppercase tracking-wider">Vence Hoy</span>
                <span className="font-display-sm text-display-sm text-accent-amber font-bold mt-1">
                  S/. {hoyMonto.toFixed(2)}
                </span>
                <p className="font-caption text-caption text-accent-amber mt-1">
                  {hoyCount.length} citas de la fecha
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent-amber/15 text-accent-amber flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">today</span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-md">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-label-sm text-label-sm text-outline mb-2">Buscar Cliente o Mascota</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  type="text"
                  value={buscarPendiente}
                  onChange={(e) => setBuscarPendiente(e.target.value)}
                  placeholder="Ej. Juan Pérez, Toby..."
                  className="w-full h-12 pl-10 pr-4 bg-surface border border-outline-variant/50 rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="w-full sm:w-auto min-w-[180px]">
              <label className="block font-label-sm text-label-sm text-outline mb-2">Fecha / Plazo</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">calendar_today</span>
                <select
                  value={filtroVencimiento}
                  onChange={(e: any) => setFiltroVencimiento(e.target.value)}
                  className="w-full h-12 pl-10 pr-8 bg-surface border border-outline-variant/50 rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer appearance-none animate-none"
                >
                  <option value="all">Todos los plazos</option>
                  <option value="vencido">Vencido</option>
                  <option value="hoy">Vence Hoy</option>
                  <option value="proximo">Próximo</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Pending Table */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[300px]">
            {loadingPendientes ? (
              <div className="flex-grow flex items-center justify-center my-xl">
                <Spinner message="Cargando cobros pendientes..." />
              </div>
            ) : errorPendientes ? (
              <div className="flex-grow p-xl">
                <ErrorMessage message={errorPendientes} onRetry={fetchPendientes} />
              </div>
            ) : filteredPendientes.length === 0 ? (
              <EmptyState
                icon="receipt_long"
                title="Sin cobros pendientes"
                description={buscarPendiente ? 'No se encontraron registros que coincidan con la búsqueda.' : 'No hay deudas ni consultas pendientes de liquidar.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/30 text-label-sm font-label-sm text-outline uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold">Cliente</th>
                      <th className="py-4 px-6 font-semibold">Mascota</th>
                      <th className="py-4 px-6 font-semibold">Servicio / Veterinario</th>
                      <th className="py-4 px-6 font-semibold w-40">Fecha</th>
                      <th className="py-4 px-6 font-semibold text-right w-36">Monto</th>
                      <th className="py-4 px-6 font-semibold text-center w-36">Estado</th>
                      <th className="py-4 px-6 font-semibold text-right w-44">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm text-on-background">
                    {filteredPendientes.map((c) => {
                      const now = new Date();
                      const citaDate = new Date(c.fechaHora);
                      const isToday = citaDate.toDateString() === now.toDateString();
                      const isPast = citaDate < now && !isToday;
                      const pendienteMonto = c.montoTotal - c.montoPagado;

                      return (
                        <tr key={c.id} className="hover:bg-surface transition-colors group">
                          <td className="py-4 px-6">
                            <div className="font-label-md text-label-md text-on-surface">{c.mascota?.usuario?.nombre || 'Sin cliente'}</div>
                            <div className="text-[12px] text-on-surface-variant font-medium mt-xxs">PAC-ID: {c.mascota?.id || '---'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getPetIconColor(c.mascota?.especie || '')}`}>
                                <span className="material-symbols-outlined text-[16px]">{getPetIcon(c.mascota?.especie || '')}</span>
                              </div>
                              <div>
                                <div className="font-label-md text-label-md text-on-surface">{c.mascota?.nombre}</div>
                                <div className="text-[12px] text-on-surface-variant font-medium mt-xxs">{c.mascota?.especie}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-label-md text-label-md text-on-surface">{c.servicio?.nombre || 'Consulta General'}</div>
                            <div className="text-[12px] text-on-surface-variant font-medium mt-xxs font-medium">Dr(a). {c.veterinario?.nombre || 'No asignado'}</div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant whitespace-nowrap">
                            {new Date(c.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-6 font-label-md text-label-md text-right text-ink font-semibold">
                            S/. {pendienteMonto.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold border ${
                              isPast 
                                ? 'bg-error-container text-on-error-container border-error/20' 
                                : 'bg-[#fff5f5] text-red-600 border-red-200'
                            }`}>
                              Pendiente
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => navigate(`/admin/pagos/registrar/${c.id}`)}
                              className="h-10 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer font-bold"
                            >
                              Registrar Cobro
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 2: TRANSACTION HISTORY */}
      {activeTab === 'historial' && (
        <div className="flex flex-col gap-lg animate-fadeIn">
          {/* Filters Area */}
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20 flex flex-wrap gap-4 items-end shadow-xs">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-sm font-label-sm text-outline mb-2">Rango de Fechas</label>
              <div className="flex items-center gap-sm">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setPage(1);
                    setFechaDesde(e.target.value);
                  }}
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-body-sm text-on-surface"
                />
                <span className="text-outline">-</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => {
                    setPage(1);
                    setFechaHasta(e.target.value);
                  }}
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-body-sm text-on-surface"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-label-sm font-label-sm text-outline mb-2">Método de Pago</label>
              <div className="relative">
                <select
                  value={metodoFiltro}
                  onChange={(e) => {
                    setPage(1);
                    setMetodoFiltro(e.target.value);
                  }}
                  className="w-full h-12 pl-4 pr-10 rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="Todos">Todos los métodos</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta de Crédito</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-label-sm font-label-sm text-outline mb-2">Estado</label>
              <div className="relative">
                <select
                  value={estadoFiltro}
                  onChange={(e) => {
                    setPage(1);
                    setEstadoFiltro(e.target.value);
                  }}
                  className="w-full h-12 pl-4 pr-10 rounded-lg border border-outline-variant/50 bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="Todos">Todos</option>
                  <option value="Válido">Válido</option>
                  <option value="Anulado">Anulado</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-sm font-label-sm text-outline mb-2">Buscar Transacción</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  type="text"
                  value={buscarHistorial}
                  onChange={(e) => setBuscarHistorial(e.target.value)}
                  placeholder="Cliente, mascota, ref..."
                  className="w-full h-12 pl-10 pr-4 bg-surface border border-outline-variant/50 rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </section>

          {/* Table Area */}
          <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[300px]">
            {loadingHistorial ? (
              <div className="flex-grow flex items-center justify-center my-xl">
                <Spinner message="Obteniendo historial de pagos..." />
              </div>
            ) : errorHistorial ? (
              <div className="flex-grow p-xl">
                <ErrorMessage message={errorHistorial} onRetry={fetchHistorial} />
              </div>
            ) : filteredHistorial.length === 0 ? (
              <EmptyState
                icon="payments"
                title="Historial de pagos vacío"
                description={buscarHistorial ? 'No se encontraron transacciones que coincidan con la búsqueda.' : 'No se han registrado cobros bajo los filtros seleccionados.'}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/30 text-label-sm font-label-sm text-outline uppercase tracking-wider">
                        <th className="py-4 px-6 font-semibold w-40">Fecha/Hora</th>
                        <th className="py-4 px-6 font-semibold">Cliente &amp; Mascota</th>
                        <th className="py-4 px-6 font-semibold">Servicio</th>
                        <th className="py-4 px-6 font-semibold w-44">Método</th>
                        <th className="py-4 px-6 font-semibold text-right w-36">Monto</th>
                        <th className="py-4 px-6 font-semibold text-center w-32">Estado</th>
                        <th className="py-4 px-6 font-semibold text-right w-40">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm text-on-background">
                      {filteredHistorial.map((p) => {
                        const isAnulado = p.tipoPago === 'Anulado';
                        
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-surface transition-colors group ${
                              isAnulado ? 'bg-surface/50 opacity-60' : ''
                            }`}
                          >
                            <td className="py-4 px-6 whitespace-nowrap">
                              <p className="font-label-md text-label-md text-on-surface">
                                {new Date(p.fechaPago).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[12px] text-on-surface-variant mt-xxs">
                                {new Date(p.fechaPago).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
                                  <span className="material-symbols-outlined text-[20px]">person</span>
                                </div>
                                <div>
                                  <p className={`font-label-md text-label-md text-on-surface font-semibold ${isAnulado ? 'line-through' : ''}`}>
                                    {p.propietarioNombre || 'Cliente'}
                                  </p>
                                  <p className={`text-[12px] text-on-surface-variant flex items-center gap-1 font-medium mt-xxs ${isAnulado ? 'line-through' : ''}`}>
                                    <span className="material-symbols-outlined text-[14px]">pets</span>
                                    {p.mascotaNombre || 'Mascota'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className={`py-4 px-6 text-on-surface-variant font-medium ${isAnulado ? 'line-through' : ''}`}>
                              {p.servicioNombre || 'Consulta General'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-on-surface font-medium">
                                <span className="material-symbols-outlined text-outline text-[20px]">
                                  {p.metodoPago === 'Tarjeta' ? 'credit_card' : 'payments'}
                                </span>
                                {p.metodoPago} {p.ultimosDigitosTarjeta ? `*${p.ultimosDigitosTarjeta}` : ''}
                              </div>
                              {p.referencia && (
                                <span className="text-[10px] text-body-muted font-code mt-1 block select-all">
                                  Ref: {p.referencia}
                                </span>
                              )}
                            </td>
                            <td className={`py-4 px-6 text-on-surface font-semibold text-right whitespace-nowrap ${isAnulado ? 'line-through' : ''}`}>
                              S/. {p.monto.toFixed(2)}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold border ${
                                isAnulado
                                  ? 'bg-error-container text-on-error-container border-error/20'
                                  : 'bg-[#e6fffa] text-primary border-primary-container/30'
                              }`}>
                                {isAnulado ? 'Anulado' : 'Válido'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isAnulado && (
                                  <>
                                    <button
                                      onClick={() => handleDescargarComprobante(p.id, p.referencia)}
                                      className="p-2 text-outline hover:text-primary hover:bg-surface-container rounded-full transition-colors cursor-pointer"
                                      title="Descargar PDF"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                    </button>
                                    
                                    {isUserAdmin && (
                                      <button
                                        onClick={() => {
                                          setSelectedPagoForAnulacion(p);
                                          setIsAnulacionModalOpen(true);
                                        }}
                                        className="p-2 text-error/80 hover:text-error hover:bg-error-container/50 rounded-full transition-colors cursor-pointer"
                                        title="Anular Transacción"
                                      >
                                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                                      </button>
                                    )}
                                  </>
                                )}
                                {isAnulado && (
                                  <span className="text-caption font-caption text-body-muted italic select-none pr-2">
                                    Sin acciones
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant/30">
                  <span className="text-label-sm font-label-sm text-outline">
                    Mostrando 10 registros por página
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="p-1 rounded text-outline hover:bg-surface-variant transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="w-8 h-8 rounded bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold">
                      {page}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={filteredHistorial.length < 10}
                      className="p-1 rounded text-outline hover:bg-surface-variant transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* VOIDING MODAL */}
      <AnularPagoModal
        isOpen={isAnulacionModalOpen}
        onClose={() => {
          setIsAnulacionModalOpen(false);
          setSelectedPagoForAnulacion(null);
        }}
        pago={
          selectedPagoForAnulacion
            ? {
                id: selectedPagoForAnulacion.id,
                referencia: selectedPagoForAnulacion.referencia,
                monto: selectedPagoForAnulacion.monto,
                propietarioNombre: selectedPagoForAnulacion.propietarioNombre,
                mascotaNombre: selectedPagoForAnulacion.mascotaNombre,
                fechaPago: selectedPagoForAnulacion.fechaPago
              }
            : null
        }
        onConfirm={handleConfirmAnulacion}
      />
    </div>
  );
}
