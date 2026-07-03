import type { Lang } from './types'
import en from './data/strings.en.json'
import es from './data/strings.es.json'

const tables: Record<Lang, Record<string, string>> = {
  en: en as Record<string, string>,
  es: es as Record<string, string>
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`

// noteParams dates stay ISO in rules.data.json (sortable, provenance-style);
// prose renders the localized long form — the house verified-date pattern
// (oracle N3): fixed en-US/es-US locale strings + a pinned UTC zone so an
// ISO date (which parses as UTC midnight) never shifts a day on the client.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const localDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })

export function t(
  lang: Lang,
  key: string,
  params: Record<string, string | number> = {}
): string {
  let s = tables[lang][key] ?? tables.en[key] ?? key
  for (const [k, v] of Object.entries(params)) {
    const rendered =
      typeof v === 'number' && /income|limit|amount/.test(k)
        ? money(v)
        : typeof v === 'string' && ISO_DATE.test(v)
          ? localDate(v, lang)
          : String(v)
    s = s.replaceAll(`{${k}}`, rendered)
  }
  return s
}
