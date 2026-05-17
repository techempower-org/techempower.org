import Document, { Head, Html, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  override render() {
    return (
      <Html lang='en'>
        <Head>
          {/* Cache-bust query string — browsers cache favicons separately
              from regular images and often ignore Cache-Control headers
              on the favicon specifically. Bump `v=N` when changing the
              favicon to force every browser to re-fetch. */}
          <link rel='icon' type='image/svg+xml' href='/favicon.svg?v=2' />
          <link rel='shortcut icon' href='/favicon.ico?v=2' />
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/favicon.png?v=2'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='192x192'
            href='/favicon-192x192.png?v=2'
          />
          <link rel='apple-touch-icon' href='/apple-touch-icon.png?v=2' />
          <link rel='manifest' href='/manifest.json?v=2' />

          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link
            rel='preconnect'
            href='https://fonts.gstatic.com'
            crossOrigin=''
          />
          {/* Notion image proxy: every resource card cover is fetched via
              `www.notion.so/image/...` which 302-redirects to
              `img.notionusercontent.com`. /resources renders ~195 such
              images — preconnect both hosts so the DNS+TLS handshake is
              warmed before HTML parsing reaches the <img> tags, saving
              ~200ms on cold cards-grid renders. crossOrigin is required
              for the redirect target (anonymous CORS image fetch). */}
          <link rel='preconnect' href='https://www.notion.so' />
          <link
            rel='preconnect'
            href='https://img.notionusercontent.com'
            crossOrigin=''
          />
          <link
            href='https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400&display=swap'
            rel='stylesheet'
          />
        </Head>

        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
/** Dark mode: follow system preference, allow manual override */
;(function () {
  var storageKey = 'darkMode'
  var classNameDark = 'dark-mode'
  var classNameLight = 'light-mode'
  function setClassOnDocumentBody(darkMode) {
    document.body.classList.add(darkMode ? classNameDark : classNameLight)
    document.body.classList.remove(darkMode ? classNameLight : classNameDark)
  }
  var preferDarkQuery = '(prefers-color-scheme: dark)'
  var mql = window.matchMedia(preferDarkQuery)
  var localStorageTheme = null
  try {
    localStorageTheme = localStorage.getItem(storageKey)
  } catch (err) {}
  // Use localStorage only if user has explicitly toggled;
  // otherwise follow system preference
  if (localStorageTheme !== null) {
    setClassOnDocumentBody(JSON.parse(localStorageTheme))
  } else {
    setClassOnDocumentBody(mql.matches)
  }
  // Listen for system preference changes (when no manual override)
  mql.addEventListener('change', function (e) {
    try {
      if (localStorage.getItem(storageKey) === null) {
        setClassOnDocumentBody(e.matches)
      }
    } catch (err) {}
  })
})();
`
            }}
          />
          <Main />

          <NextScript />
        </body>
      </Html>
    )
  }
}
