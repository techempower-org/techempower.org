# TechEmpower — Technology for All: Access Made Easy

> Free technology resources for individuals with low income, their families, and nonprofit organizations.

**[techempower.org](https://techempower.org)**

---

- [About](#about)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Dark Mode](#dark-mode)
- [Content Architecture](#content-architecture)
- [Development](#development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## About

TechEmpower is a registered 501(c)(3) nonprofit based in Grass Valley, California. We promote digital equity, inclusion, and accessibility by curating free technology resources and step-by-step guides.

This repository powers [techempower.org](https://techempower.org) — a Next.js site that renders content from Notion using [react-notion-x](https://github.com/NotionX/react-notion-x).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org/) (Pages Router, SSR) |
| CMS | [Notion](https://notion.so) via [react-notion-x](https://github.com/NotionX/react-notion-x) |
| Hosting | [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext](https://opennext.js.org/cloudflare) |
| Incremental cache | [Cloudflare R2](https://developers.cloudflare.com/r2/) (bucket: `techempower-cache`) |
| Styling | CSS Modules + global CSS custom properties |
| Fonts | Fraunces (display), DM Sans (body) |
| Analytics | Google Analytics, Fathom (optional), PostHog (optional) |
| Package manager | pnpm |

Built on top of [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit) by Travis Fischer.

## Design System

The site uses a warm earth-tone design system defined as CSS custom properties in [`styles/global.css`](./styles/global.css):

- **Backgrounds:** `--te-cream` (warm off-white), `--te-cream-dark` (slightly darker)
- **Text:** `--te-bark-*` scale (warm dark browns, 100–900)
- **Primary accent:** `--te-teal-*` (trustworthy teal-green)
- **Secondary accent:** `--te-amber-*` (warm amber)
- **Emphasis:** `--te-coral-*` (for urgency)

Notion content styling is overridden in [`styles/notion.css`](./styles/notion.css), targeting react-notion-x's global CSS classes. Component-specific styles use CSS Modules (e.g., `Header.module.css`, `Footer.module.css`).

## Dark Mode

Dark mode supports three tiers:

1. **Inline noflash script** ([`_document.tsx`](./pages/_document.tsx)) — runs before paint, checks `localStorage` then `prefers-color-scheme` to set `dark-mode` or `light-mode` class on `<body>`
2. **React hook** ([`lib/use-dark-mode.ts`](./lib/use-dark-mode.ts)) — syncs React state with body class; manual toggle writes to `localStorage`
3. **System listener** — `matchMedia('prefers-color-scheme: dark')` change listener tracks OS preference when no manual override exists

All `--te-*` tokens are re-mapped under `.dark-mode` in `global.css`, so components using tokens get dark mode automatically. The footer is an exception — it's always dark with hardcoded colors.

## Content Architecture

All content is managed in Notion. The site config ([`site.config.ts`](./site.config.ts)) maps Notion page IDs to URL paths:

| URL | Content |
|-----|---------|
| `/` | Custom homepage (React components, not Notion) |
| `/guides/*` | Step-by-step technology guides (8 guides) |
| `/resources` | Searchable resource database (Notion collection) |
| `/about` | About TechEmpower |
| `/donate` | Donation page |

The homepage ([`pages/index.tsx`](./pages/index.tsx)) is built from custom React components: Hero, GuideGrid, ResourcesPreview, SupportChannels, and AboutDonate.

Guide pages include breadcrumb navigation, Spanish translation toggle, and related guides.

## Development

Requires Node.js >= 20 and pnpm.

```bash
git clone https://github.com/YOUR_ORG/techempower
cd techempower
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Key directories

```
components/       React components (with CSS Modules)
components/homepage/  Homepage section components
lib/              Utilities, config, hooks, types
pages/            Next.js pages (SSR)
styles/           Global CSS (global.css, notion.css, prism-theme.css)
site.config.ts    Notion page IDs, navigation, site metadata
```

### Useful commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local dev server |
| `pnpm build` | Production build (Next.js) |
| `pnpm start` | Serve production build locally |
| `pnpm format` | Format code with Prettier |
| `pnpm cf:build` | Build the OpenNext Cloudflare worker bundle |
| `pnpm cf:preview` | Preview the worker locally via miniflare |
| `pnpm cf:deploy` | Deploy to Cloudflare Workers (requires env secrets) |
| `pnpm deploy:local` | Deploy with secrets pulled from Bitwarden (see [Deployment](#deployment)) |

## Deployment

The site deploys to **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare). Push to `master` to trigger automatic deployment through [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

### GitHub Actions (auto-deploy)

Requires two repository secrets:

- `CLOUDFLARE_API_TOKEN` — scoped to `Workers Scripts: Edit` (account), `Workers R2 Storage Bucket Item Write` on `techempower-cache`, and `Workers Routes: Edit` on the `techempower.org` zone.
- `CLOUDFLARE_ACCOUNT_ID`

### Manual deploy from a developer machine

Secrets live in a Bitwarden secure note named `techempower cloudflare api`:

- `notes` field → `CLOUDFLARE_API_TOKEN`
- custom field `id` → `CLOUDFLARE_ACCOUNT_ID`

Unlock the vault once per shell, then run:

```bash
export BW_SESSION=$(bw unlock --raw)
pnpm deploy:local
```

[`scripts/deploy.sh`](./scripts/deploy.sh) reads both values from Bitwarden, exports them, and runs `pnpm cf:deploy`. Requires `bw` and `jq` on PATH.

### Prerequisite: R2 bucket

The incremental cache binding points at an R2 bucket that must exist in the target account:

```bash
npx wrangler r2 bucket create techempower-cache
```

### Caching

SSR pages include CDN caching headers (`s-maxage=3600, stale-while-revalidate=86400`). The Next.js incremental cache is backed by R2 (see [`open-next.config.ts`](./open-next.config.ts) and the `r2_buckets` binding in [`wrangler.jsonc`](./wrangler.jsonc)).

## Environment Variables

App-level variables (set in a local `.env` file for development, or via `wrangler secret put` / Cloudflare dashboard for production):

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | No | Notion integration token (for private pages) |
| `NEXT_PUBLIC_FATHOM_ID` | No | Fathom Analytics site ID |
| `NEXT_PUBLIC_POSTHOG_ID` | No | PostHog project API key |
| `REDIS_HOST` | No | Redis host for preview image caching |
| `REDIS_PASSWORD` | No | Redis password |

Deploy-time variables (GitHub Actions secrets / local shell):

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | Yes | Token with Workers Scripts Edit + R2 bucket write + Workers Routes Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID |

## Contributing

See [contributing.md](./contributing.md) for development setup and guidelines.

## License

MIT — Built on [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit) by [Travis Fischer](https://transitivebullsh.it).
