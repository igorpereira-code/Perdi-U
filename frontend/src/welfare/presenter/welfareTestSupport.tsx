import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  WelfareDeliveryView,
  WelfareFoundItemView,
  WelfareLostReportView,
  WelfarePendingPickupView,
} from '@shared/welfare';
import type { MatchesService } from '../../matching/data/matchesService';
import type { WelfareService } from '../data/welfareService';
import { WelfarePage } from './WelfarePage';

export const item: WelfareFoundItemView = {
  code: 'HZ-0005', description: 'Mochila negra con cuadernos', photoUrl: null,
  category: 'Mochilas', place: 'Bloque A', classroom: 'Aula 3',
  categoryId: 1, placeId: 1, classroomId: 3,
  placeReference: 'Debajo de una mesa', foundAt: '2026-10-15T14:00:00.000Z',
  status: 'PENDING_DROP_OFF', visibility: 'VISIBLE',
  finder: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
};

export const inCustodyItem: WelfareFoundItemView = {
  ...item, code: 'HZ-0004', description: 'Calculadora gris', status: 'IN_CUSTODY',
};

export const publishedItem: WelfareFoundItemView = {
  ...item, code: 'HZ-0003', description: 'Chamarra azul', status: 'PUBLISHED',
};

export const pendingPickup: WelfarePendingPickupView = {
  matchId: 'match-1',
  owner: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
  report: { code: 'PR-0001' },
  foundItem: { code: 'HZ-0001', description: 'Celular Samsung con funda azul' },
};

export const completedDelivery: WelfareDeliveryView = {
  foundItem: { code: 'HZ-0008', description: 'Paraguas negro' },
  recipient: { name: 'Luis Mamani', email: 'luis.mamani@ucb.edu.bo', universityCode: '20201234' },
  deliveredAt: '2026-11-16T03:00:00.000Z',
};

export const activeLostReport: WelfareLostReportView = {
  code: 'PR-0001',
  description: 'Celular Samsung con funda azul',
  photoUrl: null,
  category: 'Electrónicos',
  dateFrom: '2026-10-10T00:00:00.000Z',
  dateTo: '2026-10-11T00:00:00.000Z',
  status: 'HAS_MATCHES',
  owner: { name: 'Ana Rojas', email: 'ana.rojas@ucb.edu.bo' },
};

export function service(overrides: Partial<WelfareService> = {}): WelfareService {
  return {
    listActiveLostReports: jest.fn().mockResolvedValue([]),
    findLostReportByCode: jest.fn(),
    listPendingPickups: jest.fn().mockResolvedValue([]),
    listDeliveries: jest.fn().mockResolvedValue([completedDelivery]),
    listPending: jest.fn().mockResolvedValue([item]),
    listInOffice: jest.fn().mockResolvedValue([inCustodyItem, publishedItem]),
    getCatalogs: jest.fn().mockResolvedValue({
      categories: [{ id: 1, name: 'Mochilas' }, { id: 2, name: 'Otros' }],
      places: [
        { id: 1, name: 'Bloque A', type: 'BLOCK', classrooms: [{ id: 3, name: 'Aula 3' }] },
        { id: 4, name: 'Biblioteca', type: 'SPACE', classrooms: [] },
      ],
    }),
    registerFoundItem: jest.fn().mockResolvedValue({ code: 'HZ-0042', status: 'IN_CUSTODY' }),
    findFoundItemByCode: jest.fn().mockResolvedValue({ status: 'FOUND', item }),
    confirmReception: jest.fn(),
    deletePending: jest.fn().mockResolvedValue(true),
    setPublishedVisibility: jest.fn(),
    updatePublishedItem: jest.fn(),
    deliver: jest.fn(),
    ...overrides,
  };
}

export function publishingService(): MatchesService {
  return {
    getMatches: jest.fn().mockResolvedValue([]),
    pickUp: jest.fn(),
    dismiss: jest.fn(),
    publish: jest.fn().mockResolvedValue({ status: 'PUBLISHED', matchCount: 2, visibility: 'VISIBLE' }),
  };
}

export function renderPage(
  welfareService: WelfareService = service(),
  matchesService: MatchesService = publishingService(),
) {
  return render(<WelfarePage welfareService={welfareService} matchesService={matchesService} />);
}

export async function openRequests() {
  await userEvent.click(screen.getByRole('button', { name: /^Solicitudes de hallazgo/ }));
}
