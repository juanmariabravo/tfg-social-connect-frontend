import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MapPin, Calendar, Check, X, Send, Sparkles } from 'lucide-react';
import { planService } from '@/services/social';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      avatar?: string;
      photo?: string;
    };
  };
  text: string;
  createdAt: string;
}

interface Plan {
  _id: string;
  creator: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      avatar?: string;
      photo?: string;
    };
  };
  title: string;
  description: string;
  emojiIcon: string;
  datetime: string;
  location: string;
  attendees: string[];
  reactions: Record<string, string[]>;
  comments: Comment[];
  chatId: string;
}

const REACTIONS = ['❤️', '🔥', '😂', '😢', '👏'];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    emojiIcon: '✨',
    title: '',
    description: '',
    datetime: '',
    location: '',
  });
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const ME = user?.id || '';

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await planService.getPlans();
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const toggleJoin = async (planId: string) => {
    try {
      const res = await planService.joinPlan(planId);
      // Update local state by replacing the plan with the updated one from backend
      setPlans((ps) =>
        ps.map((p) => (p._id === planId ? { ...p, attendees: res.data.attendees } : p))
      );
    } catch (error) {
      console.error('Error joining plan:', error);
    }
  };

  const react = async (planId: string, emoji: string) => {
    try {
      const res = await planService.reactToPlan(planId, emoji);
      setPlans((ps) =>
        ps.map((p) => (p._id === planId ? { ...p, reactions: res.data.reactions } : p))
      );
    } catch (error) {
      console.error('Error reacting to plan:', error);
    }
  };

  const addComment = async (planId: string) => {
    const text = (commentDrafts[planId] ?? '').trim();
    if (!text) return;

    try {
      const res = await planService.addComment(planId, text);
      // Backend returns the single added comment populated.
      // We need to add it to the local state.
      setPlans((ps) =>
        ps.map((p) => (p._id === planId ? { ...p, comments: [...p.comments, res.data] } : p))
      );
      setCommentDrafts((d) => ({ ...d, [planId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const createPlan = async () => {
    if (!draft.title.trim()) return;

    let validDatetime = '';
    try {
      validDatetime = new Date(draft.datetime).toISOString();
    } catch (e) {
      console.error('Invalid date');
      return;
    }

    try {
      await planService.createPlan({
        title: draft.title,
        description: draft.description,
        emojiIcon: draft.emojiIcon || '✨',
        datetime: validDatetime,
        location: draft.location || 'Por definir',
      });

      // Refetch to get the fully populated plan from backend
      await fetchPlans();

      setDraft({ emojiIcon: '✨', title: '', description: '', datetime: '', location: '' });
      setCreating(false);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const authorOf = (creatorData: Plan['creator']) => {
    if (creatorData._id === ME) return { name: 'Tú', avatar: creatorData.profile?.avatar };
    return { name: creatorData.name, avatar: creatorData.profile?.avatar };
  };

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short' }).format(
        new Date(isoString)
      );
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-sm text-muted-foreground">
            Propón un plan o únete a los de tus amigos.
          </p>
        </div>
        <Button variant="hero" className="h-11 rounded-xl" onClick={() => setCreating((c) => !c)}>
          <Plus className="h-4 w-4" /> Crear plan
        </Button>
      </div>

      {creating && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Nuevo plan</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[80px_1fr]">
            <Input
              value={draft.emojiIcon}
              onChange={(e) => setDraft({ ...draft, emojiIcon: e.target.value })}
              className="h-12 rounded-lg text-center text-2xl"
              maxLength={2}
            />
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="¿Qué propones?"
              className="h-12 rounded-lg"
            />
          </div>
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Cuenta los detalles..."
            className="mt-3 rounded-lg min-h-20"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              type="datetime-local"
              value={draft.datetime}
              onChange={(e) => setDraft({ ...draft, datetime: e.target.value })}
              placeholder="📅 Cuándo"
              className="h-11 rounded-lg"
            />
            <Input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="📍 Dónde"
              className="h-11 rounded-lg"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={createPlan}>
              Publicar plan
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {plans?.map((p) => {
          if (!p || !p.creator) return null; // Safe guard against malformed data
          const author = authorOf(p.creator);
          const meJoined = p.attendees?.includes(ME) || false;
          // Backend currently doesn't have a "declined" list, just toggle join

          return (
            <article
              key={p._id}
              className="rounded-2xl border border-border bg-card shadow-subtle overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={author.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {author.name ? author.name.substring(0, 2).toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{author.name}</span> propone un plan
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <div className="h-14 w-14 rounded-2xl gradient-soft flex items-center justify-center text-3xl shrink-0">
                    {p.emojiIcon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-tight">{p.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(p.datetime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </span>
                    </div>
                  </div>
                </div>
                {p.description && <p className="mt-3 text-sm leading-relaxed">{p.description}</p>}

                {/* Reactions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {REACTIONS.map((e) => {
                    const reactCount = p.reactions?.[e]?.length || 0;
                    const iReacted = p.reactions?.[e]?.includes(ME);
                    return (
                      <button
                        key={e}
                        onClick={() => react(p._id, e)}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:scale-110 transition-transform ${iReacted ? 'bg-primary/10 border-primary/20' : 'bg-surface border-border'}`}
                      >
                        <span>{e}</span>
                        {reactCount > 0 ? (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {reactCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* Join CTAs */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={meJoined ? 'hero' : 'outline'}
                    className="rounded-xl"
                    onClick={() => toggleJoin(p._id)}
                  >
                    <Check className="h-4 w-4" /> Me apunto{' '}
                    {p.attendees && p.attendees.length > 0 && `· ${p.attendees.length}`}
                  </Button>
                  {p.attendees && p.attendees.length > 0 && (
                    <div className="ml-auto flex -space-x-2">
                      {/* For now, just rendering generic avatars for attendees, we'd need them populated to show actual images/names */}
                      {p.attendees.slice(0, 4).map((id, index) => {
                        return (
                          <Avatar key={id} className="h-7 w-7 border-2 border-background">
                            <AvatarFallback className="bg-primary/20 text-[10px] font-medium text-primary">
                              A{index}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="border-t border-border bg-surface/50 p-4 space-y-3">
                {p.comments?.map((c) => {
                  const isMe = c.user._id === ME;
                  const authorName = isMe ? 'Tú' : c.user.name;
                  return (
                    <div key={c._id} className="flex items-start gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                          {authorName ? authorName.substring(0, 2).toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl bg-white border border-border px-3 py-2 text-sm shadow-subtle">
                        <p className="text-xs font-semibold">{authorName}</p>
                        <p>{c.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2">
                  <input
                    value={commentDrafts[p._id] ?? ''}
                    onChange={(e) =>
                      setCommentDrafts({ ...commentDrafts, [p._id]: e.target.value })
                    }
                    onKeyDown={(e) => e.key === 'Enter' && addComment(p._id)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 h-10 rounded-full bg-white border border-border px-4 outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button
                    onClick={() => addComment(p._id)}
                    className="h-10 w-10 rounded-full gradient-primary text-white flex items-center justify-center shadow-card hover:scale-105 transition-transform"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
