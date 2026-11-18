import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import type { MatchView } from '@shared/matching';
import type { WelfareLostReportView } from '@shared/welfare';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { INPUT_CLASSES } from '../../core/presenter/Field';
import { InfoRow } from '../../core/presenter/InfoRow';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonArea, SkeletonCard, SkeletonList } from '../../core/presenter/Skeleton';
import { StatusChip } from '../../core/presenter/StatusChip';
import { Thumb } from '../../core/presenter/Thumb';
import type { MatchesService } from '../../matching/data/matchesService';
import type { WelfareService } from '../data/welfareService';
import { WelfareSectionHeader } from './WelfareSectionHeader';
import { formatDate } from './welfarePresenter';

type LostReportsSectionProps = {
  welfareService: WelfareService;
  matchesService: MatchesService;
  onCountChange: (count: number) => void;
};

export function LostReportsSection({ welfareService, matchesService, onCountChange }: LostReportsSectionProps) {
  const [reports, setReports] = useState<WelfareLostReportView[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [code, setCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<WelfareLostReportView | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchView[] | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const loadReports = useCallback(async () => {
    setHasError(false);
    setReports(null);
    try {
      const loaded = await welfareService.listActiveLostReports();
      setReports(loaded);
      onCountChange(loaded.length);
    } catch {
      setHasError(true);
    }
  }, [onCountChange, welfareService]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  async function showReport(report: WelfareLostReportView) {
    setSelected(report);
    setMatches(null);
    setMessage(null);
    setIsLoadingMatches(true);
    try {
      const loaded = await matchesService.getMatches(report.code);
      if (loaded === null) {
        setMessage('No pudimos cargar los objetos parecidos');
      } else {
        setMatches(loaded);
      }
    } catch {
      setMessage('No pudimos cargar los objetos parecidos');
    } finally {
      setIsLoadingMatches(false);
    }
  }

  async function searchReport(event: FormEvent) {
    event.preventDefault();
    if (isSearching) {
      return;
    }
    setIsSearching(true);
    setMessage(null);
    try {
      const result = await welfareService.findLostReportByCode(code);
      if (result.status === 'FOUND') {
        await showReport(result.report);
        return;
      }
      setSelected(null);
      setMatches(null);
      setMessage('No encontramos un reporte activo con ese código');
    } catch {
      setSelected(null);
      setMatches(null);
      setMessage('No pudimos buscar el reporte');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <>
      <WelfareSectionHeader title="Reportes de pérdida activos" subtitle="Consulta reportes activos y revisa los objetos encontrados que podrían coincidir." />
      <form onSubmit={searchReport} className="mb-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
          <label htmlFor="lost-report-code" className="sr-only">Código del reporte</label>
          <input id="lost-report-code" className={`${INPUT_CLASSES} pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case`} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Buscar por ID, ej. PR-0001" disabled={isSearching} />
        </div>
        <Button type="submit" aria-label="Buscar reporte" isLoading={isSearching} loadingText="Buscando…">Buscar</Button>
      </form>
      {message && <div className="mb-4"><Alert>{message}</Alert></div>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          {hasError ? (
            <LoadErrorAlert message="No pudimos cargar los reportes de pérdida" onRetry={() => void loadReports()} />
          ) : reports === null ? (
            <SkeletonList rows={3} label="Cargando reportes de pérdida..." />
          ) : reports.length === 0 ? (
            <EmptyState title="No hay reportes de pérdida activos" text="No hay propietarios buscando objetos en este momento." />
          ) : reports.map((report) => (
            <article key={report.code}>
              <button type="button" onClick={() => { setCode(report.code); setMessage(null); void showReport(report); }} className={`flex w-full items-center gap-3 rounded-2xl border bg-neutral-0 p-3 text-left ${selected?.code === report.code ? 'border-blue-300 ring-2 ring-blue-300/20' : 'border-neutral-200'}`}>
                <Thumb category={report.category} photoUrl={report.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold text-blue-700">{report.code}</p>
                  <p className="truncate text-sm text-neutral-700">{report.description}</p>
                  <p className="text-xs text-neutral-500">{report.owner.name}</p>
                  <p className="truncate text-xs text-neutral-500">{report.owner.email}</p>
                </div>
                <StatusChip status={report.status} />
              </button>
            </article>
          ))}
        </div>
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <>
              <section className="rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                <h3 className="sr-only">Detalle del reporte</h3>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-mono text-2xl font-bold text-blue-700">{selected.code}</h3>
                  <StatusChip status={selected.status} />
                </div>
                <div className="flex gap-4">
                  <Thumb category={selected.category} photoUrl={selected.photoUrl} />
                  <dl className="min-w-0 flex-1">
                    <InfoRow label="Descripción" value={selected.description} />
                    <InfoRow label="Categoría" value={selected.category} />
                    <InfoRow label="Perdido desde" value={formatDate(selected.dateFrom)} />
                    <InfoRow label="Perdido hasta" value={formatDate(selected.dateTo)} />
                    <InfoRow label="Propietario" value={selected.owner.name} />
                    <InfoRow label="Correo" value={selected.owner.email} />
                  </dl>
                </div>
              </section>
              {isLoadingMatches && (
                <section className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                  <h3 className="text-lg font-semibold text-blue-700">Objetos parecidos</h3>
                  <SkeletonArea label="Cargando objetos parecidos…"><div className="space-y-2">{Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} />)}</div></SkeletonArea>
                </section>
              )}
              {!isLoadingMatches && matches !== null && (
                <section className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                  <h3 className="text-lg font-semibold text-blue-700">Objetos parecidos</h3>
                  {matches.length === 0 ? <EmptyState title="No hay objetos parecidos" text="Todavía no encontramos objetos relacionados con este reporte." /> : (
                    <div className="space-y-2">{matches.map((match) => <article key={match.id} className="flex gap-3 rounded-xl bg-neutral-50 p-3"><Thumb category={match.foundItem.category} photoUrl={match.foundItem.photoUrl} /><div><strong className="font-mono text-blue-700">{match.foundItem.code}</strong><p className="text-sm text-neutral-700">{match.foundItem.description}</p></div></article>)}</div>
                  )}
                </section>
              )}
            </>
          ) : <EmptyState title="Selecciona un reporte" text="Busca el código que muestra el propietario para revisar sus datos y coincidencias." />}
        </div>
      </div>
    </>
  );
}
