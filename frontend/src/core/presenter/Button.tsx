import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'accent';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-500 text-neutral-0 hover:bg-blue-700',
  outline: 'border border-neutral-300 bg-neutral-0 text-blue-700 hover:bg-blue-50',
  ghost: 'text-blue-500 hover:bg-blue-50',
  accent: 'bg-yellow-500 text-blue-700 hover:brightness-95',
};

export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}
