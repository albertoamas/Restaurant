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
  const { token } = useAuth();
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
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
    });
    socket.on('disconnect', () => {
      setConnected(false);
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

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}
