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
    registerFoundItem: async (registration) => {
      const code = `HZ-${String(foundItems.length + 1).padStart(4, '0')}`;
      foundItems.push({
        id: `item-${foundItems.length + 1}`,
        code,
        description: registration.description,
        photoUrl: registration.photoUrl ?? null,
        category: `Categoría ${registration.categoryId}`,
        categoryId: registration.categoryId,
        place: `Lugar ${registration.placeId}`,
        placeId: registration.placeId,
        classroom: null,
        classroomId: registration.classroomId,
        placeReference: registration.placeReference,
        foundAt: registration.foundAt,
        status: 'IN_CUSTODY',
        visibility: 'VISIBLE',
        finder: null,
        receivedById: registration.receivedById,
        receivedAt: registration.receivedAt,
      });
      return { code, status: 'IN_CUSTODY' };
    },
    confirmPendingReception: async (itemId, receivedById, receivedAt, correction) => {
      const foundItem = foundItems.find((candidate) => candidate.id === itemId);
      if (!foundItem || foundItem.status !== 'PENDING_DROP_OFF') {
        return null;
      }
      Object.assign(foundItem, correction);
      foundItem.status = 'IN_CUSTODY';
      foundItem.receivedById = receivedById;
      foundItem.receivedAt = receivedAt;
      return { ...foundItem, finder: foundItem.finder && { ...foundItem.finder } };
    },
    deletePending: async (itemId) => {
      const index = foundItems.findIndex(
        (candidate) => candidate.id === itemId && candidate.status === 'PENDING_DROP_OFF',
      );
      if (index < 0) {
        return false;
      }
      foundItems.splice(index, 1);
      return true;
    },
    updatePublishedVisibility: async (itemId, visibility) => {
      const foundItem = foundItems.find(
        (candidate) => candidate.id === itemId && candidate.status === 'PUBLISHED',
      );
      if (!foundItem) {
        return false;
      }
      foundItem.visibility = visibility;
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
