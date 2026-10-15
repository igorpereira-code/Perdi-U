export type FoundItemStatus = 'PENDING_DROP_OFF' | 'IN_CUSTODY' | 'PUBLISHED' | 'DELIVERED';

export type LostReportStatus = 'SEARCHING' | 'HAS_MATCHES' | 'PENDING_PICKUP' | 'RECOVERED';

export type MatchStatus = 'SUGGESTED' | 'WILL_PICK_UP' | 'DISMISSED';

export const FOUND_ITEM_STATUS_LABEL: Record<FoundItemStatus, string> = {
  PENDING_DROP_OFF: 'Pendiente de entrega',
  IN_CUSTODY: 'En custodia',
  PUBLISHED: 'Publicado',
  DELIVERED: 'Entregado',
};

export const LOST_REPORT_STATUS_LABEL: Record<LostReportStatus, string> = {
  SEARCHING: 'Buscando',
  HAS_MATCHES: 'Con coincidencias',
  PENDING_PICKUP: 'Pendiente de recojo',
  RECOVERED: 'Recuperado',
};
