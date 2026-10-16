import type { AppUser } from '@shared/user';
import { Logo } from './Logo';

export function HomePage({ user }: { user: AppUser }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-blue-700 px-4 py-3 text-neutral-0">
        <Logo />
      </header>
      <main className="space-y-1 p-4">
        <h1 className="text-xl font-semibold text-blue-700">Hola, {user.name}</h1>
        <p className="text-sm text-neutral-500">¿Lo perdi-U? ¡Lo encontr-U!</p>
      </main>
    </div>
  );
}
