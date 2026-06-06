import Link from 'next/link'
import * as React from 'react'

import * as config from '@/lib/config'
import { MoonIcon } from '@/lib/icons/moon'
import { SunIcon } from '@/lib/icons/sun'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './Footer.module.css'

export function FooterImpl() {
  const currentYear = new Date().getFullYear()
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href='/' className={styles.logo}>
            <span aria-hidden='true'>⚡</span> TechEMPOWER.org
          </Link>
          <p className={styles.tagline}>Technology for All: Access Made Easy</p>
        </div>

        <nav className={styles.links} aria-label='Footer navigation'>
          <Link href='/' className={styles.link}>
            Guides
          </Link>
          <Link href='/resources' className={styles.link}>
            Resources
          </Link>
          <Link href='/submit' className={styles.link}>
            Submit a resource
          </Link>
          <Link href='/about' className={styles.link}>
            About
          </Link>
          <Link href='/donate' className={styles.link}>
            Donate
          </Link>
          <Link href='/non-discrimination-policy' className={styles.link}>
            Non-Discrimination Policy
          </Link>
          <Link href='/privacy-policy' className={styles.link}>
            Privacy Policy
          </Link>
        </nav>

        <button
          type='button'
          className={styles.themeToggle}
          onClick={toggleDarkMode}
          aria-label={
            isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
          }
        >
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className={styles.copyright}>
          &copy; {currentYear} {config.author}. A 501(c)(3) nonprofit based in
          Grass Valley, California. EIN 92-2581940. Donations are
          tax-deductible.
        </div>
      </div>
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
