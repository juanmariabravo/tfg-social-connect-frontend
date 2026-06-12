import { useState, useEffect } from 'react';
import { friendService } from '@/services/social';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserMinus, MessageCircle, Search, Loader2, ArrowLeft, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data } = await friendService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    setDeletingId(friendId);
    try {
      await friendService.deleteFriend(friendId);
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
    } catch (error) {
      console.error('Error deleting friend:', error);
    } finally {
      setDeletingId(null);
      toast.success('Amigo eliminado');
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Mis Amigos</h1>
          <p className="text-sm text-gray-500">
            {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar entre tus amigos..."
          className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-[#FF6B6B] transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-gray-50 shadow-sm">
                  <AvatarImage
                    src={friend.profile?.avatar || friend.profile?.photo}
                    alt={friend.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B] to-[#A855F7] text-white text-lg font-bold">
                    {friend.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900">@{friend.username}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-700 font-medium tracking-wider">
                      {friend.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="rounded-full h-10 w-10 border-gray-200 text-gray-600 hover:text-[#FF6B6B] hover:border-[#FF6B6B] hover:bg-rose-50 transition-all"
                >
                  <Link to={`/chat?userId=${friend._id}`}>
                    <MessageCircle className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="hero"
                  size="icon"
                  className="rounded-full h-10 w-10 border-red-200 text-white hover:bg-red-600 hover:border-red-300 hover:text-white transition-all shadow-sm"
                  onClick={() => handleDeleteFriend(friend._id)}
                  disabled={deletingId === friend._id}
                >
                  {deletingId === friend._id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <UserMinus className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No hay resultados</h3>
            <p className="text-gray-500 max-w-[240px] mx-auto mt-1">
              {search
                ? `No hemos encontrado a ningún amigo que coincida con "${search}"`
                : 'Aún no tienes amigos agregados. ¡Empieza a conectar!'}
            </p>
            {!search && (
              <Button
                variant="hero"
                className="mt-6 rounded-full px-8"
                onClick={() => navigate('/home')}
              >
                Descubrir gente
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
