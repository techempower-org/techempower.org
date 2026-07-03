import type { Lang } from './types'
import en from './data/strings.en.json'
import es from './data/strings.es.json'

const tables: Record<Lang, Record<string, string>> = {
  en: en as Record<string, string>,
  es: es as Record<string, string>
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`

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
        : String(v)
    s = s.replaceAll(`{${k}}`, rendered)
  }
  return s
}
