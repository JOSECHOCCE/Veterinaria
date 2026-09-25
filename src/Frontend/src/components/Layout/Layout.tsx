import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import { Toaster } from 'sonner';
import { useState } from 'react';
import GreetingModal from '../Notifications/GreetingModal';

export default function Layout() {
  const [showGreeting, setShowGreeting] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      
      {/* Panel principal con margen dinámico y encuadre perimetral para todas las vistas */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <TopAppBar />
        
        {/* Contenedor de Canvas Flotante (Gutter Framing Padding) */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Proveedor de Notificaciones tipo Toast (Sonner) */}
      <Toaster position="top-right" richColors />

      {/* Greeting Modal */}
      {showGreeting && <GreetingModal onClose={() => setShowGreeting(false)} />}
    </div>
  );
}
