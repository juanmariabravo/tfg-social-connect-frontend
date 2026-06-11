import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Heart,
  UserRoundCheck,
  UserRoundPlus,
  MessageCircle,
  CalendarHeart,
  Check,
  Loader2,
  Info,
} from 'lucide-react';
import { notificationService, friendService } from '@/services/social';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/context/SocketContext';

interface Sender {
  _id: string;
  username: string;
  profile?: {
    avatar?: string;
  };
}

interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: Sender;
  referenceId?: string;
  friendshipStatus?: 'pending' | 'accepted' | 'rejected';
}

interface ContextType {
  fetchUnreadCount: () => Promise<void>;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
}

const icons: Record<string, React.ElementType> = {
  plan_interest: (props: React.ComponentProps<typeof Heart>) => (
    <Heart {...props} fill="currentColor" />
  ),
  friend_request: UserRoundPlus,
  friend_accept: UserRoundCheck,
  plan_comment: MessageCircle,
  plan_join: CalendarHeart,
  plan_invite: CalendarHeart,
  system: Info,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionedRequests, setActionedRequests] = useState<Record<string, 'accepted' | 'rejected'>>(
    {}
  );
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { setUnreadNotificationsCount } = useOutletContext<ContextType>();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      fetchNotifications();
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationService.getNotifications();
      setNotifications(data);

      // Sincronizar el badge con el conteo real que acabamos de recibir
      const unreadCount = data.filter((n: Notification) => !n.read).length;
      setUnreadNotificationsCount(unreadCount);

      // Sincronizar solicitudes de amistad ya gestionadas
      const actions: Record<string, 'accepted' | 'rejected'> = {};
      data.forEach((n: Notification) => {
        if (n.type === 'friend_request' && n.friendshipStatus && n.friendshipStatus !== 'pending') {
          actions[n._id] = n.friendshipStatus as 'accepted' | 'rejected';
        }
      });
      setActionedRequests(actions);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((arr) => arr.map((n) => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleFriendRequestAction = async (
    e: React.MouseEvent,
    notification: Notification,
    status: 'accepted' | 'rejected'
  ) => {
    e.stopPropagation();
    if (!notification.referenceId) return;

    try {
      await friendService.respondToRequest(notification.referenceId, status);
      toast.success(`Solicitud ${status === 'accepted' ? 'aceptada' : 'rechazada'}`);
      setActionedRequests((prev) => ({ ...prev, [notification._id]: status }));

      if (!notification.read) {
        await notificationService.markAsRead(notification._id);
        setNotifications((arr) =>
          arr.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al procesar la solicitud');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification._id);
        setNotifications((arr) =>
          arr.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navegación basada en el tipo de notificación
    if (notification.type.startsWith('plan_')) {
      // navigate('/plans/' + notification.referenceId); // A la página del plan específico TODO
      navigate('/plans');
    } else if (notification.type.startsWith('friend_')) {
      navigate('/profile'); // A la pestaña de amigos
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Mantente al día de tu comunidad.</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button
            onClick={markAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <Check className="h-4 w-4" /> Marcar todas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl shadow-sm">
          <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <Info className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold">No tienes notificaciones</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Aquí aparecerán tus nuevas interacciones, solicitudes de amistad y actividad en los
            planes.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-card divide-y divide-border overflow-hidden">
          {notifications.map((n) => {
            const Icon = icons[n.type] || Info;
            const senderInitial = n.sender?.username
              ? n.sender.username.charAt(0).toUpperCase()
              : '?';

            // Resaltar en negrita el nombre del remitente si está al principio del mensaje
            const messageContent =
              n.sender && n.message.startsWith(n.sender.username) ? (
                <>
                  <span className="font-bold text-foreground">{n.sender.username}</span>
                  {n.message.substring(n.sender.username.length)}
                </>
              ) : (
                <span className="text-foreground">{n.message}</span>
              );

            return (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-center gap-4 p-5 transition-colors hover:bg-surface cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12 border border-border shadow-sm">
                    <AvatarImage
                      src={n.sender?.profile?.avatar}
                      alt={n.sender?.username || 'Usuario'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                      {senderInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full gradient-primary text-white flex items-center justify-center border-2 border-white shadow-sm">
                    <Icon className="h-3 w-3" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{messageContent}</p>

                  {n.type === 'friend_request' && !actionedRequests[n._id] && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        onClick={(e) => handleFriendRequestAction(e, n, 'accepted')}
                        variant="hero"
                        className="h-9 rounded-full px-4 text-sm shadow-sm transition-transform hover:scale-[1.02]"
                      >
                        Aceptar
                      </Button>
                      <Button
                        onClick={(e) => handleFriendRequestAction(e, n, 'rejected')}
                        variant="outline"
                        className="h-9 rounded-full px-4 text-sm border-border/70 bg-background/60 hover:bg-surface hover:text-foreground transition-colors"
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {n.type === 'friend_request' && actionedRequests[n._id] && (
                    <p className="text-xs font-medium text-primary mt-2">
                      Solicitud {actionedRequests[n._id] === 'accepted' ? 'aceptada' : 'rechazada'}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>

                {!n.read && (
                  <div className="flex-shrink-0 pl-2">
                    <span className="block h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
