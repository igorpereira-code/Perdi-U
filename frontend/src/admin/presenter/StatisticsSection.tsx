import { useCallback, useState } from 'react';
import { Archive, CircleCheck, PackageSearch, SearchX, type LucideIcon } from 'lucide-react';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { StatisticsService } from '../data/statisticsService';
import { describeDateRange } from '../logic/describeDateRange';
import { getDateRangeError } from '../logic/getDateRangeError';
import { toDateRange } from '../logic/toDateRange';

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
    <div className="space-y-2 lg:max-w-md">
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

type ChosenDates = { from: string; to: string };

const NO_DATES: ChosenDates = { from: '', to: '' };

/** How many items were found, lost and returned with Perdi-U, in the chosen days. */
export function StatisticsSection({ statisticsService }: StatisticsSectionProps) {
  const [chosenDates, setChosenDates] = useState<ChosenDates>(NO_DATES);
  // The last valid dates: the counts only change when the chosen dates make sense.
  const [countedDates, setCountedDates] = useState<ChosenDates>(NO_DATES);
  const countedRange = toDateRange(countedDates.from, countedDates.to);
  const loadStatistics = useCallback(
    () => statisticsService.getStatistics(toDateRange(countedDates.from, countedDates.to)),
    [statisticsService, countedDates],
  );
  const { data: usage, hasFailed, retry } = useLoadedData(loadStatistics);

  function chooseDates(newDates: ChosenDates) {
    setChosenDates(newDates);
    if (!getDateRangeError(newDates.from, newDates.to)) {
      setCountedDates(newDates);
    }
  }

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
      <div className="space-y-3">
        <ul aria-label="Estadísticas del rango" className="grid gap-3 lg:grid-cols-3">
          <StatisticTile
            icon={PackageSearch}
            label="Objetos encontrados"
            amount={usage.foundItems}
          />
          <StatisticTile icon={SearchX} label="Objetos perdidos" amount={usage.lostReports} />
          <StatisticTile
            icon={CircleCheck}
            label="Objetos entregados"
            amount={usage.deliveredItems}
          />
        </ul>
        <h2 className="pt-2 text-sm font-semibold text-neutral-700">Hoy en Bienestar</h2>
        <ul aria-label="Objetos en custodia" className="grid gap-3 lg:grid-cols-3">
          <StatisticTile
            icon={Archive}
            label="En custodia sin reclamar"
            amount={usage.unclaimedItems}
          />
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DateRangeFields
        from={chosenDates.from}
        to={chosenDates.to}
        onChangeFrom={(from) => chooseDates({ ...chosenDates, from })}
        onChangeTo={(to) => chooseDates({ ...chosenDates, to })}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-700">{describeDateRange(countedRange)}</p>
        {countedRange && (
          <Button variant="outline" onClick={() => chooseDates(NO_DATES)}>
            Ver todo
          </Button>
        )}
      </div>
      {renderCounts()}
    </div>
  );
}
