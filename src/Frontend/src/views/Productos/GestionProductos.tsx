import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../services/api';

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  activo: boolean;
  fechaCreacion: string;
}

const GestionProductos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [productosBajoStock, setProductosBajoStock] = useState<Producto[]>([]);

  // Estados para Modal de Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Datos del Formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [categoria, setCategoria] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  // Cargar productos
  const loadProductos = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/Productos`, {
        params: {
          q: searchQuery,
          categoria: categoriaFiltro
        }
      });
      if (response.data.success) {
        setProductos(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos bajo stock
  const loadBajoStock = async () => {
    try {
      const response = await api.get(`/api/Productos/bajo-stock`);
      if (response.data.success) {
        setProductosBajoStock(response.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar alertas de stock:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProductos();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, categoriaFiltro]);

  useEffect(() => {
    loadBajoStock();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setPrecio(0);
    setStock(0);
    setStockMinimo(5);
    setCategoria('General');
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: Producto) => {
    setEditingId(p.id);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setPrecio(p.precio);
    setStock(p.stock);
    setStockMinimo(p.stockMinimo);
    setCategoria(p.categoria);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || precio <= 0 || stock < 0 || stockMinimo < 0) {
      toast.error('Por favor completa los campos obligatorios correctamente.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editingId || 0,
        nombre,
        descripcion,
        precio,
        stock,
        stockMinimo,
        categoria,
        activo: true
      };

      if (editingId) {
        const response = await api.put(`/api/Productos/${editingId}`, payload);
        if (response.data.success) {
          toast.success('¡Producto actualizado exitosamente!');
          setModalOpen(false);
          loadProductos();
          loadBajoStock();
        }
      } else {
        const response = await api.post(`/api/Productos`, payload);
        if (response.data.success) {
          toast.success('¡Producto creado y agregado al inventario!');
          setModalOpen(false);
          loadProductos();
          loadBajoStock();
        }
      }
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProducto = async (id: number, nombreProd: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${nombreProd}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/Productos/${id}`);
      if (response.data.success) {
        toast.success('¡Producto eliminado del catálogo!');
        loadProductos();
        loadBajoStock();
      }
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      toast.error('No se pudo eliminar el producto.');
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
        
        {/* Cabecera */}
        <section className="flex flex-col sm:flex-row items-center justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-md gap-sm">
          <div className="flex items-center gap-md text-left">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[32px]">inventory</span>
            </div>
            <div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface">Inventario y Catálogo de Productos</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Gestiona el inventario de medicamentos, alimentos y accesorios clínicos.</p>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-primary text-on-primary px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:bg-surface-tint transition-colors shadow-sm cursor-pointer h-[44px]"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Agregar Producto
          </button>
        </section>

        {/* Alertas de Stock Bajo */}
        {productosBajoStock.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-error-container/20 border-2 border-error/30 rounded-xl p-md flex flex-col gap-xs text-left"
          >
            <div className="flex items-center gap-sm text-error font-bold">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="text-title-medium">Alerta de Stock Crítico</h3>
            </div>
            <p className="text-body-md text-on-error-container">
              Los siguientes productos han alcanzado o se encuentran por debajo del stock mínimo. Es necesario reabastecerlos a la brevedad:
            </p>
            <div className="flex flex-wrap gap-xs mt-sm">
              {productosBajoStock.map(p => (
                <span 
                  key={p.id} 
                  className="bg-error-container text-on-error-container px-sm py-[4px] rounded-full text-label-sm font-bold border border-error/25 shadow-sm inline-flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                  {p.nombre} ({p.stock} unid.)
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Caja de Herramientas y Filtros */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-sm flex flex-col sm:flex-row items-center justify-between gap-sm">
          {/* Búsqueda */}
          <div className="relative rounded-xl border border-outline-variant/30 bg-surface shadow-sm focus-within:border-primary transition-all duration-200 w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              className="w-full h-10 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro por Categoría */}
          <div className="flex items-center gap-xs w-full sm:w-auto">
            <span className="font-label-md text-label-md text-outline font-semibold">Categoría:</span>
            <select
              className="rounded-xl border border-outline-variant/30 bg-surface shadow-sm px-sm py-xs text-body-md text-on-surface focus:outline-none focus:border-primary h-10 min-w-[150px] cursor-pointer"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Medicamento">Medicamentos</option>
              <option value="Alimento">Alimentos</option>
              <option value="Accesorio">Accesorios</option>
              <option value="General">General</option>
            </select>
          </div>
        </section>

        {/* Tabla */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
              <p className="font-label-sm text-label-sm text-outline mt-xs">Consultando catálogo de inventario...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="py-20 text-center opacity-65 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[56px] text-outline">inventory_2</span>
              <h3 className="font-headline-md text-lg text-on-surface mt-xs font-bold">Sin Productos</h3>
              <p className="font-body-md text-body-md mt-2">No se encontraron productos en el inventario.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[13px] text-on-surface-variant font-bold">
                    <th className="p-md">Nombre</th>
                    <th className="p-md">Categoría</th>
                    <th className="p-md">Descripción</th>
                    <th className="p-md text-right">Precio</th>
                    <th className="p-md text-center">Stock / Min.</th>
                    <th className="p-md text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-body-md text-on-surface font-medium">
                  {productos.map((p) => {
                    const esBajoStock = p.stock <= p.stockMinimo;
                    return (
                      <tr key={p.id} className="hover:bg-surface transition-colors">
                        <td className="p-md font-bold text-primary text-[15px]">
                          {p.nombre}
                        </td>
                        <td className="p-md text-[13px]">
                          <span className="inline-flex items-center bg-secondary-container text-on-secondary-container px-sm py-[2px] rounded-full text-label-sm font-bold">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="p-md text-[13px] text-on-surface-variant max-w-xs truncate" title={p.descripcion || ''}>
                          {p.descripcion || 'Sin descripción.'}
                        </td>
                        <td className="p-md text-right font-bold text-[15px]">
                          S/. {p.precio.toFixed(2)}
                        </td>
                        <td className="p-md text-center">
                          <span 
                            className={`inline-flex items-center gap-xs font-bold px-sm py-[4px] rounded-full text-label-sm border ${
                              esBajoStock 
                                ? 'bg-error-container/20 text-error border-error/30' 
                                : 'bg-primary-container/20 text-primary border-primary/30'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {esBajoStock ? 'error' : 'check_circle'}
                            </span>
                            {p.stock} / {p.stockMinimo}
                          </span>
                        </td>
                        <td className="p-md text-center font-bold">
                          <div className="inline-flex items-center gap-xs">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-xs rounded-lg border border-outline-variant/40 hover:bg-surface-container-high text-outline hover:text-on-surface transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Editar Producto"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProducto(p.id, p.nombre)}
                              className="p-xs rounded-lg border border-error/20 hover:bg-error-container/20 text-error transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Eliminar Producto"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
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

        {/* Modal Crear / Editar */}
        {createPortal(
          <AnimatePresence>
            {modalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setModalOpen(false)}
                  className="fixed inset-0 bg-black/45 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="relative bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/35 p-6 w-[calc(100vw-2rem)] sm:w-[480px] z-10 text-left overflow-hidden flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center border-b border-surface-variant pb-xs">
                    <h3 className="font-headline-md text-lg text-on-surface font-extrabold flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary">
                        {editingId ? 'edit_note' : 'add_circle'}
                      </span>
                      {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                    </h3>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-container-high text-outline flex items-center justify-center cursor-pointer border border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-sm">
                    {/* Nombre */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Nombre del Producto</label>
                      <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">inventory_2</span>
                        <input
                          className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none"
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="Ej. Antipulgas Pipeta"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    {/* Categoría */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Categoría</label>
                      <select
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface shadow-sm px-sm h-11 text-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="Medicamento">Medicamentos</option>
                        <option value="Alimento">Alimentos</option>
                        <option value="Accesorio">Accesorios</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    {/* Precio */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Precio Unitario (S/.)</label>
                      <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">payments</span>
                        <input
                          className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface focus:outline-none"
                          type="number"
                          step="0.01"
                          min={0.01}
                          value={precio}
                          onChange={(e) => setPrecio(Number(e.target.value))}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    {/* Stocks */}
                    <div className="grid grid-cols-2 gap-sm">
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Stock Inicial</label>
                        <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">tag</span>
                          <input
                            className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface focus:outline-none"
                            type="number"
                            min={0}
                            value={stock}
                            onChange={(e) => setStock(Number(e.target.value))}
                            required
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Stock Mínimo Alerta</label>
                        <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">report</span>
                          <input
                            className="w-full h-11 pl-10 pr-sm bg-transparent font-body-md text-body-md text-on-surface focus:outline-none"
                            type="number"
                            min={0}
                            value={stockMinimo}
                            onChange={(e) => setStockMinimo(Number(e.target.value))}
                            required
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface font-semibold ml-1">Descripción</label>
                      <div className="relative rounded-xl border border-outline-variant/30 bg-surface focus-within:border-primary transition-all duration-200">
                        <span className="material-symbols-outlined absolute left-sm top-[18px] -translate-y-1/2 text-outline">description</span>
                        <textarea
                          className="w-full pl-10 pr-sm pt-xs bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none min-h-[80px] resize-none"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          placeholder="Ingresa especificaciones o detalles del producto..."
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-xs border-t border-surface-variant/30 pt-sm mt-xs">
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="bg-transparent border border-outline text-on-surface px-margin py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer h-10"
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`px-margin py-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs cursor-pointer h-10 ${
                          submitting
                            ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/20 hover:shadow-lg'
                        }`}
                      >
                        {submitting ? (
                          <div className="flex items-center gap-sm">
                            <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                            <span>Guardando...</span>
                          </div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            <span>{editingId ? 'Actualizar' : 'Guardar Producto'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      </main>
    </motion.div>
  );
};

export default GestionProductos;
