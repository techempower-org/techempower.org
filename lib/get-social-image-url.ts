import { api, host } from './config'

export function getSocialImageUrl(
  pageId: string | undefined,
  title?: string | undefined
) {
  try {
    const url = new URL(api.getSocialImage, host)

    // The card is rendered from the title alone (no Notion fetch on the request
    // path). `id` is kept as a stable cache-identity param. Either is enough to
    // produce a card; a missing title falls back to the site-level mission card.
    if (pageId) {
      url.searchParams.set('id', pageId)
    }

    if (title) {
      url.searchParams.set('title', title)
    }

    if (pageId || title) {
      return url.toString()
    }
  } catch (err: any) {
    console.warn('error invalid social image url', pageId, err.message)
  }

  return null
}
