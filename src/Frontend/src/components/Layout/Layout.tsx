import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import { Toaster } from 'sonner';
import { useState } from 'react';
import GreetingModal from '../Notifications/GreetingModal';

export default function Layout() {
  const [showGreeting, setShowGreeting] = useState(true);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      {/* Panel principal adaptado a laptops (ml-64) y estructura idéntica al prototipo */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-y-auto bg-background">
        <TopAppBar />
        <Outlet />
      </main>

      {/* Proveedor de Notificaciones tipo Toast (Sonner) */}
      <Toaster position="top-right" richColors />

      {/* Greeting Modal (Solo aparece una vez por sesión si hay pendientes) */}
      {showGreeting && <GreetingModal onClose={() => setShowGreeting(false)} />}
    </div>
  );
}
