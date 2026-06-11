import { useState, useEffect } from 'react';
import { X, Search, Users, Smile, Loader2, MessageSquare, Check, User } from 'lucide-react';
import { Button } from './ui/Button';
import { friendService, chatService } from '../services/social';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Input } from './ui/Input';
import { EMOJIS } from '../lib/data';
import EmojiPicker from './ui/emoji-picker';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

interface Friend {
  _id: string;
  username: string;
  email: string;
  profile?: {
    photo?: string;
    avatar?: string;
  };
}

export default function NewChatModal({ isOpen, onClose, onChatCreated }: NewChatModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [mode, setMode] = useState<'selection' | 'individual' | 'group'>('selection');

  // Reset modal when it opens
  useEffect(() => {
    if (isOpen) {
      setMode('selection');
      setSelectedFriends([]);
      setGroupName('');
      setSelectedEmoji('');
      setSearch('');
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const { data } = await friendService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFriend = (id: string) => {
    if (mode === 'individual') {
      setSelectedFriends([id]);
    } else {
      setSelectedFriends((prev) =>
        prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
      );
    }
  };

  const handleCreateChat = async () => {
    if (selectedFriends.length === 0) return;

    try {
      setIsCreating(true);
      const isGroup = mode === 'group';

      // Select a random emoji if none chosen for group
      let finalEmoji = selectedEmoji;
      if (isGroup && !finalEmoji) {
        finalEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      }

      const { data } = await chatService.createChat({
        participants: selectedFriends,
        isGroup,
        name: isGroup
          ? groupName || 'Nuevo Grupo'
          : friends.find((f) => f._id === selectedFriends[0])?.username || 'undefined',
        emojiIcon: isGroup ? finalEmoji : undefined,
      });
      onChatCreated(data._id);
      handleClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleClose = () => {
    setSelectedFriends([]);
    setSearch('');
    setGroupName('');
    setSelectedEmoji('');
    setMode('selection');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white shadow-elevated overflow-hidden pointer-events-auto rounded-t-[32px] lg:rounded-3xl mt-auto lg:mt-0 animate-in slide-in-from-bottom-full lg:slide-in-from-bottom-0 lg:zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing modal when clicking inside
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-xl text-gray-900">
              {mode === 'selection'
                ? 'Nuevo chat'
                : mode === 'group'
                  ? 'Nuevo grupo'
                  : 'Nuevo chat'}
            </h3>
            <button
              onClick={handleClose}
              className="rounded-full p-2 hover:bg-surface text-gray-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {mode === 'selection' ? (
            /* Pantalla de Selección de Modo */
            <div className="p-6 space-y-4">
              <button
                onClick={() => setMode('individual')}
                className="w-full flex items-center gap-4 p-5 rounded-[20px] border border-gray-200 bg-white hover:bg-gray-50 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-xl bg-[#FF7875] flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">Chat individual</p>
                  <p className="text-sm text-gray-500 mt-0.5">Habla con un amigo</p>
                </div>
              </button>

              <button
                onClick={() => setMode('group')}
                className="w-full flex items-center gap-4 p-5 rounded-[20px] border border-gray-200 bg-white hover:bg-gray-50 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-xl bg-[#4ECDC4] flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">Crear grupo</p>
                  <p className="text-sm text-gray-500 mt-0.5">Chat con varios amigos</p>
                </div>
              </button>
            </div>
          ) : (
            /* Pantalla de Selección de Amigos */
            <>
              {/* Personalización de Grupo (Emoji + Nombre) */}
              {mode === 'group' && (
                <div className="px-6 py-5 bg-surface/50 border-b border-gray-100 space-y-4 animate-in slide-in-from-top duration-500">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">
                      Icono del Grupo
                    </label>
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelect}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 rounded-lg p-0"
                        >
                          {selectedEmoji ? (
                            <span className="text-xl">{selectedEmoji}</span>
                          ) : (
                            <Smile className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">
                      Nombre del Grupo
                    </label>
                    <Input
                      placeholder="Ej: Plan de fin de semana 🚀"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="bg-white h-12 rounded-xl border-gray-200 focus:ring-primary shadow-sm"
                    />
                  </div>
                </div>
              )}

              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Selecciona {mode === 'group' ? 'amigos' : 'un amigo'}
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre..."
                    className="pl-11 h-12 rounded-2xl bg-surface border-transparent focus:bg-white transition-all shadow-subtle"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="px-3 pb-4 max-h-[300px] overflow-y-auto space-y-1">
                {loading ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-medium text-gray-400">Buscando amigos...</p>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No se encontraron amigos.</p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend._id);
                    return (
                      <button
                        key={friend._id}
                        type="button"
                        onClick={() => toggleFriend(friend._id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                          isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-surface'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                            <AvatarImage src={friend.profile?.avatar || friend.profile?.photo} />
                            <AvatarFallback className="gradient-soft text-primary font-bold">
                              {friend.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 border-2 border-white shadow-sm animate-in zoom-in duration-300">
                              <Check className="h-2.5 w-2.5 stroke-[4px]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{friend.username}</p>
                          <p className="text-xs text-gray-400 truncate">{friend.email}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl h-12 font-bold text-gray-500"
                  onClick={() => {
                    setMode('selection');
                    setSelectedFriends([]);
                  }}
                >
                  Atrás
                </Button>
                <Button
                  className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
                  variant="hero"
                  disabled={
                    selectedFriends.length === 0 ||
                    isCreating ||
                    (mode === 'group' && !groupName.trim())
                  }
                  onClick={handleCreateChat}
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      {mode === 'group' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        <MessageSquare className="h-5 w-5" />
                      )}
                      <span>
                        {mode === 'group' ? `Crear (${selectedFriends.length})` : 'Iniciar Chat'}
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
