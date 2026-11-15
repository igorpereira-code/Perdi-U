import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { MyLostReport, MyLostReportsService } from '../data/myLostReportsService';

const REPORT_SELECT_ID = 'claim-report';

type ClaimItemProps = {
  myLostReportsService: Pick<MyLostReportsService, 'listMine'>;
};

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
export function ClaimItem({ myLostReportsService }: ClaimItemProps) {
  const loadReports = useCallback(() => myLostReportsService.listMine(), [myLostReportsService]);
  const { data: reports, hasFailed, retry } = useLoadedData(loadReports);
  const [chosenCode, setChosenCode] = useState<string>();

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
  return (
    <div className="space-y-3">
      <ReportChoice reports={activeReports} chosenCode={selectedCode} onChoose={setChosenCode} />
      <Button className="w-full">Es mío, pasaré a recoger</Button>
    </div>
  );
}