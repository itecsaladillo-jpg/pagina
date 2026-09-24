/**
 * Normalización telefónica para WhatsApp (Argentina).
 * Convierte cualquier formato a dígitos con código de país 54.
 */
export function normalizeWhatsAppPhone(raw: string): string {
  let d = (raw ?? '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  if (!d.startsWith('54') && !d.startsWith('1')) d = '54' + d
  // Móvil argentino sin el 9: 54 + 12 dígitos sin el 9 → 13 dígitos
  if (d.startsWith('54') && d.length === 12 && d[2] !== '9') {
    d = '549' + d.slice(2)
  }
  return d
}

/**
 * Construye el link de WhatsApp Web con texto pre-cargado.
 * https://web.whatsapp.com/send?phone=NUMERO&text=TEXTO
 */
export function buildWaLink(phone: string, text = ''): string {
  const n = normalizeWhatsAppPhone(phone)
  const base = `https://web.whatsapp.com/send?phone=${n}`
  return text ? `${base}&text=${encodeURIComponent(text)}` : base
}

/**
 * Reemplaza {{variable}} en una plantilla.
 */
export function replacePlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}
