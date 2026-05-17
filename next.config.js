// import path from 'node:path'
// import { fileURLToPath } from 'node:url'

// --- Content Security Policy ---------------------------------------------
// Built as an array so the directives stay readable. Joined with `; ` for
// the response header. Designed to allow everything the live site currently
// uses (Notion content via react-notion-x, Google Analytics, Google Fonts,
// R2-hosted cover images, optional Fathom + PostHog analytics, Formspree
// newsletter signup, oEmbed iframes from YouTube/Twitter/Vimeo) without
// loosening more than necessary.
//
// `'unsafe-inline'` is required for both script-src and style-src:
//   - scripts: the dark-mode noflash block in _document.tsx and the GA
//     config snippet in components/GoogleAnalytics.tsx are inline.
//   - styles:  react-notion-x emits inline `style="..."` on rendered nodes
//     and Notion content can include inline styles.
// A nonce-based strategy is possible long-term but would require wiring
// nonces through Document + every inline <Script> + react-notion-x output
// rewriting, which is out of scope for the release sprint.
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + GA loader + PostHog + Fathom; 'unsafe-inline' for the
  // noflash + GA config inline blocks.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://app.posthog.com https://*.posthog.com https://cdn.usefathom.com https://static.cloudflareinsights.com",
  // Same set for script-src-elem so browsers that split on it agree.
  "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://app.posthog.com https://*.posthog.com https://cdn.usefathom.com https://static.cloudflareinsights.com",
  // Styles: self + Google Fonts CSS + react-notion-x inline styles.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: Google Fonts CDN + data: for any inlined font fallbacks.
  "font-src 'self' data: https://fonts.gstatic.com",
  // Images: self + data/blob (canvases, dark-mode toggle, Next image
  // placeholders) + Notion's CDN + Twitter media + Unsplash + S3 bucket
  // used by Notion + Google Analytics tracking pixels + our R2 cover
  // bucket.
  "img-src 'self' data: blob: https://www.notion.so https://notion.so https://*.notion.so https://*.notionusercontent.com https://images.unsplash.com https://abs.twimg.com https://pbs.twimg.com https://s3.us-west-2.amazonaws.com https://*.amazonaws.com https://www.google-analytics.com https://www.googletagmanager.com https://pub-f94e62ffd9ac4b6888afd6948c4ccb5e.r2.dev",
  // XHR / fetch endpoints: analytics ingest, Notion proxies, R2, Listmonk.
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://app.posthog.com https://*.posthog.com https://cdn.usefathom.com https://*.usefathom.com https://api.notion.com https://www.notion.so https://*.notion.so https://list.techempower.org https://pub-f94e62ffd9ac4b6888afd6948c4ccb5e.r2.dev",
  // Media (audio/video) — Notion blocks can embed both.
  "media-src 'self' data: blob: https://www.notion.so https://*.notion.so",
  // Iframes embedded via lib/oembed.ts (YouTube, Twitter/X, Vimeo, etc.).
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://twitter.com https://platform.twitter.com https://x.com https://www.notion.so",
  // Clickjacking protection — supersedes X-Frame-Options for modern
  // browsers. We never want techempower.org embedded in another page.
  "frame-ancestors 'none'",
  // No <base href> injection allowed.
  "base-uri 'self'",
  // Forms post to self (newsletter signup is JSON fetch to listmonk, not form action).
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // Auto-upgrade any leftover http:// asset references.
  'upgrade-insecure-requests'
]

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; ')
  },
  // 180 days, include subdomains. No `preload` — we'd need to submit to
  // hstspreload.org and be confident every subdomain ships HTTPS forever.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=15552000; includeSubDomains'
  },
  // Legacy clickjacking header — paired with frame-ancestors in the CSP
  // above for browsers that only read one or the other.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features we don't use. Anyone needing one of these
  // (e.g., a future "share location for nearest resource" feature) will
  // need to relax this list explicitly.
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=(self)',
      'xr-spatial-tracking=()'
    ].join(', ')
  },
  // COOP isolates the browsing context group so cross-origin popups can't
  // peek at window references. Safe with our current set of embeds.
  // We deliberately do NOT set Cross-Origin-Embedder-Policy: require-corp
  // because oEmbed iframes from YouTube/Twitter/Vimeo and Notion images
  // don't all send CORP headers, and require-corp would break them.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Allow our own pages to be loaded as resources cross-origin where
  // needed; restrict third-party embeds of our resources to same-origin.
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' }
]

export default {
  staticPageGenerationTimeout: 300,

  // Strip the `X-Powered-By: Next.js` fingerprint header.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Apply security headers to every route. Cache-Control and route-
        // specific headers continue to be set by individual pages via
        // getServerSideProps / getStaticProps as before.
        source: '/:path*',
        headers: securityHeaders
      }
    ]
  },

  images: {
    // Cloudflare Pages does not support the Next.js image optimization API,
    // so we serve images unoptimized and rely on Cloudflare's built-in Polish
    // / image resizing at the CDN layer instead.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // webpack: (config) => {
  //   // Workaround for ensuring that `react` and `react-dom` resolve correctly
  //   // when using a locally-linked version of `react-notion-x`.
  //   // @see https://github.com/vercel/next.js/issues/50391
  //   const dirname = path.dirname(fileURLToPath(import.meta.url))
  //   config.resolve.alias.react = path.resolve(dirname, 'node_modules/react')
  //   config.resolve.alias['react-dom'] = path.resolve(
  //     dirname,
  //     'node_modules/react-dom'
  //   )
  //   return config
  // },

  // Transpile all runtime deps so Next 16's Turbopack doesn't externalize them.
  // OpenNext/Cloudflare Workers has no node_modules at runtime — transpiling inlines them.
  transpilePackages: [
    '@fisch0920/use-dark-mode',
    '@keyvhq/core',
    '@keyvhq/redis',
    'classnames',
    'expiry-map',
    'fathom-client',
    'katex',
    'ky',
    'notion-client',
    'notion-types',
    'notion-utils',
    'nprogress',
    'p-map',
    'p-memoize',
    'posthog-js',
    'prismjs',
    'react-body-classname',
    'react-notion-x',
    'react-tweet',
    'react-use',
    'rss'
  ]
}
