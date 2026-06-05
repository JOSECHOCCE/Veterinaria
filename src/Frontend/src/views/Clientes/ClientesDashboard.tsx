import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientes } from '../../hooks/useClientes';
import type { Cliente } from '../../services/clientes.service';

export default function ClientesDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [localSearch, setLocalSearch] = useState('');

  const {
    clientes,
    citasPorUsuario,
    totalItems,
    page,
    setPage,
    loading,
    buscar,
    handleSearch,
    setMostrarInactivos,
    handleToggleActivo,
    refetch,
  } = useClientes('', true); // Show all by default

  // Sync component state filter to hook's show inactives param
  useEffect(() => {
    if (filter === 'activos') {
      setMostrarInactivos(false);
    } else {
      setMostrarInactivos(true);
    }
  }, [filter, setMostrarInactivos]);

  // Client-side filter to only show inactive if that tab is selected
  const displayedClientes = clientes.filter(c => {
    if (filter === 'inactivos') return !c.activo;
    return true;
  });

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (localSearch !== buscar) {
        handleSearch(localSearch);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [localSearch, buscar, handleSearch]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleToggleState = async (e: React.MouseEvent, cliente: Cliente) => {
    e.stopPropagation();
    await handleToggleActivo(cliente);
  };

  // Calculations for pagination display
  const itemsPerPage = 10;
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        when: 'beforeChildren',
        staggerChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex-1 flex flex-col min-w-0 px-gutter md:px-xl py-8"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div className="max-w-2xl">
          <p className="text-caption-uppercase text-primary tracking-widest mb-1">
            Módulo 2 · Directorio
          </p>
          <h1 className="font-display-lg text-display-lg text-ink tracking-tight mb-2">
            Gestión de Clientes
          </h1>
          <p className="text-body-md text-body-muted leading-relaxed">
            Directorio administrativo para la búsqueda, filtrado y gestión de perfiles de propietarios y sus mascotas asociadas.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/clientes/nuevo')}
          className="bg-primary text-white font-button text-button px-6 py-3 rounded-full hover:bg-[#75331c] transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 hover:shadow-md hover:-translate-y-[1px] cursor-pointer"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 2c-2.5 0-7 1.5-7 4v1h14v-1c0-2.5-4.5-4-7-4zm7 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 2.9v1h6v-1c0-2.5-3.5-4-7-4z" />
          </svg>
          Registrar Cliente
        </button>
      </div>

      {/* Toolbar (Search & Filters) */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6 justify-between items-start xl:items-center bg-surface-card p-3 rounded-xl border border-hairline shadow-sm">
        {/* Search Input */}
        <div className="relative w-full xl:w-96 shrink-0 group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-muted group-focus-within:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-canvas border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-body-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-body-muted shadow-inner"
            placeholder="Buscar por nombre, correo o documento..."
            type="text"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto xl:justify-end">
          <span className="text-caption text-body-muted mr-2 hidden sm:block">Filtros:</span>
          
          <button
            onClick={() => setFilter('todos')}
            className={`font-caption-caps px-4 py-2 rounded-full border transition-all cursor-pointer shadow-sm ${
              filter === 'todos'
                ? 'bg-ink text-canvas border-ink'
                : 'bg-canvas text-ink border-outline-variant hover:border-outline hover:bg-surface-soft'
            }`}
          >
            Todos
          </button>
          
          <button
            onClick={() => setFilter('activos')}
            className={`font-caption-caps px-4 py-2 rounded-full border transition-all cursor-pointer shadow-sm ${
              filter === 'activos'
                ? 'bg-ink text-canvas border-ink'
                : 'bg-canvas text-ink border-outline-variant hover:border-outline hover:bg-surface-soft'
            }`}
          >
            Activos
          </button>
          
          <button
            onClick={() => setFilter('inactivos')}
            className={`font-caption-caps px-4 py-2 rounded-full border transition-all cursor-pointer shadow-sm ${
              filter === 'inactivos'
                ? 'bg-ink text-canvas border-ink'
                : 'bg-canvas text-ink border-outline-variant hover:border-outline hover:bg-surface-soft'
            }`}
          >
            Inactivos
          </button>
          
          <div className="w-[1px] h-6 bg-hairline mx-2 hidden sm:block"></div>
          
          <button
            onClick={() => refetch()}
            className="bg-canvas text-body-muted font-caption px-3 py-2 rounded-lg border border-transparent hover:bg-surface-soft transition-all flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-card border-b border-hairline">
                <th className="text-caption-uppercase text-body-muted py-3 px-6 font-medium tracking-widest w-[30%]">Cliente</th>
                <th className="text-caption-uppercase text-body-muted py-3 px-6 font-medium tracking-widest">Contacto</th>
                <th className="text-caption-uppercase text-body-muted py-3 px-6 font-medium tracking-widest">Documento</th>
                <th className="text-caption-uppercase text-body-muted py-3 px-6 font-medium tracking-widest w-[20%]">Mascotas Asociadas</th>
                <th className="text-caption-uppercase text-body-muted py-3 px-6 font-medium tracking-widest">Estado</th>
                <th className="text-caption-uppercase text-body-muted py-3 px-6 font-medium tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  // Loading Pulse Skeletons
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-card" />
                          <div className="space-y-2">
                            <div className="h-4 w-36 bg-surface-card rounded" />
                            <div className="h-3 w-28 bg-surface-card rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6"><div className="h-4 w-28 bg-surface-card rounded" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-24 bg-surface-card rounded" /></td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <div className="h-5 w-16 bg-surface-card rounded" />
                          <div className="h-5 w-16 bg-surface-card rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-6"><div className="h-6 w-20 bg-surface-card rounded-full" /></td>
                      <td className="py-4 px-6 text-right"><div className="h-8 w-24 bg-surface-card rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : displayedClientes.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center text-body-muted mb-4 border border-hairline">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                        </div>
                        <h3 className="text-title-md text-ink mb-1">No se encontraron clientes</h3>
                        <p className="text-body-sm text-body-muted mb-6 leading-relaxed">
                          Intente cambiar el término de búsqueda o modifique los filtros activos.
                        </p>
                        <button
                          onClick={() => { setLocalSearch(''); setFilter('todos'); }}
                          className="px-4 py-2 border border-outline-variant text-ink rounded-lg font-button text-button hover:bg-surface-soft cursor-pointer transition-all"
                        >
                          Limpiar Filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Render Client Rows
                  displayedClientes.map((cliente) => (
                    <motion.tr
                      key={cliente.id}
                      variants={rowVariants}
                      layout
                      className="hover:bg-surface-soft/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/clientes/${cliente.id}`)}
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border border-hairline shrink-0 bg-surface-container-high text-primary font-title-sm shadow-inner">
                            {getInitials(cliente.nombre)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-title-sm text-ink truncate group-hover:text-primary transition-colors">
                              {cliente.nombre}
                            </div>
                            <div className="text-body-sm text-body-muted truncate mt-0.5">
                              {cliente.email || 'Sin correo electrónico'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Teléfono */}
                      <td className="py-4 px-6 align-middle text-body-sm text-ink whitespace-nowrap">
                        {cliente.telefono}
                      </td>

                      {/* Documento DNI */}
                      <td className="py-4 px-6 align-middle font-code text-code text-body-muted whitespace-nowrap">
                        {cliente.dni || '—'}
                      </td>

                      {/* Mascotas */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {cliente.mascotas && cliente.mascotas.length > 0 ? (
                            cliente.mascotas.map((pet) => (
                              <span
                                key={pet.id}
                                onClick={() => navigate(`/admin/mascotas/${pet.id}`)}
                                className="bg-surface-card border border-outline-variant text-ink font-caption text-caption px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm hover:border-primary transition-colors cursor-pointer"
                              >
                                <svg className="w-3 h-3 text-body-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.5c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2-1.5.895-1.5 2 .672 2 1.5 2Zm-5.5 2c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2-1.5.895-1.5 2 .672 2 1.5 2Zm11 0c.828 0 1.5-.895 1.5-2s-.672-2-1.5-2-1.5.895-1.5 2 .672 2 1.5 2Zm-5.5 8c2.485 0 4.5-1.79 4.5-4 0-1.657-1.12-3-2.5-3-.552 0-1 .448-1 1s-.448 1-1 1-1-.448-1-1-.448-1-1-1c-1.38 0-2.5 1.343-2.5 3 0 2.21 2.015 4 4.5 4Z" />
                                </svg>
                                {pet.nombre}
                              </span>
                            ))
                          ) : (
                            <span className="text-body-muted font-caption text-caption italic">
                              Sin mascotas
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className={`flex items-center gap-1.5 font-caption text-caption text-ink bg-surface-card border border-hairline px-3 py-1 rounded-full inline-flex shadow-sm`}>
                          <span className={`w-2 h-2 rounded-full ${
                            cliente.activo
                              ? 'bg-success shadow-[0_0_4px_rgba(93,184,114,0.5)]'
                              : 'bg-secondary'
                          }`} />
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/admin/clientes/${cliente.id}`)}
                            className="p-1.5 text-body-muted hover:text-primary hover:bg-surface-soft rounded-md transition-all cursor-pointer"
                            title="Ver ficha"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => navigate(`/admin/clientes/${cliente.id}/editar`)}
                            className="p-1.5 text-body-muted hover:text-primary hover:bg-surface-soft rounded-md transition-all cursor-pointer"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={(e) => handleToggleState(e, cliente)}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                              cliente.activo
                                ? 'text-body-muted hover:text-error hover:bg-error-container/30'
                                : 'text-body-muted hover:text-success hover:bg-emerald-50'
                            }`}
                            title={cliente.activo ? 'Desactivar' : 'Activar'}
                          >
                            {cliente.activo ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-surface-card border-t border-hairline py-4 px-6 flex items-center justify-between mt-auto">
          <span className="text-caption text-body-muted">
            {totalItems > 0
              ? `Mostrando ${startItem}-${endItem} de ${totalItems} clientes`
              : 'Mostrando 0 clientes'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-hairline text-body-muted hover:text-ink hover:border-outline-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                  className={`w-8 h-8 flex items-center justify-center rounded-md font-caption-caps transition-all cursor-pointer ${
                    page === pageNum
                      ? 'bg-ink text-canvas font-bold'
                      : 'border border-hairline text-ink hover:bg-surface-soft'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-hairline text-body-muted hover:text-ink hover:border-outline-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
