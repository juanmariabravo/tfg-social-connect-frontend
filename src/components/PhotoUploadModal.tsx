import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { X, Upload, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface PhotoManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (realPhotoUrl: string | null, virtualPhotoUrl: string | null) => void;
  currentRealPhoto?: string;
  currentVirtualPhoto?: string;
}

const PHOTO_LIMITS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxSizeMB: 5,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
};

export default function PhotoManagementModal({
  isOpen,
  onClose,
  onSave,
  currentRealPhoto = '',
  currentVirtualPhoto = '',
}: PhotoManagementModalProps) {
  const [realPhotoUrl, setRealPhotoUrl] = useState(currentRealPhoto);
  const [virtualPhotoUrl, setVirtualPhotoUrl] = useState(currentVirtualPhoto);
  const [realPhotoPreview, setRealPhotoPreview] = useState(currentRealPhoto);
  const [virtualPhotoPreview, setVirtualPhotoPreview] = useState(currentVirtualPhoto);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ real?: string; virtual?: string }>({});

  // Sincronizar estado con props cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setRealPhotoUrl(currentRealPhoto);
      setVirtualPhotoUrl(currentVirtualPhoto);
      setRealPhotoPreview(currentRealPhoto);
      setVirtualPhotoPreview(currentVirtualPhoto);
      setErrors({});
    }
  }, [isOpen, currentRealPhoto, currentVirtualPhoto]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'real' | 'virtual') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    if (file.size > PHOTO_LIMITS.maxSize) {
      setErrors({
        ...errors,
        [type]: `La imagen supera los ${PHOTO_LIMITS.maxSizeMB}MB`,
      });
      return;
    }

    // Validar formato
    if (!PHOTO_LIMITS.allowedFormats.includes(file.type)) {
      setErrors({
        ...errors,
        [type]: 'Formato no permitido. Usa JPG, PNG o WebP',
      });
      return;
    }

    // Crear URL local para vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'real') {
        setRealPhotoUrl(dataUrl);
        setRealPhotoPreview(dataUrl);
      } else {
        setVirtualPhotoUrl(dataUrl);
        setVirtualPhotoPreview(dataUrl);
      }
      setErrors({ ...errors, [type]: undefined });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'real' | 'virtual') => {
    const url = e.target.value;
    if (type === 'real') {
      setRealPhotoUrl(url);
    } else {
      setVirtualPhotoUrl(url);
    }
    setErrors({ ...errors, [type]: undefined });

    // Validar URL
    if (url.trim()) {
      const img = new Image();
      img.onload = () => {
        if (type === 'real') {
          setRealPhotoPreview(url);
        } else {
          setVirtualPhotoPreview(url);
        }
        setErrors({ ...errors, [type]: undefined });
      };
      img.onerror = () => {
        setErrors({ ...errors, [type]: 'La URL de la imagen no es válida' });
        if (type === 'real') {
          setRealPhotoPreview('');
        } else {
          setVirtualPhotoPreview('');
        }
      };
      img.src = url;
    } else {
      if (type === 'real') {
        setRealPhotoPreview('');
      } else {
        setVirtualPhotoPreview('');
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(realPhotoUrl || null, virtualPhotoUrl || null);
      onClose();
      setErrors({});
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const generateRandomAvatar = () => {
    const randomSeed =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${randomSeed}`;

    // Validar que la imagen cargue correctamente
    const img = new Image();
    img.onload = () => {
      setVirtualPhotoUrl(avatarUrl);
      setVirtualPhotoPreview(avatarUrl);
      setErrors({ ...errors, virtual: undefined });
    };
    img.onerror = () => {
      setErrors({ ...errors, virtual: 'Error al generar el avatar' });
    };
    img.src = avatarUrl;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="rounded-2xl bg-white shadow-xl border border-gray-200 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div>
              <h2 className="text-xl font-bold">Gestionar fotos de perfil</h2>
              <p className="text-sm text-gray-500 mt-1">Personaliza tu foto real y virtual</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">
            {/* Foto Real */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
                <h3 className="text-lg font-semibold">Foto Real</h3>
              </div>
              <p className="text-sm text-gray-600">
                Una foto tuya auténtica. Máximo {PHOTO_LIMITS.maxSizeMB}MB. Formatos: JPG, PNG, WebP
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vista previa circular */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Vista previa</label>
                  <div className="flex justify-center">
                    <div className="rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center h-48 w-48">
                      {realPhotoPreview ? (
                        <img
                          src={realPhotoPreview}
                          alt="Foto real"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Sin foto</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controles de carga */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Cargar desde archivo
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e, 'real')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#FF6B6B] file:to-[#A855F7] file:text-white hover:file:opacity-90"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      O ingresa una URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/foto.jpg"
                      value={realPhotoUrl}
                      onChange={(e) => handleUrlChange(e, 'real')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  {errors.real && (
                    <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-600 text-sm">{errors.real}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200" />

            {/* Foto Virtual */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#4ECDC4]" />
                <h3 className="text-lg font-semibold">Foto Virtual</h3>
              </div>
              <p className="text-sm text-gray-600">
                Un avatar o foto artística. Máximo {PHOTO_LIMITS.maxSizeMB}MB. Formatos: JPG, PNG,
                WebP
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vista previa circular */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Vista previa</label>
                  <div className="flex justify-center">
                    <div className="rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center h-48 w-48">
                      {virtualPhotoPreview ? (
                        <img
                          src={virtualPhotoPreview}
                          alt="Foto virtual"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Sin foto</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controles de carga */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Cargar desde archivo
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e, 'virtual')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#4ECDC4] file:to-[#A855F7] file:text-white hover:file:opacity-90"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      O ingresa una URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/avatar.jpg"
                      value={virtualPhotoUrl}
                      onChange={(e) => handleUrlChange(e, 'virtual')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    onClick={generateRandomAvatar}
                    disabled={loading}
                    variant="secondary"
                    className="w-full mt-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generar avatar aleatorio
                  </Button>

                  {errors.virtual && (
                    <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-600 text-sm">{errors.virtual}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl sticky bottom-0">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleSave}
              disabled={loading || (!realPhotoUrl && !virtualPhotoUrl)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Guardar fotos
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
