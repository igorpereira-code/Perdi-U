import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { MatchesService } from '../../matching/data/matchesService';
import type { MyLostReport, MyLostReportsService } from '../data/myLostReportsService';

const REPORT_SELECT_ID = 'claim-report';

type ClaimItemProps = {
  itemCode: string;
  myLostReportsService: Pick<MyLostReportsService, 'listMine'>;
  matchesService: Pick<MatchesService, 'claim'>;
};

type ClaimState = 'idle' | 'saving' | 'failed' | 'done';

type ReportChoiceProps = {
  reports: MyLostReport[];
  chosenCode: string;
  onChoose: (code: string) => void;
};

/** With one active report there is nothing to choose; with several, the owner picks one. */
function ReportChoice({ reports, chosenCode, onChoose }: ReportChoiceProps) {
  if (reports.length === 1) {
    return (
      <p className="text-sm text-neutral-700">Lo relacionaremos con tu reporte {reports[0].code}.</p>
    );
  }
  return (
    <Field id={REPORT_SELECT_ID} label="¿Con cuál de tus reportes lo relacionas?">
      <select
        id={REPORT_SELECT_ID}
        className={INPUT_CLASSES}
        value={chosenCode}
        onChange={(event) => onChoose(event.target.value)}
      >
        {reports.map((report) => (
          <option key={report.code} value={report.code}>
            {report.code} – {report.description}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** "Es mío, pasaré a recoger": lets the owner say that a published item is theirs. */
export function ClaimItem({ itemCode, myLostReportsService, matchesService }: ClaimItemProps) {
  const loadReports = useCallback(() => myLostReportsService.listMine(), [myLostReportsService]);
  const { data: reports, hasFailed, retry } = useLoadedData(loadReports);
  const [chosenCode, setChosenCode] = useState<string>();
  const [claimState, setClaimState] = useState<ClaimState>('idle');

  if (hasFailed) {
    return (
      <LoadErrorAlert message="No se pudieron cargar tus reportes. Intenta nuevamente." onRetry={retry} />
    );
  }
  if (!reports) {
    return <p role="status" className="text-sm text-neutral-500">Cargando tus reportes…</p>;
  }

  const activeReports = reports.filter((report) => report.status !== 'RECOVERED');
  if (activeReports.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-700">
          Para pedir este objeto necesitas un reporte de pérdida.
        </p>
        <Link
          to="/reportar-perdida"
          className="inline-flex min-h-11 items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-blue-700"
        >
          Reportar mi pérdida
        </Link>
      </div>
    );
  }

  const selectedCode = activeReports.some((report) => report.code === chosenCode)
    ? (chosenCode as string)
    : activeReports[0].code;
  async function handleClaim() {
    setClaimState('saving');
    try {
      await matchesService.claim(itemCode, selectedCode);
      setClaimState('done');
    } catch {
      setClaimState('failed');
    }
  }

  if (claimState === 'done') {
    return (
      <p role="status" className="rounded-xl bg-success-50 p-2 text-sm font-medium text-success-700">
        Pasarás a recoger este objeto
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <ReportChoice reports={activeReports} chosenCode={selectedCode} onChoose={setChosenCode} />
      {claimState === 'failed' && (
        <div role="alert">
          <Alert>No se pudo avisar a Bienestar. Intenta nuevamente.</Alert>
        </div>
      )}
      <Button
        className="w-full"
        onClick={handleClaim}
        isLoading={claimState === 'saving'}
        loadingText="Guardando…"
      >
        Es mío, pasaré a recoger
      </Button>
    </div>
  );
}