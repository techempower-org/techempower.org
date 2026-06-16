import { type ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import { NotionRenderer } from 'react-notion-x'

import styles from './SpanishToggle.module.css'

const STORAGE_KEY = 'techempower-show-spanish'

interface SpanishToggleProps {
  blockIds: string[]
  recordMap: ExtendedRecordMap
  darkMode?: boolean
}

/**
 * Language toggle that shows/hides Spanish translation content on guide pages.
 *
 * When Spanish callout blocks are found in the Notion recordMap, this component
 * renders them inside a collapsible section. When no Spanish content exists,
 * the component renders nothing.
 */
export function SpanishToggle({
  blockIds,
  recordMap,
  darkMode
}: SpanishToggleProps) {
  const [showSpanish, setShowSpanish] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        setShowSpanish(true)
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [])

  const handleToggle = React.useCallback(() => {
    setShowSpanish((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage may be unavailable
      }
      return next
    })
  }, [])

  // Don't render if there are no Spanish blocks or before hydration
  if (!hasMounted || !blockIds.length) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      <button
        type='button'
        className={styles.toggle}
        onClick={handleToggle}
        aria-expanded={showSpanish}
        aria-controls='spanish-callout'
      >
        <span className={styles.toggleIcon} aria-hidden='true'>
          {showSpanish ? '\u25BC' : '\u25B6'}
        </span>
        <span className={styles.toggleLabel}>
          {showSpanish
            ? 'Hide Spanish / Ocultar espa\u00F1ol'
            : 'View in Spanish / Ver en espa\u00F1ol'}
        </span>
      </button>

      {showSpanish && (
        <aside
          id='spanish-callout'
          className={styles.callout}
          role='region'
          aria-label='Traducción al español'
          lang='es'
        >
          <span className={styles.calloutIcon} aria-hidden='true'>
            {'\uD83C\uDDF2\uD83C\uDDFD'}
          </span>
          <div className={styles.calloutBody}>
            {blockIds.map((blockId) => (
              <NotionRenderer
                key={blockId}
                recordMap={recordMap}
                rootPageId={blockId}
                darkMode={darkMode}
                fullPage={false}
                disableHeader
              />
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}
