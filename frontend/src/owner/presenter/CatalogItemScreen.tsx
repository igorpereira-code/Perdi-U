import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../core/presenter/Alert';
import { EmptyState } from '../../core/presenter/EmptyState';
import { InfoRow } from '../../core/presenter/InfoRow';
import { Skeleton, SkeletonArea } from '../../core/presenter/Skeleton';
import { WelfareCard } from '../../core/presenter/WelfareCard';
import type { FoundItemsService } from '../../finder/data/foundItemsService';
import { formatReportDate } from '../../finder/logic/formatReportDate';
import { FoundItemPhoto } from '../../finder/presenter/FoundItemPhoto';
import type { CatalogItem, CatalogService } from '../data/catalogService';
import type { MatchesService } from '../../matching/data/matchesService';
import { PickUpInstructions } from '../../matching/presenter/MatchesPage';
import type { MyLostReportsService } from '../data/myLostReportsService';
import { ClaimItem } from './ClaimItem';

type CatalogItemScreenProps = {
  catalogService: Pick<CatalogService, 'getByCode'>;
  foundItemsService: Pick<FoundItemsService, 'getPhotoUrl'>;
  myLostReportsService: Pick<MyLostReportsService, 'listMine'>;
  matchesService: Pick<MatchesService, 'claim'>;
};

type IsItYoursProps = {
  item: CatalogItem;
  myLostReportsService: Pick<MyLostReportsService, 'listMine'>;
  matchesService: Pick<MatchesService, 'claim'>;
};

/** Where to ask for the item, or, once the owner claimed it, that they will pick it up. */
function IsItYours({ item, myLostReportsService, matchesService }: IsItYoursProps) {
  const [claimedReportCode, setClaimedReportCode] = useState<string>();

  return (
    <section aria-labelledby="ask-welfare-title" className="space-y-2">
      <h2 id="ask-welfare-title" className="text-base font-semibold text-blue-700">
        ¿Es tuyo?
      </h2>
      {claimedReportCode ? (
        <PickUpInstructions reportCode={claimedReportCode} />
      ) : (
        <>
          <p className="text-sm text-neutral-700">
            Acércate a Bienestar Estudiantil con el código {item.code} para preguntar por él.
          </p>
          <WelfareCard />
          <ClaimItem
            itemCode={item.code}
            myLostReportsService={myLostReportsService}
            matchesService={matchesService}
            onClaimed={setClaimedReportCode}
          />
        </>
      )}
    </section>
  );
}

type ScreenState = { status: 'loading' } | { status: 'missing' } | { status: 'failed' } | { status: 'ready'; item: CatalogItem };

const BACK_LINK = 'inline-flex text-sm font-semibold text-blue-500';

/** How many data rows are shown in gray while the item loads. */
const SKELETON_ROWS = 4;

/** The shape of the item detail while it loads: photo, description and data rows. */
function CatalogItemSkeleton() {
  return (
    <SkeletonArea label="Cargando el objeto…">
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
          {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonArea>
  );
}

/** Detail of a published found item. */
export function CatalogItemScreen({ catalogService, foundItemsService, myLostReportsService, matchesService }: CatalogItemScreenProps) {
  const { code = '' } = useParams();
  const [state, setState] = useState<ScreenState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    catalogService
      .getByCode(code)
      .then((item) => {
        if (active) {
          setState(item ? { status: 'ready', item } : { status: 'missing' });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: 'failed' });
        }
      });
    return () => {
      active = false;
    };
  }, [catalogService, code]);

  if (state.status === 'loading') {
    return <CatalogItemSkeleton />;
  }
  if (state.status === 'failed') {
    return (
      <div role="alert" className="mx-auto max-w-lg">
        <Alert>No se pudo cargar el objeto. Intenta nuevamente.</Alert>
      </div>
    );
  }
  if (state.status === 'missing') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <EmptyState
          title="No encontramos este objeto"
          text="Puede que ya haya sido entregado a su dueño o que el código no sea correcto."
        />
        <Link to="/" className={BACK_LINK}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { item } = state;
  return (
    <article className="mx-auto max-w-lg space-y-4">
      <Link to="/" className={BACK_LINK}>
        Volver al inicio
      </Link>
      <h1 className="text-lg font-semibold text-blue-700">Detalle del objeto</h1>
      <div className="flex gap-3">
        <FoundItemPhoto report={item} foundItemsService={foundItemsService} />
        <p className="min-w-0 break-words text-base text-neutral-900">{item.description}</p>
      </div>
      <dl className="rounded-2xl border border-neutral-200 bg-neutral-0 px-4">
        <InfoRow label="Código" value={item.code} />
        <InfoRow label="Categoría" value={item.category} />
        <InfoRow label="Lugar" value={item.place} />
        {item.placeReference && <InfoRow label="Referencia" value={item.placeReference} />}
        <InfoRow label="Fecha" value={formatReportDate(item.foundAt)} />
      </dl>
      <IsItYours item={item} myLostReportsService={myLostReportsService} matchesService={matchesService} />
    </article>
  );
}