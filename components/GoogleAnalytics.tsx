import { useRouter } from 'next/router'
import Script from 'next/script'
import * as React from 'react'

const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function GoogleAnalytics() {
  const router = useRouter()

  // Fire a pageview on client-side route changes so GA4 sees SPA navigations.
  React.useEffect(() => {
    if (!gaTrackingId) return
    const handle = (url: string) => {
      window.gtag?.('event', 'page_view', {
        page_path: url,
        page_location: window.location.origin + url,
        page_title: document.title
      })
    }
    router.events.on('routeChangeComplete', handle)
    return () => {
      router.events.off('routeChangeComplete', handle)
    }
  }, [router.events])

  if (!gaTrackingId) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
        strategy='afterInteractive'
      />
      <Script id='google-analytics' strategy='afterInteractive'>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaTrackingId}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  )
}

/**
 * Fire a custom event to GA4. Returns true if dispatched, false if GA is
 * not loaded (no measurement id, ad blocker, etc.) so callers can fall
 * back gracefully.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>
): boolean {
  if (typeof window === 'undefined' || !window.gtag) return false
  window.gtag('event', name, params ?? {})
  return true
}
