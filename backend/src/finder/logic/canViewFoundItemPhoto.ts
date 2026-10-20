import type { CurrentUser } from '../../core/currentUser';
import type { FoundItemPhotoAccess } from '../data/foundItemsRepository';

export function canViewFoundItemPhoto(item: FoundItemPhotoAccess, user: Pick<CurrentUser, 'id' | 'role'>): boolean {
  if (item.finderId === user.id || user.role === 'WELFARE') {
    return true;
  }
  return item.visibility === 'VISIBLE'
    && ['IN_CUSTODY', 'PUBLISHED', 'DELIVERED'].includes(item.status);
}
