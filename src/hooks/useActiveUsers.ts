import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

interface ActiveUserStatus {
  userId: string;
  status: 'online' | 'offline';
  connectedAt?: string;
  disconnectedAt?: string;
}

export const useActiveUsers = (chatId?: string) => {
  const { socket } = useSocket();
  const [activeUsersGlobal, setActiveUsersGlobal] = useState<Set<string>>(new Set());

  // Escuchar cambios de estado global de usuarios
  useEffect(() => {
    if (!socket) return;

    const handleUserStatusChange = (data: ActiveUserStatus) => {
      setActiveUsersGlobal((prev) => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    socket.on('user_status_change', handleUserStatusChange);

    return () => {
      socket.off('user_status_change', handleUserStatusChange);
    };
  }, [socket]);

  const isUserActive = useCallback(
    (userId: string) => {
      return activeUsersGlobal.has(userId);
    },
    [activeUsersGlobal]
  );

  return {
    isUserActive,
  };
};
