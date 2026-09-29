const fs = require('fs')
const path = require('path')

function loadEnv(file) {
  const env = {}
  const p = path.join(process.cwd(), file)
  if (!fs.existsSync(p)) return env
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

function normalizeWhatsAppPhone(raw) {
  let d = (raw ?? '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  if (!d.startsWith('54') && !d.startsWith('1')) d = '54' + d
  if (d.startsWith('54') && d.length === 12 && d[2] !== '9') d = '549' + d.slice(2)
  return d
}

async function main() {
  const env = { ...loadEnv('.env.local'), ...loadEnv('.env') }
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY

  const out = []
  if (!url || !url.startsWith('http') || !key || key.startsWith('[')) {
    out.push('NO_CREDS: url_ok=' + Boolean(url && url.startsWith('http')) + ' key_ok=' + Boolean(key && !key.startsWith('[')))
    fs.writeFileSync('wa_diag.txt', out.join('\n'))
    console.log('NO_CREDS')
    return
  }

  const headers = { apikey: key, Authorization: 'Bearer ' + key }

  async function q(pathAndQuery) {
    const res = await fetch(url + pathAndQuery, { headers })
    const body = await res.text()
    if (!res.ok) throw new Error(res.status + ' ' + body.slice(0, 300))
    return JSON.parse(body)
  }

  const members = await q('/rest/v1/members?select=full_name,email,phone,status')
  const contacts = await q('/rest/v1/whatsapp_contacts?select=nombre,telefono,email,fuente,es_agenda_itec')

  out.push('members_total=' + members.length)
  out.push('contacts_total=' + contacts.length)

  const byPhone = new Map(contacts.map((c) => [c.telefono, c]))
  const report = { no_phone: [], inactive: [], no_name: [], short_phone: [], dup_phone: [], not_in_contacts: [], imported: 0 }

  const seenPhones = new Map()

  for (const m of members) {
    const name = (m.full_name || '').trim()
    if (m.status !== 'activo') {
      report.inactive.push(name + ' [' + m.status + ']')
      continue
    }
    if (!name) {
      report.no_name.push('(sin nombre) email=' + m.email)
      continue
    }
    const raw = m.phone?.trim()
    if (!raw) {
      report.no_phone.push(name + ' email=' + m.email)
      continue
    }
    const tel = normalizeWhatsAppPhone(raw)
    if (!tel || tel.length < 8) {
      report.short_phone.push(name + ' phone="' + raw + '" -> "' + tel + '"')
      continue
    }
    if (seenPhones.has(tel)) {
      report.dup_phone.push(name + ' dup of ' + seenPhones.get(tel) + ' tel=' + tel)
      continue
    }
    seenPhones.set(tel, name)

    if (byPhone.has(tel)) {
      report.imported++
    } else {
      report.not_in_contacts.push(name + ' tel=' + tel + ' raw="' + raw + '" email=' + m.email)
    }
  }

  out.push('imported_matched=' + report.imported)
  out.push('missing_from_agenda=' + report.not_in_contacts.length)
  out.push('')
  out.push('--- NOT IN AGENDA ---')
  for (const x of report.not_in_contacts) out.push('  ' + x)
  out.push('')
  out.push('--- NO PHONE (' + report.no_phone.length + ') ---')
  for (const x of report.no_phone) out.push('  ' + x)
  out.push('')
  out.push('--- INACTIVE (' + report.inactive.length + ') ---')
  for (const x of report.inactive) out.push('  ' + x)
  out.push('')
  out.push('--- SHORT/INVALID PHONE (' + report.short_phone.length + ') ---')
  for (const x of report.short_phone) out.push('  ' + x)
  out.push('')
  out.push('--- DUP PHONE IN MEMBERS (' + report.dup_phone.length + ') ---')
  for (const x of report.dup_phone) out.push('  ' + x)
  out.push('')
  out.push('--- NO NAME (' + report.no_name.length + ') ---')
  for (const x of report.no_name) out.push('  ' + x)

  // fuente breakdown
  const byFuente = {}
  for (const c of contacts) byFuente[c.fuente] = (byFuente[c.fuente] || 0) + 1
  out.push('')
  out.push('contacts_by_fuente=' + JSON.stringify(byFuente))

  fs.writeFileSync('wa_diag.txt', out.join('\n'))
  console.log('OK written to wa_diag.txt')
}

main().catch((e) => {
  fs.writeFileSync('wa_diag.txt', 'ERROR: ' + e.message)
  console.log('ERROR: ' + e.message)
})
