#!/usr/bin/env node
// Sync show/ep1/teleprompter.html from ep1-teleprompter.txt (the source of
// truth) and bake a realm-sigil badge into the page. The sigil is seeded by
// a hash of the script text, so the on-screen name changes exactly when the
// script changes — refresh the prompter and compare the sigil to know
// whether you're looking at the current version or a stale cache.
//
// Usage: node scripts/sync-prompter.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'show', 'ep1')

// body = everything after the prompter-notes header (delimited by '=' rules)
const txt = readFileSync(join(dir, 'ep1-teleprompter.txt'), 'utf8')
const lines = txt.split('\n')
const rules = lines.flatMap((l, i) =>
  l.trim() && [...l.trim()].every((c) => c === '=') ? [i] : []
)
const body = lines
  .slice(rules[1] + 1)
  .join('\n')
  .replace(/^\n+|\n+$/g, '')

const htmlPath = join(dir, 'teleprompter.html')
let html = readFileSync(htmlPath, 'utf8')
const openTag = '<script type="text/plain" id="rawScript">'
const start = html.indexOf(openTag) + openTag.length
const end = html.indexOf('</script>', start)
if (start < openTag.length || end < 0)
  throw new Error('rawScript block not found')
html = html.slice(0, start) + '\n' + body + '\n' + html.slice(end)

// realm-sigil, forge realm (matching this project's /api/version realm) —
// words inlined per the realm-sigil JS pattern. Same algorithm as
// sigil.realm.watch generateName(): adj = seed % 20, noun = (seed >> 8) % 20,
// seeded here by the script content hash instead of a git hash.
const ADJECTIVES = [
  'Annealed',
  'Bolted',
  'Carbonized',
  'Dense',
  'Electric',
  'Flux',
  'Galvanized',
  'Hardened',
  'Ignited',
  'Joined',
  'Keen',
  'Laminated',
  'Molten',
  'Nitrided',
  'Oxidized',
  'Pressed',
  'Quenched',
  'Riveted',
  'Sintered',
  'Tempered'
]
const NOUNS = [
  'Anvil',
  'Bellows',
  'Crucible',
  'Die',
  'Engine',
  'Furnace',
  'Gear',
  'Hammer',
  'Ingot',
  'Jig',
  'Kiln',
  'Lathe',
  'Mandrel',
  'Nozzle',
  'Oven',
  'Piston',
  'Quench',
  'Rivet',
  'Spark',
  'Tongs'
]
const hash = createHash('sha1').update(body).digest('hex').slice(0, 7)
const seed = parseInt(hash, 16)
const sigil = `${ADJECTIVES[seed % ADJECTIVES.length]} ${NOUNS[(seed >> 8) % NOUNS.length]} · ${hash}`

html = html.replace(/(<div id="sigil"[^>]*>)[^<]*(<\/div>)/, `$1✦ ${sigil}$2`)
writeFileSync(htmlPath, html)

const words = (body.match(/\S+/g) || []).length
console.log(
  `synced ✦ ${sigil}  (${words} words, ~${(words / 150).toFixed(1)} min at 150 wpm)`
)
