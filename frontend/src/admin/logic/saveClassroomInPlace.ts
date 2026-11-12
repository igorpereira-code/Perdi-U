import type { ManagedClassroom, ManagedPlace } from '@shared/admin';
import { saveInListByName } from './saveInListByName';

/** The block with the saved classroom in its list (new or updated), ordered by name. */
export function saveClassroomInPlace(
  place: ManagedPlace,
  savedClassroom: ManagedClassroom,
): ManagedPlace {
  return { ...place, classrooms: saveInListByName(place.classrooms, savedClassroom) };
}
