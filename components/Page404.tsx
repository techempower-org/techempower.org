import Link from 'next/link'

import type * as types from '@/lib/types'

import { PageHead } from './PageHead'
import styles from './styles.module.css'

export function Page404({ site }: types.PageProps) {
  const title = `Page not found — ${site?.name || 'TechEmpower'}`

  return (
    <>
      <PageHead site={site} title={title} />

      <div className={styles.container}>
        <main className={styles.main}>
          <h1>Page not found</h1>

          <p>
            We couldn&rsquo;t find that page. It may have been moved, or the
            link might be old. Try one of these:
          </p>

          <ul className={styles.errorLinks}>
            <li>
              <Link href='/'>Home</Link>
            </li>
            <li>
              <Link href='/resources'>Search free programs</Link>
            </li>
            <li>
              <Link href='/about'>About TechEmpower</Link>
            </li>
          </ul>

          <p>
            Still stuck? Call <strong>2-1-1</strong> from any phone for free
            help finding food, housing, healthcare, and other local resources.
          </p>
        </main>
      </div>
    </>
  )
}
