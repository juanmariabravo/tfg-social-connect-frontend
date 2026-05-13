import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthBranding } from '../components/AuthBranding';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }
    if (!password) {
      setError('La contraseña es obligatoria');
      return;
    }

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/profile');
    } catch (err) {
      const message = err.response?.data?.error?.toLowerCase() || '';
      if (message.includes('invalid credentials')) {
        setError('Correo electrónico o contraseña incorrectos');
      } else if (message.includes('valid email')) {
        setError('Correo electrónico no válido');
      } else if (message.includes('password') && message.includes('empty')) {
        setError('La contraseña es obligatoria');
      } else if (!err.response) {
        setError('Error de conexión. Intenta más tarde.');
      } else {
        setError(err.response?.data?.error || 'Error al iniciar sesión');
      }
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[3fr_2fr] bg-white">
      <AuthBranding tagline="Conecta de forma auténtica." />
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-scale-in">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
            <h1 className="text-3xl font-bold tracking-tight">Inicia sesión en Social Connect</h1>
            <p className="mt-2 text-sm text-gray-500">Bienvenido de nuevo. Nos alegra verte.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg"
                required
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-lg"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" variant="hero" className="w-full">
                Iniciar sesión
              </Button>
              <div className="text-center">
                <Link
                  to="#"
                  className="text-sm text-gray-500 hover:text-[#FF6B6B] transition-colors"
                >
                  ¿Has olvidado tu contraseña?
                </Link>
              </div>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-gray-400 text-sm">o</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-[#FF6B6B] text-[#FF6B6B] hover:bg-red-50"
                onClick={() => navigate('/register')}
              >
                Crear una cuenta
              </Button>
            </form>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            Al continuar aceptas los{' '}
            <Link to="#" className="text-[#FF6B6B] hover:underline">
              Términos
            </Link>{' '}
            y la{' '}
            <Link to="#" className="text-[#FF6B6B] hover:underline">
              Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
