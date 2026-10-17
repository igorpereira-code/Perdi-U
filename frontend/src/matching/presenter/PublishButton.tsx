import { useState } from 'react';
import type { PublishResult } from '@shared/matching';
import { Button } from '../../core/presenter/Button';
import type { MatchesService } from '../data/matchesService';

type PublishButtonProps = {
  itemCode: string;
  matchesService: MatchesService;
};

/** "Publicar" button for Bienestar's panel (Chiqui). It publishes the item and shows the result. */
export function PublishButton({ itemCode, matchesService }: PublishButtonProps) {
  const [result, setResult] = useState<PublishResult | null>(null);

  async function handlePublish() {
    setResult(await matchesService.publish(itemCode));
  }

  return (
    <div className="space-y-2">
      <Button onClick={handlePublish}>Publicar</Button>
      {result?.status === 'NOT_RECEIVED' && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          Este objeto todavía no fue recibido en Bienestar. Primero confirma que lo recibiste.
        </p>
      )}
    </div>
  );
}
