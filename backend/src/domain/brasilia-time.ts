const BRASILIA_OFFSET_HOURS = 3;
const MS_PER_HOUR = 60 * 60 * 1000;
const INPUT_FORMAT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})-03:00$/;

export function parseBrasiliaDateTime(text: string): Date | null {
  const match = INPUT_FORMAT.exec(text);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  if (hour > 23 || minute > 59) return null;

  const date = new Date(Date.UTC(year, month - 1, day, hour + BRASILIA_OFFSET_HOURS, minute));
  const calendarDate = new Date(date.getTime() - BRASILIA_OFFSET_HOURS * MS_PER_HOUR);
  const isRealDate =
    calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day;
  return isRealDate ? date : null;
}

export function formatBrasiliaDateTime(date: Date): string {
  const brasiliaTime = new Date(date.getTime() - BRASILIA_OFFSET_HOURS * MS_PER_HOUR);
  return `${brasiliaTime.toISOString().slice(0, 19)}-03:00`;
}
