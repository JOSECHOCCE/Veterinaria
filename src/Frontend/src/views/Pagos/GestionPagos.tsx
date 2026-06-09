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
        // Convert base64 to blob and trigger download
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

      // Build params
      const params: any = {
        page
      };

      if (metodoFiltro !== 'Todos') params.metodoPago = metodoFiltro;
      if (estadoFiltro !== 'Todos') {
        params.tipoPago = estadoFiltro === 'Anulado' ? 'Anulado' : ''; // Filter voided ones specifically
      }
      if (fechaDesde) params.fechaDesde = `${fechaDesde}T00:00:00`;
      if (fechaHasta) params.fechaHasta = `${fechaHasta}T23:59:59`;

      const res = await PagosService.getPagos(params);
      if (res) {
        let list: PagoDto[] = res.pagos || [];
        
        // Local filtering for "Válido" if estadoFiltro is Válido (since API filters by tipoPago)
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
      // Text search
      if (buscarPendiente.trim()) {
        const query = buscarPendiente.toLowerCase();
        const clientMatch = c.mascota?.usuario?.nombre.toLowerCase().includes(query);
        const petMatch = c.mascota?.nombre.toLowerCase().includes(query);
        const serviceMatch = c.servicio?.nombre.toLowerCase().includes(query);
        if (!clientMatch && !petMatch && !serviceMatch) return false;
      }

      // Expiration date filter
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
    <div className="flex-grow flex flex-col min-w-0 select-none">
      {/* Header */}
      <PageHeader
        title="Pagos y Cobros"
        description="Gestión de facturación, caja diaria y registro de auditoría de transacciones."
        actions={
          <div className="flex gap-xs bg-surface-soft p-1 rounded-lg border border-hairline">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-4 py-2 font-button text-button rounded-md transition-all cursor-pointer ${
                activeTab === 'pendientes'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-secondary hover:text-ink'
              }`}
            >
              Cobros Pendientes
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2 font-button text-button rounded-md transition-all cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-primary text-on-primary shadow-sm'
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
            <div className="bg-surface-card rounded-xl p-md border border-hairline flex justify-between items-center shadow-xs">
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

            <div className="bg-error/5 rounded-xl p-md border border-error/15 flex justify-between items-center shadow-xs">
              <div>
                <span className="block font-caption text-caption text-error uppercase tracking-wider">Cobros Vencidos</span>
                <span className="font-display-sm text-display-sm text-error font-bold mt-1">
                  S/. {vencidosMonto.toFixed(2)}
                </span>
                <p className="font-caption text-caption text-error mt-1">
                  {vencidosCount.length} citas atrasadas
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
            </div>

            <div className="bg-accent-amber/5 rounded-xl p-md border border-accent-amber/20 flex justify-between items-center shadow-xs">
              <div>
                <span className="block font-caption text-caption text-accent-amber uppercase tracking-wider">Vence Hoy</span>
                <span className="font-display-sm text-display-sm text-accent-amber font-bold mt-1">
                  S/. {hoyMonto.toFixed(2)}
                </span>
                <p className="font-caption text-caption text-accent-amber mt-1">
                  {hoyCount.length} citas de la fecha
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent-amber/10 text-accent-amber flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">today</span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-surface-card rounded-xl border border-hairline p-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-md">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
              <input
                type="text"
                value={buscarPendiente}
                onChange={(e) => setBuscarPendiente(e.target.value)}
                placeholder="Buscar por cliente, mascota o servicio..."
                className="w-full pl-9 pr-4 py-2 bg-canvas border border-hairline rounded-lg font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary transition-all shadow-inner"
              />
            </div>

            <div className="flex gap-sm">
              <select
                value={filtroVencimiento}
                onChange={(e: any) => setFiltroVencimiento(e.target.value)}
                className="bg-canvas border border-hairline rounded-lg pl-3 pr-8 py-2 font-body-sm text-body-sm text-ink focus:outline-none focus:border-primary cursor-pointer appearance-none min-w-[150px]"
              >
                <option value="all">Plazo: Todos</option>
                <option value="vencido">Vencido</option>
                <option value="hoy">Vence Hoy</option>
                <option value="proximo">Próximo</option>
              </select>
            </div>
          </div>

          {/* Pending Table */}
          <div className="bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
            {loadingPendientes ? (
              <div className="flex-grow flex items-center justify-center my-xl">
                <Spinner message="Cargando cola de cobros pendientes..." />
              </div>
            ) : errorPendientes ? (
              <div className="flex-grow p-xl">
                <ErrorMessage message={errorPendientes} onRetry={fetchPendientes} />
              </div>
            ) : filteredPendientes.length === 0 ? (
              <EmptyState
                icon="receipt_long"
                title="Sin cobros pendientes"
                description={buscarPendiente ? 'No se encontraron registros que coincidan con la búsqueda.' : 'No hay deudas ni consultas pendientes de pago en este momento.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-surface-soft border-b border-hairline">
                      <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider w-[35%]">Cliente / Mascota</th>
                      <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Servicio</th>
                      <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Veterinario</th>
                      <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider w-36">Fecha Cita</th>
                      <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider text-right w-36">Monto Total</th>
                      <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider text-right w-36">Pendiente</th>
                      <th className="py-3 px-lg font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider text-center w-36">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {filteredPendientes.map((c) => {
                      const now = new Date();
                      const citaDate = new Date(c.fechaHora);
                      const isToday = citaDate.toDateString() === now.toDateString();
                      const isPast = citaDate < now && !isToday;
                      const pendienteMonto = c.montoTotal - c.montoPagado;

                      return (
                        <tr key={c.id} className="hover:bg-surface-soft/30 transition-colors group">
                          <td className="py-sm px-md">
                            <div className="flex items-center gap-md">
                              <div className="w-9 h-9 rounded-full bg-surface-soft flex items-center justify-center text-secondary font-bold">
                                {c.mascota?.usuario?.nombre ? c.mascota.usuario.nombre.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div>
                                <p className="font-title-sm text-title-sm text-ink font-semibold">{c.mascota?.usuario?.nombre || 'Sin cliente'}</p>
                                <p className="font-caption text-caption text-secondary mt-xxs flex items-center gap-xxs">
                                  <span className="material-symbols-outlined text-[13px]">pets</span>
                                  {c.mascota?.nombre} ({c.mascota?.especie})
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-sm px-md">
                            <p className="font-body-sm text-body-sm text-ink">{c.servicio?.nombre || 'Consulta General'}</p>
                            <span className={`inline-block mt-xs px-2 py-0.5 rounded-full font-caption text-[10px] font-bold border ${
                              isPast 
                                ? 'bg-error-container text-on-error-container border-error/20' 
                                : isToday 
                                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                : 'bg-surface-soft text-secondary border-hairline'
                            }`}>
                              {isPast ? 'Vencido' : isToday ? 'Vence Hoy' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="py-sm px-md font-body-sm text-body-sm text-secondary">
                            {c.veterinario?.nombre || 'No asignado'}
                          </td>
                          <td className="py-sm px-md font-body-sm text-body-sm text-secondary">
                            {new Date(c.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-sm px-md font-body-sm text-body-sm text-ink font-semibold text-right">
                            S/. {c.montoTotal.toFixed(2)}
                          </td>
                          <td className="py-sm px-md font-body-sm text-body-sm text-error font-bold text-right">
                            S/. {pendienteMonto.toFixed(2)}
                          </td>
                          <td className="py-sm px-md text-center">
                            <button
                              onClick={() => navigate(`/admin/pagos/registrar/${c.id}`)}
                              className="bg-primary hover:bg-primary-active text-on-primary font-button text-button px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                            >
                              Registrar Pago
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
          <section className="bg-surface-card rounded-xl p-lg border border-hairline flex flex-wrap gap-md items-end shadow-xs">
            <div className="flex flex-col gap-xxs flex-1 min-w-[200px]">
              <label className="font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Rango de Fechas</label>
              <div className="flex items-center gap-sm">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setFechaDesde(e.target.value);
                    setPage(1);
                  }}
                  className="bg-canvas border border-hairline rounded-lg px-sm py-2 font-body-sm text-body-sm w-full focus:outline-none focus:border-primary shadow-inner text-ink"
                />
                <span className="text-secondary">-</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => {
                    setFechaHasta(e.target.value);
                    setPage(1);
                  }}
                  className="bg-canvas border border-hairline rounded-lg px-sm py-2 font-body-sm text-body-sm w-full focus:outline-none focus:border-primary shadow-inner text-ink"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xxs min-w-[150px]">
              <label className="font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Método</label>
              <select
                value={metodoFiltro}
                onChange={(e) => {
                  setMetodoFiltro(e.target.value);
                  setPage(1);
                }}
                className="bg-canvas border border-hairline rounded-lg px-sm py-2 font-body-sm text-body-sm focus:outline-none focus:border-primary cursor-pointer text-ink"
              >
                <option value="Todos">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
              </select>
            </div>

            <div className="flex flex-col gap-xxs min-w-[150px]">
              <label className="font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Estado</label>
              <select
                value={estadoFiltro}
                onChange={(e) => {
                  setEstadoFiltro(e.target.value);
                  setPage(1);
                }}
                className="bg-canvas border border-hairline rounded-lg px-sm py-2 font-body-sm text-body-sm focus:outline-none focus:border-primary cursor-pointer text-ink"
              >
                <option value="Todos">Todos</option>
                <option value="Válido">Válido</option>
                <option value="Anulado">Anulado</option>
              </select>
            </div>

            <div className="flex flex-col gap-xxs flex-1 min-w-[200px]">
              <label className="font-caption-uppercase text-caption-uppercase text-secondary font-medium tracking-wider">Buscar por Filtro</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
                <input
                  type="text"
                  value={buscarHistorial}
                  onChange={(e) => setBuscarHistorial(e.target.value)}
                  placeholder="Cliente, Mascota, Ref..."
                  className="bg-canvas border border-hairline rounded-lg pl-xl pr-sm py-2 font-body-sm text-body-sm w-full focus:outline-none focus:border-primary shadow-inner text-ink"
                />
              </div>
            </div>
          </section>

          {/* Table Area */}
          <section className="bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
            {loadingHistorial ? (
              <div className="flex-grow flex items-center justify-center my-xl">
                <Spinner message="Obteniendo historial de caja y transacciones..." />
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
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-hairline bg-surface-soft">
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium w-40">Fecha/Hora</th>
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium">Cliente</th>
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium">Mascota</th>
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium">Servicio</th>
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium w-40">Método / Ref</th>
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium text-right w-36">Monto</th>
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium text-center w-32">Estado</th>
                        <th className="font-caption-uppercase text-caption-uppercase text-secondary py-3 px-lg font-medium text-right w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm divide-y divide-hairline">
                      {filteredHistorial.map((p) => {
                        const isAnulado = p.tipoPago === 'Anulado';
                        
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-surface-soft/30 transition-colors ${
                              isAnulado ? 'bg-error-container/10 opacity-70' : ''
                            }`}
                          >
                            <td className="py-sm px-md text-secondary whitespace-nowrap">
                              {new Date(p.fechaPago).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className={`py-sm px-md text-ink font-semibold ${isAnulado ? 'line-through' : ''}`}>
                              {p.propietarioNombre || 'Dueño'}
                            </td>
                            <td className="py-sm px-md text-secondary">
                              {p.mascotaNombre || 'Mascota'}
                            </td>
                            <td className="py-sm px-md text-secondary">
                              {p.servicioNombre || 'Servicio'}
                            </td>
                            <td className="py-sm px-md">
                              <div className="flex flex-col gap-xxs font-body-sm">
                                <span className="flex items-center gap-1 font-medium text-ink">
                                  <span className="material-symbols-outlined text-[16px] text-secondary">
                                    {p.metodoPago === 'Tarjeta' ? 'credit_card' : 'payments'}
                                  </span>
                                  {p.metodoPago} {p.ultimosDigitosTarjeta ? `*${p.ultimosDigitosTarjeta}` : ''}
                                </span>
                                {p.referencia && (
                                  <span className="text-[11px] text-body-muted font-code select-all">
                                    {p.referencia}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`py-sm px-md text-ink font-semibold text-right whitespace-nowrap ${isAnulado ? 'line-through' : ''}`}>
                              S/. {p.monto.toFixed(2)}
                            </td>
                            <td className="py-sm px-md text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isAnulado
                                  ? 'bg-error-container text-on-error-container border-error/20'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}>
                                {isAnulado ? 'Anulado' : 'Válido'}
                              </span>
                            </td>
                            <td className="py-sm px-md text-right">
                              <div className="flex items-center justify-end gap-xs md:opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isAnulado && (
                                  <>
                                    <button
                                      onClick={() => handleDescargarComprobante(p.id, p.referencia)}
                                      className="p-xs text-body-muted hover:text-primary hover:bg-surface-variant/50 rounded-md transition-all cursor-pointer"
                                      title="Descargar Comprobante PDF"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                    </button>
                                    
                                    {isUserAdmin && (
                                      <button
                                        onClick={() => {
                                          setSelectedPagoForAnulacion(p);
                                          setIsAnulacionModalOpen(true);
                                        }}
                                        className="p-xs text-body-muted hover:text-error hover:bg-error-container/30 rounded-md transition-all cursor-pointer"
                                        title="Anular Transacción"
                                      >
                                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                                      </button>
                                    )}
                                  </>
                                )}
                                {isAnulado && (
                                  <span className="text-caption font-caption text-body-muted italic select-none">
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
                <div className="border-t border-hairline bg-surface-soft px-lg py-sm flex items-center justify-between mt-auto">
                  <span className="font-caption text-caption text-secondary">
                    Total Registros: {totalPagosCount}
                  </span>
                  <div className="flex items-center gap-xs">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-hairline text-secondary hover:text-ink hover:border-outline-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="font-caption text-caption text-ink px-sm py-xxs bg-canvas rounded-md border border-hairline font-bold">
                      {page}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={filteredHistorial.length < 10} // Assumes 10 elements per page
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-hairline text-secondary hover:text-ink hover:border-outline-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
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
