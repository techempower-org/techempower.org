import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'

import { trackEvent } from '@/components/GoogleAnalytics'

import styles from './Header.module.css'

const NAV_LINKS = [
  { href: '/', label: 'Guides' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' }
] as const

export function Header() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)

  // Close mobile menu on route change
  React.useEffect(() => {
    const handleRouteChange = () => setMenuOpen(false)
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router.events])

  // Close on Escape
  React.useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href='/' className={styles.logo} aria-label='Techempower.org home'>
          <span className={styles.logoIcon} aria-hidden='true'>
            ⚡
          </span>
          TechEMPOWER.org
        </Link>

        {/* Desktop nav */}
        <nav className={styles.desktopNav} aria-label='Main navigation'>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${
                router.pathname === href ||
                (href !== '/' && router.asPath.startsWith(href))
                  ? styles.navLinkActive
                  : ''
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href='/donate'
            className={`${styles.navLink} ${styles.donateLink}`}
            onClick={() =>
              trackEvent('donate_intent', { location: 'header_desktop' })
            }
          >
            Donate
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type='button'
          className={styles.menuButton}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls='mobile-nav'
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg
            className={styles.menuIcon}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
            aria-hidden='true'
          >
            {menuOpen ? (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M6 18L18 6M6 6l12 12'
              />
            ) : (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M4 6h16M4 12h16M4 18h16'
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav
          id='mobile-nav'
          className={styles.mobileNav}
          aria-label='Mobile navigation'
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.mobileNavLink} ${
                router.pathname === href ||
                (href !== '/' && router.asPath.startsWith(href))
                  ? styles.mobileNavLinkActive
                  : ''
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href='/donate'
            className={styles.mobileDonateLink}
            onClick={() =>
              trackEvent('donate_intent', { location: 'header_mobile' })
            }
          >
            Donate
          </Link>
        </nav>
      )}
    </header>
  )
}
