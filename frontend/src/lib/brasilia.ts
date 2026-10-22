const BRASILIA_OFFSET = '-03:00';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_TIME_INPUT_LENGTH = 'AAAA-MM-DDTHH:MM'.length;

// O campo datetime-local não tem fuso: o valor digitado é sempre o horário de Brasília.
export function toApiDateTime(localInputValue: string): string {
  return `${localInputValue.slice(0, DATE_TIME_INPUT_LENGTH)}${BRASILIA_OFFSET}`;
}

// Valor inicial do campo datetime-local, no horário de Brasília, daqui a `days` dias.
export function brasiliaInputAfterDays(days: number, now: Date = new Date()): string {
  const brasiliaMoment = new Date(now.getTime() + days * MS_PER_DAY - 3 * 60 * 60 * 1000);
  return brasiliaMoment.toISOString().slice(0, DATE_TIME_INPUT_LENGTH);
}
