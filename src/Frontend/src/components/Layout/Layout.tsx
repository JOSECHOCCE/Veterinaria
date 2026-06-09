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
      
      {/* El contenido principal se renderiza a la derecha del sidebar y se alinea al tope con la píldora flotante */}
      <main className="flex-1 md:ml-72 p-gutter lg:p-6 pb-24 md:pb-6 overflow-y-auto">
        <Outlet />
      </main>

      {/* Proveedor de Notificaciones tipo Toast (Sonner) */}
      <Toaster position="top-right" richColors />

      {/* Greeting Modal (Solo aparece una vez por sesión si hay pendientes) */}
      {showGreeting && <GreetingModal onClose={() => setShowGreeting(false)} />}
    </div>
  );
}
