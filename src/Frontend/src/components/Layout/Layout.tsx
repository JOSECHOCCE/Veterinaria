import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import { Toaster } from 'sonner';
import { useState } from 'react';
import GreetingModal from '../Notifications/GreetingModal';

export default function Layout() {
  const [showGreeting, setShowGreeting] = useState(true);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <TopAppBar />
      
      {/* El contenido principal con padding-top adecuado para no ser tapado por la barra fija */}
      <main className="flex-1 md:ml-72 pt-[4.5rem] px-6 pb-6 overflow-y-auto bg-canvas">
        <Outlet />
      </main>

      {/* Proveedor de Notificaciones tipo Toast (Sonner) */}
      <Toaster position="top-right" richColors />

      {/* Greeting Modal (Solo aparece una vez por sesión si hay pendientes) */}
      {showGreeting && <GreetingModal onClose={() => setShowGreeting(false)} />}
    </div>
  );
}
