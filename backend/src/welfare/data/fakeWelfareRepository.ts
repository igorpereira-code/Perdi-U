import type { WelfareFoundItem, WelfareRepository } from './welfareRepository';

/** In-memory welfare repository for tests. It never touches the shared database. */
export function fakeWelfareRepository(initialItems: WelfareFoundItem[]) {
  const items = initialItems.map((item) => ({ ...item, finder: item.finder && { ...item.finder } }));

  const repository: WelfareRepository = {
    listPending: async () =>
      items
        .filter((item) => item.status === 'PENDING_DROP_OFF')
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
  };

  return { repository, items };
}
