import { useState } from 'react';
import type { PublishResult } from '@shared/matching';
import { Button } from '../../core/presenter/Button';
import type { MatchesService } from '../data/matchesService';
import { matchCountText } from '../logic/matchCountText';

type PublishButtonProps = {
  itemCode: string;
  matchesService: MatchesService;
  onPublished?: () => void;
};

/** "Publicar" button for Bienestar's panel (Chiqui). It publishes the item and shows the result. */
export function PublishButton({ itemCode, matchesService, onPublished }: PublishButtonProps) {
  const [result, setResult] = useState<PublishResult | null>(null);

  async function handlePublish() {
    const nextResult = await matchesService.publish(itemCode);
    setResult(nextResult);
    if (nextResult.status === 'PUBLISHED') {
      onPublished?.();
    }
  }

  if (result?.status === 'PUBLISHED') {
    return (
      <div
        role="status"
        className="space-y-1 rounded-xl bg-success-50 p-2 text-sm text-success-700"
      >
        <p className="font-medium">Publicado: la comunidad ya puede ver este objeto.</p>
        <p>{matchCountText(result.matchCount)}</p>
      </div>
    );
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
