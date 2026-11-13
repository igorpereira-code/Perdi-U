import { useCallback } from 'react';
import { CircleCheck, PackageSearch, SearchX, type LucideIcon } from 'lucide-react';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { StatisticsService } from '../data/statisticsService';

type StatisticsSectionProps = {
  statisticsService: StatisticsService;
};

type StatisticTileProps = {
  icon: LucideIcon;
  label: string;
  amount: number;
};

function StatisticTile({ icon: Icon, label, amount }: StatisticTileProps) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
      <Icon className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" />
      <span className="flex-1 text-sm text-neutral-700">{label}</span>
      <span className="text-2xl font-semibold text-neutral-900">{amount}</span>
    </li>
  );
}

/** How many items were found, lost and returned with Perdi-U. */
export function StatisticsSection({ statisticsService }: StatisticsSectionProps) {
  const loadStatistics = useCallback(() => statisticsService.getStatistics(), [statisticsService]);
  const { data: usage, hasFailed, retry } = useLoadedData(loadStatistics);

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudieron cargar las estadísticas. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (usage === undefined) {
    return <SkeletonList rows={3} label="Cargando estadísticas…" />;
  }
  return (
    <ul aria-label="Estadísticas" className="space-y-3">
      <StatisticTile icon={PackageSearch} label="Objetos encontrados" amount={usage.foundItems} />
      <StatisticTile icon={SearchX} label="Objetos perdidos" amount={usage.lostReports} />
      <StatisticTile icon={CircleCheck} label="Objetos entregados" amount={usage.deliveredItems} />
    </ul>
  );
}
