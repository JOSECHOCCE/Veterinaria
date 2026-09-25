import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

/**
 * Hook that listens for real-time triage queue updates via SignalR (RNF-007).
 * Replaces polling with push-based notifications for < 3s latency.
 * 
 * @param onQueueUpdated - Callback fired when the triage queue changes on the server
 */
export function useTriageRealtime(onQueueUpdated: () => void) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const callbackRef = useRef(onQueueUpdated);

  // Keep callback ref current without re-creating connection
  useEffect(() => {
    callbackRef.current = onQueueUpdated;
  }, [onQueueUpdated]);

  useEffect(() => {
    const token = window.localStorage.getItem('token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_URL || '/notificacionHub', {
        accessTokenFactory: () => window.localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      .build();

    connectionRef.current = connection;

    connection.on('TriageQueueUpdated', () => {
      callbackRef.current();
    });

    connection.start()
      .then(() => console.log('SignalR: Conectado para cola de triaje en tiempo real.'))
      .catch((err) => console.error('SignalR: Error al conectar para triaje:', err));

    return () => {
      connection.off('TriageQueueUpdated');
      connection.stop();
      connectionRef.current = null;
    };
  }, []);
}
