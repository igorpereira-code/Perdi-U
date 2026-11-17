import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WelfarePendingPickupView } from '@shared/welfare';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import type { WelfareService } from '../data/welfareService';
import { WelfareSectionHeader } from './WelfareSectionHeader';

type PendingPickupsSectionProps = {
  welfareService: WelfareService;
  deliveredCodes: string[];
  onCountChange: (count: number) => void;
  onStartDelivery: (pickup: WelfarePendingPickupView) => void;
};

export function PendingPickupsSection({ welfareService, deliveredCodes, onCountChange, onStartDelivery }: PendingPickupsSectionProps) {
  const [pickups, setPickups] = useState<WelfarePendingPickupView[] | null>(null);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    setHasError(false);
    setPickups(null);
    try {
      const loaded = await welfareService.listPendingPickups();
      setPickups(loaded);
      onCountChange(loaded.length);
    } catch {
      setHasError(true);
    }
  }, [onCountChange, welfareService]);

  useEffect(() => {
    void load();
  }, [load]);

  const visiblePickups = useMemo(
    () => pickups?.filter((pickup) => !deliveredCodes.includes(pickup.foundItem.code)),
    [deliveredCodes, pickups],
  );

  useEffect(() => {
    if (visiblePickups) {
      onCountChange(visiblePickups.length);
    }
  }, [onCountChange, visiblePickups]);

  return (
    <>
      <WelfareSectionHeader title="Recojos pendientes" subtitle="Personas que avisaron que pasarán a recoger un objeto." />
      {hasError ? (
        <LoadErrorAlert message="No pudimos cargar los recojos pendientes" onRetry={() => void load()} />
      ) : pickups === null ? (
        <SkeletonList rows={3} label="Cargando recojos pendientes..." />
      ) : visiblePickups?.length === 0 ? (
        <EmptyState title="No hay recojos pendientes" text="Cuando alguien pulse “Pasaré a recoger”, aparecerá aquí." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visiblePickups?.map((pickup) => (
            <article key={pickup.matchId} className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
              <div>
                <strong className="text-blue-700">{pickup.owner.name}</strong>
                <p className="truncate text-sm text-neutral-500">{pickup.owner.email}</p>
              </div>
              <p className="text-sm text-neutral-700">Vendrá a recoger <b className="font-mono">{pickup.foundItem.code}</b></p>
              <p className="text-sm text-neutral-600">{pickup.foundItem.description}</p>
              <p className="text-xs text-neutral-500">Reporte: <b className="font-mono text-blue-700">{pickup.report.code}</b></p>
              <Button onClick={() => onStartDelivery(pickup)} className="w-full">Registrar entrega</Button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
