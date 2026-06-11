import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Compass, CalendarHeart, MessageCircle, User, Bell } from 'lucide-react';
import { Logo } from '../Logo';
import { useSocket } from '../../context/SocketContext';
import { useState, useEffect } from 'react';
import { notificationService, chatService } from '@/services/social';

const items = [
  { to: '/home', label: 'Inicio', icon: Home },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/plans', label: 'Planes', icon: CalendarHeart },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/profile', label: 'Perfil', icon: User },
] as const;

export function AppShell() {
  const location = useLocation();
  const path = location.pathname;
  const { socket } = useSocket();
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchUnreadChatStatus = async () => {
    try {
      const { data } = await chatService.getChats();
      const hasAnyUnread = data.some((c: any) => (c.unreadCount || 0) > 0);
      setHasUnreadChat(hasAnyUnread);
    } catch (error) {
      console.error('Error fetching chat unread status:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await notificationService.getUnreadCount();
      setUnreadNotificationsCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  // Cargar contadores iniciales
  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadChatStatus();
  }, []);

  // Escuchar nuevos eventos para (des)activar los badges
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      // Si no estamos en la página de chat, activamos el puntito rojo
      if (!path.startsWith('/chat')) {
        setHasUnreadChat(true);
      }
    };

    const handleNewNotification = () => {
      setUnreadNotificationsCount((prev) => prev + 1);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, path]);


  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-border bg-white p-6 lg:flex">
        <Logo />
        <nav className="mt-10 flex flex-col gap-1">
          {items.map((it) => {
            const active = path.startsWith(it.to);
            const Icon = it.icon;
            const showBadge = it.to === '/chat' && hasUnreadChat;

            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:bg-surface ${active ? 'gradient-primary text-white shadow-card' : 'text-foreground'}`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white" />
                  )}
                </div>
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <Link
            to="/notifications"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:bg-surface ${path.startsWith('/notifications') ? 'gradient-primary text-white shadow-card' : 'text-foreground'}`}
          >
            <Bell className="h-5 w-5" /> Notificaciones
            {unreadNotificationsCount > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-4 lg:hidden">
        <Logo size="sm" />
        <Link to="/notifications" className="relative rounded-full p-2 hover:bg-surface">
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Link>
      </header>

      {/* Desktop top-right notifications shortcut */}
      <div className="fixed top-4 right-6 z-20 hidden lg:block">
        <Link
          to="/notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-border shadow-subtle hover:shadow-card transition-all"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
            </span>
          )}
        </Link>
      </div>

      <main className="lg:pl-[260px] pb-20 lg:pb-0 animate-fade-in">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-10 lg:py-10">
          <Outlet
            context={{
              fetchUnreadCount,
              setUnreadNotificationsCount,
              fetchUnreadChatStatus,
              setHasUnreadChat,
            }}
          />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 border-t border-border bg-white lg:hidden h-16">
        {items.map((it) => {
          const active = path.startsWith(it.to);
          const Icon = it.icon;
          const showBadge = it.to === '/chat' && hasUnreadChat;

          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white" />
                )}
              </div>
              <span className="font-medium">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
