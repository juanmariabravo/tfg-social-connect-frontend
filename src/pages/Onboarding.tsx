import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import PhotoManagementModal from '@/components/PhotoUploadModal';
import { Camera, Sparkles, Loader2, ChevronLeft, Crosshair } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { INTERESTS, EMOJIS, QUESTIONS } from '@/lib/data';
import { PersonalityChart } from '@/components/PersonalityChart';
import { getGravatarUrl } from '@/lib/gravatar';
import { getCurrentLocation, reverseGeocode } from '@/services/geocoding';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Profile State
  const [realPhoto, setRealPhoto] = useState('');
  const [virtualPhoto, setVirtualPhoto] = useState('');
  const [userName, setUserName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    location?: string;
    bio?: string;
  }>({});

  // Step 2: Interests State
  const [pickedInterests, setPickedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  // Step 3: Personality State
  const [personalityStep, setPersonalityStep] = useState(0);
  const [personalityAnswers, setPersonalityAnswers] = useState<number[]>([]);
  const [personalityDone, setPersonalityDone] = useState(false);
  const personalityTotal = QUESTIONS.slice(0, 5).length;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id) return;
      try {
        const { data } = await api.get(`/profiles/${user._id}`);
        if (data) {
          setUserName(data.username || '');
          setBio(data.bio || '');
          setRealPhoto(data.photo || '');
          setVirtualPhoto(data.avatar || '');
          setLocation(data.location || '');
          if (data.interests) {
            const interestsStrings = data.interests.map((i: any) =>
              i.emoji ? `${i.emoji} ${i.name}` : i.name
            );
            setPickedInterests(interestsStrings);
          }

          // Determinar en qué paso empezar si ya hay datos
          if (userName && location && bio && (!data.interests || data.interests.length < 3)) {
            setStep(2);
          } else if (data.interests && data.interests.length >= 3) {
            setStep(3);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // --- Step 1 Actions ---
  const handleDetectLocation = async () => {
    setGeolocating(true);
    setError('');
    try {
      const coords = await getCurrentLocation();
      const city = await reverseGeocode(coords.lat, coords.lng);
      setLocation(city);
      // Limpiar error de ubicación si existía
      if (profileErrors.location) {
        setProfileErrors((prev) => ({ ...prev, location: undefined }));
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo obtener la ubicación');
    } finally {
      setGeolocating(false);
    }
  };

  const validateProfile = (): boolean => {
    const newErrors: { name?: string; bio?: string; location?: string } = {};
    if (!userName.trim()) newErrors.name = 'El nombre es obligatorio';
    else if (userName.trim().length < 2) newErrors.name = 'Mínimo 2 caracteres';

    if (!location.trim()) newErrors.location = 'La ubicación es obligatoria';
    else if (location.trim().length > 100) newErrors.location = 'Máximo 100 caracteres';

    if (!bio.trim()) newErrors.bio = 'La biografía es obligatoria';
    else if (bio.length > 500) newErrors.bio = 'Máximo 500 caracteres';
    // console.log('Profile validation errors:', newErrors);
    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileContinue = async () => {
    if (!validateProfile()) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/profiles/${user?._id}`, {
        username: userName.trim(),
        bio: bio.trim(),
        photo:
          realPhoto ||
          'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
        avatar: virtualPhoto || getGravatarUrl(user?.email || '', 200),
        location: location.trim(),
      });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  // --- Step 2 Actions ---
  const toggleInterest = (i: string) =>
    setPickedInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  const addCustomInterest = () => {
    const v = customInterest.trim();
    if (!v) return;
    const hasEmoji = v.match(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
    const tag = hasEmoji ? v : `${getRandomEmoji()} ${v}`;
    if (!pickedInterests.includes(tag)) setPickedInterests([...pickedInterests, tag]);
    setCustomInterest('');
  };

  const handleInterestsContinue = async () => {
    if (pickedInterests.length < 3) return;
    setSaving(true);
    setError('');
    try {
      const interestsPayload = pickedInterests.map((i) => {
        const parts = i.split(' ');
        const emoji = parts[0];
        const name = parts.slice(1).join(' ') || i;
        return { name, emoji };
      });
      await api.put(`/profiles/${user?._id}`, { interests: interestsPayload });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar intereses');
    } finally {
      setSaving(false);
    }
  };

  // --- Step 3 Actions ---
  const answerPersonality = (v: number) => {
    const next = [...personalityAnswers, v];
    setPersonalityAnswers(next);
    if (personalityStep + 1 < personalityTotal) setPersonalityStep(personalityStep + 1);
    else setPersonalityDone(true);
  };

  const handleOnboardingComplete = async () => {
    setSaving(true);
    setError('');
    try {
      const personalityData = {
        extroversion: personalityAnswers[0] ? personalityAnswers[0] / 0.5 : 0.6,
        openness: personalityAnswers[1] ? personalityAnswers[1] / 0.5 : 0.6,
        conscientiousness: personalityAnswers[2] ? personalityAnswers[2] / 0.5 : 0.6,
        agreeableness: personalityAnswers[3] ? personalityAnswers[3] / 0.5 : 0.6,
        neuroticism: personalityAnswers[4] ? personalityAnswers[4] / 0.5 : 0.6,
      };
      await api.put(`/profiles/${user?._id}`, {
        personality: personalityData,
        onboardingCompleted: true,
      });
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al completar onboarding');
    } finally {
      setSaving(false);
    }
  };

  const getRandomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {step > 1 && !saving && (
            <button
              onClick={() => setStep(step - 1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <Logo size="sm" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Paso {step} de 3
          </span>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 w-6 rounded-full transition-colors ${s <= step ? 'bg-[#FF6B6B]' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error === '"bio" is not allowed to be empty' ? 'La biografía es obligatoria.' : error}
          </div>
        )}

        {/* --- STEP 1: PROFILE --- */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold">Completa tu perfil</h1>
            <p className="mt-2 text-gray-600">Dinos un poco sobre ti para empezar.</p>

            <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
                Tus fotos
              </h2>
              <div className="flex gap-8">
                {[
                  { label: 'Foto real', val: realPhoto, icon: Camera, color: 'bg-[#FF6B6B]' },
                  {
                    label: 'Avatar virtual',
                    val: virtualPhoto,
                    icon: Sparkles,
                    color: 'bg-[#4ECDC4]',
                  },
                ].map((p, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.color}`} />
                      {p.label}
                    </div>
                    <div className="rounded-full overflow-hidden border-4 border-white bg-white shadow-sm h-28 w-28 flex items-center justify-center">
                      {p.val ? (
                        <img src={p.val} className="w-full h-full object-cover" />
                      ) : (
                        <p.icon className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-6 w-full bg-white"
                onClick={() => setPhotoModalOpen(true)}
              >
                Añadir fotos de perfil (real y virtual)
              </Button>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value.replace(/\s/g, ''))}
                  className="h-11"
                  placeholder="Cómo quieres que te llamen"
                />
                {profileErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{profileErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                <div className="relative">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 pr-12"
                    placeholder="Dónde vives o tu ciudad favorita"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={geolocating}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B6B] transition-colors disabled:opacity-50"
                    title="Detectar ubicación actual"
                  >
                    {geolocating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Crosshair className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {profileErrors.location && (
                  <p className="text-red-500 text-xs mt-1">{profileErrors.location}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sobre ti</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-24"
                  placeholder="Tus aficiones, metas..."
                />
                {profileErrors.bio && (
                  <p className="text-red-500 text-xs mt-1">{profileErrors.bio}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1 text-right">{bio.length}/500</p>
              </div>
            </div>

            <Button
              variant="hero"
              className="mt-10 w-full h-12 text-lg"
              onClick={handleProfileContinue}
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin" /> : 'Continuar'}
            </Button>
          </div>
        )}

        {/* --- STEP 2: INTERESTS --- */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className="text-3xl font-bold">¿Qué te apasiona?</h1>
            <p className="mt-2 text-gray-600">
              Selecciona al menos 3 para encontrar personas afines.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[...INTERESTS, ...pickedInterests.filter((p) => !INTERESTS.includes(p))].map((i) => {
                const isSelected = pickedInterests.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] text-white border-transparent shadow-md scale-105'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF6B6B] hover:text-[#FF6B6B]'
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex gap-2">
              <Input
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Añade otro..."
                className="h-11"
                onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
              />
              <Button variant="outline" onClick={addCustomInterest}>
                Añadir
              </Button>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                {pickedInterests.length} seleccionados
              </span>
              <Button
                variant="hero"
                disabled={pickedInterests.length < 3 || saving}
                onClick={handleInterestsContinue}
                className="px-8"
              >
                {saving ? <Loader2 className="animate-spin" /> : 'Siguiente'}
              </Button>
            </div>
          </div>
        )}

        {/* --- STEP 3: PERSONALITY --- */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {!personalityDone ? (
              <>
                <h1 className="text-3xl font-bold">Test de Personalidad</h1>
                <p className="mt-2 text-gray-600">Poco a poco te conoceremos mejor.</p>

                <div className="mt-10">
                  <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-tighter">
                    <span>Pregunta {personalityStep + 1}</span>
                    <span>{Math.round((personalityStep / personalityTotal) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden mb-8">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] transition-all duration-500"
                      style={{ width: `${(personalityStep / personalityTotal) * 100}%` }}
                    />
                  </div>

                  <h2 className="text-2xl font-bold leading-tight mb-10">
                    {QUESTIONS[personalityStep]?.text}
                  </h2>

                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => answerPersonality(v)}
                        className="aspect-square rounded-2xl border-2 border-gray-200 bg-white text-xl font-black text-gray-400 transition-all hover:scale-110 hover:border-[#FF6B6B] hover:text-[#FF6B6B] active:scale-95"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>En desacuerdo</span>
                    <span>De acuerdo</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] text-4xl shadow-xl mb-6">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold">¡Casi estamos!</h1>
                <p className="mt-2 text-gray-600">Este es un avance de tu perfil psicológico.</p>

                <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl shadow-[#FF6B6B]/5">
                  <PersonalityChart
                    data={personalityAnswers.map((a, i) => ({
                      trait: QUESTIONS[i].trait,
                      value: (a / 5) * 100,
                    }))}
                  />
                </div>

                <Button
                  variant="hero"
                  className="mt-10 w-full h-14 text-xl shadow-lg shadow-[#FF6B6B]/20"
                  onClick={handleOnboardingComplete}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin" /> : 'Empezar ahora'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <PhotoManagementModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onSave={(r, v) => {
          if (r) setRealPhoto(r);
          if (v) setVirtualPhoto(v);
          setPhotoModalOpen(false);
        }}
        currentRealPhoto={realPhoto}
        currentVirtualPhoto={virtualPhoto}
      />
    </div>
  );
}
