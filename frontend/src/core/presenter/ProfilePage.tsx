import { useState } from 'react';
import { LogOut } from 'lucide-react';
import type { AppUser } from '@shared/user';
import { Button } from './Button';

type ProfilePageProps = {
  user: AppUser;
  onSignOut: () => void | Promise<void>;
};

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    setHasFailed(false);
    try {
      await onSignOut();
    } catch {
      setHasFailed(true);
      setIsSigningOut(false);
    }
  }

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
      {hasFailed && (
        <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
          No se pudo cerrar la sesión. Intenta nuevamente.
        </p>
      )}
      <Button
        variant="outline"
        onClick={handleSignOut}
        isLoading={isSigningOut}
        loadingText="Cerrando sesión…"
        className="w-full"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Cerrar sesión
      </Button>
    </div>
  );
}
