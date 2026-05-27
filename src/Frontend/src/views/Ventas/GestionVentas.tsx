import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  activo: boolean;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  dni?: string;
}

interface VentaDetalle {
  id: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Venta {
  id: number;
  fecha: string;
  total: number;
  metodoPago: string;
  clienteId?: number;
  clienteNombre?: string;
  estado: string;
  detalles: VentaDetalle[];
}

const GestionVentas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Filtros de búsqueda para POS
  const [searchProd, setSearchProd] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  // Estado del Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [processingSale, setProcessingSale] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);

  // Historial de Ventas
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Cargar productos activos para POS
  const loadProductosPOS = async () => {
    setLoadingProds(true);
    try {
      const response = await api.get(`/api/Productos`, {
        params: { q: searchProd, page: 1 }
      });
      if (response.data.success) {
        setProductos(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar productos para POS:', error);
    } finally {
      setLoadingProds(false);
    }
  };

  // Cargar clientes para POS
  const loadClientesPOS = async () => {
    setLoadingClientes(true);
    try {
      const response = await api.get(`/api/Clientes`, {
        params: { buscar: searchClient }
      });
      if (response.data.success) {
        setClientes(response.data.data.usuarios || []);
      }
    } catch (error) {
      console.error('Error al cargar clientes para POS:', error);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Cargar historial de ventas
  const loadVentasHistory = async () => {
    setLoadingVentas(true);
    try {
      const response = await api.get(`/api/Ventas`, {
        params: {
          desde: fechaDesde || undefined,
          hasta: fechaHasta || undefined,
          page: 1
        }
      });
      if (response.data.success) {
        setVentas(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar historial de ventas:', error);
      toast.error('No se pudo cargar el historial de ventas.');
    } finally {
      setLoadingVentas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pos') {
      const timer = setTimeout(() => {
        loadProductosPOS();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchProd, activeTab]);

  useEffect(() => {
    if (activeTab === 'pos') {
      const timer = setTimeout(() => {
        loadClientesPOS();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchClient, activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadVentasHistory();
    }
  }, [activeTab, fechaDesde, fechaHasta]);

  // Carrito de compras
  const addToCart = (p: Producto) => {
    if (p.stock <= 0) {
      toast.error('El producto seleccionado no tiene stock disponible.');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.producto.id === p.id);
      if (existing) {
        if (existing.cantidad >= p.stock) {
          toast.warning(`Solo hay ${p.stock} unidades disponibles de "${p.nombre}".`);
          return prev;
        }
        return prev.map(item => item.producto.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { producto: p, cantidad: 1 }];
    });
  };

  const updateCartQuantity = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.producto.id !== id));
      return;
    }
    const item = cart.find(i => i.producto.id === id);
    if (item && qty > item.producto.stock) {
      toast.warning(`Solo hay ${item.producto.stock} unidades disponibles.`);
      return;
    }
    setCart(prev => prev.map(i => i.producto.id === id ? { ...i, cantidad: qty } : i));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.producto.id !== id));
  };

  const clearPOS = () => {
    setCart([]);
    setSelectedClient(null);
    setSearchClient('');
    setMetodoPago('Efectivo');
    setLastSaleId(null);
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
  };

  // Confirmar Venta
  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito de compras está vacío.');
      return;
    }

    setProcessingSale(true);
    try {
      const payload = {
        clienteId: selectedClient?.id || null,
        metodoPago: metodoPago,
        detalles: cart.map(item => ({
          productoId: item.producto.id,
          cantidad: item.cantidad
        }))
      };

      const response = await api.post('/api/Ventas', payload);
      if (response.data.success) {
        const venta = response.data.data;
        setLastSaleId(venta.id);
        toast.success('¡Venta procesada exitosamente!');
        // Vaciar carrito
        setCart([]);
        // Recargar productos
        loadProductosPOS();
      }
    } catch (error: any) {
      console.error('Error al registrar venta:', error);
      toast.error(error.response?.data?.message || 'Error al procesar la venta.');
    } finally {
      setProcessingSale(false);
    }
  };

  // Descargar Factura PDF
  const handleDownloadInvoice = async (id: number) => {
    try {
      const response = await api.get(`/api/Ventas/Factura/${id}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Factura_FAC_${id.toString().padStart(6, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al descargar factura:', error);
      toast.error('No se pudo generar la factura en PDF.');
    }
  };

  // Cancelar Venta
  const handleCancelSale = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas anular esta venta? Esto restablecerá los productos al inventario.')) {
      return;
    }

    try {
      const response = await api.post(`/api/Ventas/Cancel/${id}`);
      if (response.data.success) {
        toast.success('Venta anulada y stock retornado al inventario.');
        loadVentasHistory();
      }
    } catch (error: any) {
      console.error('Error al anular venta:', error);
      toast.error(error.response?.data?.message || 'No se pudo anular la venta.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-grow w-full bg-background min-h-screen pt-24 pb-margin"
    >
      <main className="flex-grow w-full max-w-6xl mx-auto px-margin flex flex-col gap-md">
        
        {/* Cabecera y Tabs */}
        <section className="flex flex-col sm:flex-row items-center justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md gap-sm">
          <div className="flex items-center gap-md text-left w-full sm:w-auto">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[32px]">point_of_sale</span>
            </div>
            <div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface">Punto de Venta y Facturación (POS)</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Registra ventas de medicamentos, emite facturas y consulta transacciones pasadas.</p>
            </div>
          </div>
          
          <div className="flex bg-surface-container-high/40 rounded-xl p-xs border border-outline-variant/30 w-full sm:w-auto justify-center">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-md py-xs rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                activeTab === 'pos' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Caja / POS
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-md py-xs rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                activeTab === 'history' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Historial de Ventas
            </button>
          </div>
        </section>

        {activeTab === 'pos' ? (
          /* PANTACTILLA POS */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md text-left">
            {/* LADO IZQUIERDO: SELECCIÓN DE PRODUCTOS */}
            <div className="lg:col-span-2 flex flex-col gap-sm">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-sm flex items-center gap-sm">
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface shadow-sm focus-within:border-primary transition-all duration-200 w-full">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">search</span>
                  <input
                    type="text"
                    className="w-full h-10 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none"
                    placeholder="Buscar producto por nombre..."
                    value={searchProd}
                    onChange={(e) => setSearchProd(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid de productos */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md min-h-[400px]">
                {loadingProds ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
                    <p className="font-label-sm text-label-sm text-outline mt-xs">Cargando catálogo...</p>
                  </div>
                ) : productos.length === 0 ? (
                  <div className="py-20 text-center opacity-65 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[48px] text-outline">inventory_2</span>
                    <p className="font-body-md text-body-md mt-sm">No se encontraron productos disponibles.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                    {productos.map(p => {
                      const outOfStock = p.stock <= 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => !outOfStock && addToCart(p)}
                          className={`border rounded-xl p-sm flex flex-col justify-between gap-sm transition-all cursor-pointer ${
                            outOfStock 
                              ? 'border-error/25 bg-error-container/5 opacity-60 cursor-not-allowed' 
                              : 'border-outline-variant/40 hover:border-primary hover:shadow-md hover:bg-surface'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-xs">
                            <h4 className="font-headline-sm font-bold text-on-surface truncate" title={p.nombre}>{p.nombre}</h4>
                            <span className="bg-secondary-container text-on-secondary-container px-sm py-[2px] rounded-full text-[10px] font-bold uppercase truncate">
                              {p.categoria}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-sm">
                            <span className="font-bold text-primary text-title-medium">S/. {p.precio.toFixed(2)}</span>
                            <span className={`text-label-sm font-bold px-sm py-[2px] rounded ${
                              outOfStock ? 'bg-error/15 text-error' : 'bg-outline-variant/30 text-on-surface-variant'
                            }`}>
                              Stock: {p.stock}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* LADO DERECHO: DETALLE DEL CARRITO Y CLIENTE */}
            <div className="flex flex-col gap-sm">
              {/* Cliente */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm">
                <h3 className="font-headline-sm font-extrabold text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Propietario / Cliente
                </h3>

                {selectedClient ? (
                  <div className="bg-primary/5 border border-primary/25 rounded-xl p-sm flex justify-between items-center gap-sm">
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-primary truncate">{selectedClient.nombre}</h4>
                      <p className="text-[11px] text-on-surface-variant font-semibold truncate">{selectedClient.email}</p>
                      {selectedClient.dni && <p className="text-[10px] text-outline truncate font-bold">DNI: {selectedClient.dni}</p>}
                    </div>
                    <button 
                      onClick={() => setSelectedClient(null)}
                      className="text-error hover:bg-error-container/30 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-xs relative">
                    <div className="relative rounded-xl border border-outline-variant/30 bg-surface shadow-sm focus-within:border-primary transition-all duration-200">
                      <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">search</span>
                      <input
                        type="text"
                        className="w-full h-10 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none"
                        placeholder="Buscar por nombre..."
                        value={searchClient}
                        onChange={(e) => setSearchClient(e.target.value)}
                      />
                    </div>

                    {searchClient.trim() !== '' && clientes.length > 0 && (
                      <div className="absolute top-11 left-0 w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg max-h-40 overflow-y-auto z-40">
                        {clientes.map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedClient(c);
                              setSearchClient('');
                            }}
                            className="p-sm hover:bg-surface transition-colors cursor-pointer border-b border-outline-variant/20 last:border-b-0"
                          >
                            <h4 className="font-bold text-on-surface text-[13px]">{c.nombre}</h4>
                            <p className="text-[10px] text-outline">{c.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Detalle del carrito */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-col gap-sm flex-1 min-h-[350px]">
                <h3 className="font-headline-sm font-extrabold text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">shopping_cart</span>
                  Productos en Venta
                </h3>

                <div className="flex-1 overflow-y-auto max-h-60 border border-outline-variant/30 rounded-xl p-xs">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-65 text-center py-10">
                      <span className="material-symbols-outlined text-[42px] text-outline">production_quantity_limits</span>
                      <p className="font-body-md text-body-md mt-sm">Carrito vacío</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-xs">
                      {cart.map(item => (
                        <div key={item.producto.id} className="flex justify-between items-center gap-xs border-b border-outline-variant/20 pb-xs last:border-none">
                          <div className="min-w-0 flex-grow">
                            <h4 className="font-bold text-[13px] text-on-surface truncate">{item.producto.nombre}</h4>
                            <p className="text-[11px] text-primary font-bold">S/. {item.producto.precio.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex items-center gap-[4px] flex-shrink-0">
                            <button
                              onClick={() => updateCartQuantity(item.producto.id, item.cantidad - 1)}
                              className="w-7 h-7 bg-surface-container-high rounded flex items-center justify-center font-bold text-lg cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-[13px]">{item.cantidad}</span>
                            <button
                              onClick={() => updateCartQuantity(item.producto.id, item.cantidad + 1)}
                              className="w-7 h-7 bg-surface-container-high rounded flex items-center justify-center font-bold text-lg cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.producto.id)}
                              className="text-error w-8 h-8 flex items-center justify-center hover:bg-error-container/20 rounded cursor-pointer ml-xs"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Métodos de Pago */}
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-outline font-semibold ml-1">Método de Pago:</label>
                  <div className="grid grid-cols-3 gap-xs">
                    {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodoPago(m)}
                        className={`h-9 rounded-lg font-semibold text-label-sm transition-all border cursor-pointer ${
                          metodoPago === m 
                            ? 'bg-primary text-on-primary border-primary shadow' 
                            : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen Final */}
                <div className="border-t border-outline-variant/35 pt-sm space-y-sm">
                  <div className="flex justify-between items-center text-on-surface font-extrabold text-title-medium">
                    <span>Monto Total:</span>
                    <span className="text-primary font-black text-headline-sm">S/. {calculateTotal().toFixed(2)}</span>
                  </div>

                  {lastSaleId && (
                    <motion.button
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => handleDownloadInvoice(lastSaleId)}
                      className="w-full bg-secondary text-on-secondary py-sm rounded-lg font-bold text-label-md flex items-center justify-center gap-xs hover:bg-secondary-container transition-colors shadow shadow-secondary/20 cursor-pointer h-10 border border-secondary/20"
                    >
                      <span className="material-symbols-outlined">download</span>
                      Descargar Factura PDF
                    </motion.button>
                  )}

                  <div className="grid grid-cols-2 gap-xs">
                    <button
                      onClick={clearPOS}
                      disabled={processingSale}
                      className="border border-outline hover:bg-surface-container-high text-on-surface py-sm rounded-lg font-bold text-label-sm transition-colors cursor-pointer h-10"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={handleConfirmSale}
                      disabled={processingSale || cart.length === 0}
                      className={`py-sm rounded-lg font-bold text-label-sm flex items-center justify-center gap-xs cursor-pointer h-10 ${
                        processingSale || cart.length === 0
                          ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/20 hover:shadow-lg'
                      }`}
                    >
                      {processingSale ? 'Procesando...' : 'Confirmar Venta'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PANTALLA HISTORIAL */
          <div className="flex flex-col gap-sm text-left">
            {/* Filtros Historial */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md flex flex-wrap items-center gap-sm">
              <div className="flex items-center gap-xs w-full sm:w-auto">
                <span className="font-label-md text-label-md text-outline font-semibold">Desde:</span>
                <input
                  type="date"
                  className="rounded-xl border border-outline-variant/30 bg-surface shadow-sm px-sm py-xs text-body-md text-on-surface focus:outline-none focus:border-primary h-10 cursor-pointer"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-xs w-full sm:w-auto">
                <span className="font-label-md text-label-md text-outline font-semibold">Hasta:</span>
                <input
                  type="date"
                  className="rounded-xl border border-outline-variant/30 bg-surface shadow-sm px-sm py-xs text-body-md text-on-surface focus:outline-none focus:border-primary h-10 cursor-pointer"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>

              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => {
                    setFechaDesde('');
                    setFechaHasta('');
                  }}
                  className="text-error hover:bg-error-container/20 px-sm py-xs rounded-lg font-bold text-label-sm cursor-pointer h-10 inline-flex items-center justify-center"
                >
                  Limpiar Filtros
                </button>
              )}
            </section>

            {/* Listado de Ventas */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
              {loadingVentas ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
                  <p className="font-label-sm text-label-sm text-outline mt-xs">Consultando transacciones...</p>
                </div>
              ) : ventas.length === 0 ? (
                <div className="py-20 text-center opacity-65 flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-[56px] text-outline">history</span>
                  <h3 className="font-headline-md text-lg text-on-surface mt-xs font-bold">Sin transacciones</h3>
                  <p className="font-body-md text-body-md mt-2">No se encontraron registros de ventas en el período.</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant text-[13px] text-on-surface-variant font-bold">
                        <th className="p-md">FAC N°</th>
                        <th className="p-md">Fecha</th>
                        <th className="p-md">Cliente / Propietario</th>
                        <th className="p-md">Pago</th>
                        <th className="p-md text-right">Total</th>
                        <th className="p-md text-center">Estado</th>
                        <th className="p-md text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-body-md text-on-surface font-medium">
                      {ventas.map((v) => {
                        const isCancelada = v.estado === 'Cancelada';
                        return (
                          <tr key={v.id} className={`hover:bg-surface transition-colors ${isCancelada ? 'opacity-60 bg-surface-container-high/15' : ''}`}>
                            <td className="p-md font-bold text-primary">
                              FAC-{v.id.toString().padStart(6, '0')}
                            </td>
                            <td className="p-md text-[13px]">
                              {new Date(v.fecha).toLocaleString()}
                            </td>
                            <td className="p-md text-[13px] font-semibold text-on-surface">
                              {v.clienteNombre || 'Consumidor Final / General'}
                            </td>
                            <td className="p-md text-[13px]">
                              <span className="bg-secondary-container text-on-secondary-container px-sm py-[2px] rounded-full text-label-sm font-bold">
                                {v.metodoPago}
                              </span>
                            </td>
                            <td className="p-md text-right font-bold text-[15px]">
                              S/. {v.total.toFixed(2)}
                            </td>
                            <td className="p-md text-center">
                              <span className={`inline-flex items-center gap-xs font-bold px-sm py-[2px] rounded text-label-sm ${
                                isCancelada ? 'bg-error/15 text-error' : 'bg-primary-container/20 text-primary'
                              }`}>
                                {v.estado}
                              </span>
                            </td>
                            <td className="p-md text-center font-bold">
                              <div className="inline-flex items-center gap-xs">
                                <button
                                  onClick={() => handleDownloadInvoice(v.id)}
                                  className="p-xs rounded-lg border border-outline-variant/45 hover:bg-surface-container-high text-outline hover:text-on-surface transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Descargar Factura PDF"
                                >
                                  <span className="material-symbols-outlined text-[18px]">download</span>
                                </button>

                                {!isCancelada && (
                                  <button
                                    onClick={() => handleCancelSale(v.id)}
                                    className="p-xs rounded-lg border border-error/20 hover:bg-error-container/20 text-error transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="Anular / Cancelar Venta"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">block</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </motion.div>
  );
};

export default GestionVentas;
