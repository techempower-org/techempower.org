import { ImageResponse } from 'next/og'

import * as siteConfig from '@/lib/config'
import { ogFonts } from '@/lib/fonts/og-fonts'

// Dynamic per-page Open Graph / Twitter social cards, rendered with next/og
// (satori + resvg-wasm). Previously stubbed to a static fallback because the
// @vercel/og + wasm bundle (~2.2 MiB) blew the Workers FREE 3 MiB bundle cap;
// now on Workers PAID (10 MiB) so the dynamic cards are back.
//
// This lives as an App Router route handler (not a pages/api route) on purpose:
// @opennextjs/cloudflare only makes @vercel/og work on workerd by swapping its
// Node build for the Edge/wasm build at build time, and that AST patch only
// matches the dynamic `index.node.js` import that App Router route handlers
// emit. A pages/api route statically bundles @vercel/og's Node build inline,
// which the patch can't rewrite — so it crashes on Workers reading its
// fallback font from disk. The Node.js runtime (not Edge) is what triggers the
// OpenNext og patch path. See lib/get-social-image-url.ts for the caller.
//
// The card is rendered purely from query params (title + optional eyebrow) so
// it costs no Notion fetch on the request path — deliberately avoiding the
// heavy recordMap render that tripped the per-request CPU limit (503 / 1102).

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WIDTH = 1200
const HEIGHT = 630

// Earth-tone design tokens, mirrored from styles/global.css (light theme).
// OG cards render as a fixed image embedded in other sites' feeds, so they use
// the warm cream brand theme regardless of the viewer's color scheme.
const C = {
  cream: '#faf8f5',
  creamDark: '#f3efe9',
  bark900: '#1c1210',
  bark800: '#2c1f1a',
  bark600: '#5c4236',
  bark500: '#78614f',
  bark200: '#e0d6cc',
  teal700: '#0b5e5a',
  teal600: '#0f766e',
  teal500: '#14b8a6',
  amber500: '#f59e0b',
  coral500: '#f43f5e'
}

// White "rising bars" mark — three ascending rounded columns evoking growth /
// empowerment. Inlined as an SVG data URI so satori renders it crisply.
const MARK = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <rect x="5" y="22" width="8" height="13" rx="4" fill="#ffffff"/>
    <rect x="16" y="14" width="8" height="21" rx="4" fill="#ffffff"/>
    <rect x="27" y="5" width="8" height="30" rx="4" fill="#ffffff" opacity="0.92"/>
  </svg>`
)}`

function titleFontSize(title: string): number {
  const len = title.length
  if (len <= 24) return 84
  if (len <= 42) return 72
  if (len <= 64) return 60
  if (len <= 96) return 50
  return 42
}

export function GET(req: Request): ImageResponse {
  const { searchParams } = new URL(req.url)

  const rawTitle = (searchParams.get('title') || '').trim()
  const siteName = siteConfig.name || 'TechEMPOWER.org'

  // On the homepage (no distinct page title, or title === site name) lead with
  // the mission line instead of repeating the wordmark.
  const isSiteLevel =
    !rawTitle || rawTitle.toLowerCase() === siteName.toLowerCase()
  const title = isSiteLevel
    ? 'Free technology for everyone'
    : rawTitle.length > 140
      ? `${rawTitle.slice(0, 139).replace(/\s+\S*$/, '')}…`
      : rawTitle

  const eyebrow = (searchParams.get('eyebrow') || 'FREE TECHNOLOGY RESOURCES')
    .trim()
    .toUpperCase()

  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        fontFamily: 'DM Sans',
        backgroundColor: C.cream,
        backgroundImage: `linear-gradient(135deg, ${C.cream} 0%, ${C.creamDark} 100%)`,
        overflow: 'hidden'
      }}
    >
      {/* Left accent rail: teal → amber → coral gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 16,
          height: '100%',
          backgroundImage: `linear-gradient(180deg, ${C.teal600} 0%, ${C.amber500} 60%, ${C.coral500} 100%)`
        }}
      />

      {/* Warm decorative glow, bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: -180,
          right: -140,
          width: 520,
          height: 520,
          borderRadius: 9999,
          backgroundImage: `radial-gradient(circle at center, ${C.amber500}33 0%, ${C.amber500}00 70%)`
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -160,
          right: 120,
          width: 360,
          height: 360,
          borderRadius: 9999,
          backgroundImage: `radial-gradient(circle at center, ${C.teal500}26 0%, ${C.teal500}00 70%)`
        }}
      />

      {/* Header: logo tile + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 76,
            height: 76,
            borderRadius: 20,
            backgroundColor: C.teal600,
            backgroundImage: `linear-gradient(150deg, ${C.teal500} 0%, ${C.teal700} 100%)`,
            boxShadow: '0 8px 24px rgba(11,94,90,0.28)'
          }}
        >
          <img src={MARK} width={40} height={40} alt='' />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            marginLeft: 24,
            fontFamily: 'DM Sans',
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: -0.5
          }}
        >
          <span style={{ color: C.bark800 }}>Tech</span>
          <span style={{ color: C.teal700 }}>EMPOWER</span>
          <span style={{ color: C.bark500 }}>.org</span>
        </div>
      </div>

      {/* Title block */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 980 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Fraunces',
            fontWeight: 600,
            fontSize: titleFontSize(title),
            lineHeight: 1.04,
            color: C.bark900,
            letterSpacing: -1
          }}
        >
          {title}
        </div>
      </div>

      {/* Footer: eyebrow label + domain pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              width: 56,
              height: 5,
              borderRadius: 9999,
              marginBottom: 16,
              backgroundImage: `linear-gradient(90deg, ${C.teal600} 0%, ${C.amber500} 100%)`
            }}
          />
          <div
            style={{
              display: 'flex',
              fontFamily: 'DM Sans',
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: 3,
              color: C.teal700
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 22px',
            borderRadius: 9999,
            border: `2px solid ${C.bark200}`,
            backgroundColor: '#ffffffcc',
            fontFamily: 'DM Sans',
            fontWeight: 500,
            fontSize: 22,
            color: C.bark600
          }}
        >
          {siteConfig.domain || 'techempower.org'}
        </div>
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: 'Fraunces',
          data: ogFonts.fraunces600,
          weight: 600,
          style: 'normal'
        },
        {
          name: 'DM Sans',
          data: ogFonts.dmSans700,
          weight: 700,
          style: 'normal'
        },
        {
          name: 'DM Sans',
          data: ogFonts.dmSans500,
          weight: 500,
          style: 'normal'
        }
      ],
      headers: {
        'Cache-Control':
          'public, immutable, no-transform, max-age=86400, s-maxage=604800'
      }
    }
  )
}
