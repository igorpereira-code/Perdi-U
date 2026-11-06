export function notificationDestination(link: string | null): string | null {
  if (!link || !link.startsWith('/') || link.startsWith('//') || link.includes('\\')) {
    return null;
  }
  return link;
}
