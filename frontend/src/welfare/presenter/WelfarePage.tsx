import { useEffect, useState, type FormEvent } from 'react';
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
import { PublishButton } from '../../matching/presenter/PublishButton';

type WelfarePageProps = {
  welfareService: WelfareService;
  matchesService: MatchesService;
};

export function WelfarePage({ welfareService, matchesService }: WelfarePageProps) {
  const [lostReports, setLostReports] = useState<WelfareLostReportView[] | null>(null);
  const [lostReportsError, setLostReportsError] = useState(false);
  const [lostReportCode, setLostReportCode] = useState('');
  const [selectedLostReport, setSelectedLostReport] = useState<WelfareLostReportView | null>(
    null,
  );
  const [lostReportMessage, setLostReportMessage] = useState<string | null>(null);
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

  async function searchLostReport(event: FormEvent) {
    event.preventDefault();
    setLostReportMessage(null);
    try {
      const result = await welfareService.findLostReportByCode(lostReportCode);
      if (result.status === 'FOUND') {
        setSelectedLostReport(result.report);
        return;
      }
      setSelectedLostReport(null);
      setLostReportMessage('No encontramos un reporte activo con ese código');
    } catch {
      setSelectedLostReport(null);
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
  }

  function startItemDelivery(item: WelfareFoundItemView) {
    setDeliveryDraft({
      foundItemCode: item.code,
      lostReportCode: '',
      recipientName: '',
      recipientEmail: '',
      recipientUniversityCode: '',
    });
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

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-blue-700">Panel de Bienestar</h1>
      <form onSubmit={search} className="flex items-end gap-3">
        <div className="flex-1">
          <Field id="found-item-code" label="Código del objeto">
            <input id="found-item-code" className={INPUT_CLASSES} value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
        </div>
        <Button type="submit">Buscar</Button>
      </form>
      {message && <Alert>{message}</Alert>}

      {deliveryDraft && (
        <form
          onSubmit={confirmDelivery}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-5"
        >
          <h2 className="text-lg font-semibold text-blue-700">Registrar entrega</h2>
          <Field id="delivery-item-code" label="Código del objeto a entregar">
            <input
              id="delivery-item-code"
              className={INPUT_CLASSES}
              value={deliveryDraft.foundItemCode}
              onChange={(event) => updateDelivery('foundItemCode', event.target.value)}
            />
          </Field>
          <Field id="delivery-report-code" label="Código del reporte (opcional)">
            <input
              id="delivery-report-code"
              className={INPUT_CLASSES}
              value={deliveryDraft.lostReportCode ?? ''}
              onChange={(event) => updateDelivery('lostReportCode', event.target.value)}
            />
          </Field>
          <Field id="delivery-recipient-name" label="Nombre de quien recibe">
            <input
              id="delivery-recipient-name"
              className={INPUT_CLASSES}
              value={deliveryDraft.recipientName}
              onChange={(event) => updateDelivery('recipientName', event.target.value)}
            />
          </Field>
          <Field id="delivery-recipient-email" label="Correo institucional">
            <input
              id="delivery-recipient-email"
              className={INPUT_CLASSES}
              value={deliveryDraft.recipientEmail}
              onChange={(event) => updateDelivery('recipientEmail', event.target.value)}
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
          <Button type="submit" disabled={delivering}>
            Confirmar entrega
          </Button>
        </form>
      )}

      {selected && (
        <section className="rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
          <h2 className="text-lg font-semibold text-blue-700">Detalle del objeto</h2>
          <dl>
            <InfoRow label="Código" value={selected.code} />
            <InfoRow label="Descripción" value={selected.description} />
            <InfoRow label="Categoría" value={selected.category} />
            <InfoRow label="Lugar" value={selected.place} />
            {selected.classroom && <InfoRow label="Aula" value={selected.classroom} />}
            {selected.finder && <><InfoRow label="Hallador" value={selected.finder.name} /><InfoRow label="Correo" value={selected.finder.email} /></>}
          </dl>
          <Button onClick={receive} disabled={receiving} className="mt-4">
            Confirmar recepción
          </Button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-blue-700">Reportes de pérdida activos</h2>
        <form onSubmit={searchLostReport} className="flex items-end gap-3">
          <div className="flex-1">
            <Field id="lost-report-code" label="Código del reporte">
              <input
                id="lost-report-code"
                className={INPUT_CLASSES}
                value={lostReportCode}
                onChange={(event) => setLostReportCode(event.target.value)}
              />
            </Field>
          </div>
          <Button type="submit">Buscar reporte</Button>
        </form>
        {lostReportMessage && <Alert>{lostReportMessage}</Alert>}
        {selectedLostReport && (
          <section className="rounded-2xl border border-neutral-200 bg-neutral-0 p-5">
            <h3 className="text-lg font-semibold text-blue-700">Detalle del reporte</h3>
            <dl>
              <InfoRow label="Código" value={selectedLostReport.code} />
              <InfoRow label="Descripción" value={selectedLostReport.description} />
              <InfoRow label="Categoría" value={selectedLostReport.category} />
              <InfoRow label="Propietario" value={selectedLostReport.owner.name} />
              <InfoRow label="Correo" value={selectedLostReport.owner.email} />
            </dl>
            <StatusChip status={selectedLostReport.status} />
          </section>
        )}
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
          <div className="grid gap-3 md:grid-cols-2">
            {lostReports.map((report) => (
              <article
                key={report.code}
                className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
              >
                <Thumb category={report.category} photoUrl={report.photoUrl} />
                <div className="space-y-1">
                  <strong>{report.code}</strong>
                  <p>{report.description}</p>
                  <StatusChip status={report.status} />
                  <p>{report.owner.name}</p>
                  <p>{report.owner.email}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-blue-700">Recojos pendientes</h2>
        {pendingPickupsError ? (
          <Alert>No pudimos cargar los recojos pendientes</Alert>
        ) : pendingPickups === null ? (
          <p>Cargando recojos pendientes...</p>
        ) : pendingPickups.length === 0 ? (
          <EmptyState
            title="No hay recojos pendientes"
            text="Ningún propietario indicó que pasará a recoger un objeto."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pendingPickups.map((pickup) => (
              <article key={pickup.matchId} className="space-y-1 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                <strong>{pickup.owner.name}</strong>
                <p>{pickup.owner.email}</p>
                <p>Reporte: <span>{pickup.report.code}</span></p>
                <p>Objeto: <span>{pickup.foundItem.code}</span></p>
                <p>{pickup.foundItem.description}</p>
                <Button onClick={() => startPickupDelivery(pickup)} className="mt-3">
                  Registrar entrega
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-blue-700">Objetos pendientes de recepción</h2>
        {items === null ? (
          <p>Cargando objetos pendientes...</p>
        ) : items.length === 0 ? (
          <EmptyState title="No hay objetos pendientes" text="No quedan objetos por recibir en la oficina." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <article key={item.code} className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
                <Thumb category={item.category} photoUrl={item.photoUrl} />
                <div><strong>{item.code}</strong><p>{item.description}</p><StatusChip status={item.status} /></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-blue-700">Objetos en la oficina</h2>
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
                  <div>
                    <strong>{item.code}</strong>
                    <p>{item.description}</p>
                    <StatusChip status={displayedStatus} />
                    <p>{displayedStatus === 'PUBLISHED' ? 'Publicado' : 'No publicado'}</p>
                    {item.status === 'IN_CUSTODY' && (
                      <PublishButton
                        itemCode={item.code}
                        matchesService={matchesService}
                        onPublished={() =>
                          setPublishedCodes((current) => new Set(current).add(item.code))
                        }
                      />
                    )}
                    <Button onClick={() => startItemDelivery(item)} className="mt-3">
                      Registrar entrega
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}
