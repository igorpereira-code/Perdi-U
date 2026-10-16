import { INSTITUTIONAL_EMAIL_DOMAIN } from '@shared/constants';
import { Button } from './Button';
import { Logo } from './Logo';

type LoginPageProps = {
  onGoogleLogin: () => void;
  notInstitutional?: boolean;
};

export function LoginPage({ onGoogleLogin, notInstitutional = false }: LoginPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-blue-700 px-6 text-neutral-0">
      <Logo />
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-0 p-6 text-center">
        <h1 className="text-lg font-semibold text-blue-700">Ingresa a Perdi-U</h1>
        <p className="text-sm text-neutral-500">Usa tu correo @{INSTITUTIONAL_EMAIL_DOMAIN}</p>
        {notInstitutional && (
          <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
            Solo se permiten cuentas institucionales (@{INSTITUTIONAL_EMAIL_DOMAIN}). Ingresa con tu
            correo de la universidad.
          </p>
        )}
        <Button onClick={onGoogleLogin} className="w-full">
          Ingresar con Google
        </Button>
      </div>
    </main>
  );
}
