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

export const planService = {
  getPlans: () => api.get('/plans'),
  createPlan: (data: {
    title: string;
    description: string;
    emojiIcon?: string;
    datetime: string;
    location: string;
  }) => api.post('/plans', data),
  joinPlan: (planId: string) => api.post(`/plans/${planId}/join`),
  reactToPlan: (planId: string, emoji: string) => api.post(`/plans/${planId}/react`, { emoji }),
  addComment: (planId: string, text: string) => api.post(`/plans/${planId}/comments`, { text }),
  getComments: (planId: string) => api.get(`/plans/${planId}/comments`),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllAsRead: () => api.put('/notifications/read-all'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const profileService = {
  getProfile: (userId: string) => api.get(`/profiles/${userId}`),
  updateProfile: (userId: string, data: any) => api.put(`/profiles/${userId}`, data),
  getRandomProfiles: (limit = 10) => api.get('/profiles/random', { params: { limit } }),
};
