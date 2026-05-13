import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/textarea";
import { PersonalityChart } from "../components/PersonalityChart";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { EMOJIS, INTERESTS } from "../lib/data";
import { Camera, Sparkles, Pencil, X, Check, Plus, Loader2 } from "lucide-react";
import { getGravatarUrl } from "../lib/gravatar";
import api from "../services/api";


export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; bio?: string }>({});
  
  const [photoView, setPhotoView] = useState<"real" | "virtual">("real");
  const [realPhoto, setRealPhoto] = useState<string>("");
  const [virtualPhoto, setVirtualPhoto] = useState<string>("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [personality, setPersonality] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [customInterest, setCustomInterest] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id) {
        setError("No se encontró el usuario");
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/profiles/${user._id}`);
        if (data) {
          setName(data.displayName || user.name || "");
          setBio(data.bio || "");
          setLocation("");
          setInterests(data.interests?.map((i: any) => i.emoji ? `${i.emoji} ${i.name}` : i.name) || []);
          setPersonality(data.personality || null);
          setRealPhoto(data.photo || "");
          setVirtualPhoto(data.avatar || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Error al cargar el perfil");
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
      const interestsPayload = (updatedInterests || interests).map(i => {
        // Si el interés está definido en INTERESTS (default) o en los intereses actuales, extraemos el emoji y el nombre
        if (interests.includes(i) || INTERESTS.includes(i)) {
          const parts = i.split(" ");
          const emoji = parts[0];
          const name = parts.slice(1).join(" ") || i;
          return { name, emoji };
        }
        // Si el interés es nuevo y personalizado, intentamos extraer un emoji si el usuario lo incluyó al inicio
        const hasEmoji = i.match(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
        if (hasEmoji) {
          const emoji = hasEmoji[0];
          const index = hasEmoji.index;
          const name = i.slice(index + emoji.length).trim();
          return { name: name, emoji: emoji };
        }
        // Si no se encuentra un emoji, asignamos uno aleatorio
        return { name: i, emoji: getRandomEmoji() };
      });

      await api.put(`/profiles/${user._id}`, {
        displayName: name,
        bio,
        interests: interestsPayload,
      });
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Error al guardar los cambios");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const validateProfile = (): boolean => {
    if (!name.trim()) return false;
    if (name.trim().length < 2) return false;
    if (name.trim().length > 50) return false;
    if (bio.length > 500) return false;
    return true;
  };

  const handleSave = async () => {
    // Validación preventiva: si ya está guardando, salir
    if (saving) return;

    // Validar nombre
    const newFieldErrors: { name?: string; bio?: string } = {};

    if (!name.trim()) {
      newFieldErrors.name = "El nombre es obligatorio";
    } else if (name.trim().length < 2) {
      newFieldErrors.name = "El nombre debe tener al menos 2 caracteres";
    } else if (name.trim().length > 50) {
      newFieldErrors.name = "El nombre no puede exceder 50 caracteres";
    }

    // Validar biografía
    if (bio.length == 0) {
      newFieldErrors.bio = "La biografía es obligatoria";
    } else if (bio.length > 500) {
      newFieldErrors.bio = "La biografía no puede exceder 500 caracteres";
    }

    // Si hay errores de validación, mostrarlos y no guardar
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("");
      return;
    }

    // Si no hay errores de validación, limpiar y intentar guardar
    setFieldErrors({});
    setError("");
    
    // Solo si la validación pasó, hacer la petición
    const success = await updateProfile();
    if (success) {
      setEditing(false);
    }
  };

  const activeColor = (photoView === "real" ? "linear-gradient(135deg,#FF6B6B,#A855F7)" : "linear-gradient(135deg,#4ECDC4,#A855F7)");

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
      setCustomInterest("");
    }
  };

  const remainingInterests = INTERESTS.filter((i) => !interests.includes(i));

  const getAgeFromDateOfBirth = () => {
    if (!user?.dateOfBirth) return "";
    const birth = new Date(user.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const traits = personality ? [
    { trait: "Extroversión", value: personality.extroversion * 10 },
    { trait: "Apertura", value: personality.openness * 10 },
    { trait: "Responsabilidad", value: personality.conscientiousness * 10 },
    { trait: "Amabilidad", value: personality.agreeableness * 10 },
    { trait: "Estabilidad", value: personality.neuroticism * 10 },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
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
                    photoView === "real"
                      ? realPhoto
                        ? realPhoto
                        : getGravatarUrl(user?.email || "", 200)
                      : virtualPhoto
                        ? virtualPhoto
                        : getGravatarUrl(user?.email || "", 200)
                  }
                  alt={photoView === "real" ? "Foto real" : "Foto virtual"}
                />
                <AvatarFallback
                  className={`bg-gradient-to-r ${
                    photoView === "real"
                      ? "from-[#FF6B6B] to-[#A855F7]"
                      : "from-[#4ECDC4] to-[#A855F7]"
                  } text-white`}
                >
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="absolute -bottom-1 -right-1 inline-flex rounded-full bg-white border border-gray-200 p-0.5 shadow-lg">
                <button
                  onClick={() => setPhotoView("real")}
                  aria-label="Foto real"
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${photoView === "real" ? "bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] text-white" : "text-gray-400"}`}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPhotoView("virtual")}
                  aria-label="Foto virtual"
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${photoView === "virtual" ? "bg-gradient-to-r from-[#FF6B6B] to-[#A855F7] text-white" : "text-gray-400"}`}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Button
              variant={editing ? "hero" : "outline"}
              size="sm"
              className="h-10 rounded-lg"
              disabled={saving || (editing && !validateProfile())}
              onClick={editing ? handleSave : () => {
                setEditing(true);
                setFieldErrors({});
                setError("");
              }}
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

          <div className="mt-5">
            {editing ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        // Limpiar error del nombre cuando el usuario empieza a escribir
                        if (fieldErrors.name) {
                          setFieldErrors({ ...fieldErrors, name: undefined });
                        }
                      }}
                      className="h-11 rounded-lg flex-1"
                      placeholder="Nombre"
                      required
                    />
                    {fieldErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                </div>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 rounded-lg"
                  placeholder="Ubicación"
                />
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
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">
                  {name || user?.name || "Usuario"}, {age || getAgeFromDateOfBirth()}
                </h1>
                {location && <p className="text-sm text-gray-500">📍 {location}</p>}
                {bio && <p className="mt-3 text-sm leading-relaxed">{bio}</p>}
              </>
            )}
          </div>
        </div>
      </div>

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
                onKeyDown={(e) => e.key === "Enter" && addCustomInterest()}
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
            <p className="text-sm text-gray-400">Completa el test de personalidad para ver tus resultados.</p>
          )}
        </div>
      </section>
    </div>
  );
}