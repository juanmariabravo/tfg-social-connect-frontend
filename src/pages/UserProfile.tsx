import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PersonalityChart } from '@/components/PersonalityChart';
import {
  ArrowLeft,
  MessageCircle,
  MapPin,
  Sparkles,
  Loader2,
  UserPlus,
  Camera,
  Check,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';
import { friendService } from '@/services/social';
import { getGravatarUrl } from '@/lib/gravatar';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [photoView, setPhotoView] = useState<'real' | 'virtual'>('real');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/profiles/${id}`);
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleConnect = async () => {
    if (!profile?.userId) return;
    setConnecting(true);
    try {
      await friendService.sendFriendRequest(profile.userId?._id || profile.userId);
      toast.success('¡Solicitud de conexión enviada!');
      setProfile((prev: any) => ({ ...prev, friendshipStatus: 'pending' }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al conectar');
    } finally {
      setConnecting(false);
    }
  };

  const getAgeFromDateOfBirth = (dob: string) => {
    if (!dob) return '';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h1 className="text-xl font-bold text-gray-900">Perfil no encontrado</h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          Volver
        </Button>
      </div>
    );
  }

  const traits = [
    { trait: 'Extroversión', value: (profile.personality?.extroversion || 5) * 10 },
    { trait: 'Apertura', value: (profile.personality?.openness || 5) * 10 },
    { trait: 'Responsabilidad', value: (profile.personality?.conscientiousness || 5) * 10 },
    { trait: 'Amabilidad', value: (profile.personality?.agreeableness || 5) * 10 },
    { trait: 'Estabilidad', value: (profile.personality?.neuroticism || 5) * 10 },
  ];

  const activeColor =
    photoView === 'real'
      ? 'linear-gradient(135deg,#FF6B6B,#A855F7)'
      : 'linear-gradient(135deg,#4ECDC4,#A855F7)';

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6 animate-fade-in pb-20 lg:pb-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[#FF6B6B] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg">
        <div className="h-32" style={{ background: activeColor }} />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage
                  src={
                    photoView === 'real'
                      ? profile.photo ||
                        'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
                      : profile.avatar || getGravatarUrl(profile.username + '@test.com', 200)
                  }
                  alt={photoView === 'real' ? 'Foto real' : 'Foto virtual'}
                />
                <AvatarFallback>
                  {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="absolute -bottom-1 -right-1 inline-flex rounded-full bg-white border border-gray-200 p-0.5 shadow-lg">
                <button
                  onClick={() => setPhotoView('real')}
                  aria-label="Foto real"
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${photoView === 'real' ? 'bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] text-white' : 'text-gray-400'}`}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPhotoView('virtual')}
                  aria-label="Foto virtual"
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${photoView === 'virtual' ? 'bg-gradient-to-r from-[#4ECDC4] to-[#A855F7] text-white' : 'text-gray-400'}`}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              {profile.friendshipStatus === 'accepted' ? (
                <Button
                  variant="hero"
                  size="sm"
                  className="h-10 rounded-lg shadow-lg shadow-[#FF6B6B]/20"
                  onClick={() => navigate(`/chat?userId=${profile.userId?._id || profile.userId}`)}
                >
                  <MessageCircle className="h-4 w-4" /> Enviar mensaje
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="sm"
                  className="h-10 rounded-lg shadow-lg shadow-[#FF6B6B]/20"
                  onClick={handleConnect}
                  disabled={connecting || profile.friendshipStatus === 'pending'}
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : profile.friendshipStatus === 'pending' ? (
                    'Solicitud pendiente'
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> Conectar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-2xl font-bold">
              {profile.username}, {getAgeFromDateOfBirth(profile.dateOfBirth)}
            </h1>
            {profile.location && (
              <p className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" /> {profile.location}
              </p>
            )}
            {profile.bio && (
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2">Intereses</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {profile.interests && profile.interests.length > 0 ? (
            profile.interests.map((i: any) => (
              <span
                key={i.name}
                className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-700"
              >
                {i.emoji} {i.name}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic">
              Este usuario aún no ha añadido intereses.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Personalidad</h2>
        <div className="mt-4">
          <PersonalityChart data={traits} />
        </div>
      </section>
    </div>
  );
}
