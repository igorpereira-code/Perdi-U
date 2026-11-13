import { useState } from 'react';
import { INSTITUTIONAL_EMAIL_DOMAIN } from '@shared/constants';
import { Button } from './Button';
import { Logo } from './Logo';

type LoginPageProps = {
  onGoogleLogin: () => void | Promise<void>;
  isNotInstitutional?: boolean;
};

export function LoginPage({ onGoogleLogin, isNotInstitutional = false }: LoginPageProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function handleGoogleLogin() {
    setIsRedirecting(true);
    setHasFailed(false);
    try {
      // On success the browser goes to Google, so the button keeps loading until then.
      await onGoogleLogin();
    } catch {
      setHasFailed(true);
      setIsRedirecting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-blue-700 px-6 text-neutral-0">
      <Logo />
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-0 p-6 text-center">
        <h1 className="text-lg font-semibold text-blue-700">Ingresa a Perdi-U</h1>
        <p className="text-sm text-neutral-500">Usa tu correo @{INSTITUTIONAL_EMAIL_DOMAIN}</p>
        {isNotInstitutional && (
          <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
            Solo se permiten cuentas institucionales (@{INSTITUTIONAL_EMAIL_DOMAIN}). Ingresa con tu
            correo de la universidad.
          </p>
        )}
        {hasFailed && (
          <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
            No se pudo conectar con Google. Revisa tu conexión e intenta nuevamente.
          </p>
        )}
        <Button
          onClick={handleGoogleLogin}
          isLoading={isRedirecting}
          loadingText="Conectando con Google…"
          className="w-full"
        >
          Ingresar con Google
        </Button>
      </div>
    </main>
  );
}
