import { useCallback, useState } from 'react';
import { CircleCheck, PackageSearch, SearchX, type LucideIcon } from 'lucide-react';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { StatisticsService } from '../data/statisticsService';
import { getDateRangeError } from '../logic/getDateRangeError';

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

type DateRangeFieldsProps = {
  from: string;
  to: string;
  onChangeFrom: (from: string) => void;
  onChangeTo: (to: string) => void;
};

/** "Desde" and "Hasta". Both empty means "since Perdi-U started". */
function DateRangeFields({ from, to, onChangeFrom, onChangeTo }: DateRangeFieldsProps) {
  const error = getDateRangeError(from, to);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <Field id="statistics-from" label="Desde">
          <input
            id="statistics-from"
            type="date"
            value={from}
            onChange={(event) => onChangeFrom(event.target.value)}
            className={INPUT_CLASSES}
          />
        </Field>
        <Field id="statistics-to" label="Hasta">
          <input
            id="statistics-to"
            type="date"
            value={to}
            onChange={(event) => onChangeTo(event.target.value)}
            className={INPUT_CLASSES}
          />
        </Field>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** How many items were found, lost and returned with Perdi-U. */
export function StatisticsSection({ statisticsService }: StatisticsSectionProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const loadStatistics = useCallback(() => statisticsService.getStatistics(), [statisticsService]);
  const { data: usage, hasFailed, retry } = useLoadedData(loadStatistics);

  function renderCounts() {
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
        <StatisticTile
          icon={CircleCheck}
          label="Objetos entregados"
          amount={usage.deliveredItems}
        />
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      <DateRangeFields from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />
      {renderCounts()}
    </div>
  );
}
