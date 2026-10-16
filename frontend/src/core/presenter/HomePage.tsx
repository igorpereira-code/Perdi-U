import type { AppUser } from '@shared/user';

export function HomePage({ user }: { user: AppUser }) {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold text-blue-700">Hola, {user.name}</h1>
      <p className="text-sm text-neutral-500">¿Lo perdi-U? ¡Lo encontr-U!</p>
    </div>
  );
}
