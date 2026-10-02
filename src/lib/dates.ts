/**
 * Constantes y utilidades para el huso horario oficial de la app (UTC -3:00, Saladillo / Argentina).
 */
export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires'
export const APP_UTC_OFFSET_HOURS = -3
export const APP_UTC_OFFSET_MS = APP_UTC_OFFSET_HOURS * 60 * 60 * 1000

const DIAS_SEMANA_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]
const MESES_ABR_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export function toUtcLocalDate(value: string | Date): Date {
  const d = new Date(value)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/**
 * Descompone un timestamp o string de fecha en componentes exactos del huso UTC-3.
 */
export function getUTC3Parts(value: string | Date | number) {
  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  if (isNaN(d.getTime())) return null

  // Desplazamiento fijo de -3 horas respecto de UTC
  const dUtc3 = new Date(d.getTime() + APP_UTC_OFFSET_MS)

  const pad = (n: number) => String(n).padStart(2, '0')
  const year = dUtc3.getUTCFullYear()
  const month = pad(dUtc3.getUTCMonth() + 1)
  const day = pad(dUtc3.getUTCDate())
  const hours = pad(dUtc3.getUTCHours())
  const minutes = pad(dUtc3.getUTCMinutes())
  const seconds = pad(dUtc3.getUTCSeconds())
  const dayOfWeek = dUtc3.getUTCDay()

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    fechaDate: `${year}-${month}-${day}`,
    hora: hours,
    minuto: minutes,
    dayOfWeek,
  }
}

/**
 * Compone un string ISO con offset UTC-3 (-03:00) a partir de fechaDate, hora y minuto.
 */
export function composeUTC3ISO(fechaDate: string, hora: string, minuto: string): string {
  const pad = (v: string | number) => String(v).padStart(2, '0')
  return `${fechaDate}T${pad(hora)}:${pad(minuto)}:00-03:00`
}

/**
 * Obtiene la fecha actual en formato 'YYYY-MM-DD' en huso UTC-3.
 */
export function getTodayUTC3(): string {
  const parts = getUTC3Parts(Date.now())
  return parts ? parts.fechaDate : ''
}

/**
 * Obtiene una fecha con offset de días en formato 'YYYY-MM-DD' en huso UTC-3.
 */
export function getOffsetDayUTC3(daysOffset: number): string {
  const parts = getUTC3Parts(Date.now() + daysOffset * 24 * 60 * 60 * 1000)
  return parts ? parts.fechaDate : ''
}

/**
 * Formatea una fecha para visualización completa en español según UTC-3:
 * ej. "jueves 15 de octubre, 2026 a las 19:30 hs"
 */
export function formatFechaLargaUTC3(value: string | Date | number): string {
  const parts = getUTC3Parts(value)
  if (!parts) return typeof value === 'string' ? value : ''
  const diaSemana = DIAS_SEMANA_ES[parts.dayOfWeek]
  const mesNombre = MESES_ES[Number(parts.month) - 1]
  return `${diaSemana} ${Number(parts.day)} de ${mesNombre}, ${parts.year} a las ${parts.hours}:${parts.minutes} hs`
}

/**
 * Formatea una fecha para la Pizarra pública de próximas actividades en UTC-3:
 * ej. "jueves 15 de octubre · 19:30 hs"
 */
export function formatPizarraFechaUTC3(value: string | Date | number): string {
  const parts = getUTC3Parts(value)
  if (!parts) return typeof value === 'string' ? value : ''
  const diaSemana = DIAS_SEMANA_ES[parts.dayOfWeek]
  const mesNombre = MESES_ES[Number(parts.month) - 1]
  return `${diaSemana} ${Number(parts.day)} de ${mesNombre} · ${parts.hours}:${parts.minutes} hs`
}

/**
 * Formatea el badge mensual de la pizarra en UTC-3:
 * ej. { dia: "15", mes: "OCT" }
 */
export function formatBadgeUTC3(value: string | Date | number): { dia: string; mes: string } {
  const parts = getUTC3Parts(value)
  if (!parts) return { dia: '--', mes: '---' }
  return {
    dia: parts.day,
    mes: MESES_ABR_ES[Number(parts.month) - 1],
  }
}