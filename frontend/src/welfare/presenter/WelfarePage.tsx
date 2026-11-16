import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Archive,
  ClipboardList,
  FileSearch,
  HandCoins,
  Inbox,
  PackageCheck,
  PackagePlus,
  Search,
} from 'lucide-react';
import type {
  WelfareDeliveryView,
  WelfareFoundItemView,
  WelfareLostReportView,
  WelfarePendingPickupView,
} from '@shared/welfare';
import type {
  DeliveryInput,
  ReceptionCorrection,
  WelfareService,
} from '../data/welfareService';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { InfoRow } from '../../core/presenter/InfoRow';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonArea, SkeletonCard, SkeletonList } from '../../core/presenter/Skeleton';
import { StatusChip } from '../../core/presenter/StatusChip';
import { Thumb } from '../../core/presenter/Thumb';
import type { MatchesService } from '../../matching/data/matchesService';
import type { MatchView } from '@shared/matching';
import { PublishButton } from '../../matching/presenter/PublishButton';
import { formatMatchCount } from '../../matching/logic/formatMatchCount';
import { FoundItemForm } from '../../finder/presenter/FoundItemForm';

type WelfarePageProps = {
  welfareService: WelfareService;
  matchesService: MatchesService;
};

type WelfareSection =
  | 'reports'
  | 'requests'
  | 'register'
  | 'custody'
  | 'pickups'
  | 'delivery'
  | 'deliveries';

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function formatDateTimeLocal(value: string): string {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

type ReceptionDraft = Omit<ReceptionCorrection, 'foundAt'> & { foundAt: string };

function buildReceptionDraft(item: WelfareFoundItemView): ReceptionDraft {
  return {
    description: item.description,
    categoryId: item.categoryId,
    placeId: item.placeId,
    classroomId: item.classroomId,
    placeReference: item.placeReference,
    foundAt: formatDateTimeLocal(item.foundAt),
  };
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-4">
      <h2 className="text-2xl font-bold text-blue-700">{title}</h2>
      <p className="text-sm text-neutral-500">{subtitle}</p>
    </header>
  );
}

export function WelfarePage({ welfareService, matchesService }: WelfarePageProps) {
  const [activeSection, setActiveSection] = useState<WelfareSection>('reports');
  const [lostReports, setLostReports] = useState<WelfareLostReportView[] | null>(null);
  const [hasLostReportsError, setHasLostReportsError] = useState(false);
  const [lostReportCode, setLostReportCode] = useState('');
  const [isSearchingLostReport, setIsSearchingLostReport] = useState(false);
  const [selectedLostReport, setSelectedLostReport] = useState<WelfareLostReportView | null>(null);
  const [lostReportMessage, setLostReportMessage] = useState<string | null>(null);
  const [lostReportMatches, setLostReportMatches] = useState<MatchView[] | null>(null);
  const [isLoadingLostReportMatches, setIsLoadingLostReportMatches] = useState(false);
  const [pendingPickups, setPendingPickups] = useState<WelfarePendingPickupView[] | null>(null);
  const [hasPendingPickupsError, setHasPendingPickupsError] = useState(false);
  const [deliveries, setDeliveries] = useState<WelfareDeliveryView[] | null>(null);
  const [hasDeliveriesError, setHasDeliveriesError] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState('');
  const [pendingItems, setPendingItems] = useState<WelfareFoundItemView[] | null>(null);
  const [hasPendingItemsError, setHasPendingItemsError] = useState(false);
  const [inOfficeItems, setInOfficeItems] = useState<WelfareFoundItemView[] | null>(null);
  const [hasInOfficeItemsError, setHasInOfficeItemsError] = useState(false);
  const [editingPublishedCode, setEditingPublishedCode] = useState<string | null>(null);
  const [publishedDraft, setPublishedDraft] = useState<ReceptionDraft | null>(null);
  const [isSavingPublishedItem, setIsSavingPublishedItem] = useState(false);
  const [publicationResults, setPublicationResults] = useState<Record<string, number>>({});
  const [selectedItem, setSelectedItem] = useState<WelfareFoundItemView | null>(null);
  const [searchedItemCode, setSearchedItemCode] = useState('');
  const [isSearchingFoundItem, setIsSearchingFoundItem] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [catalogs, setCatalogs] = useState<FoundItemCatalogs | null>(null);
  const [receptionDraft, setReceptionDraft] = useState<ReceptionDraft | null>(null);
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryInput | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);

  const loadActiveLostReports = useCallback(async () => {
    setHasLostReportsError(false);
    setLostReports(null);
    try {
      setLostReports(await welfareService.listActiveLostReports());
    } catch {
      setHasLostReportsError(true);
    }
  }, [welfareService]);

  useEffect(() => {
    void loadActiveLostReports();
  }, [loadActiveLostReports]);

  async function showLostReport(report: WelfareLostReportView) {
    setSelectedLostReport(report);
    setLostReportMatches(null);
    setLostReportMessage(null);
    setIsLoadingLostReportMatches(true);
    try {
      const matches = await matchesService.getMatches(report.code);
      if (matches === null) {
        setLostReportMessage('No pudimos cargar los objetos parecidos');
      } else {
        setLostReportMatches(matches);
      }
    } catch {
      setLostReportMessage('No pudimos cargar los objetos parecidos');
    } finally {
      setIsLoadingLostReportMatches(false);
    }
  }

  async function searchLostReport(event: FormEvent) {
    event.preventDefault();
    if (isSearchingLostReport) {
      return;
    }
    setIsSearchingLostReport(true);
    setLostReportMessage(null);
    try {
      const searchResult = await welfareService.findLostReportByCode(lostReportCode);
      if (searchResult.status === 'FOUND') {
        await showLostReport(searchResult.report);
        return;
      }
      setSelectedLostReport(null);
      setLostReportMatches(null);
      setLostReportMessage('No encontramos un reporte activo con ese código');
    } catch {
      setSelectedLostReport(null);
      setLostReportMatches(null);
      setLostReportMessage('No pudimos buscar el reporte');
    } finally {
      setIsSearchingLostReport(false);
    }
  }

  function startPickupDelivery(pickup: WelfarePendingPickupView) {
    setDeliveryDraft({
      foundItemCode: pickup.foundItem.code,
      lostReportCode: pickup.report.code,
      recipientName: pickup.owner.name,
      recipientEmail: pickup.owner.email,
      recipientUniversityCode: '',
    });
    setActiveSection('delivery');
  }

  function startItemDelivery(item: WelfareFoundItemView) {
    setDeliveryDraft({
      foundItemCode: item.code,
      lostReportCode: '',
      recipientName: '',
      recipientEmail: '',
      recipientUniversityCode: '',
    });
    setActiveSection('delivery');
  }

  function updateDelivery(field: keyof DeliveryInput, value: string) {
    setDeliveryDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function confirmDelivery(event: FormEvent) {
    event.preventDefault();
    if (!deliveryDraft || isDelivering) {
      return;
    }
    setIsDelivering(true);
    setFeedbackMessage(null);
    try {
      const deliveryResult = await welfareService.deliver(deliveryDraft);
      if (deliveryResult.status !== 'DELIVERED') {
        setFeedbackMessage(
          deliveryResult.status === 'REPORT_NOT_ELIGIBLE'
            ? 'El reporte no corresponde a este objeto o propietario'
            : deliveryResult.status === 'ITEM_NOT_AVAILABLE'
              ? 'El objeto ya no está disponible para entrega'
              : deliveryResult.status === 'INVALID_RECIPIENT_EMAIL'
                ? 'Ingresa un correo institucional válido'
                : 'Completa todos los datos obligatorios',
        );
        return;
      }
      setPendingPickups((current) =>
        current?.filter((pickup) => pickup.foundItem.code !== deliveryResult.foundItemCode) ?? [],
      );
      setInOfficeItems((current) =>
        current?.filter((item) => item.code !== deliveryResult.foundItemCode) ?? [],
      );
      setDeliveryDraft(null);
      setActiveSection('custody');
      setFeedbackMessage('Entrega registrada correctamente');
    } catch {
      setFeedbackMessage('No pudimos registrar la entrega');
    } finally {
      setIsDelivering(false);
    }
  }

  const loadPendingPickups = useCallback(async () => {
    setHasPendingPickupsError(false);
    setPendingPickups(null);
    try {
      setPendingPickups(await welfareService.listPendingPickups());
    } catch {
      setHasPendingPickupsError(true);
    }
  }, [welfareService]);

  useEffect(() => {
    void loadPendingPickups();
  }, [loadPendingPickups]);

  const loadDeliveries = useCallback(async () => {
    setHasDeliveriesError(false);
    setDeliveries(null);
    try {
      setDeliveries(await welfareService.listDeliveries());
    } catch {
      setHasDeliveriesError(true);
    }
  }, [welfareService]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const loadPendingItems = useCallback(async () => {
    setHasPendingItemsError(false);
    setPendingItems(null);
    try {
      setPendingItems(await welfareService.listPending());
    } catch {
      setHasPendingItemsError(true);
    }
  }, [welfareService]);

  useEffect(() => {
    void loadPendingItems();
  }, [loadPendingItems]);

  const loadInOfficeItems = useCallback(async () => {
    setHasInOfficeItemsError(false);
    setInOfficeItems((current) => (current?.length ? current : null));
    try {
      const loadedItems = await welfareService.listInOffice();
      setInOfficeItems((current) => {
        if (current === null) {
          return loadedItems;
        }
        const currentCodes = new Set(current.map((item) => item.code));
        return [...loadedItems.filter((item) => !currentCodes.has(item.code)), ...current];
      });
    } catch {
      setHasInOfficeItemsError(true);
    }
  }, [welfareService]);

  useEffect(() => {
    void loadInOfficeItems();
  }, [loadInOfficeItems]);

  useEffect(() => {
    welfareService.getCatalogs().then(setCatalogs).catch(() => setCatalogs(null));
  }, [welfareService]);

  function selectPendingItem(item: WelfareFoundItemView) {
    setSelectedItem(item);
    setReceptionDraft(buildReceptionDraft(item));
    setIsConfirmingDeletion(false);
  }

  function updateReceptionDraft<Field extends keyof ReceptionDraft>(
    field: Field,
    value: ReceptionDraft[Field],
  ) {
    setReceptionDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function searchFoundItem(event: FormEvent) {
    event.preventDefault();
    if (isSearchingFoundItem) {
      return;
    }
    setIsSearchingFoundItem(true);
    setFeedbackMessage(null);
    try {
      const searchResult = await welfareService.findFoundItemByCode(searchedItemCode);
      if (searchResult.status === 'FOUND') {
        selectPendingItem(searchResult.item);
        return;
      }
      setSelectedItem(null);
      setReceptionDraft(null);
      setFeedbackMessage(
        searchResult.status === 'NOT_FOUND'
          ? 'No encontramos un objeto con ese código'
          : 'Este objeto ya fue recibido',
      );
    } catch {
      setFeedbackMessage('No pudimos buscar el objeto');
    } finally {
      setIsSearchingFoundItem(false);
    }
  }

  async function confirmReception() {
    if (!selectedItem || !receptionDraft || isReceiving) {
      return;
    }
    setIsReceiving(true);
    setFeedbackMessage(null);
    try {
      const receptionResult = await welfareService.confirmReception(selectedItem.code, {
        ...receptionDraft,
        foundAt: new Date(receptionDraft.foundAt).toISOString(),
      });
      if (receptionResult.status !== 'FOUND') {
        setFeedbackMessage('Este objeto ya fue recibido');
        return;
      }
      setPendingItems((current) =>
        current?.filter((item) => item.code !== selectedItem.code) ?? [],
      );
      setInOfficeItems((current) => [...(current ?? []), receptionResult.item]);
      setSelectedItem(null);
      setReceptionDraft(null);
      setFeedbackMessage('Objeto recibido y puesto en custodia');
    } catch {
      setFeedbackMessage('No pudimos confirmar la recepción');
    } finally {
      setIsReceiving(false);
    }
  }

  async function deletePendingRequest() {
    if (!selectedItem || isDeleting) {
      return;
    }
    setIsDeleting(true);
    setFeedbackMessage(null);
    try {
      const wasDeleted = await welfareService.deletePending(selectedItem.code);
      if (!wasDeleted) {
        setFeedbackMessage('La solicitud ya no está disponible para eliminar');
        return;
      }
      setPendingItems((current) =>
        current?.filter((item) => item.code !== selectedItem.code) ?? [],
      );
      setSelectedItem(null);
      setReceptionDraft(null);
      setIsConfirmingDeletion(false);
      setFeedbackMessage('Solicitud eliminada');
    } catch {
      setFeedbackMessage('No pudimos eliminar la solicitud');
    } finally {
      setIsDeleting(false);
    }
  }

  function updateOfficeItem(code: string, update: (item: WelfareFoundItemView) => WelfareFoundItemView) {
    setInOfficeItems((current) =>
      current?.map((item) => (item.code === code ? update(item) : item)) ?? current,
    );
  }

  async function togglePublishedVisibility(item: WelfareFoundItemView) {
    const visibility = item.visibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    try {
      await welfareService.setPublishedVisibility(item.code, visibility);
      updateOfficeItem(item.code, (current) => ({ ...current, visibility }));
    } catch {
      setFeedbackMessage('No pudimos cambiar la visibilidad del objeto');
    }
  }

  function startPublishedEdit(item: WelfareFoundItemView) {
    setEditingPublishedCode(item.code);
    setPublishedDraft(buildReceptionDraft(item));
  }

  async function savePublishedItem(event: FormEvent) {
    event.preventDefault();
    if (!editingPublishedCode || !publishedDraft || isSavingPublishedItem) {
      return;
    }
    setIsSavingPublishedItem(true);
    try {
      const updatedItem = await welfareService.updatePublishedItem(editingPublishedCode, {
        ...publishedDraft,
        foundAt: new Date(publishedDraft.foundAt).toISOString(),
      });
      updateOfficeItem(editingPublishedCode, () => updatedItem);
      setEditingPublishedCode(null);
      setPublishedDraft(null);
    } catch {
      setFeedbackMessage('No pudimos guardar los cambios del objeto');
    } finally {
      setIsSavingPublishedItem(false);
    }
  }

  const normalizedDeliverySearch = deliverySearch.trim().toLocaleLowerCase();
  const filteredDeliveries = deliveries?.filter((delivery) =>
    [delivery.foundItem.code, delivery.recipient.name, delivery.recipient.email].some((value) =>
      value.toLocaleLowerCase().includes(normalizedDeliverySearch),
    ),
  );

  const navigation: Array<{
    id: WelfareSection;
    label: string;
    icon: typeof Inbox;
    count?: number;
  }> = [
    { id: 'reports', label: 'Reportes de pérdida', icon: FileSearch, count: lostReports?.length },
    {
      id: 'requests',
      label: 'Solicitudes de hallazgo',
      icon: Inbox,
      count: pendingItems?.length,
    },
    { id: 'register', label: 'Registrar objeto', icon: PackagePlus },
    { id: 'custody', label: 'Objetos en custodia', icon: Archive },
    {
      id: 'pickups',
      label: 'Recojos pendientes',
      icon: HandCoins,
      count: pendingPickups?.length,
    },
    { id: 'delivery', label: 'Registrar entrega', icon: PackageCheck },
    { id: 'deliveries', label: 'Entregas realizadas', icon: ClipboardList },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
      <aside className="md:w-64 md:shrink-0">
        <h1 className="mb-2 hidden px-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase md:block">
          Panel de Bienestar
        </h1>
        <nav
          aria-label="Secciones de Bienestar"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0"
        >
          {navigation.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeSection === id}
              onClick={() => {
                setActiveSection(id);
                if (id === 'delivery') {
                  setDeliveryDraft((current) => current ?? {
                      foundItemCode: '',
                      lostReportCode: '',
                      recipientName: '',
                      recipientEmail: '',
                      recipientUniversityCode: '',
                    });
                }
              }}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activeSection === id
                  ? 'bg-blue-50 text-blue-500'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="flex-1 text-left whitespace-nowrap">{label}</span>
              {!!count && (
                <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-blue-700">
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        {feedbackMessage && <div className="mb-4"><Alert>{feedbackMessage}</Alert></div>}

        <section className={activeSection === 'reports' ? '' : 'hidden'}>
          <SectionHeader
            title="Reportes de pérdida activos"
            subtitle="Consulta reportes activos y revisa los objetos encontrados que podrían coincidir."
          />
          <form onSubmit={searchLostReport} className="mb-4 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />
              <label htmlFor="lost-report-code" className="sr-only">Código del reporte</label>
              <input
                id="lost-report-code"
                className={`${INPUT_CLASSES} pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case`}
                value={lostReportCode}
                onChange={(event) => setLostReportCode(event.target.value)}
                placeholder="Buscar por ID, ej. PR-0001"
                disabled={isSearchingLostReport}
              />
            </div>
            <Button
              type="submit"
              aria-label="Buscar reporte"
              isLoading={isSearchingLostReport}
              loadingText="Buscando…"
            >
              Buscar
            </Button>
          </form>
          {lostReportMessage && <div className="mb-4"><Alert>{lostReportMessage}</Alert></div>}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-2">
              {hasLostReportsError ? (
                <LoadErrorAlert
                  message="No pudimos cargar los reportes de pérdida"
                  onRetry={() => void loadActiveLostReports()}
                />
              ) : lostReports === null ? (
                <SkeletonList rows={3} label="Cargando reportes de pérdida..." />
              ) : lostReports.length === 0 ? (
                <EmptyState
                  title="No hay reportes de pérdida activos"
                  text="No hay propietarios buscando objetos en este momento."
                />
              ) : (
                lostReports.map((report) => (
                  <article key={report.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setLostReportCode(report.code);
                        setLostReportMessage(null);
                        void showLostReport(report);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border bg-neutral-0 p-3 text-left ${
                        selectedLostReport?.code === report.code
                          ? 'border-blue-300 ring-2 ring-blue-300/20'
                          : 'border-neutral-200'
                      }`}
                    >
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
                ))
              )}
            </div>

            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {selectedLostReport ? (
                <>
                  <section className="rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                    <h3 className="sr-only">Detalle del reporte</h3>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-mono text-2xl font-bold text-blue-700">
                        {selectedLostReport.code}
                      </h3>
                      <StatusChip status={selectedLostReport.status} />
                    </div>
                    <div className="flex gap-4">
                      <Thumb
                        category={selectedLostReport.category}
                        photoUrl={selectedLostReport.photoUrl}
                      />
                      <dl className="min-w-0 flex-1">
                        <InfoRow label="Descripción" value={selectedLostReport.description} />
                        <InfoRow label="Categoría" value={selectedLostReport.category} />
                        <InfoRow label="Perdido desde" value={formatDate(selectedLostReport.dateFrom)} />
                        <InfoRow label="Perdido hasta" value={formatDate(selectedLostReport.dateTo)} />
                        <InfoRow label="Propietario" value={selectedLostReport.owner.name} />
                        <InfoRow label="Correo" value={selectedLostReport.owner.email} />
                      </dl>
                    </div>
                  </section>

                  {isLoadingLostReportMatches && (
                    <section className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                      <h3 className="text-lg font-semibold text-blue-700">Objetos parecidos</h3>
                      <SkeletonArea label="Cargando objetos parecidos…">
                        <div className="space-y-2">
                          {Array.from({ length: 3 }, (_, cardIndex) => (
                            <SkeletonCard key={cardIndex} />
                          ))}
                        </div>
                      </SkeletonArea>
                    </section>
                  )}

                  {!isLoadingLostReportMatches && lostReportMatches !== null && (
                    <section className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                      <h3 className="text-lg font-semibold text-blue-700">Objetos parecidos</h3>
                      {lostReportMatches.length === 0 ? (
                        <EmptyState
                          title="No hay objetos parecidos"
                          text="Todavía no encontramos objetos relacionados con este reporte."
                        />
                      ) : (
                        <div className="space-y-2">
                          {lostReportMatches.map((match) => (
                            <article key={match.id} className="flex gap-3 rounded-xl bg-neutral-50 p-3">
                              <Thumb
                                category={match.foundItem.category}
                                photoUrl={match.foundItem.photoUrl}
                              />
                              <div>
                                <strong className="font-mono text-blue-700">
                                  {match.foundItem.code}
                                </strong>
                                <p className="text-sm text-neutral-700">
                                  {match.foundItem.description}
                                </p>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </>
              ) : (
                <EmptyState
                  title="Selecciona un reporte"
                  text="Busca el código que muestra el propietario para revisar sus datos y coincidencias."
                />
              )}
            </div>
          </div>
        </section>

        <section className={activeSection === 'requests' ? '' : 'hidden'}>
          <SectionHeader
            title="Solicitudes de hallazgo"
            subtitle="Reportes privados esperando que el hallador traiga el objeto."
          />
          <form onSubmit={searchFoundItem} className="mb-4 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />
              <label htmlFor="found-item-code" className="sr-only">Código del objeto</label>
              <input
                id="found-item-code"
                className={`${INPUT_CLASSES} pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case`}
                value={searchedItemCode}
                onChange={(event) => setSearchedItemCode(event.target.value)}
                placeholder="Buscar por ID, ej. HZ-0007"
                disabled={isSearchingFoundItem}
              />
            </div>
            <Button
              type="submit"
              isLoading={isSearchingFoundItem}
              loadingText="Buscando…"
            >
              Buscar
            </Button>
          </form>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-2">
              <h2 className="sr-only">Objetos pendientes de recepción</h2>
              {hasPendingItemsError ? (
                <LoadErrorAlert
                  message="No pudimos cargar los objetos pendientes"
                  onRetry={() => void loadPendingItems()}
                />
              ) : pendingItems === null ? (
                <SkeletonList rows={3} label="Cargando objetos pendientes..." />
              ) : pendingItems.length === 0 ? (
                <EmptyState title="No hay objetos pendientes" text="No quedan objetos por recibir en la oficina." />
              ) : (
                pendingItems.map((item) => (
                  <article key={item.code}>
                    <button
                      type="button"
                      onClick={() => selectPendingItem(item)}
                      className={`flex w-full items-center gap-3 rounded-2xl border bg-neutral-0 p-3 text-left ${
                        selectedItem?.code === item.code
                          ? 'border-blue-300 ring-2 ring-blue-300/20'
                          : 'border-neutral-200'
                      }`}
                    >
                      <Thumb category={item.category} photoUrl={item.photoUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-blue-700">{item.code}</p>
                        <p className="truncate text-sm text-neutral-700">{item.description}</p>
                        <p className="text-xs text-neutral-500">{item.finder?.name}</p>
                      </div>
                      <StatusChip status={item.status} />
                    </button>
                  </article>
                ))
              )}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              {selectedItem ? (
                <section className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-mono text-2xl font-bold text-blue-700">{selectedItem.code}</h2>
                    <StatusChip status={selectedItem.status} />
                  </div>
                  <Thumb category={selectedItem.category} photoUrl={selectedItem.photoUrl} />
                  {receptionDraft && (
                    <div className="space-y-3">
                      <Field id="reception-description" label="Descripción del objeto">
                        <textarea
                          id="reception-description"
                          className={INPUT_CLASSES}
                          value={receptionDraft.description}
                          onChange={(event) => updateReceptionDraft('description', event.target.value)}
                        />
                      </Field>
                      <Field id="reception-category" label="Categoría del objeto">
                        <select
                          id="reception-category"
                          className={INPUT_CLASSES}
                          value={receptionDraft.categoryId}
                          onChange={(event) =>
                            updateReceptionDraft('categoryId', Number(event.target.value))
                          }
                        >
                          {(catalogs?.categories ?? [{
                            id: selectedItem.categoryId,
                            name: selectedItem.category,
                          }]).map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field id="reception-place" label="Lugar del hallazgo">
                        <select
                          id="reception-place"
                          className={INPUT_CLASSES}
                          value={receptionDraft.placeId}
                          onChange={(event) => {
                            updateReceptionDraft('placeId', Number(event.target.value));
                            updateReceptionDraft('classroomId', null);
                          }}
                        >
                          {(catalogs?.places ?? [{
                            id: selectedItem.placeId,
                            name: selectedItem.place,
                            type: 'SPACE' as const,
                            classrooms: [],
                          }]).map((place) => (
                            <option key={place.id} value={place.id}>{place.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field id="reception-found-at" label="Fecha del hallazgo">
                        <input
                          id="reception-found-at"
                          type="datetime-local"
                          className={INPUT_CLASSES}
                          value={receptionDraft.foundAt}
                          onChange={(event) => updateReceptionDraft('foundAt', event.target.value)}
                        />
                      </Field>
                    </div>
                  )}
                  <dl>
                    {selectedItem.classroom && (
                      <InfoRow label="Aula" value={selectedItem.classroom} />
                    )}
                    {selectedItem.finder && (
                      <>
                        <InfoRow label="Hallador" value={selectedItem.finder.name} />
                        <InfoRow label="Correo" value={selectedItem.finder.email} />
                      </>
                    )}
                  </dl>
                  <Button
                    onClick={confirmReception}
                    isLoading={isReceiving}
                    loadingText="Confirmando recepción…"
                    className="w-full"
                    disabled={!receptionDraft}
                  >
                    <PackageCheck className="h-4 w-4" aria-hidden="true" />
                    Confirmar recepción
                  </Button>
                  {isConfirmingDeletion ? (
                    <Alert>
                      <p className="mb-3">¿Confirmas que el objeto nunca llegó a la oficina?</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => void deletePendingRequest()}
                          isLoading={isDeleting}
                          loadingText="Eliminando…"
                        >
                          Sí, eliminar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsConfirmingDeletion(false)}
                          disabled={isDeleting}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </Alert>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsConfirmingDeletion(true)}
                      className="w-full"
                    >
                      Eliminar solicitud
                    </Button>
                  )}
                </section>
              ) : (
                <EmptyState
                  title="Selecciona una solicitud"
                  text="Busca el ID que te muestra el hallador para ver el detalle."
                />
              )}
            </div>
          </div>
        </section>

        <section className={activeSection === 'custody' ? '' : 'hidden'}>
          <SectionHeader
            title="Objetos en custodia"
            subtitle="Objetos recibidos en la oficina. Publícalos para que la comunidad los vea."
          />
          {hasInOfficeItemsError && (
            <div className="mb-4">
              <LoadErrorAlert
                message="No pudimos cargar los objetos en la oficina"
                onRetry={() => void loadInOfficeItems()}
              />
            </div>
          )}
          {inOfficeItems === null ? (
            hasInOfficeItemsError ? null : (
              <SkeletonList rows={4} label="Cargando objetos en la oficina..." />
            )
          ) : inOfficeItems.length === 0 ? (
            <EmptyState title="No hay objetos en la oficina" text="No quedan objetos bajo custodia." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {inOfficeItems.map((item) => {
                const isEditing = editingPublishedCode === item.code && publishedDraft;
                return (
                  <article key={item.code} className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                    <Thumb category={item.category} photoUrl={item.photoUrl} />
                    <div className="min-w-0 flex-1">
                      <strong className="font-mono text-blue-700">{item.code}</strong>
                      <p className="text-sm text-neutral-700">{item.description}</p>
                      <div className="mt-2"><StatusChip status={item.status} /></div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {item.status === 'PUBLISHED'
                          ? item.visibility === 'VISIBLE'
                            ? 'Visible para la comunidad'
                            : 'Oculto para la comunidad'
                          : 'No publicado'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.status === 'IN_CUSTODY' && (
                          <PublishButton
                            itemCode={item.code}
                            matchesService={matchesService}
                            onPublished={(result) => {
                              setPublicationResults((current) => ({
                                ...current, [item.code]: result.matchCount,
                              }));
                              updateOfficeItem(item.code, (current) => ({
                                ...current, status: 'PUBLISHED', visibility: result.visibility,
                              }));
                            }}
                          />
                        )}
                        {item.status === 'PUBLISHED' && (
                          <>
                            <Button onClick={() => void togglePublishedVisibility(item)} variant="outline">
                              {item.visibility === 'VISIBLE'
                                ? 'Ocultar de la comunidad'
                                : 'Mostrar a la comunidad'}
                            </Button>
                            <Button onClick={() => startPublishedEdit(item)} variant="outline">
                              Editar datos
                            </Button>
                          </>
                        )}
                        <Button onClick={() => startItemDelivery(item)} variant="outline">
                          Registrar entrega
                        </Button>
                      </div>
                      {publicationResults[item.code] !== undefined && (
                        <div role="status" className="mt-3 rounded-xl bg-success-50 p-2 text-sm text-success-700">
                          <p className="font-medium">
                            {item.visibility === 'VISIBLE'
                              ? 'Publicado: la comunidad ya puede ver este objeto.'
                              : 'Publicado como oculto para la comunidad.'}
                          </p>
                          <p>{formatMatchCount(publicationResults[item.code])}</p>
                        </div>
                      )}
                      {isEditing && (
                        <form onSubmit={savePublishedItem} className="mt-4 space-y-3 rounded-xl bg-neutral-50 p-3">
                          <label className="block text-sm font-medium">
                            Descripción publicada
                            <textarea
                              value={publishedDraft.description}
                              onChange={(event) => setPublishedDraft({ ...publishedDraft, description: event.target.value })}
                              className="mt-1 w-full rounded-xl border border-neutral-300 p-2"
                              required
                            />
                          </label>
                          <label className="block text-sm font-medium">
                            Categoría publicada
                            <select
                              value={publishedDraft.categoryId}
                              onChange={(event) => setPublishedDraft({ ...publishedDraft, categoryId: Number(event.target.value) })}
                              className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3"
                            >
                              {(catalogs?.categories ?? []).map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm font-medium">
                            Lugar publicado
                            <select
                              value={publishedDraft.placeId}
                              onChange={(event) => setPublishedDraft({
                                ...publishedDraft,
                                placeId: Number(event.target.value),
                                classroomId: null,
                              })}
                              className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3"
                            >
                              {(catalogs?.places ?? []).map((place) => (
                                <option key={place.id} value={place.id}>{place.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm font-medium">
                            Referencia publicada
                            <input
                              value={publishedDraft.placeReference ?? ''}
                              onChange={(event) => setPublishedDraft({
                                ...publishedDraft, placeReference: event.target.value || null,
                              })}
                              className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 px-3"
                            />
                          </label>
                          <label className="block text-sm font-medium">
                            Fecha publicada
                            <input
                              type="datetime-local"
                              value={publishedDraft.foundAt}
                              onChange={(event) => setPublishedDraft({ ...publishedDraft, foundAt: event.target.value })}
                              className="mt-1 min-h-11 w-full rounded-xl border border-neutral-300 px-3"
                              required
                            />
                          </label>
                          <div className="flex gap-2">
                            <Button type="submit" isLoading={isSavingPublishedItem} loadingText="Guardando…">
                              Guardar cambios
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => { setEditingPublishedCode(null); setPublishedDraft(null); }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={activeSection === 'pickups' ? '' : 'hidden'}>
          <SectionHeader
            title="Recojos pendientes"
            subtitle="Personas que avisaron que pasarán a recoger un objeto."
          />
          {hasPendingPickupsError ? (
            <LoadErrorAlert
              message="No pudimos cargar los recojos pendientes"
              onRetry={() => void loadPendingPickups()}
            />
          ) : pendingPickups === null ? (
            <SkeletonList rows={3} label="Cargando recojos pendientes..." />
          ) : pendingPickups.length === 0 ? (
            <EmptyState
              title="No hay recojos pendientes"
              text="Cuando alguien pulse “Pasaré a recoger”, aparecerá aquí."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pendingPickups.map((pickup) => (
                <article key={pickup.matchId} className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                  <div>
                    <strong className="text-blue-700">{pickup.owner.name}</strong>
                    <p className="truncate text-sm text-neutral-500">{pickup.owner.email}</p>
                  </div>
                  <p className="text-sm text-neutral-700">
                    Vendrá a recoger <b className="font-mono">{pickup.foundItem.code}</b>
                  </p>
                  <p className="text-sm text-neutral-600">{pickup.foundItem.description}</p>
                  <p className="text-xs text-neutral-500">
                    Reporte: <b className="font-mono text-blue-700">{pickup.report.code}</b>
                  </p>
                  <Button onClick={() => startPickupDelivery(pickup)} className="w-full">
                    Registrar entrega
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={activeSection === 'register' ? '' : 'hidden'}>
          {activeSection === 'register' && (catalogs ? (
            <FoundItemForm
              catalogs={catalogs}
              onCreate={welfareService.registerFoundItem}
              title="Registrar objeto"
              submitLabel="Registrar objeto"
              submittingLabel="Registrando objeto…"
              renderConfirmation={(code) => (
                <section className="mx-auto max-w-lg space-y-4">
                  <h2 className="text-lg font-semibold text-blue-700">Objeto registrado</h2>
                  <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                    Código del objeto <strong className="block text-2xl">{code}</strong>
                  </p>
                  <p className="text-sm text-neutral-700">
                    El objeto quedó en custodia y está listo para publicarse.
                  </p>
                </section>
              )}
            />
          ) : (
            <SkeletonList label="Cargando formulario" rows={4} />
          ))}
        </section>

        <section className={activeSection === 'deliveries' ? '' : 'hidden'}>
          <SectionHeader
            title="Entregas realizadas"
            subtitle="Consulta quién recibió cada objeto y cuándo fue entregado."
          />
          <label className="mb-4 block max-w-xl">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Buscar por código, nombre o correo
            </span>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="search"
                aria-label="Buscar entregas"
                value={deliverySearch}
                onChange={(event) => setDeliverySearch(event.target.value)}
                placeholder="Ej. HZ-0008, Luis o correo@ucb.edu.bo"
                className={`${INPUT_CLASSES} pl-10`}
              />
            </div>
          </label>

          {hasDeliveriesError ? (
            <LoadErrorAlert
              message="No pudimos cargar las entregas realizadas"
              onRetry={() => void loadDeliveries()}
            />
          ) : deliveries === null ? (
            <SkeletonList rows={3} label="Cargando entregas realizadas..." />
          ) : deliveries.length === 0 ? (
            <EmptyState
              title="Todavía no hay entregas realizadas"
              text="Cuando se registre una entrega, aparecerá en este historial."
            />
          ) : filteredDeliveries?.length === 0 ? (
            <EmptyState
              title="No encontramos entregas"
              text="Prueba con otro código, nombre o correo institucional."
            />
          ) : (
            <div className="space-y-3">
              {filteredDeliveries?.map((delivery) => (
                <article
                  key={`${delivery.foundItem.code}-${delivery.deliveredAt}`}
                  className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-mono text-blue-700">
                        {delivery.foundItem.code}
                      </strong>
                      <span className="text-sm text-neutral-700">
                        {delivery.foundItem.description}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-neutral-800">
                      {delivery.recipient.name}
                    </p>
                    <p className="truncate text-sm text-neutral-500">
                      {delivery.recipient.email}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Código universitario: {delivery.recipient.universityCode}
                    </p>
                  </div>
                  <time
                    dateTime={delivery.deliveredAt}
                    className="text-sm font-medium text-neutral-600 sm:text-right"
                  >
                    {formatDate(delivery.deliveredAt)}
                  </time>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={activeSection === 'delivery' ? '' : 'hidden'}>
          <SectionHeader
            title="Registrar entrega"
            subtitle="Verifica la propiedad en persona antes de registrar la entrega."
          />
          {deliveryDraft ? (
            <form
              onSubmit={confirmDelivery}
              className="max-w-2xl space-y-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-5"
            >
              <Field id="delivery-item-code" label="Código del objeto a entregar">
                <input
                  id="delivery-item-code"
                  className={`${INPUT_CLASSES} font-mono uppercase`}
                  value={deliveryDraft.foundItemCode}
                  onChange={(event) => updateDelivery('foundItemCode', event.target.value)}
                />
              </Field>
              <Field id="delivery-report-code" label="Código del reporte (opcional)">
                <input
                  id="delivery-report-code"
                  className={`${INPUT_CLASSES} font-mono uppercase`}
                  value={deliveryDraft.lostReportCode ?? ''}
                  onChange={(event) => updateDelivery('lostReportCode', event.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="delivery-recipient-name" label="Nombre de quien recibe">
                  <input
                    id="delivery-recipient-name"
                    className={INPUT_CLASSES}
                    value={deliveryDraft.recipientName}
                    onChange={(event) => updateDelivery('recipientName', event.target.value)}
                  />
                </Field>
                <Field id="delivery-recipient-code" label="Código universitario">
                  <input
                    id="delivery-recipient-code"
                    className={INPUT_CLASSES}
                    value={deliveryDraft.recipientUniversityCode}
                    onChange={(event) => updateDelivery('recipientUniversityCode', event.target.value)}
                  />
                </Field>
              </div>
              <Field id="delivery-recipient-email" label="Correo institucional">
                <input
                  id="delivery-recipient-email"
                  type="email"
                  className={INPUT_CLASSES}
                  value={deliveryDraft.recipientEmail}
                  onChange={(event) => updateDelivery('recipientEmail', event.target.value)}
                />
              </Field>
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-blue-700">
                Al confirmar, el objeto pasará a <b>Entregado</b>, dejará de verse en el
                catálogo y el reporte vinculado quedará como <b>Recuperado</b>.
              </div>
              <Button
                type="submit"
                isLoading={isDelivering}
                loadingText="Registrando entrega…"
              >
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                Confirmar entrega
              </Button>
            </form>
          ) : (
            <EmptyState
              title="Selecciona un objeto"
              text="Elige un objeto en custodia o un recojo pendiente para registrar su entrega."
            />
          )}
        </section>
      </main>
    </div>
  );
}
