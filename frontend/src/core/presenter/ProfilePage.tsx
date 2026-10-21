import { LogOut, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { Button } from './Button';

type ProfilePageProps = {
  user: AppUser;
  onSignOut: () => void;
};

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-6 text-center">
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt="Foto de perfil"
            referrerPolicy="no-referrer"
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label="Foto de perfil"
            className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-semibold text-blue-700"
          >
            {user.name.charAt(0)}
          </div>
        )}
        <h1 className="text-lg font-semibold text-blue-700">{user.name}</h1>
        <p className="text-sm text-neutral-500">{user.email}</p>
      </section>

      <div className="space-y-3">
        {/* Nuevo botón para ir a Mis Reportes */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/mis-reportes')} 
          className="w-full flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Mis reportes de pérdida
        </Button>

        {/* Botón original de Cerrar sesión */}
        <Button 
          variant="outline" 
          onClick={onSignOut} 
          className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}