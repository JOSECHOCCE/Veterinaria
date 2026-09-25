import { useState, useEffect } from 'react';
import productosService, { type ProductoDto } from '../../services/productos.service';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'sonner';

export default function GestionProductos() {
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<ProductoDto>>({
    nombre: '',
    categoria: 'Medicamento',
    precioUnitario: 0,
    stockActual: 10,
    puntoReorden: 5,
    requiereReceta: false,
  });

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await productosService.getProductos(q, categoria);
      if (res.success && res.data) {
        setProductos(res.data.data || res.data || []);
      } else {
        setProductos([]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar inventario de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [q, categoria]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) {
      toast.error('Ingrese el nombre del producto');
      return;
    }
    try {
      await productosService.createProducto(formData);
      toast.success('Producto registrado correctamente');
      setShowModal(false);
      setFormData({
        nombre: '',
        categoria: 'Medicamento',
        precioUnitario: 0,
        stockActual: 10,
        puntoReorden: 5,
        requiereReceta: false,
      });
      fetchProductos();
    } catch (err) {
      toast.error('Error al guardar producto');
    }
  };

  return (
    <div className="flex-grow w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-12 select-none animate-fadeIn">
      <PageHeader
        title="Inventario y Botica"
        description="Gestión de medicamentos, kardex, stock y punto de reorden (ROP)"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nuevo Producto
          </button>
        }
      />

      {/* Control Bar & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3 w-full md:w-96 bg-slate-100 px-4 py-2 rounded-xl">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-slate-100 border-none px-4 py-2 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="">Todas las Categorías</option>
            <option value="Medicamento">Medicamentos</option>
            <option value="Vacuna">Vacunas</option>
            <option value="Alimento">Alimento & Nutrición</option>
            <option value="Accesorio">Accesorios & Petshop</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse font-medium">Cargando inventario...</div>
        ) : productos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
            <p className="font-semibold text-slate-600">No se encontraron productos</p>
            <p className="text-xs text-slate-400 mt-1">Registra nuevos medicamentos o ajusta los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Precio</th>
                  <th className="py-3 px-4">Stock Actual</th>
                  <th className="py-3 px-4">Punto Reorden (ROP)</th>
                  <th className="py-3 px-4">Receta</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {productos.map((p) => {
                  const isStockBajo = p.stockActual <= p.puntoReorden;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.nombre}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-700">S/ {p.precioUnitario.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isStockBajo ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stockActual} un.
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.puntoReorden} un.</td>
                      <td className="py-3 px-4">
                        {p.requiereReceta ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            🔒 Receta Obligatoria
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Venta Libre</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Editar producto"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
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

      {/* Modal Agregar Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-100 animate-scaleUp">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Nuevo Producto de Botica</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Medicamento">Medicamento</option>
                    <option value="Vacuna">Vacuna</option>
                    <option value="Alimento">Alimento</option>
                    <option value="Accesorio">Accesorio</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Precio Unitario (S/)</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={formData.precioUnitario}
                    onChange={(e) => setFormData({ ...formData, precioUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Punto Reorden (ROP)</label>
                  <input
                    type="number"
                    required
                    value={formData.puntoReorden}
                    onChange={(e) => setFormData({ ...formData, puntoReorden: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="requiereReceta"
                  checked={formData.requiereReceta}
                  onChange={(e) => setFormData({ ...formData, requiereReceta: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="requiereReceta" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Requiere receta médica obligatoria para venta
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
