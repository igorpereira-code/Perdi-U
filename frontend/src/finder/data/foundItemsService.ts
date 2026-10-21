import { FOUND_ITEM_STATUS_LABEL, type FoundItemStatus } from '@shared/statuses';
import type { ApiFetch } from '../../core/data/api';

export type FoundItemCatalogs = {
  categories: { id: number; name: string }[];
  places: { id: number; name: string; type: 'BLOCK' | 'SPACE'; classrooms: { id: number; name: string }[] }[];
};
export type FoundItemPayload = {
  description: string;
  categoryId: number;
  placeId: number;
  classroomId: number | null;
  placeReference: string | null;
  foundAt: string;
};
export type FoundItemCreated = { code: string; status: 'PENDING_DROP_OFF' };
export type MyFoundItem = {
  code: string;
  description: string;
  category: string;
  foundAt: string;
  hasPhoto: boolean;
  status: FoundItemStatus;
  receivedAt: string | null;
};
export type FoundItemsService = {
  listMine: () => Promise<MyFoundItem[]>;
  getMineByCode: (code: string) => Promise<MyFoundItem | null>;
  getCatalogs: () => Promise<FoundItemCatalogs>;
  create: (report: FoundItemPayload, photo: File | null) => Promise<FoundItemCreated>;
  getPhotoUrl: (code: string) => Promise<{ url: string; expiresIn: number }>;
};

function isMyFoundItem(value: unknown): value is MyFoundItem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Partial<MyFoundItem>;
  return typeof item.code === 'string' && /^HZ-\d+$/.test(item.code)
    && typeof item.description === 'string' && typeof item.category === 'string'
    && typeof item.foundAt === 'string' && !Number.isNaN(Date.parse(item.foundAt))
    && typeof item.hasPhoto === 'boolean'
    && typeof item.status === 'string' && Object.hasOwn(FOUND_ITEM_STATUS_LABEL, item.status)
    && (item.receivedAt === null || (typeof item.receivedAt === 'string' && !Number.isNaN(Date.parse(item.receivedAt))));
}

function isPhotoUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function createFoundItemsService(apiFetch: ApiFetch): FoundItemsService {
  async function request(path: string, fallback: string, init?: RequestInit, options: { allowNotFound?: boolean } = {}) {
    let response: Response;
    try {
      response = await (init ? apiFetch(path, init) : apiFetch(path));
    } catch {
      throw new Error(fallback);
    }
    if (options.allowNotFound && response.status === 404) {
      return { response, body: null };
    }
    let body;
    try { body = await response.json(); } catch { throw new Error(fallback); }
    if (!response.ok) {
      throw new Error(typeof body?.error === 'string' ? body.error : fallback);
    }
    return { response, body };
  }

  return {
    getMineByCode: async (code) => {
      const fallback = 'No se pudo cargar el reporte. Intenta nuevamente.';
      const { response, body } = await request(`/my-found-items/${encodeURIComponent(code)}`, fallback, undefined, { allowNotFound: true });
      if (response.status === 404) {
        return null;
      }
      if (!isMyFoundItem(body) || body.code !== code) {
        throw new Error(fallback);
      }
      return body;
    },
    listMine: async () => {
      const fallback = 'No se pudieron cargar tus reportes. Intenta nuevamente.';
      const { body } = await request('/my-found-items', fallback);
      if (!Array.isArray(body) || !body.every(isMyFoundItem)) {
        throw new Error(fallback);
      }
      return body;
    },
    getCatalogs: async () => {
      const { body } = await request('/found-items/catalogs', 'No se pudieron cargar las categorías y ubicaciones. Intenta nuevamente.');
      if (!Array.isArray(body?.categories) || !Array.isArray(body?.places)) {
        throw new Error('No se pudieron cargar las categorías y ubicaciones. Intenta nuevamente.');
      }
      return body;
    },
    create: async (report, photo) => {
      let init: RequestInit;
      if (photo) {
        const form = new FormData();
        form.append('report', JSON.stringify(report));
        form.append('photo', photo);
        init = { method: 'POST', body: form };
      } else {
        init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) };
      }
      const { response, body } = await request('/found-items', 'No se pudo enviar el reporte. Intenta nuevamente.', init);
      if (response.status !== 201 || typeof body?.code !== 'string' || !/^HZ-\d+$/.test(body.code)
        || body.status !== 'PENDING_DROP_OFF') {
        throw new Error('No se pudo confirmar el código del reporte.');
      }
      return body;
    },
    getPhotoUrl: async (code) => {
      const fallback = 'No se pudo consultar la fotografía. Intenta nuevamente.';
      const { body } = await request(`/found-items/${encodeURIComponent(code)}/photo`, fallback);
      if (!isPhotoUrl(body?.url) || !Number.isInteger(body?.expiresIn) || body.expiresIn <= 0) {
        throw new Error(fallback);
      }
      return body;
    },
  };
}
