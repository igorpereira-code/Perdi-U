type NamedItem = { id: number; name: string };

/** Puts the saved item in the list (replacing the old version, if any), ordered by name. */
export function saveInListByName<T extends NamedItem>(items: T[], savedItem: T): T[] {
  const otherItems = items.filter((item) => item.id !== savedItem.id);
  return [...otherItems, savedItem].sort((first, second) =>
    first.name.localeCompare(second.name, 'es'),
  );
}
