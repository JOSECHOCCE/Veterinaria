import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast } from 'sonner';

export function useNotifications() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Configurar la conexión con el Hub de SignalR utilizando la variable de entorno
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5132/notificacionHub', {
        withCredentials: true // Necesario para compartir cookies de autenticación con el servidor
      })
      .withAutomaticReconnect() // Reconexión automática si se cae la red
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Conexión con SignalR Hub establecida correctamente.');
          
          // Escuchar notificaciones del servidor
          connection.on('RecibirNotificacion', (notificacion: { id: number; mensaje: string; fechaCreacion: string; leida: boolean }) => {
            setUnreadCount((prev) => prev + 1);
            
            // Disparar toast informativo de Sonner de alta prioridad
            toast.error(`🚨 ¡ALERTA CRÍTICA!`, {
              description: notificacion.mensaje,
              duration: 8000,
              action: {
                label: 'Ver Cola',
                onClick: () => window.location.href = '/admin/cola'
              }
            });
          });
        })
        .catch((error) => console.error('Error al conectar con SignalR Hub:', error));

      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  return { unreadCount, setUnreadCount };
}
