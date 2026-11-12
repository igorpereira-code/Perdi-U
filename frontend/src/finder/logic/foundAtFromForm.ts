/** America/La_Paz es UTC−4. 00:00 sin hora es una convención técnica, no una hora confirmada. */
export function foundAtFromForm(date: string, time: string): string {
  const selectedTime = time || '00:00';
  const calendarDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(selectedTime)
    || !Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== date) {
    throw new Error('Indica una fecha y hora válidas.');
  }
  return new Date(`${date}T${selectedTime}:00-04:00`).toISOString();
}
