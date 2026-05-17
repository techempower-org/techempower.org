import { type NextApiRequest, type NextApiResponse } from 'next'

// Dynamic social-card generation via @vercel/og was disabled because the
// @vercel/og + resvg.wasm + yoga.wasm bundle (~2.2 MiB) pushed the
// Cloudflare Workers worker past the 3 MiB free-plan size limit and broke
// deploys. This route now 302s to a static fallback OG image.
//
// To restore rich per-page OG cards: either (a) upgrade Cloudflare to a
// paid Workers plan (10 MiB limit) and reinstate the prior next/og
// implementation, or (b) pre-render one OG card per page at build time
// to R2 and serve from there.
const FALLBACK_OG = '/favicon-512x512.png'

export default function OGImage(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
  res.redirect(302, FALLBACK_OG)
}
