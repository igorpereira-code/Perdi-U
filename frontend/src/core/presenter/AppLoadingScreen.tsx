import { LoaderCircle } from 'lucide-react';
import { Logo } from './Logo';

/** Shown when the app opens, while it checks if someone is signed in. */
export function AppLoadingScreen() {
  return (
    <main
      role="status"
      aria-busy="true"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-blue-700 text-neutral-0"
    >
      <Logo />
      <p className="flex items-center gap-2 text-sm text-blue-100">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando…
      </p>
    </main>
  );
}
