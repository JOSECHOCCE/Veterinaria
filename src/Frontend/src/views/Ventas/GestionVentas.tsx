import { useState, useEffect } from 'react';
import productosService, { type ProductoDto } from '../../services/productos.service';
import ventasService from '../../services/ventas.service';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'sonner';

interface CartItem {
  producto: ProductoDto;
  cantidad: number;
}

export default function GestionVentas() {
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [processing, setProcessing] = useState(false);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await productosService.getProductos(q, categoria);
      if (res.success && res.data) {
        setProductos(res.data.data || res.data || []);
      } else {
        setProductos([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [q, categoria]);

  const addToCart = (producto: ProductoDto) => {
    if (producto.stockActual <= 0) {
      toast.error('Producto sin stock disponible');
      return;
    }
    if (producto.requiereReceta) {
      toast.warning('⚠️ Este medicamento requiere receta médica válida');
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id);
      if (existing) {
        if (existing.cantidad + 1 > producto.stockActual) {
          toast.error('Supera el stock disponible');
          return prev;
        }
        return prev.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.producto.id === id) {
            const nextQty = item.cantidad + delta;
            if (nextQty > item.producto.stockActual) {
              toast.error('Supera el stock disponible');
              return item;
            }
            return nextQty > 0 ? { ...item, cantidad: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.producto.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.producto.precioUnitario * item.cantidad, 0);

  const handleCompletarVenta = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    try {
      setProcessing(true);
      const payload = {
        tipoPago,
        detalles: cart.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precioUnitario,
        })),
      };
      await ventasService.registrarVenta(payload);
      toast.success('🎉 ¡Venta completada con éxito!');
      setCart([]);
      fetchProductos();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar la venta POS');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-grow w-full max-w-[1600px] mx-auto flex flex-col gap-4 pb-6 select-none animate-fadeIn">
      <PageHeader
        title="Ventas (POS)"
        description="Punto de venta directo para botica, medicamentos y petshop"
      />

      {/* Main Split Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
        {/* Left Column: Product Catalog (65%) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {/* Catalog Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl flex-1">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input
                type="text"
                placeholder="Buscar por medicamento o código..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="bg-slate-100 border-none px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="">Todas las Categorías</option>
              <option value="Medicamento">Medicamentos</option>
              <option value="Vacuna">Vacunas</option>
              <option value="Alimento">Alimentos</option>
              <option value="Accesorio">Accesorios</option>
            </select>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 animate-pulse">Cargando catálogo POS...</div>
            ) : productos.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Sin productos disponibles</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {productos.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-teal-600/30 hover:shadow-md transition-all flex flex-col justify-between bg-slate-50/50"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{p.nombre}</h4>
                        {p.requiereReceta && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 shrink-0">
                            Receta
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{p.categoria}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50">
                      <div>
                        <span className="text-xs text-slate-400 block leading-none">Precio</span>
                        <span className="text-base font-black text-teal-700">S/ {p.precioUnitario.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        className="bg-teal-600 text-white p-2 rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Persistent Shopping Cart (35%) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">shopping_bag</span>
                Carrito de Venta POS
              </h3>
              <span className="text-xs font-bold text-slate-400">{cart.length} productos</span>
            </div>

            {/* Cart Line Items */}
            <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 pr-1">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">remove_shopping_cart</span>
                  <p className="text-xs font-medium">El carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.producto.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-800 text-xs truncate">{item.producto.nombre}</p>
                      <p className="text-[11px] text-teal-700 font-semibold">
                        S/ {item.producto.precioUnitario.toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white rounded-lg border border-slate-200">
                        <button
                          onClick={() => updateQuantity(item.producto.id, -1)}
                          className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-l-lg cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.producto.id, 1)}
                          className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-r-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.producto.id)}
                        className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Summary Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Medio de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {['Efectivo', 'Tarjeta', 'Yape/Plin'].map((metodo) => (
                  <button
                    key={metodo}
                    type="button"
                    onClick={() => setTipoPago(metodo)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      tipoPago === metodo
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {metodo}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-slate-600">Total a Cobrar</span>
              <span className="text-2xl font-black text-slate-900">S/ {subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCompletarVenta}
              disabled={processing || cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                processing || cart.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined">check_circle</span>
              {processing ? 'Procesando Venta...' : 'Confirmar Venta y Cobro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
