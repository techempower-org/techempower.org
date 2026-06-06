/**
 * Typed constants for all TechEmpower Notion page IDs and guide metadata.
 *
 * These IDs correspond to the pageUrlOverrides in site.config.ts.
 * Keep in sync when adding or removing pages.
 */

// ---------------------------------------------------------------------------
// Guide page IDs
// ---------------------------------------------------------------------------

export const GUIDE_HOW_TO_USE_TECHEMPOWER = '6c979ba4e43f48d7a4836e0027ea4178'
export const GUIDE_FREE_INTERNET = 'bb5e537b083a417eb90ed9e984128c71'
export const GUIDE_EV_INCENTIVES = '758054e1a2ec4c1aa077202ffedec710'
export const GUIDE_EBT_BALANCE = '272a4ee69520804fa68ad8c110af49f6'
export const GUIDE_EBT_SPENDING = '16f7018ad93542652b2b16c44464b1c3'
export const GUIDE_FINDHELP = '992742a61e2e472b9b4a149f7aa74539'
export const GUIDE_PASSWORD_MANAGER = '99b0ab9c7cce428e8c86e3143752aa1c'
export const GUIDE_FREE_CELL_SERVICE = '7519ef16d7b74519acd9b8262a7beb84'

// ---------------------------------------------------------------------------
// About page IDs
// ---------------------------------------------------------------------------

export const ABOUT_PAGE = 'dbf0ddece2ce468fb2bf9049e6322e8a'
export const DONATE_PAGE = '59d8a4dab0cc484f8b044d33f240ce1d'
export const NON_DISCRIMINATION_POLICY_PAGE = 'cdbe9906ae2441a1a9bb3aec601a5a6c'

// ---------------------------------------------------------------------------
// Root / home page
// ---------------------------------------------------------------------------

export const HOME_PAGE = '0959e44599984143acabc80187305001'

// ---------------------------------------------------------------------------
// Resources database page
// ---------------------------------------------------------------------------

export const RESOURCES_PAGE = '2a3d706803c649409e74e9ce5ccd4c4b'

// ---------------------------------------------------------------------------
// All guide IDs as a set for quick membership checks
// ---------------------------------------------------------------------------

export const ALL_GUIDE_IDS: ReadonlySet<string> = new Set([
  GUIDE_HOW_TO_USE_TECHEMPOWER,
  GUIDE_FREE_INTERNET,
  GUIDE_EV_INCENTIVES,
  GUIDE_EBT_BALANCE,
  GUIDE_EBT_SPENDING,
  GUIDE_FINDHELP,
  GUIDE_PASSWORD_MANAGER,
  GUIDE_FREE_CELL_SERVICE
])

// ---------------------------------------------------------------------------
// Guide metadata
// ---------------------------------------------------------------------------

export interface GuideMeta {
  id: string
  slug: string
  title: string
  summary: string
  icon: string
}

export const GUIDE_METADATA: readonly GuideMeta[] = [
  {
    id: GUIDE_HOW_TO_USE_TECHEMPOWER,
    slug: 'how-to-use-techempower',
    title: 'How to Use TechEMPOWER.org',
    summary:
      'Learn how to navigate Techempower.org and get the most from our free guides.',
    icon: '\u{1F4D6}' // open book
  },
  {
    id: GUIDE_FREE_INTERNET,
    slug: 'free-internet',
    title: 'Free Internet',
    summary:
      'Find free and low-cost internet programs, including the ACP and ISP discounts.',
    icon: '\u{1F4F6}' // antenna bars
  },
  {
    id: GUIDE_EV_INCENTIVES,
    slug: 'ev-incentives',
    title: 'EV Incentives',
    summary:
      'Discover federal and state incentives for purchasing an electric vehicle.',
    icon: '\u{1F697}' // car
  },
  {
    id: GUIDE_EBT_BALANCE,
    slug: 'ebt-balance',
    title: 'EBT Balance',
    summary: 'Check your EBT / SNAP balance online, by phone, or by app.',
    icon: '\u{1F4B3}' // credit card
  },
  {
    id: GUIDE_EBT_SPENDING,
    slug: 'ebt-spending',
    title: 'EBT Spending',
    summary:
      'Understand what you can and cannot buy with your EBT / SNAP benefits.',
    icon: '\u{1F6D2}' // shopping cart
  },
  {
    id: GUIDE_FINDHELP,
    slug: 'findhelp',
    title: 'FindHelp',
    summary:
      'Use FindHelp.org to locate free and reduced-cost services near you.',
    icon: '\u{1F50D}' // magnifying glass
  },
  {
    id: GUIDE_PASSWORD_MANAGER,
    slug: 'password-manager',
    title: 'Password Manager',
    summary:
      'Set up a free password manager to keep your accounts safe and organized.',
    icon: '\u{1F512}' // lock
  },
  {
    id: GUIDE_FREE_CELL_SERVICE,
    slug: 'free-cell-service',
    title: 'Free Cell Service',
    summary:
      'Get a free government cell phone and service through the Lifeline program.',
    icon: '\u{1F4F1}' // mobile phone
  }
] as const

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Map from page ID to guide metadata for O(1) lookups. */
export const GUIDE_BY_ID: ReadonlyMap<string, GuideMeta> = new Map(
  GUIDE_METADATA.map((g) => [g.id, g])
)

/** Map from slug to guide metadata for O(1) lookups. */
export const GUIDE_BY_SLUG: ReadonlyMap<string, GuideMeta> = new Map(
  GUIDE_METADATA.map((g) => [g.slug, g])
)

/** Strip hyphens from a UUID so it matches our stored page IDs. */
function normalizeId(id: string): string {
  return id.replaceAll('-', '')
}

/**
 * Return whether a given page ID belongs to a guide page.
 */
export function isGuidePage(pageId: string | undefined): boolean {
  return !!pageId && ALL_GUIDE_IDS.has(normalizeId(pageId))
}

/**
 * Return whether a given page ID is the resources database page.
 */
export function isResourcesPage(pageId: string | undefined): boolean {
  return !!pageId && normalizeId(pageId) === RESOURCES_PAGE
}

/**
 * Get related guides for a given page ID (all guides except the current one).
 */
export function getRelatedGuides(pageId: string, limit = 4): GuideMeta[] {
  const normalized = normalizeId(pageId)
  return GUIDE_METADATA.filter((g) => g.id !== normalized).slice(0, limit)
}
