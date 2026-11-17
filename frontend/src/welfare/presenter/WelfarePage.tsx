import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { WelfareFoundItemView, WelfarePendingPickupView } from '@shared/welfare';
import type { FoundItemCatalogs } from '../../finder/data/foundItemsService';
import type { MatchesService } from '../../matching/data/matchesService';
import { Alert } from '../../core/presenter/Alert';
import type { DeliveryInput, WelfareService } from '../data/welfareService';
import { CustodySection } from './CustodySection';
import { DeliveryFormSection } from './DeliveryFormSection';
import { DeliveryHistorySection } from './DeliveryHistorySection';
import { LostReportsSection } from './LostReportsSection';
import { PendingPickupsSection } from './PendingPickupsSection';
import { PendingRequestsSection } from './PendingRequestsSection';
import { RegisterFoundItemSection } from './RegisterFoundItemSection';
import { WelfareNavigation } from './WelfareNavigation';
import type { WelfareSection } from './welfarePresenter';

type WelfarePageProps = {
  welfareService: WelfareService;
  matchesService: MatchesService;
};

const emptyDelivery: DeliveryInput = {
  foundItemCode: '',
  lostReportCode: '',
  recipientName: '',
  recipientEmail: '',
  recipientUniversityCode: '',
};

export function WelfarePage({ welfareService, matchesService }: WelfarePageProps) {
  const [activeSection, setActiveSection] = useState<WelfareSection>('reports');
  const [counts, setCounts] = useState<Partial<Record<WelfareSection, number>>>({});
  const [catalogs, setCatalogs] = useState<FoundItemCatalogs | null>(null);
  const [receivedItems, setReceivedItems] = useState<WelfareFoundItemView[]>([]);
  const [deliveredCodes, setDeliveredCodes] = useState<string[]>([]);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryInput | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    welfareService.getCatalogs().then(setCatalogs).catch(() => setCatalogs(null));
  }, [welfareService]);

  const updateReportCount = useCallback((count: number) => {
    setCounts((current) => ({ ...current, reports: count }));
  }, []);
  const updateRequestCount = useCallback((count: number) => {
    setCounts((current) => ({ ...current, requests: count }));
  }, []);
  const updatePickupCount = useCallback((count: number) => {
    setCounts((current) => ({ ...current, pickups: count }));
  }, []);

  function selectSection(section: WelfareSection) {
    setActiveSection(section);
    if (section === 'delivery') {
      setDeliveryDraft((current) => current ?? emptyDelivery);
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
    setDeliveryDraft({ ...emptyDelivery, foundItemCode: item.code });
    setActiveSection('delivery');
  }

  function updateDelivery(field: keyof DeliveryInput, value: string) {
    setDeliveryDraft((current) => current ? { ...current, [field]: value } : current);
  }

  async function confirmDelivery(event: FormEvent) {
    event.preventDefault();
    if (!deliveryDraft || isDelivering) {
      return;
    }
    setIsDelivering(true);
    setFeedbackMessage(null);
    try {
      const result = await welfareService.deliver(deliveryDraft);
      if (result.status !== 'DELIVERED') {
        setFeedbackMessage(
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
      setDeliveredCodes((current) => current.includes(result.foundItemCode) ? current : [...current, result.foundItemCode]);
      setDeliveryDraft(null);
      setActiveSection('custody');
      setFeedbackMessage('Entrega registrada correctamente');
    } catch {
      setFeedbackMessage('No pudimos registrar la entrega');
    } finally {
      setIsDelivering(false);
    }
  }

  function rememberReceivedItem(item: WelfareFoundItemView) {
    setReceivedItems((current) => current.some(({ code }) => code === item.code) ? current : [item, ...current]);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
      <WelfareNavigation activeSection={activeSection} counts={counts} onSelect={selectSection} />
      <main className="min-w-0 flex-1">
        {feedbackMessage && <div className="mb-4"><Alert>{feedbackMessage}</Alert></div>}

        <section className={activeSection === 'reports' ? '' : 'hidden'}>
          <LostReportsSection welfareService={welfareService} matchesService={matchesService} onCountChange={updateReportCount} />
        </section>
        <section className={activeSection === 'requests' ? '' : 'hidden'}>
          <PendingRequestsSection welfareService={welfareService} catalogs={catalogs} onCountChange={updateRequestCount} onReceived={rememberReceivedItem} />
        </section>
        <section className={activeSection === 'custody' ? '' : 'hidden'}>
          <CustodySection welfareService={welfareService} matchesService={matchesService} catalogs={catalogs} receivedItems={receivedItems} deliveredCodes={deliveredCodes} onStartDelivery={startItemDelivery} />
        </section>
        <section className={activeSection === 'pickups' ? '' : 'hidden'}>
          <PendingPickupsSection welfareService={welfareService} deliveredCodes={deliveredCodes} onCountChange={updatePickupCount} onStartDelivery={startPickupDelivery} />
        </section>
        <section className={activeSection === 'register' ? '' : 'hidden'}>
          {activeSection === 'register' && <RegisterFoundItemSection catalogs={catalogs} welfareService={welfareService} />}
        </section>
        <section className={activeSection === 'deliveries' ? '' : 'hidden'}>
          <DeliveryHistorySection welfareService={welfareService} />
        </section>
        <section className={activeSection === 'delivery' ? '' : 'hidden'}>
          <DeliveryFormSection draft={deliveryDraft} isDelivering={isDelivering} onChange={updateDelivery} onSubmit={confirmDelivery} />
        </section>
      </main>
    </div>
  );
}
