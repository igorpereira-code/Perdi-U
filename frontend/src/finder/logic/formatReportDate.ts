const reportDateFormat = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/La_Paz',
});

export function formatReportDate(value: string): string {
  return reportDateFormat.format(new Date(value));
}
