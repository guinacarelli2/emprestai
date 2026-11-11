const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function localToday(now: Date = new Date()): string {
  const parts = formatter.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${read("year")}-${read("month")}-${read("day")}`;
}
export function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function asDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}
export function civilDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
export function isOverdue(dueDate: Date, returnedAt: Date | null, today: string = localToday()): boolean {
  return returnedAt === null && civilDate(dueDate) < today;
}
export function endOfWeek(today: string): string {
  const weekday = asDbDate(today).getUTCDay();
  return addCalendarDays(today, (7 - weekday) % 7);
}
