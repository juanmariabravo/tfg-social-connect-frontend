import { useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export const useActiveUsers = (chatId?: string) => {
  const { activeUsers } = useSocket();

  const isUserActive = useCallback(
    (userId: string) => {
      return activeUsers.has(userId);
    },
    [activeUsers]
  );

  return {
    isUserActive,
  };
};
