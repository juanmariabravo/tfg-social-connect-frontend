import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function ProfilePage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-card">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <Button variant="outline" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
        <p className="text-gray-500">Perfil de usuario autenticado</p>
      </div>
    </div>
  );
}
