import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SOCKET_URL = import.meta.env.VITE_API_URL;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let newSocket: Socket | null = null;

    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');

      newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'], // Forzar WebSocket para mayor eficiencia
      });

      newSocket.on('connect', () => {
        //console.log('Connected to WebSocket server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        //console.log('Disconnected from WebSocket server');
        setIsConnected(false);
        setActiveUsers(new Set());
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      // Manejar estados de usuarios
      newSocket.on(
        'user_status_change',
        (data: { userId: string; status: 'online' | 'offline' }) => {
          setActiveUsers((prev) => {
            const newSet = new Set(prev);
            if (data.status === 'online') {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        }
      );

      newSocket.on('initial_active_users', (userIds: string[]) => {
        setActiveUsers(new Set(userIds));
      });

      setSocket(newSocket);
    } else {
      // Si el usuario no está autenticado, cerrar socket si existe
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setActiveUsers(new Set());
      }
    }

    return () => {
      if (newSocket) {
        //console.log('Cleaning up socket connection...');
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, activeUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe usarse dentro de SocketProvider');
  }
  return context;
}
