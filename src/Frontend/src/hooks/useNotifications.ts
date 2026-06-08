import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast } from 'sonner';
import notificacionesService from '../services/notificaciones.service';

interface ServerNotification {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string; // Info | Success | Warning | Error
  icono?: string;
  urlAccion?: string;
  fecha: string;
}

export function useNotifications() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = window.localStorage.getItem('token');
    if (!token) return; // sin sesión no hay conexión

    // Cargar conteo de no leídas inicial desde REST
    notificacionesService.getNoLeidasCount()
      .then((res) => {
        if (res.success && res.data) {
          setUnreadCount(res.data.count || 0);
        }
      })
      .catch((err) => console.error('Error al cargar conteo inicial de notificaciones:', err));


    // Configurar la conexión con el Hub de SignalR.
    // accessTokenFactory: el JWT se envía como query string (?access_token=...)
    // ya que los WebSockets no permiten cabeceras Authorization personalizadas.
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5132/notificacionHub', {
        accessTokenFactory: () => window.localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (!connection) return;

    connection.start()
      .then(() => {
        console.log('SignalR conectado al Hub de notificaciones.');

        connection.on('RecibirNotificacion', (n: ServerNotification) => {
          setUnreadCount((prev) => prev + 1);

          const titulo = n?.titulo || 'Notificación';
          const mensaje = n?.mensaje || '';
          const url = n?.urlAccion;

          const baseOpts = {
            description: mensaje,
            duration: 7000,
            action: url
              ? { label: 'Ver', onClick: () => { window.location.href = url; } }
              : undefined
          };

          switch (n?.tipo) {
            case 'Success':
              toast.success(titulo, baseOpts);
              break;
            case 'Warning':
              toast.warning(titulo, baseOpts);
              break;
            case 'Error':
              toast.error(titulo, baseOpts);
              break;
            default:
              toast.info(titulo, baseOpts);
          }
        });
      })
      .catch((error) => console.error('Error al conectar con SignalR Hub:', error));

    return () => {
      connection.stop();
    };
  }, [connection]);

  return { unreadCount, setUnreadCount };
}
