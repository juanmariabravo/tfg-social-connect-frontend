import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthBranding } from '@/components/AuthBranding';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/services/api';
import { DatePicker } from '@/components/ui/DatePicker';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: null as Date | null,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }
    if (!formData.password) {
      setError('La contraseña es obligatoria');
      return;
    }
    if (!formData.dateOfBirth) {
      setError('Por favor selecciona tu fecha de nacimiento');
      return;
    }
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const { data } = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth.toISOString().split('T')[0],
      });
      login(data.token, data.user);
      navigate('/profile');
    } catch (err) {
      const message = err.response?.data?.error?.toLowerCase() || '';

      if (message.includes('already registered')) {
        setError('El correo electrónico ya está en uso');
      } else if (message.includes('email') && message.includes('must be')) {
        setError('El correo electrónico no es válido');
      } else if (message.includes('password') && message.includes('at least')) {
        setError('La contraseña debe tener al menos 8 caracteres');
      } else if (message.includes('name') && message.includes('required')) {
        setError('El nombre de usuario es obligatorio');
      } else if (message.includes('email') && message.includes('empty')) {
        setError('El correo electrónico es obligatorio');
      } else if (!err.response) {
        setError('Error de conexión. Intenta más tarde.');
      } else {
        setError(err.response?.data?.error || 'Error al registrar');
      }
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[3fr_2fr] bg-white">
      <AuthBranding tagline="Empieza una nueva forma de conectar." />
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-scale-in">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
            <h1 className="text-3xl font-bold tracking-tight">Empieza a usar Social Connect</h1>
            <p className="mt-2 text-sm text-gray-500">Solo te llevará un minuto.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 rounded-lg"
                required
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 rounded-lg"
                required
              />
              <Input
                type="password"
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-12 rounded-lg"
                required
              />
              <div>
                <DatePicker
                  selected={formData.dateOfBirth}
                  onSelect={(date) => setFormData({ ...formData, dateOfBirth: date || null })}
                  placeholder="Fecha de nacimiento"
                  allowed_dates="only_past"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  placeholder="usuario"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value.replace(/\s/g, '') })
                  }
                  className="flex h-12 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus:border-[#FF6B6B] focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" variant="hero" className="w-full">
                Comenzar
              </Button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="block w-full text-center text-sm text-gray-500 hover:text-[#FF6B6B]"
              >
                Ya tengo una cuenta
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
