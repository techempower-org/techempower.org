import dmSans500Base64 from './dmsans-500'
import dmSans700Base64 from './dmsans-700'
import fraunces600Base64 from './fraunces-600'

// Decode a base64 string to an ArrayBuffer using `atob`, which is available in
// both the Edge runtime (workerd / next/og) and Node — unlike `Buffer`, which
// the Next.js Edge runtime does not reliably polyfill. next/og's `ImageResponse`
// accepts an ArrayBuffer for `fonts[].data`.
function decodeFont(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (ch) => ch.codePointAt(0) ?? 0)
  return bytes.buffer
}

// Brand fonts for the social cards, decoded once at module load. Each is an
// instanced + Latin/Latin-1/Latin-Ext-A subset of the upstream Google Fonts
// variable TTF (see the per-file headers).
export const ogFonts = {
  fraunces600: decodeFont(fraunces600Base64),
  dmSans700: decodeFont(dmSans700Base64),
  dmSans500: decodeFont(dmSans500Base64)
}
