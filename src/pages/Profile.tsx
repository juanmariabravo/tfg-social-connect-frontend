import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/textarea';
import { PersonalityChart } from '../components/PersonalityChart';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import PhotoManagementModal from '../components/PhotoUploadModal';
import { EMOJIS, INTERESTS } from '../lib/data';
import { Camera, Sparkles, Pencil, X, Check, Plus, Loader2 } from 'lucide-react';
import { getGravatarUrl } from '../lib/gravatar';
import api from '../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; bio?: string }>({});

  const [photoView, setPhotoView] = useState<'real' | 'virtual'>('real');
  const [realPhoto, setRealPhoto] = useState<string>('');
  const [virtualPhoto, setVirtualPhoto] = useState<string>('');
  const [username, setUserName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [personality, setPersonality] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id) {
        setError('No se encontró el usuario');
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/profiles/${user._id}`);
        if (data) {
          // Si el onboarding no está completado, redirigir
          if (!data.onboardingCompleted) {
            navigate('/onboarding', { replace: true });
            return;
          }
          setUserName(data.username || user?.username || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          setInterests(
            data.interests?.map((i: any) => (i.emoji ? `${i.emoji} ${i.name}` : i.name)) || []
          );

          setPersonality(data.personality || null);
          setRealPhoto(data.photo || '');
          setVirtualPhoto(data.avatar || '');
        }
      } catch (err) {
        setError('Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const getRandomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  const updateProfile = async (updatedInterests?: string[]): Promise<boolean> => {
    if (!user?._id) return false;
    setSaving(true);
    try {
      const interestsPayload = (updatedInterests || interests).map((i) => {
        const match = i.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
        if (match) {
          const emoji = match[0];
          const name = i.slice(emoji.length).trim();
          return { name: name || i, emoji };
        }
        return { name: i, emoji: getRandomEmoji() };
      });

      await api.put(`/profiles/${user._id}`, {
        username,
        location,
        bio,
        interests: interestsPayload,
      });
      return true;
    } catch (err) {
      setError('Error al guardar los cambios');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const validateProfile = (): boolean => {
    if (!username.trim()) return false;
    if (username.trim().length < 2) return false;
    if (username.trim().length > 50) return false;
    if (bio.length > 500) return false;
    return true;
  };

  const handleSave = async () => {
    // Validación preventiva: si ya está guardando, salir
    if (saving) return;

    // Validar nombre
    const newFieldErrors: { username?: string; bio?: string } = {};

    if (!username.trim()) {
      newFieldErrors.username = 'El nombre de usuario es obligatorio';
    } else if (username.trim().length < 2) {
      newFieldErrors.username = 'El nombre de usuario debe tener al menos 2 caracteres';
    } else if (username.trim().length > 50) {
      newFieldErrors.username = 'El nombre de usuario no puede exceder 50 caracteres';
    }

    // Validar biografía
    if (bio.length == 0) {
      newFieldErrors.bio = 'La biografía es obligatoria';
    } else if (bio.length > 500) {
      newFieldErrors.bio = 'La biografía no puede exceder 500 caracteres';
    }

    // Si hay errores de validación, mostrarlos y no guardar
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('');
      return;
    }

    // Si no hay errores de validación, limpiar y intentar guardar
    setFieldErrors({});
    setError('');

    // Solo si la validación pasó, hacer la petición
    const success = await updateProfile();
    if (success) {
      setEditing(false);
    }
  };

  const handlePhotoSave = async (realPhotoUrl: string | null, virtualPhotoUrl: string | null) => {
    if (!user?._id) {
      setError('No se encontró el usuario');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updateData: Record<string, string> = {};
      if (realPhotoUrl) updateData.photo = realPhotoUrl;
      if (virtualPhotoUrl) updateData.avatar = virtualPhotoUrl;

      if (Object.keys(updateData).length === 0) return;

      await api.put(`/profiles/${user._id}`, updateData);

      if (realPhotoUrl) setRealPhoto(realPhotoUrl);
      if (virtualPhotoUrl) setVirtualPhoto(virtualPhotoUrl);
      setPhotoModalOpen(false);
    } catch (err) {
      let errorMessage = 'Error al guardar las fotos';

      if (err instanceof Error) {
        if ('response' in err) {
          const status = (err as any).response?.status;
          if (status === 413) {
            errorMessage = 'Las imágenes son demasiado grandes. Máximo 5MB por imagen.';
          } else if (status >= 500) {
            errorMessage = 'Error en el servidor. Intenta más tarde.';
          } else {
            errorMessage = (err as any).response?.data?.message || err.message;
          }
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setPhotoModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const activeColor =
    photoView === 'real'
      ? 'linear-gradient(135deg,#FF6B6B,#A855F7)'
      : 'linear-gradient(135deg,#4ECDC4,#A855F7)';

  const removeInterest = async (i: string) => {
    const updated = interests.filter((x) => x !== i);
    setInterests(updated);
    await updateProfile(updated);
  };

  const addInterest = async (i: string) => {
    if (!interests.includes(i)) {
      const updated = [...interests, i];
      setInterests(updated);
      await updateProfile(updated);
    }
    setAdding(false);
  };

  const addCustomInterest = async () => {
    if (customInterest.trim()) {
      const newInterest = customInterest.trim();
      await addInterest(newInterest);
      setCustomInterest('');
    }
  };

  const remainingInterests = INTERESTS.filter((i) => !interests.includes(i));

  const getAgeFromDateOfBirth = () => {
    if (!user?.dateOfBirth) return '';
    const birth = new Date(user.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const traits = personality
    ? [
        { trait: 'Extroversión', value: personality.extroversion * 10 },
        { trait: 'Apertura', value: personality.openness * 10 },
        { trait: 'Responsabilidad', value: personality.conscientiousness * 10 },
        { trait: 'Amabilidad', value: personality.agreeableness * 10 },
        { trait: 'Estabilidad', value: personality.neuroticism * 10 },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg">
        <div className="h-32" style={{ background: activeColor }} />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage
                  src={
                    photoView === 'real'
                      ? realPhoto ||
                        'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
                      : virtualPhoto || getGravatarUrl(user?.email || '', 200)
                  }
                  alt={photoView === 'real' ? 'Foto real' : 'Foto virtual'}
                />
                <AvatarFallback
                  className={`bg-gradient-to-r ${
                    photoView === 'real'
                      ? 'from-[#FF6B6B] to-[#A855F7]'
                      : 'from-[#4ECDC4] to-[#A855F7]'
                  } text-white`}
                >
                  {username?.charAt(0) || 'U'}
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
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${photoView === 'virtual' ? 'bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] text-white' : 'text-gray-400'}`}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant={editing ? 'hero' : 'outline'}
                size="sm"
                className="h-10 rounded-lg"
                disabled={saving || (editing && !validateProfile())}
                onClick={
                  editing
                    ? handleSave
                    : () => {
                        setEditing(true);
                        setFieldErrors({});
                        setError('');
                      }
                }
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  <>
                    <Check className="h-4 w-4" /> Guardar
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" /> Editar perfil
                  </>
                )}
              </Button>
            </div>
          </div>
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="mt-2 text-sm text-[#FF6B6B] hover:text-[#FF6B6B]/80 hover:underline font-medium transition-colors"
          >
            Cambiar foto de perfil
          </button>

          <div className="mt-5">
            {editing ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={username}
                      onChange={(e) => {
                        setUserName(e.target.value.replace(/\s/g, ''));
                        // Limpiar error del nombre cuando el usuario empieza a escribir
                        if (fieldErrors.username) {
                          setFieldErrors({ ...fieldErrors, username: undefined });
                        }
                      }}
                      className="h-11 rounded-lg flex-1"
                      placeholder="Nombre de usuario"
                      required
                    />
                    {fieldErrors.username && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.username}</p>
                    )}
                  </div>
                </div>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 rounded-lg"
                  placeholder="Ubicación"
                />{' '}
                <div>
                  <Textarea
                    value={bio}
                    onChange={(e) => {
                      setBio(e.target.value);
                      // Limpiar error de bio cuando el usuario empieza a escribir
                      if (fieldErrors.bio) {
                        setFieldErrors({ ...fieldErrors, bio: undefined });
                      }
                    }}
                    className="rounded-lg min-h-24"
                    placeholder="Cuéntanos sobre ti..."
                    required
                  />
                  {fieldErrors.bio && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.bio}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">({bio.length}/500)</p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">
                  {username || 'Usuario'}, {getAgeFromDateOfBirth()}
                </h1>
                {location && <p className="text-sm text-gray-500">📍 {location}</p>}
                {bio && <p className="mt-3 text-sm leading-relaxed">{bio}</p>}
              </>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Intereses</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {interests.map((i) => (
            <span
              key={i}
              className="group inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 pl-3 pr-1 py-1 text-sm"
            >
              {i}
              <button
                onClick={() => removeInterest(i)}
                aria-label={`Eliminar ${i}`}
                className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setAdding((a) => !a)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-400 hover:text-[#FF6B6B] hover:border-[#FF6B6B] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir
          </button>
        </div>
        {adding && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex gap-2">
              <Input
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Interest personalizado"
                className="h-9 rounded-lg flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
              />
              <Button size="sm" onClick={addCustomInterest} className="h-9">
                Añadir
              </Button>
            </div>
            <p className="text-xs text-gray-400 mb-2">O selecciona de la lista:</p>
            <div className="flex flex-wrap gap-2">
              {remainingInterests.map((i) => (
                <button
                  key={i}
                  onClick={() => addInterest(i)}
                  className="rounded-full bg-white border border-gray-200 px-3 py-1 text-sm hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#A855F7] hover:text-white hover:border-transparent transition-all"
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Personalidad</h2>
          <Button variant="ghost" size="sm">
            Repetir test
          </Button>
        </div>
        <div className="mt-4">
          {traits.length > 0 ? (
            <PersonalityChart data={traits} />
          ) : (
            <p className="text-sm text-gray-400">
              Completa el test de personalidad para ver tus resultados.
            </p>
          )}
        </div>
      </section>

      <PhotoManagementModal
        isOpen={photoModalOpen}
        onClose={() => {
          setPhotoModalOpen(false);
        }}
        onSave={handlePhotoSave}
        currentRealPhoto={realPhoto}
        currentVirtualPhoto={virtualPhoto}
      />
    </div>
  );
}
