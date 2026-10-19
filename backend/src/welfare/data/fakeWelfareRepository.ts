import type {
  DeliveryRegistration,
  WelfareFoundItem,
  WelfareRepository,
} from './welfareRepository';
import type { LostReportStatus, MatchStatus } from '@shared/statuses';
import type { WelfarePendingPickupView } from '@shared/welfare';

type FakePendingPickup = WelfarePendingPickupView & {
  matchStatus: MatchStatus;
  reportStatus: LostReportStatus;
};

/** In-memory welfare repository for tests. It never touches the shared database. */
export function fakeWelfareRepository(
  initialItems: WelfareFoundItem[],
  initialPickups: FakePendingPickup[] = [],
) {
  const items = initialItems.map((item) => ({ ...item, finder: item.finder && { ...item.finder } }));
  const pickups = initialPickups.map((pickup) => ({
    ...pickup,
    owner: { ...pickup.owner },
    report: { ...pickup.report },
    foundItem: { ...pickup.foundItem },
  }));
  const deliveries: DeliveryRegistration[] = [];

  const repository: WelfareRepository = {
    listPendingPickups: async () =>
      pickups
        .filter(
          (pickup) =>
            pickup.matchStatus === 'WILL_PICK_UP' && pickup.reportStatus === 'PENDING_PICKUP',
        )
        .map(({ matchStatus: _matchStatus, reportStatus: _reportStatus, ...pickup }) => pickup),
    listPending: async () =>
      items
        .filter((item) => item.status === 'PENDING_DROP_OFF')
        .map((item) => ({ ...item, finder: item.finder && { ...item.finder } })),
    listInOffice: async () =>
      items
        .filter((item) => item.status === 'IN_CUSTODY' || item.status === 'PUBLISHED')
        .map((item) => ({ ...item, finder: item.finder && { ...item.finder } })),
    findByCode: async (code) => {
      const item = items.find((candidate) => candidate.code === code);
      return item ? { ...item, finder: item.finder && { ...item.finder } } : null;
    },
    receivePending: async (itemId, receivedById, receivedAt) => {
      const item = items.find((candidate) => candidate.id === itemId);
      if (!item || item.status !== 'PENDING_DROP_OFF') {
        return false;
      }
      item.status = 'IN_CUSTODY';
      item.receivedById = receivedById;
      item.receivedAt = receivedAt;
      return true;
    },
    deliver: async (delivery) => {
      const item = items.find((candidate) => candidate.code === delivery.foundItemCode);
      if (!item || !['IN_CUSTODY', 'PUBLISHED'].includes(item.status)) {
        return { status: 'ITEM_NOT_AVAILABLE' };
      }
      const pickup = delivery.lostReportCode
        ? pickups.find(
            (candidate) =>
              candidate.report.code === delivery.lostReportCode &&
              candidate.foundItem.code === item.code &&
              candidate.owner.email.toLowerCase() === delivery.recipientEmail &&
              candidate.matchStatus === 'WILL_PICK_UP' &&
              candidate.reportStatus === 'PENDING_PICKUP',
          )
        : null;
      if (delivery.lostReportCode && !pickup) {
        return { status: 'REPORT_NOT_ELIGIBLE' };
      }
      item.status = 'DELIVERED';
      if (pickup) {
        pickup.reportStatus = 'RECOVERED';
      }
      deliveries.push({ ...delivery });
      return { status: 'DELIVERED', foundItemCode: item.code };
    },
  };

  return { repository, items, pickups, deliveries };
}
