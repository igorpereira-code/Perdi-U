import { SearchCheck } from 'lucide-react';
import { APP_NAME } from '@shared/constants';

export function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500 text-blue-700">
        <SearchCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      {APP_NAME}
    </span>
  );
}
