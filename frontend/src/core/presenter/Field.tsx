import type { ReactNode } from 'react';

type FieldProps = {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
};

/** Classes for inputs, selects and textareas, so every form looks the same. */
export const INPUT_CLASSES =
  'w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/30';

function OptionalMark() {
  return <span className="font-normal text-neutral-500">(opcional)</span>;
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-danger-700">
      {text}
    </p>
  );
}

export function Field({ id, label, optional = false, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label} {optional && <OptionalMark />}
      </label>
      {children}
      {error && <ErrorMessage text={error} />}
    </div>
  );
}
