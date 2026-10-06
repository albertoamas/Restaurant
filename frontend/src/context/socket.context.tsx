import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth.context';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface SocketContextType {
  socket:       Socket | null;
  connected:    boolean;
  reconnecting: boolean;
  status:       ConnectionStatus;
}

const SocketContext = createContext<SocketContextType>({
  socket:       null,
  connected:    false,
  reconnecting: false,
  status:       'disconnected',
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected]       = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const { token, refreshUser } = useAuth();
  // En un ref: el socket no debe recrearse cuando cambia la identidad de la función.
  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setReconnecting(false);
      return;
    }

    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      // reconnectionAttempts omitido → Infinity (default Socket.IO)
      // 5 era demasiado restrictivo: tras un corte breve de red el socket
      // abandonaba y la app caía al polling de 30 s indefinidamente.
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
    });
    socket.on('disconnect', (reason) => {
      setConnected(false);
      // Corte del servidor = me desactivaron o suspendieron el negocio. Releer la sesión da 401
      // y el cliente HTTP cierra la sesión al instante, sin esperar a la próxima acción.
      if (reason === 'io server disconnect') void refreshUserRef.current();
    });
    socket.on('connect_error', (err) => {
      if (err.message === 'Sesión inactiva') void refreshUserRef.current();
    });
    socket.io.on('reconnect_attempt', () => {
      setReconnecting(true);
    });
    socket.io.on('reconnect', () => {
      setReconnecting(false);
    });
    socket.io.on('reconnect_failed', () => {
      setReconnecting(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const status: ConnectionStatus =
    connected ? 'connected' : reconnecting ? 'reconnecting' : 'disconnected';

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, reconnecting, status }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

/** Subscribe to a socket event, auto-cleanup on unmount */
export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;
    const fn = (data: T) => handlerRef.current(data);
    socket.on(event, fn);
    return () => { socket.off(event, fn); };
  }, [socket, event]);
}
