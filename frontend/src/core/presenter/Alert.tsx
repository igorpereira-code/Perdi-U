import type { ReactNode } from 'react';

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-blue-700"
    >
      {children}
    </div>
  );
}
