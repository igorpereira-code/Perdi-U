import { useState } from 'react';
import type { PublishResult } from '@shared/matching';
import { Button } from '../../core/presenter/Button';
import type { MatchesService } from '../data/matchesService';
import { formatMatchCount } from '../logic/formatMatchCount';

type PublishButtonProps = {
  itemCode: string;
  matchesService: MatchesService;
  onPublished?: (result: Extract<PublishResult, { status: 'PUBLISHED' }>) => void;
};

/** "Publicar" button for Bienestar's panel (Chiqui). It publishes the item and shows the result. */
export function PublishButton({ itemCode, matchesService, onPublished }: PublishButtonProps) {
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [visibility, setVisibility] = useState<'VISIBLE' | 'HIDDEN'>('VISIBLE');

  async function handlePublish() {
    setIsPublishing(true);
    setHasFailed(false);
    try {
      const newPublishResult = await matchesService.publish(itemCode, visibility);
      setPublishResult(newPublishResult);
      if (newPublishResult.status === 'PUBLISHED') {
        onPublished?.(newPublishResult);
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
        <p className="font-medium">
          {publishResult.visibility === 'VISIBLE'
            ? 'Publicado: la comunidad ya puede ver este objeto.'
            : 'Publicado como oculto para la comunidad. Solo Bienestar y las coincidencias pueden verlo.'}
        </p>
        <p>{formatMatchCount(publishResult.matchCount)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">
        Visibilidad
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as 'VISIBLE' | 'HIDDEN')}
          disabled={isPublishing}
          className="mt-1 block min-h-11 w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3"
        >
          <option value="VISIBLE">Visible para la comunidad</option>
          <option value="HIDDEN">Oculto para la comunidad</option>
        </select>
      </label>
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
