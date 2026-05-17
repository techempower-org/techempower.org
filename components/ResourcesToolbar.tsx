import * as React from 'react'
import { createPortal } from 'react-dom'

/**
 * Client-side search, sort, and filter toolbar for the resources gallery.
 * Uses a portal to inject itself after the Notion view tabs row,
 * then operates on the DOM — shows/hides `.notion-collection-card`
 * elements based on user input.
 */
export function ResourcesToolbar() {
  const [query, setQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'default' | 'az' | 'za'>('default')
  const [activeCategory, setActiveCategory] = React.useState<string | null>(
    null
  )
  const [categories, setCategories] = React.useState<string[]>([])
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(
    null
  )

  // Create a container element and insert it after the view tabs row
  React.useEffect(() => {
    const findAndInsert = () => {
      const tabsRow = document.querySelector(
        '.resources-page .notion-collection-view-tabs-row'
      )
      if (!tabsRow?.parentElement) return false

      const container = document.createElement('div')
      container.className = 'resources-toolbar-portal'
      tabsRow.parentElement.insertBefore(container, tabsRow.nextSibling)
      setPortalTarget(container)
      return true
    }

    if (!findAndInsert()) {
      // If tabs row isn't rendered yet, wait for it
      const observer = new MutationObserver(() => {
        if (findAndInsert()) observer.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
      return () => observer.disconnect()
    }

    return () => {
      // Cleanup portal container on unmount
      const el = document.querySelector('.resources-toolbar-portal')
      el?.remove()
    }
  }, [])

  // Extract available categories from cards on mount
  React.useEffect(() => {
    const cats = new Set<string>()
    const cards = document.querySelectorAll(
      '.resources-page .notion-collection-card'
    )
    for (const card of cards) {
      const tags = card.querySelectorAll(
        '.notion-property-multi_select-item, .notion-property-select-item'
      )
      for (const tag of tags) {
        const text = tag.textContent?.trim()
        if (text) cats.add(text)
      }
    }
    setCategories([...cats].toSorted())
  }, [])

  // Apply search + filter + sort whenever inputs change
  React.useEffect(() => {
    const container = document.querySelector(
      '.resources-page .notion-gallery-grid'
    ) as HTMLElement | null
    if (!container) return

    const cards = [
      ...container.querySelectorAll(':scope > .notion-collection-card')
    ] as HTMLElement[]
    const lowerQuery = query.toLowerCase()

    // Filter: show/hide cards
    for (const card of cards) {
      const allText = card.textContent?.toLowerCase() || ''

      const matchesSearch = !lowerQuery || allText.includes(lowerQuery)

      let matchesCategory = true
      if (activeCategory) {
        const tags = card.querySelectorAll(
          '.notion-property-multi_select-item, .notion-property-select-item'
        )
        matchesCategory = [...tags].some(
          (t) => t.textContent?.trim() === activeCategory
        )
      }

      card.style.display = matchesSearch && matchesCategory ? '' : 'none'
    }

    // Sort: reorder visible cards
    if (sortBy !== 'default') {
      const visible = cards.filter((c) => c.style.display !== 'none')
      visible.sort((a, b) => {
        const aText =
          a
            .querySelector('.notion-page-title-text')
            ?.textContent?.trim()
            ?.toLowerCase() || ''
        const bText =
          b
            .querySelector('.notion-page-title-text')
            ?.textContent?.trim()
            ?.toLowerCase() || ''
        return sortBy === 'az'
          ? aText.localeCompare(bText)
          : bText.localeCompare(aText)
      })
      for (const card of visible) {
        container.append(card)
      }
    }
  }, [query, sortBy, activeCategory])

  // Re-scan categories when the view changes (tabs switch = DOM mutation)
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const cats = new Set<string>()
      const cards = document.querySelectorAll(
        '.resources-page .notion-collection-card'
      )
      for (const card of cards) {
        const tags = card.querySelectorAll(
          '.notion-property-multi_select-item, .notion-property-select-item'
        )
        for (const tag of tags) {
          const text = tag.textContent?.trim()
          if (text) cats.add(text)
        }
      }
      const sorted = [...cats].toSorted()
      setCategories((prev) =>
        prev.join(',') === sorted.join(',') ? prev : sorted
      )
    })

    const target = document.querySelector('.resources-page')
    if (target) {
      observer.observe(target, { childList: true, subtree: true })
    }
    return () => observer.disconnect()
  }, [])

  // Reset filters when view tabs change
  React.useEffect(() => {
    const handleTabClick = () => {
      setQuery('')
      setSortBy('default')
      setActiveCategory(null)
    }

    const tabs = document.querySelectorAll(
      '.resources-page .notion-collection-view-tabs-content-item'
    )
    for (const tab of tabs) {
      tab.addEventListener('click', handleTabClick)
    }
    return () => {
      for (const tab of tabs) {
        tab.removeEventListener('click', handleTabClick)
      }
    }
  }, [portalTarget])

  const toolbar = (
    <div className='resources-toolbar'>
      <div className='resources-toolbar-row'>
        <div className='resources-search-wrapper'>
          <svg
            className='resources-search-icon'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='11' cy='11' r='8' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
          </svg>
          <input
            type='text'
            className='resources-search-input'
            placeholder='Search resources...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className='resources-search-clear'
              onClick={() => setQuery('')}
              aria-label='Clear search'
            >
              &times;
            </button>
          )}
        </div>

        <select
          className='resources-sort-select'
          aria-label='Sort resources'
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'default' | 'az' | 'za')}
        >
          <option value='default'>Sort: Default</option>
          <option value='az'>Sort: A &rarr; Z</option>
          <option value='za'>Sort: Z &rarr; A</option>
        </select>
      </div>

      {categories.length > 0 && (
        <div className='resources-filter-chips'>
          <button
            className={`resources-chip ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`resources-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() =>
                setActiveCategory((prev) => (prev === cat ? null : cat))
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Use portal to render inside the Notion page after the tabs row
  if (portalTarget) {
    return createPortal(toolbar, portalTarget)
  }

  // Fallback: render inline (SSR or before portal target is found)
  return null
}
