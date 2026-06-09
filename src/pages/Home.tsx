import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/Button';
import { Sparkles, Camera, X, Heart, MapPin, Loader2, UserPlus } from 'lucide-react';
import { profileService, friendService } from '@/services/social';
import { toast } from 'sonner';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface ProfileData {
  _id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  photo?: string;
  interests?: { name: string; emoji: string }[];
  user: {
    username: string;
    name: string;
    dateOfBirth: string;
  };
}

interface SwipeableCardProps {
  profile: ProfileData;
  virtual: boolean;
  setVirtual: (v: boolean) => void;
  onSwipe: (dir: 'left' | 'right') => void;
  isTop: boolean;
  calculateAge: (dob: string) => number | string;
}

const SwipeableCard = memo(function SwipeableCard({
  profile,
  virtual,
  setVirtual,
  onSwipe,
  isTop,
  calculateAge,
}: SwipeableCardProps) {
  const x = useMotionValue(0); // posición horizontal del arrastre
  const rotate = useTransform(x, [-200, 200], [-25, 25]); // rotación basada en la posición horizontal
  const opacity = useTransform(x, [-100, -50, 0, 50, 100], [0, 1, 1, 1, 0]); // opacidad que disminuye al arrastrar hacia los lados
  const rejectOpacity = useTransform(x, [-50, -20], [1, 0]); // opacidad del indicador de rechazo
  const connectOpacity = useTransform(x, [20, 50], [0, 1]); // opacidad del indicador de conexión

  const handleDragEnd = (_: any, info: any) => {
    if (!isTop) return;
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  const imageUrl = virtual ? profile.avatar : profile.photo;

  return (
    <motion.div
      style={isTop ? { x, rotate } : { scale: 0.95, opacity: 0.6 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 rounded-3xl border border-border bg-card shadow-card overflow-hidden cursor-grab active:cursor-grabbing touch-none will-change-transform"
      initial={isTop ? { scale: 0.9, opacity: 0 } : false}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.6 }}
    >
      {/* Contenido de la Tarjeta */}
      <motion.div style={isTop ? { opacity } : {}} className="absolute inset-0">
        {/* Imagen de Fondo */}
        <div className="absolute inset-0 pointer-events-none">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={profile.user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl font-bold text-primary/40">
                {profile.user.username.charAt(0)}
              </span>
            </div>
          )}
          {/* Indicadores visuales de Swipe */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Selector de tipo de perfil: virtual o real */}
        <div
          className="absolute top-4 left-4 z-20 inline-flex items-center rounded-full border border-white/20 bg-black/50 p-1 shadow-lg relative"
          onPointerDown={(e) => e.stopPropagation()} // Evitar arrastrar al hacer clic en el botón
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVirtual(false);
            }}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors z-10 ${!virtual ? 'text-black' : 'text-white/60 hover:text-white'}`}
          >
            <Camera className="h-4 w-4" />
            Real
            {!virtual && (
              <motion.div
                layoutId={`activePill-${profile._id}`}
                className="absolute inset-0 bg-white rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVirtual(true);
            }}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors z-10 ${virtual ? 'text-black' : 'text-white/60 hover:text-white'}`}
          >
            <Sparkles className="h-4 w-4" />
            Virtual
            {virtual && (
              <motion.div
                layoutId={`activePill-${profile._id}`}
                className="absolute inset-0 bg-white rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Información del Perfil superpuesta */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none select-none">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold">{profile.displayName || profile.user.username}</h2>
            <span className="text-lg opacity-90">{calculateAge(profile.user.dateOfBirth)}</span>
          </div>
          <p className="text-sm opacity-80 flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" /> Ciudad Real, ES
          </p>
          <p className="mt-3 text-sm leading-relaxed opacity-90 line-clamp-3">
            {profile.bio || 'Sin biografía'}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.interests?.map((i) => (
              <span
                key={i.name}
                className="rounded-full bg-white/20 border border-white/20 px-2.5 py-1 text-xs"
              >
                {i.emoji} {i.name}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Indicadores Visuales */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: rejectOpacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-30 pointer-events-none"
          >
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center rotate-[-15deg] border-8 border-rose-500/20">
              <X size={80} className="text-rose-500" strokeWidth={4} />
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: connectOpacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-30 pointer-events-none"
          >
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center rotate-[15deg] border-8 border-emerald-500/20">
              <UserPlus size={80} className="text-emerald-500" strokeWidth={3} />
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
});

const calculateAge = (dob: string) => {
  if (!dob) return '??';
  const birthDate = new Date(dob);
  const difference = Date.now() - birthDate.getTime();
  const ageDate = new Date(difference);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export default function HomePage() {
  const [virtual, setVirtual] = useState(false);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await profileService.getRandomProfiles(10);
      setProfiles((prev) => (index === 0 ? res.data : [...prev, ...res.data]));
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Error al cargar perfiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (index >= profiles.length - 2 && !loading && profiles.length > 0) {
      fetchProfiles();
    }
  }, [index, profiles.length, loading]);

  const handleSwipe = useCallback(
    async (dir: 'left' | 'right') => {
      if (index >= profiles.length) return;
      const currentProfile = profiles[index];

      if (dir === 'right') {
        try {
          await friendService.sendFriendRequest(currentProfile.userId);
          toast.success(
            `Solicitud enviada a ${currentProfile.displayName || currentProfile.user.username}`
          );
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Error al enviar solicitud');
        }
      }

      // Añadir un pequeño retraso antes de pasar a la siguiente tarjeta
      // para que el usuario vea la animación y el feedback visual
      setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 300);
    },
    [index, profiles]
  );

  if (loading && profiles.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="md:space-y-6 overflow-hidden flex flex-col justify-center h-[calc(100dvh-190px)] lg:h-auto lg:min-h-[calc(100vh-140px)] overscroll-none">
      <div className="relative mx-auto w-full max-w-md h-[70vh] min-h-[480px] select-none rounded-3xl z-10">
        {index < profiles.length ? (
          // Se renderizan las 2 tarjetas superiores. index es la superior, index+1 es la de fondo.
          // Se invierten para que index se pinte encima de index+1
          profiles
            .slice(index, index + 2)
            .reverse()
            .map((profile, i, arr) => {
              const isTop = i === arr.length - 1;
              return (
                <SwipeableCard
                  key={profile._id}
                  profile={profile}
                  virtual={virtual}
                  setVirtual={setVirtual}
                  onSwipe={handleSwipe}
                  isTop={isTop}
                  calculateAge={calculateAge}
                />
              );
            })
        ) : (
          <motion.div
            key="no-more-profiles"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-surface flex items-center justify-center mb-4 text-primary">
              <Sparkles className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold">¡Has visto a todos!</h3>
            <p className="text-muted-foreground mt-2 px-4">
              Vuelve más tarde para descubrir a más personas increíbles.
            </p>
            <Button
              onClick={() => {
                setIndex(0);
                fetchProfiles();
              }}
              className="mt-6"
              variant="outline"
            >
              Actualizar
            </Button>
          </motion.div>
        )}
      </div>

      {index < profiles.length && (
        <div className="hidden md:flex justify-center gap-6">
          <button
            onClick={() => handleSwipe('left')}
            aria-label="Saltar"
            className="h-16 w-16 rounded-full bg-rose-500 shadow-card flex items-center justify-center text-white hover:scale-110 hover:brightness-95 transition-all active:scale-95 border border-rose-600/30"
          >
            <X className="h-7 w-7" strokeWidth={3} />
          </button>
          <button
            onClick={() => handleSwipe('right')}
            aria-label="Conectar"
            className="h-16 w-16 rounded-full bg-emerald-500 shadow-card flex items-center justify-center text-white hover:scale-110 hover:brightness-95 transition-all active:scale-95 border border-emerald-600/30"
          >
            <UserPlus className="h-7 w-7" strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}
