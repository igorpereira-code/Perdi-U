import { LogOut } from 'lucide-react';
import type { AppUser } from '@shared/user';
import { Button } from './Button';

type ProfilePageProps = {
  user: AppUser;
  onSignOut: () => void;
};

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
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
      <Button variant="outline" onClick={onSignOut} className="w-full">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Cerrar sesión
      </Button>
    </div>
  );
}
