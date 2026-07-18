// NOTE: katex.min.css (24KB) intentionally NOT imported here. The Equation
// component in NotionPage.tsx is dynamic()-imported, and katex CSS should
// load with it on-demand rather than ship on every page. The TechEMPOWER
// content (resources/guides) does not currently contain math equations,
// so eager-loading 24KB of KaTeX styles wastes bandwidth and parse time
// on every cold render.
// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-coy.css'
// core styles shared by all of react-notion-x (required)
import 'react-notion-x/styles.css'
// global styles shared across the entire site
import 'styles/global.css'
// this might be better for dark mode
// import 'prismjs/themes/prism-okaidia.css'
// global style overrides for notion
import 'styles/notion.css'
// global style overrides for prism theme (optional)
import 'styles/prism-theme.css'

import type { AppProps } from 'next/app'
import * as Fathom from 'fathom-client'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'
import { posthog } from 'posthog-js'
import * as React from 'react'

import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { Layout } from '@/components/Layout'
import { bootstrap } from '@/lib/bootstrap-client'
import {
  fathomConfig,
  fathomId,
  isServer,
  posthogConfig,
  posthogId
} from '@/lib/config'

// Trickle fast enough to reach ~60-70% during a typical 3-5s server
// fetch, giving steady visual progress. NProgress.inc() has built-in
// diminishing returns so the bar naturally slows as it approaches 100%.
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.1,
  easing: 'ease',
  speed: 300
})

const BUILD_VERSION = 'teal-puma-v3'

if (!isServer) {
  bootstrap()
  console.log(
    `%c⚡ TechEMPOWER.org ${BUILD_VERSION}`,
    'color:#0d9488;font-weight:bold'
  )
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  React.useEffect(() => {
    function onRouteChangeComplete() {
      NProgress.done()

      if (fathomId) {
        Fathom.trackPageview()
      }

      // /qualify is analytics-free by promise (see posthogConfig)
      if (posthogId && !window.location.pathname.startsWith('/qualify')) {
        posthog.capture('$pageview')
      }
    }

    // Start NProgress on ANY internal link click — catches both
    // Next.js SPA navigations and full page loads (e.g. react-notion-x
    // collection cards that render plain <a> tags).
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      // Skip external links, new-tab clicks, and modifier keys
      if (anchor.target === '_blank') return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (anchor.origin && anchor.origin !== window.location.origin) return
      NProgress.start()
    }

    document.addEventListener('click', onLinkClick, { capture: true })

    if (fathomId) {
      Fathom.load(fathomId, fathomConfig)
    }

    if (posthogId) {
      posthog.init(posthogId, posthogConfig)
    }

    router.events.on('routeChangeStart', NProgress.start)
    router.events.on('routeChangeComplete', onRouteChangeComplete)
    router.events.on('routeChangeError', NProgress.done)

    return () => {
      document.removeEventListener('click', onLinkClick, { capture: true })
      router.events.off('routeChangeStart', NProgress.start)
      router.events.off('routeChangeComplete', onRouteChangeComplete)
      router.events.off('routeChangeError', NProgress.done)
    }
  }, [router.events])

  return (
    <>
      <GoogleAnalytics />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
