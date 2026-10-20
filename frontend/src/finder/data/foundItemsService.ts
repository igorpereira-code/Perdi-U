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
export type FoundItemsService = {
  getCatalogs: () => Promise<FoundItemCatalogs>;
  create: (report: FoundItemPayload, photo: File | null) => Promise<FoundItemCreated>;
  getPhotoUrl: (code: string) => Promise<{ url: string; expiresIn: number }>;
};

export function createFoundItemsService(apiFetch: ApiFetch): FoundItemsService {
  async function request(path: string, fallback: string, init?: RequestInit) {
    let response: Response;
    try {
      response = await (init ? apiFetch(path, init) : apiFetch(path));
    } catch {
      throw new Error(fallback);
    }
    let body;
    try { body = await response.json(); } catch { throw new Error(fallback); }
    if (!response.ok) {
      throw new Error(typeof body?.error === 'string' ? body.error : fallback);
    }
    return { response, body };
  }

  return {
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
      const { body } = await request(`/found-items/${encodeURIComponent(code)}/photo`, 'No se pudo consultar la fotografía. Intenta nuevamente.');
      return body;
    },
  };
}
