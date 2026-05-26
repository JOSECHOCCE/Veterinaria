import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import { Toaster } from 'sonner';

export default function Layout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <TopAppBar />
      
      {/* El contenido principal se renderiza debajo del appbar y a la derecha del sidebar */}
      <main className="flex-1 mt-16 md:ml-64 p-gutter lg:p-lg pb-24 md:pb-lg overflow-y-auto">
        <Outlet />
      </main>

      {/* Proveedor de Notificaciones tipo Toast (Sonner) */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
