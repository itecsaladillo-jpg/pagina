export function toUtcLocalDate(value: string | Date): Date {
  const d = new Date(value)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}