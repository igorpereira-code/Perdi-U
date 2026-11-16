import { useEffect, useState, type FormEvent } from 'react';
import { Archive, FileSearch, HandCoins, Inbox, PackageCheck, Search } from 'lucide-react';
import type {
  WelfareFoundItemView,
  WelfareLostReportView,
  WelfarePendingPickupView,
} from '@shared/welfare';
import type { DeliveryInput, WelfareService } from '../data/welfareService';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { InfoRow } from '../../core/presenter/InfoRow';
import { StatusChip } from '../../core/presenter/StatusChip';
import { Thumb } from '../../core/presenter/Thumb';
import type { MatchesService } from '../../matching/data/matchesService';
import type { MatchView } from '@shared/matching';
import { PublishButton } from '../../matching/presenter/PublishButton';

type WelfarePageProps = {
  welfareService: WelfareService;
  matchesService: MatchesService;
};

type WelfareSection = 'reports' | 'requests' | 'custody' | 'pickups' | 'delivery';

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
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
  const [lostReportsError, setLostReportsError] = useState(false);
  const [lostReportCode, setLostReportCode] = useState('');
  const [selectedLostReport, setSelectedLostReport] = useState<WelfareLostReportView | null>(null);
  const [lostReportMessage, setLostReportMessage] = useState<string | null>(null);
  const [lostReportMatches, setLostReportMatches] = useState<MatchView[] | null>(null);
  const [pendingPickups, setPendingPickups] = useState<WelfarePendingPickupView[] | null>(null);
  const [pendingPickupsError, setPendingPickupsError] = useState(false);
  const [items, setItems] = useState<WelfareFoundItemView[] | null>(null);
  const [inOfficeItems, setInOfficeItems] = useState<WelfareFoundItemView[] | null>(null);
  const [publishedCodes, setPublishedCodes] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<WelfareFoundItemView | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryInput | null>(null);
  const [delivering, setDelivering] = useState(false);

  useEffect(() => {
    welfareService
      .listActiveLostReports()
      .then(setLostReports)
      .catch(() => {
        setLostReports([]);
        setLostReportsError(true);
      });
  }, [welfareService]);

  async function showLostReport(report: WelfareLostReportView) {
    setSelectedLostReport(report);
    setLostReportMatches(null);
    try {
      const matches = await matchesService.getMatches(report.code);
      if (matches === null) {
        setLostReportMessage('No pudimos cargar los objetos parecidos');
      } else {
        setLostReportMatches(matches);
      }
    } catch {
      setLostReportMessage('No pudimos cargar los objetos parecidos');
    }
  }

  async function searchLostReport(event: FormEvent) {
    event.preventDefault();
    setLostReportMessage(null);
    try {
      const result = await welfareService.findLostReportByCode(lostReportCode);
      if (result.status === 'FOUND') {
        await showLostReport(result.report);
        return;
      }
      setSelectedLostReport(null);
      setLostReportMatches(null);
      setLostReportMessage('No encontramos un reporte activo con ese código');
    } catch {
      setSelectedLostReport(null);
      setLostReportMatches(null);
      setLostReportMessage('No pudimos buscar el reporte');
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
    if (!deliveryDraft || delivering) {
      return;
    }
    setDelivering(true);
    setMessage(null);
    try {
      const result = await welfareService.deliver(deliveryDraft);
      if (result.status !== 'DELIVERED') {
        setMessage(
          result.status === 'REPORT_NOT_ELIGIBLE'
            ? 'El reporte no corresponde a este objeto o propietario'
            : result.status === 'ITEM_NOT_AVAILABLE'
              ? 'El objeto ya no está disponible para entrega'
              : result.status === 'INVALID_RECIPIENT_EMAIL'
                ? 'Ingresa un correo institucional válido'
                : 'Completa todos los datos obligatorios',
        );
        return;
      }
      setPendingPickups((current) =>
        current?.filter((pickup) => pickup.foundItem.code !== result.foundItemCode) ?? [],
      );
      setInOfficeItems((current) =>
        current?.filter((item) => item.code !== result.foundItemCode) ?? [],
      );
      setDeliveryDraft(null);
      setActiveSection('custody');
      setMessage('Entrega registrada correctamente');
    } catch {
      setMessage('No pudimos registrar la entrega');
    } finally {
      setDelivering(false);
    }
  }

  useEffect(() => {
    welfareService
      .listPendingPickups()
      .then(setPendingPickups)
      .catch(() => {
        setPendingPickups([]);
        setPendingPickupsError(true);
      });
  }, [welfareService]);

  useEffect(() => {
    welfareService
      .listPending()
      .then(setItems)
      .catch(() => {
        setItems([]);
        setMessage('No pudimos cargar los objetos pendientes');
      });
  }, [welfareService]);

  useEffect(() => {
    welfareService
      .listInOffice()
      .then((loadedItems) =>
        setInOfficeItems((current) => {
          if (current === null) {
            return loadedItems;
          }
          const currentCodes = new Set(current.map((item) => item.code));
          return [...loadedItems.filter((item) => !currentCodes.has(item.code)), ...current];
        }),
      )
      .catch(() => setInOfficeItems((current) => current ?? []));
  }, [welfareService]);

  async function search(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      const result = await welfareService.findByCode(code);
      if (result.status === 'FOUND') {
        setSelected(result.item);
        return;
      }
      setSelected(null);
      setMessage(
        result.status === 'NOT_FOUND'
          ? 'No encontramos un objeto con ese código'
          : 'Este objeto ya fue recibido',
      );
    } catch {
      setMessage('No pudimos buscar el objeto');
    }
  }

  async function receive() {
    if (!selected || receiving) {
      return;
    }
    setReceiving(true);
    setMessage(null);
    try {
      const result = await welfareService.receive(selected.code);
      if (result.status !== 'FOUND') {
        setMessage('Este objeto ya fue recibido');
        return;
      }
      setItems((current) => current?.filter((item) => item.code !== selected.code) ?? []);
      setInOfficeItems((current) => [...(current ?? []), result.item]);
      setSelected(null);
      setMessage('Objeto recibido y puesto en custodia');
    } catch {
      setMessage('No pudimos confirmar la recepción');
    } finally {
      setReceiving(false);
    }
  }

  const navigation: Array<{
    id: WelfareSection;
    label: string;
    icon: typeof Inbox;
    count?: number;
  }> = [
    { id: 'reports', label: 'Reportes de pérdida', icon: FileSearch, count: lostReports?.length },
    { id: 'requests', label: 'Solicitudes de hallazgo', icon: Inbox, count: items?.length },
    { id: 'custody', label: 'Objetos en custodia', icon: Archive },
    {
      id: 'pickups',
      label: 'Recojos pendientes',
      icon: HandCoins,
      count: pendingPickups?.length,
    },
    { id: 'delivery', label: 'Registrar entrega', icon: PackageCheck },
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
        {message && <div className="mb-4"><Alert>{message}</Alert></div>}

        <section className={activeSection === 'reports' ? '' : 'hidden'}>
          <SectionHeader
            title="Reportes de pérdida activos"
            subtitle="Consulta reportes activos y revisa los objetos encontrados que podrían coincidir."
          />
          <form onSubmit={searchLostReport} className="relative mb-4">
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
            />
            <button type="submit" className="sr-only">Buscar reporte</button>
          </form>
          {lostReportMessage && <div className="mb-4"><Alert>{lostReportMessage}</Alert></div>}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-2">
              {lostReportsError ? (
                <Alert>No pudimos cargar los reportes de pérdida</Alert>
              ) : lostReports === null ? (
                <p>Cargando reportes de pérdida...</p>
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

                  {lostReportMatches !== null && (
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
          <form onSubmit={search} className="relative mb-4">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
            <label htmlFor="found-item-code" className="sr-only">Código del objeto</label>
            <input
              id="found-item-code"
              className={`${INPUT_CLASSES} pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case`}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Buscar por ID, ej. HZ-0007"
            />
            <button type="submit" className="sr-only">Buscar</button>
          </form>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-2">
              <h2 className="sr-only">Objetos pendientes de recepción</h2>
              {items === null ? (
                <p>Cargando objetos pendientes...</p>
              ) : items.length === 0 ? (
                <EmptyState title="No hay objetos pendientes" text="No quedan objetos por recibir en la oficina." />
              ) : (
                items.map((item) => (
                  <article key={item.code}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`flex w-full items-center gap-3 rounded-2xl border bg-neutral-0 p-3 text-left ${
                        selected?.code === item.code
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
              {selected ? (
                <section className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-mono text-2xl font-bold text-blue-700">{selected.code}</h2>
                    <StatusChip status={selected.status} />
                  </div>
                  <Thumb category={selected.category} photoUrl={selected.photoUrl} />
                  <dl>
                    <InfoRow label="Descripción" value={selected.description} />
                    <InfoRow label="Categoría" value={selected.category} />
                    <InfoRow label="Lugar" value={selected.place} />
                    {selected.classroom && <InfoRow label="Aula" value={selected.classroom} />}
                    {selected.finder && (
                      <>
                        <InfoRow label="Hallador" value={selected.finder.name} />
                        <InfoRow label="Correo" value={selected.finder.email} />
                      </>
                    )}
                  </dl>
                  <Button onClick={receive} disabled={receiving} className="w-full">
                    <PackageCheck className="h-4 w-4" aria-hidden="true" />
                    Confirmar recepción
                  </Button>
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
          {inOfficeItems === null ? (
            <p>Cargando objetos en la oficina...</p>
          ) : inOfficeItems.length === 0 ? (
            <EmptyState title="No hay objetos en la oficina" text="No quedan objetos bajo custodia." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {inOfficeItems.map((item) => {
                const displayedStatus = publishedCodes.has(item.code) ? 'PUBLISHED' : item.status;
                return (
                  <article key={item.code} className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                    <Thumb category={item.category} photoUrl={item.photoUrl} />
                    <div className="min-w-0 flex-1">
                      <strong className="font-mono text-blue-700">{item.code}</strong>
                      <p className="text-sm text-neutral-700">{item.description}</p>
                      <div className="mt-2"><StatusChip status={displayedStatus} /></div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {displayedStatus === 'PUBLISHED' ? 'Publicado' : 'No publicado'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.status === 'IN_CUSTODY' && (
                          <PublishButton
                            itemCode={item.code}
                            matchesService={matchesService}
                            onPublished={() =>
                              setPublishedCodes((current) => new Set(current).add(item.code))
                            }
                          />
                        )}
                        <Button onClick={() => startItemDelivery(item)} variant="outline">
                          Registrar entrega
                        </Button>
                      </div>
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
          {pendingPickupsError ? (
            <Alert>No pudimos cargar los recojos pendientes</Alert>
          ) : pendingPickups === null ? (
            <p>Cargando recojos pendientes...</p>
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
              <Button type="submit" disabled={delivering}>
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
