import type {
  WelfareFoundItemView,
  WelfareLostReportView,
  WelfarePendingPickupView,
} from '@shared/welfare';
import type { ApiFetch } from '../../core/data/api';

export type WelfareResult =
  | { status: 'FOUND'; item: WelfareFoundItemView }
  | { status: 'NOT_FOUND' }
  | { status: 'ALREADY_RECEIVED' };

export type DeliveryInput = {
  foundItemCode: string;
  lostReportCode?: string;
  recipientName: string;
  recipientEmail: string;
  recipientUniversityCode: string;
};

export type DeliveryResult =
  | { status: 'DELIVERED'; foundItemCode: string }
  | { status: 'ITEM_NOT_AVAILABLE' }
  | { status: 'REPORT_NOT_ELIGIBLE' }
  | { status: 'INVALID_DELIVERY_DATA' }
  | { status: 'INVALID_RECIPIENT_EMAIL' };

export type WelfareService = {
  listActiveLostReports: () => Promise<WelfareLostReportView[]>;
  listPendingPickups: () => Promise<WelfarePendingPickupView[]>;
  listPending: () => Promise<WelfareFoundItemView[]>;
  listInOffice: () => Promise<WelfareFoundItemView[]>;
  findByCode: (code: string) => Promise<WelfareResult>;
  receive: (code: string) => Promise<WelfareResult>;
  deliver: (delivery: DeliveryInput) => Promise<DeliveryResult>;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

async function itemResult(response: Response): Promise<WelfareResult> {
  if (response.ok) {
    return { status: 'FOUND', item: await response.json() };
  }
  if (response.status === 404) {
    return { status: 'NOT_FOUND' };
  }
  if (response.status === 409) {
    return { status: 'ALREADY_RECEIVED' };
  }
  throw new Error('No se pudo consultar Bienestar');
}

export function createWelfareService(apiFetch: ApiFetch): WelfareService {
  return {
    listActiveLostReports: async () => {
      const response = await apiFetch('/welfare/lost-reports');
      if (!response.ok) {
        throw new Error('No se pudieron consultar los reportes de pérdida');
      }
      return response.json();
    },
    listPendingPickups: async () => {
      const response = await apiFetch('/welfare/pending-pickups');
      if (!response.ok) {
        throw new Error('No se pudo consultar Bienestar');
      }
      return response.json();
    },
    listPending: async () => {
      const response = await apiFetch('/welfare/found-items/pending');
      if (!response.ok) {
        throw new Error('No se pudo consultar Bienestar');
      }
      return response.json();
    },
    listInOffice: async () => {
      const response = await apiFetch('/welfare/found-items/in-office');
      if (!response.ok) {
        throw new Error('No se pudo consultar Bienestar');
      }
      return response.json();
    },
    findByCode: async (code) =>
      itemResult(await apiFetch(`/welfare/found-items/${normalizeCode(code)}`)),
    receive: async (code) =>
      itemResult(
        await apiFetch(`/welfare/found-items/${normalizeCode(code)}/receive`, { method: 'POST' }),
      ),
    deliver: async (delivery) => {
      const response = await apiFetch('/welfare/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...delivery,
          foundItemCode: normalizeCode(delivery.foundItemCode),
          lostReportCode: delivery.lostReportCode
            ? normalizeCode(delivery.lostReportCode)
            : undefined,
          recipientEmail: delivery.recipientEmail.trim().toLowerCase(),
        }),
      });
      if (response.ok || response.status === 400 || response.status === 409) {
        return response.json();
      }
      throw new Error('No se pudo registrar la entrega');
    },
  };
}
