import type { WelfareFoundItemView } from '@shared/welfare';
import type { ApiFetch } from '../../core/data/api';

export type WelfareResult =
  | { status: 'FOUND'; item: WelfareFoundItemView }
  | { status: 'NOT_FOUND' }
  | { status: 'ALREADY_RECEIVED' };

export type WelfareService = {
  listPending: () => Promise<WelfareFoundItemView[]>;
  listInOffice: () => Promise<WelfareFoundItemView[]>;
  findByCode: (code: string) => Promise<WelfareResult>;
  receive: (code: string) => Promise<WelfareResult>;
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
  };
}
