import Document, { Head, Html, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  override render() {
    return (
      <Html lang='en'>
        <Head>
          <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
          <link rel='shortcut icon' href='/favicon.ico' />
          <link rel='icon' type='image/png' sizes='32x32' href='/favicon.png' />
          <link
            rel='icon'
            type='image/png'
            sizes='192x192'
            href='/favicon-192x192.png'
          />
          <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
          <link rel='manifest' href='/manifest.json' />

          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link
            rel='preconnect'
            href='https://fonts.gstatic.com'
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
