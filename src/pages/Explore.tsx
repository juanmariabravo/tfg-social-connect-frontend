import { useState, useEffect, useRef } from 'react';
import { Search, Camera, Sparkles, Loader2, MapPin, ArrowRight, Zap } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';

const TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Cerca', value: 'proximity' },
  { label: 'Intereses', value: 'interests' },
  { label: 'Personalidad', value: 'personality' },
  { label: 'Edad', value: 'age' },
];

const calculateAge = (dob: string) => {
  if (!dob) return '??';
  const birthDate = new Date(dob);
  const difference = Date.now() - birthDate.getTime();
  const ageDate = new Date(difference);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export default function ExplorePage() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [virtual, setVirtual] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchUsers = async (pageNum: number, isNewSearch: boolean = false) => {
    // Ya no hacemos el return aquí, el bloqueo se gestiona antes de llamar a setPage
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { data } = await api.get('/profiles/explore', {
        params: {
          filter: tab,
          search: q,
          page: pageNum,
          limit: 12,
        },
      });

      const newUsers = data.users || [];
      if (isNewSearch) {
        setUsers(newUsers);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
      }

      setHasMore(newUsers.length === 12); // Si vienen menos de 12, no hay más
    } catch (error) {
      console.error('Error fetching explore users:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false; // Liberamos el bloqueo síncrono
    }
  };

  // Reset y búsqueda inicial cuando cambia tab o query
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    const timer = setTimeout(
      () => {
        isFetchingRef.current = true;
        fetchUsers(1, true);
      },
      q ? 500 : 0
    );
    return () => clearTimeout(timer);
  }, [tab, q]);

  // Cargar más cuando cambia la página (si no es la 1)
  useEffect(() => {
    if (page > 1) {
      fetchUsers(page);
    }
  }, [page]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Detectamos si estamos cerca del fondo (a menos de 100px)
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100;

    if (isNearBottom && hasMore && !loadingMore && !loading && !isFetchingRef.current) {
      isFetchingRef.current = true; // Bloqueo inmediato síncrono
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="space-y-6 h-[calc(100vh-12rem)] lg:h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-hide animate-fade-in pb-20 lg:pb-0"
    >
      <div className="space-y-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold">Explorar</h1>
          <p className="text-sm text-muted-foreground">
            Descubre nuevas personas con intereses parecidos.
          </p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#FF6B6B]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar personas..."
            className="h-12 rounded-full pl-11 bg-white border-gray-100 shadow-sm focus:ring-[#FF6B6B]/20 transition-all"
          />
        </div>

        <div className="sticky top-0 bg-surface z-20 py-2 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map((t) => (
              <Button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t.value ? 'gradient-primary text-white shadow-card' : 'bg-white text-muted-foreground border border-gray-100'}`}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className="inline-flex items-center rounded-full border border-border bg-white p-1 shadow-subtle">
            <button
              onClick={() => setVirtual(false)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${!virtual ? 'gradient-primary text-white shadow-card' : 'text-muted-foreground'}`}
            >
              <Camera className="h-3.5 w-3.5" /> Real
            </button>
            <button
              onClick={() => setVirtual(true)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${virtual ? 'gradient-primary text-white shadow-card' : 'text-muted-foreground'}`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Virtual
            </button>
          </div>
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#FF6B6B]" />
          <p className="text-muted-foreground font-medium animate-pulse">
            Encontrando perfiles compatibles...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
            {users.map((p) => (
              <Link
                key={p._id}
                to={`/u/${p.userId?._id || p.userId}`}
                className="group relative rounded-3xl border border-gray-100 bg-white p-6 pt-14 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Friendship Status (Top-Left) */}
                <div className="absolute top-5 left-6 z-10">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                      p.friendshipStatus === 'accepted'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}
                  >
                    {p.friendshipStatus === 'accepted' ? 'Ya sois amigos' : 'Conectar'}
                  </span>
                </div>

                {/* Affinity Badge (Floating Top-Right) */}
                <div className="absolute top-4 right-6 z-10">
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl px-3 py-1.5 border border-[#FF6B6B]/10 shadow-sm flex items-center gap-1.5 transition-transform group-hover:scale-105">
                    <Zap className="h-3.5 w-3.5 text-[#FF6B6B] fill-[#FF6B6B]" />
                    <span className="text-xs font-bold bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] bg-clip-text text-transparent">
                      {Math.round(p.compatibility?.total || 0)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div
                    className={`h-16 w-16 rounded-full p-0.5 bg-gradient-to-tr ${virtual ? 'from-[#A855F7] to-[#FF6B6B]' : 'from-gray-200 to-gray-100'}`}
                  >
                    <Avatar className="h-full w-full border-2 border-white">
                      <AvatarImage
                        src={virtual ? p.avatar : p.photo}
                        alt={p.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-400">
                        {p.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-900 truncate">@{p.username}</h3>
                      <span className="text-sm font-medium text-gray-400 shrink-0">
                        {calculateAge(p.dateOfBirth)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 mt-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <p className="text-xs font-medium truncate">
                        {p.location || 'Sin ubicación'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {p.interests?.slice(0, 3).map((i: any) => (
                      <span
                        key={i.name}
                        className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 group-hover:bg-[#FF6B6B]/5 group-hover:border-[#FF6B6B]/10 transition-colors"
                      >
                        {i.emoji} {i.name}
                      </span>
                    ))}
                    {p.interests?.length > 3 && (
                      <span className="text-xs font-bold text-gray-400 py-1.5">
                        +{p.interests.length - 3} más
                      </span>
                    )}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#FF6B6B] group-hover:text-white transition-all shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
            </div>
          )}

          {!hasMore && users.length > 0 && (
            <div className="text-center py-12 text-muted-foreground font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF6B6B]" />
              <span>Has llegado al final de los resultados</span>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No hay resultados</h3>
              <p className="text-muted-foreground max-w-[280px] mt-1">
                No hemos encontrado a nadie que coincida exactamente. Prueba con otros filtros o
                términos de búsqueda.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
