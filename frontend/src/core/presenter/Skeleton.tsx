import type { ReactNode } from 'react';

type SkeletonProps = {
  /** Size and shape of the block, e.g. "h-4 w-24" or "h-16 w-16 rounded-xl". */
  className?: string;
};

/** A gray block that pulses where some content will appear. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-lg bg-neutral-200 ${className}`} />
  );
}

type SkeletonAreaProps = {
  /** What is loading, read by screen readers, e.g. "Cargando tus avisos…". */
  label: string;
  children: ReactNode;
};

/** Wraps the skeleton of a screen or a list, so screen readers know it is loading. */
export function SkeletonArea({ label, children }: SkeletonAreaProps) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** The shape of an item card: photo, code and description. */
export function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

type SkeletonListProps = {
  /** How many rows to show. */
  rows?: number;
  label?: string;
};

/** The shape of a list or a table while it loads. */
export function SkeletonList({ rows = 3, label = 'Cargando…' }: SkeletonListProps) {
  return (
    <SkeletonArea label={label}>
      <ul className="space-y-3">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <li
            key={rowIndex}
            className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
          >
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    </SkeletonArea>
  );
}
