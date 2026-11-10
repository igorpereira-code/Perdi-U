import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'outline' | 'ghost' | 'accent';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** While true, the button is disabled and shows a spinner, so the user knows the app is working. */
  isLoading?: boolean;
  /** Text shown while loading, e.g. "Enviando reporte…". Without it, the normal text stays. */
  loadingText?: string;
};

const BASE_CLASSES =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98]';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-blue-500 text-neutral-0 hover:bg-blue-700',
  outline: 'border border-neutral-300 bg-neutral-0 text-blue-700 hover:bg-blue-50',
  ghost: 'text-blue-500 hover:bg-blue-50',
  accent: 'bg-yellow-500 text-blue-700 hover:brightness-95',
};

export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  isLoading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${
        isLoading ? 'cursor-progress opacity-80' : 'disabled:cursor-not-allowed disabled:opacity-50'
      } ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
