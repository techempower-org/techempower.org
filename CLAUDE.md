<!-- claude-md-version: d69cae3 | updated: 2026-03-22 -->
# CLAUDE.md — techempower

Nonprofit website for TechEmpower (techempower.org) — free technology resources for low-income individuals and families.

## What This Is

A Next.js site that renders content from Notion as a CMS, using react-notion-x. Built on the nextjs-notion-starter-kit. 501(c)(3) nonprofit based in Grass Valley, California.

**Live:** https://techempower.org

## Tech Stack

- **Framework:** Next.js (Pages Router, SSR), React 19
- **CMS:** Notion via react-notion-x
- **Hosting:** Cloudflare Workers via OpenNext (auto-deploy on push to `master`)
- **Styling:** CSS Modules + global CSS custom properties (warm earth-tone design system)
- **Fonts:** Fraunces (display), DM Sans (body)
- **Package manager:** pnpm (Node >= 20)
- **Analytics:** Google Analytics, Fathom (optional), PostHog (optional)

## Commands

```bash
pnpm install          # install deps (runs patch-package postinstall)
pnpm dev              # dev server at localhost:3000
pnpm build            # production build
pnpm start            # serve production build
pnpm cf:build         # build OpenNext Cloudflare worker bundle
pnpm cf:preview       # preview worker locally via miniflare
pnpm cf:deploy        # manual deploy (requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in env)
pnpm deploy:local     # manual deploy with secrets pulled from Bitwarden (see Deploying)
```

## Deploying

CI auto-deploys on push to `master` via `.github/workflows/deploy.yml` using the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` GitHub Actions secrets.

For a manual deploy from a local machine, secrets live in Bitwarden:

- Item: `techempower cloudflare api` (secure note)
- `notes` field → `CLOUDFLARE_API_TOKEN`
- custom field `id` → `CLOUDFLARE_ACCOUNT_ID`

Unlock the vault once per shell, then run the helper script:

```bash
export BW_SESSION=$(bw unlock --raw)
pnpm deploy:local
```

`scripts/deploy.sh` reads both values from Bitwarden, exports them, and runs
`pnpm cf:deploy`. Requires `bw` and `jq` on PATH.

## Key Files

| Path | Purpose |
|------|---------|
| `site.config.ts` | Notion page IDs, URL path mappings, navigation, site metadata |
| `pages/index.tsx` | Custom homepage (React components, not Notion) |
| `pages/[...pageId].tsx` | Dynamic Notion page renderer |
| `components/` | React components with CSS Modules |
| `components/homepage/` | Homepage section components (Hero, GuideGrid, ResourcesPreview, etc.) |
| `lib/` | Utilities, config, hooks, types |
| `styles/global.css` | Design system CSS custom properties (`--te-*` tokens) |
| `styles/notion.css` | Notion content style overrides for react-notion-x |
| `patches/` | patch-package patches applied at install |

## Content Architecture

All content lives in Notion. `site.config.ts` maps Notion page IDs to URL paths:

- `/` — Custom homepage (React components)
- `/guides/*` — Step-by-step technology guides (8 guides)
- `/resources` — Searchable resource database (Notion collection)
- `/about`, `/donate` — Static pages

## Design System

Earth-tone palette defined as CSS custom properties in `styles/global.css`:
- `--te-cream` backgrounds, `--te-bark-*` text scale, `--te-teal-*` primary, `--te-amber-*` secondary, `--te-coral-*` emphasis
- Dark mode: all tokens remapped under `.dark-mode` class
- Dark mode detection: inline noflash script in `_document.tsx` + React hook + system preference listener

## Gotchas

- Images are unoptimized (`next.config.js`) — relies on CDN-level optimization
- `postinstall` runs `patch-package` — check `patches/` dir if deps behave unexpectedly
- SSR pages set CDN cache headers (`s-maxage=3600, stale-while-revalidate=86400`)
- Guide pages include breadcrumb navigation, Spanish translation toggle, and related guides
- Redis caching is disabled (`isRedisEnabled: false` in site.config.ts)
