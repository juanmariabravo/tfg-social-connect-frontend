import api from './api';

export const chatService = {
  getChats: () => api.get('/chats'),
  createChat: (data: {
    participants: string[];
    isGroup?: boolean;
    name?: string;
    emojiIcon?: string;
  }) => api.post('/chats', data),
  getMessages: (chatId: string, cursor: string | null = null, limit = 20) =>
    api.get(`/chats/${chatId}/messages`, { params: { cursor, limit } }),
  sendMessage: (chatId: string, content: string) =>
    api.post(`/chats/${chatId}/messages`, { content }),
};

export const friendService = {
  getFriends: () => api.get('/friends'),
  getFriendRequests: () => api.get('/friends/requests'),
  sendFriendRequest: (userId: string) => api.post(`/friends/request/${userId}`),
  respondToRequest: (requestId: string, status: 'accepted' | 'rejected') =>
    api.put(`/friends/request/${requestId}`, { status }),
};
