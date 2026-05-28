import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MessageCircle,
  Loader2,
  Send,
  ArrowLeft,
  MoreVertical,
  Smile,
  ImageIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { chatService } from '../services/social';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import NewChatModal from '../components/NewChatModal';

interface Participant {
  _id: string;
  name: string;
  profile?: {
    avatar?: string;
  };
}

interface Message {
  _id: string;
  chatId: string;
  sender: Participant;
  content: string;
  createdAt: string;
}

interface Chat {
  _id: string;
  isGroup: boolean;
  name?: string;
  emojiIcon?: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: string;
  };
  updatedAt: string;
}

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null); // para scroll hacia el último mensaje
  const messagesContainerRef = useRef<HTMLDivElement>(null); // para scroll infinito y mantener la posición al cargar más mensajes
  const prevScrollHeight = useRef<number | null>(null);

  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'smooth') => {
    // Usamos setTimeout para esperar al renderizado y actualización de scrollHeight
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior,
        });
      }
    }, 100);
  };

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [isModalOpen]); // Reload chats when modal closes (in case a new chat was created)

  // Handle incoming socket messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload: { chatId: string; message: Message }) => {
      // Update chats list (move chat to top, update last message)
      setChats((prev) => {
        const chatIdx = prev.findIndex((c) => c._id === payload.chatId);
        if (chatIdx === -1) {
          // Si el chat no está en la lista (chat nuevo), recargamos la lista
          loadChats();
          return prev;
        }
        const updatedChat = {
          ...prev[chatIdx],
          lastMessage: {
            content: payload.message.content,
            createdAt: payload.message.createdAt,
            sender: payload.message.sender._id,
          },
          updatedAt: payload.message.createdAt,
        };

        const newList = [...prev];
        newList.splice(chatIdx, 1);
        return [updatedChat, ...newList];
      });
      //console.log('Received new message via socket:', payload);
      // If this message belongs to current active chat, add it
      if (payload.chatId === chatId) {
        setMessages((prev) => [...prev, payload.message]);
        scrollToBottom();
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, chatId]);

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      setPage(1);
      setHasMore(true);
      loadMessages(chatId, 1).then(() => scrollToBottom('auto'));
      if (socket) {
        socket.emit('join_chat', chatId);
      }
    } else {
      // Quitar chat window, volver a lista de chats
      setMessages([]);
      setPage(1);
      setHasMore(true);
    }
  }, [chatId, socket]);

  useLayoutEffect(() => {
    if (prevScrollHeight.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;

      container.scrollTop = container.scrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = null;
    }
  }, [messages, page, loadingMore]);

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      const { data } = await chatService.getChats();
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (id: string, pageNum: number, isMore = false) => {
    try {
      if (isMore) setLoadingMore(true);
      else setLoadingMessages(true);

      const { data } = await chatService.getMessages(id, pageNum);

      const newMessages = data.messages.reverse();

      if (isMore && messagesContainerRef.current) {
        // Record only the scrollHeight before state update
        prevScrollHeight.current = messagesContainerRef.current.scrollHeight;

        setMessages((prev) => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }

      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!isMore) navigate('/chat');
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !loadingMore && !loadingMessages && chatId) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(chatId, nextPage, true);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !chatId || isSending) return;

    try {
      setIsSending(true);
      scrollToBottom();
      const content = messageInput;
      setMessageInput('');
      await chatService.sendMessage(chatId, content);
      // Message will be added via socket event to keep consistency
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore input on error?
      setMessageInput(messageInput);
    } finally {
      setIsSending(false);
    }
  };

  const currentChat = useMemo(() => chats.find((c) => c._id === chatId), [chats, chatId]);

  const filteredChats = useMemo(
    () =>
      chats.filter((chat) => {
        const chatName = chat.isGroup
          ? chat.name
          : chat.participants.find((p) => p._id !== user?._id)?.name;
        return chatName?.toLowerCase().includes(search.toLowerCase());
      }),
    [chats, search, user]
  );

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) return chat.name || 'Grupo';
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    return otherParticipant?.name || 'Usuario';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) return null;
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    return otherParticipant?.profile?.avatar;
  };

  const activeChatSubtitle = useMemo(() => {
    if (!currentChat) return '';
    // TODO
    // onlineMembers = miembros conectados actualmente, totalMembers = currentChat.participants.length
    if (currentChat.isGroup) {
      // return `${onlineMembers} de ${totalMembers} miembros activos`;
      return `${currentChat.participants.length} miembros`;
    }
    const otherParticipantStatus = 'Activo ahora'; // TODO usar un estado real de conexión del otro participante

    return otherParticipantStatus;
  }, [currentChat]);

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-12rem)] lg:h-[calc(100vh-7rem)] animate-fade-in">
      {/* Sidebar - Hidden on mobile if a chat is active */}
      <aside
        className={`rounded-2xl border border-border bg-card overflow-hidden flex flex-col ${chatId ? 'hidden lg:flex' : 'flex'}`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">Chats</h2>
          <div className="flex gap-1">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full gradient-primary text-white px-3 py-1.5 text-xs font-bold shadow-card hover:scale-105 transition-transform"
            >
              <Plus className="h-3.5 w-3.5" /> Nuevo
            </Button>
          </div>
        </div>

        <div className="p-3 border-b border-border bg-surface/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Buscar chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs rounded-xl bg-white border-transparent shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {loadingChats ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No hay chats aún</p>
            </div>
          ) : (
            filteredChats.map((c) => (
              <button
                key={c._id}
                onClick={() => navigate(`/chat/${c._id}`)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-surface text-left transition-all ${chatId === c._id ? 'bg-primary/5 border-r-2 border-primary' : ''}`}
              >
                <div className="relative shrink-0">
                  {c.isGroup ? (
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center shadow-sm border-2 border-white"
                      style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)' }}
                    >
                      <span className="text-xl">{c.emojiIcon || '👥'}</span>
                    </div>
                  ) : (
                    <Avatar className="h-11 w-11 rounded-xl border-2 border-white shadow-sm">
                      <AvatarImage src={getChatAvatar(c)} />
                      <AvatarFallback className="gradient-soft text-primary font-bold text-xs">
                        {getChatName(c).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-bold text-sm truncate text-gray-900">{getChatName(c)}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {c.lastMessage
                        ? formatDistanceToNow(new Date(c.updatedAt), { locale: es })
                        : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate line-clamp-1">
                    {c.lastMessage ? (
                      <>
                        {c.lastMessage.sender === user?._id && (
                          <span className="text-primary font-medium">Tú: </span>
                        )}
                        {c.lastMessage.content}
                      </>
                    ) : (
                      <span className="italic opacity-60">Nuevo chat · di hola 👋</span>
                    )}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Window */}
      <section
        className={`rounded-2xl border border-border bg-card flex flex-col overflow-hidden ${!chatId ? 'hidden lg:flex' : 'flex'}`}
      >
        {chatId ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => navigate('/chat')}
                  className="p-2 hover:bg-surface rounded-xl transition-colors lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>

                {currentChat?.isGroup ? (
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)' }}
                  >
                    <span className="text-lg">{currentChat?.emojiIcon}</span>
                  </div>
                ) : (
                  <Avatar className="h-10 w-10 rounded-xl border border-gray-100">
                    <AvatarImage src={currentChat ? getChatAvatar(currentChat) : undefined} />
                    <AvatarFallback className="gradient-soft text-primary font-bold text-xs">
                      {currentChat ? getChatName(currentChat).charAt(0) : '?'}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="min-w-0">
                  <p className="font-bold text-sm truncate text-gray-900">
                    {currentChat ? getChatName(currentChat) : 'Cargando...'}
                  </p>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                    {activeChatSubtitle}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-surface rounded-xl transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface/30"
            >
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs font-medium">Cargando mensajes...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                  <div className="h-16 w-16 rounded-3xl bg-white flex items-center justify-center shadow-subtle mb-4">
                    <span className="text-2xl">👋</span>
                  </div>
                  <h3 className="font-bold text-gray-900">¡Saluda!</h3>
                  <p className="text-xs max-w-[200px] mt-1">
                    Envía un mensaje para romper el hielo.
                  </p>
                </div>
              ) : (
                <>
                  {loadingMore && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary opacity-50" />
                    </div>
                  )}
                  {messages.map((m, i) => {
                    const isMe = m.sender._id === user?._id;
                    return (
                      <div
                        key={m._id || i}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar del remitente del mensaje en cada mensaje si es un grupo y yo no soy el remitente */}
                        {/* {!isMe && currentChat?.isGroup && (
                          <Avatar className="h-7 w-7 rounded-lg mb-1">
                            <AvatarImage src={m.sender.profile?.avatar} />
                            <AvatarFallback className="text-[8px]">
                              {m.sender.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )} */}
                        <div className="flex flex-col max-w-[75%]">
                          {!isMe && currentChat?.isGroup && (
                            <span className="text-[9px] font-bold text-gray-400 ml-2 mb-0.5">
                              {m.sender.name.split(' ')[0]}
                            </span>
                          )}
                          <div
                            className={`px-4 py-2.5 text-sm shadow-subtle ${
                              isMe
                                ? 'gradient-primary text-white rounded-2xl rounded-br-none'
                                : 'bg-white text-gray-700 rounded-2xl rounded-bl-none border border-gray-100'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-border">
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="h-11 rounded-2xl bg-surface border-transparent focus:bg-white pr-12 transition-all text-sm"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="h-11 w-11 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-card hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state for desktop when no chat selected */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface/20">
            <div className="h-24 w-24 rounded-[40px] bg-white flex items-center justify-center shadow-elevated mb-6 animate-float">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Tus Mensajes</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              Selecciona una conversación de la lista para empezar a chatear o inicia una nueva con
              tus amigos.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="mt-8 rounded-xl border-2 px-8"
            >
              Empezar a chatear
            </Button>
          </div>
        )}
      </section>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChatCreated={(id) => navigate(`/chat/${id}`)}
      />
    </div>
  );
}
