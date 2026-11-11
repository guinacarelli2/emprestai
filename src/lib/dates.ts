const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Formato dd/mmm, minúsculo, pt-BR: 14/set. */
export function formatDM(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  return `${dd}/${MESES[date.getMonth()]}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}
