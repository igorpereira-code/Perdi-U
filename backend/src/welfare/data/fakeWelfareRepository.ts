import type {
  DeliveryRegistration,
  WelfareFoundItem,
  WelfareLostReport,
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
  initialFoundItems: WelfareFoundItem[],
  initialPendingPickups: FakePendingPickup[] = [],
  initialLostReports: WelfareLostReport[] = [],
) {
  const foundItems = initialFoundItems.map((foundItem) => ({
    ...foundItem,
    finder: foundItem.finder && { ...foundItem.finder },
  }));
  const pendingPickups = initialPendingPickups.map((pendingPickup) => ({
    ...pendingPickup,
    owner: { ...pendingPickup.owner },
    report: { ...pendingPickup.report },
    foundItem: { ...pendingPickup.foundItem },
  }));
  const deliveries: DeliveryRegistration[] = [];
  const lostReports = initialLostReports.map((lostReport) => ({
    ...lostReport,
    owner: { ...lostReport.owner },
  }));

  const repository: WelfareRepository = {
    listActiveLostReports: async () =>
      lostReports
        .filter((lostReport) => lostReport.status !== 'RECOVERED')
        .map((lostReport) => ({ ...lostReport, owner: { ...lostReport.owner } })),
    findActiveLostReportByCode: async (code) => {
      const lostReport = lostReports.find(
        (candidate) => candidate.code === code && candidate.status !== 'RECOVERED',
      );
      return lostReport ? { ...lostReport, owner: { ...lostReport.owner } } : null;
    },
    listPendingPickups: async () =>
      pendingPickups
        .filter(
          (pendingPickup) =>
            pendingPickup.matchStatus === 'WILL_PICK_UP' &&
            pendingPickup.reportStatus === 'PENDING_PICKUP',
        )
        .map(({ matchStatus: _matchStatus, reportStatus: _reportStatus, ...pendingPickup }) =>
          pendingPickup,
        ),
    listPending: async () =>
      foundItems
        .filter((foundItem) => foundItem.status === 'PENDING_DROP_OFF')
        .map((foundItem) => ({
          ...foundItem,
          finder: foundItem.finder && { ...foundItem.finder },
        })),
    listInOffice: async () =>
      foundItems
        .filter(
          (foundItem) => foundItem.status === 'IN_CUSTODY' || foundItem.status === 'PUBLISHED',
        )
        .map((foundItem) => ({
          ...foundItem,
          finder: foundItem.finder && { ...foundItem.finder },
        })),
    findFoundItemByCode: async (code) => {
      const foundItem = foundItems.find((candidate) => candidate.code === code);
      return foundItem
        ? { ...foundItem, finder: foundItem.finder && { ...foundItem.finder } }
        : null;
    },
    confirmPendingReception: async (itemId, receivedById, receivedAt) => {
      const foundItem = foundItems.find((candidate) => candidate.id === itemId);
      if (!foundItem || foundItem.status !== 'PENDING_DROP_OFF') {
        return false;
      }
      foundItem.status = 'IN_CUSTODY';
      foundItem.receivedById = receivedById;
      foundItem.receivedAt = receivedAt;
      return true;
    },
    deliver: async (delivery) => {
      const foundItem = foundItems.find(
        (candidate) => candidate.code === delivery.foundItemCode,
      );
      if (!foundItem || !['IN_CUSTODY', 'PUBLISHED'].includes(foundItem.status)) {
        return { status: 'ITEM_NOT_AVAILABLE' };
      }
      const pendingPickup = delivery.lostReportCode
        ? pendingPickups.find(
            (candidate) =>
              candidate.report.code === delivery.lostReportCode &&
              candidate.foundItem.code === foundItem.code &&
              candidate.owner.email.toLowerCase() === delivery.recipientEmail &&
              candidate.matchStatus === 'WILL_PICK_UP' &&
              candidate.reportStatus === 'PENDING_PICKUP',
          )
        : null;
      if (delivery.lostReportCode && !pendingPickup) {
        return { status: 'REPORT_NOT_ELIGIBLE' };
      }
      foundItem.status = 'DELIVERED';
      if (pendingPickup) {
        pendingPickup.reportStatus = 'RECOVERED';
      }
      deliveries.push({ ...delivery });
      return { status: 'DELIVERED', foundItemCode: foundItem.code };
    },
  };

  return { repository, foundItems, pendingPickups, deliveries };
}
