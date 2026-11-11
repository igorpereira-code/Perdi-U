import { useState } from 'react';
import type { PublishResult } from '@shared/matching';
import { Button } from '../../core/presenter/Button';
import type { MatchesService } from '../data/matchesService';
import { formatMatchCount } from '../logic/formatMatchCount';

type PublishButtonProps = {
  itemCode: string;
  matchesService: MatchesService;
  onPublished?: () => void;
};

/** "Publicar" button for Bienestar's panel (Chiqui). It publishes the item and shows the result. */
export function PublishButton({ itemCode, matchesService, onPublished }: PublishButtonProps) {
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function handlePublish() {
    setIsPublishing(true);
    setHasFailed(false);
    try {
      const newPublishResult = await matchesService.publish(itemCode);
      setPublishResult(newPublishResult);
      if (newPublishResult.status === 'PUBLISHED') {
        onPublished?.();
      }
    } catch {
      setHasFailed(true);
    } finally {
      setIsPublishing(false);
    }
  }

  if (publishResult?.status === 'PUBLISHED') {
    return (
      <div
        role="status"
        className="space-y-1 rounded-xl bg-success-50 p-2 text-sm text-success-700"
      >
        <p className="font-medium">Publicado: la comunidad ya puede ver este objeto.</p>
        <p>{formatMatchCount(publishResult.matchCount)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={handlePublish} isLoading={isPublishing} loadingText="Publicando…">
        Publicar
      </Button>
      {publishResult?.status === 'NOT_RECEIVED' && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          Este objeto todavía no fue recibido en Bienestar. Primero confirma que lo recibiste.
        </p>
      )}
      {hasFailed && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          No se pudo publicar. Intenta nuevamente.
        </p>
      )}
    </div>
  );
}
