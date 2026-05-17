import type { NextApiRequest, NextApiResponse } from 'next'

const startTime = Date.now()
const startISO = new Date().toISOString()

const adjectives = [
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
const nouns = [
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

function generateName(hash: string): string {
  const seed = Number.parseInt(hash, 16) || 0
  const adj = adjectives[seed % adjectives.length]
  const noun = nouns[(seed >> 8) % nouns.length]
  return `${adj} ${noun} · ${hash}`
}

function gitInfo() {
  const sha =
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA
  const ref =
    process.env.WORKERS_CI_COMMIT_REF ||
    process.env.CF_PAGES_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF
  if (sha) {
    return { hash: sha.slice(0, 7), branch: ref || 'unknown', dirty: false }
  }
  return { hash: 'dev', branch: 'unknown', dirty: false }
}

function detectPlatform(): string {
  if (process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES)
    return 'cloudflare'
  if (process.env.VERCEL) return 'vercel'
  return 'local'
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const git = gitInfo()
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({
    name: 'techempower',
    description: 'Tech empower platform',
    version: generateName(git.hash),
    hash: git.hash,
    branch: git.branch,
    dirty: git.dirty,
    built: startISO,
    started: startISO,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    realm: 'forge',
    platform: detectPlatform(),
    repo: 'https://github.com/techempower-org/techempower.org',
    commit_url:
      git.hash !== 'dev'
        ? `https://github.com/techempower-org/techempower.org/commit/${git.hash}`
        : ''
  })
}
