// Capture 1920x1080 viewport + full-page screenshots of the remaining Ep2 screencast targets.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const OUT = process.argv[2] || 'out'
fs.mkdirSync(OUT, { recursive: true })

const targets = [
  {
    name: '05a-library-hotspots-program',
    url: 'https://www.nevadacountyca.gov/3934/Hotspots'
  },
  {
    name: '05b-library-catalog-hotspot-search',
    url: 'https://library.nevadacountyca.gov/polaris/search/searchresults.aspx?ctx=1.1033.0.0.1&type=Default&term=hotspot&by=KW&sort=MP&limit=(TOM=*%20AND%20OWN=1)&query=&page=0&searchid=9',
    hover:
      'a[id*="PlaceHold"], a[title*="Place Hold"], a:has-text("Place Hold")'
  },
  {
    name: '06-tmobile-project-10million',
    url: 'https://www.t-mobile.com/brand/project-10-million'
  },
  {
    name: '07a-c4c-low-income-families',
    url: 'https://computersforclassrooms.org/buy-a-computer/computers-for-low-income-families/'
  },
  {
    name: '07b-c4c-price-sheet',
    url: 'https://computersforclassrooms.org/buy-a-computer/price-sheet/'
  },
  {
    name: '07c-c4c-policies-warranties',
    url: 'https://computersforclassrooms.org/policies-warranties/'
  },
  { name: '08a-humanit-store', url: 'https://store.human-i-t.org/' },
  {
    name: '08b-humanit-basic-chromebook',
    url: 'https://store.human-i-t.org/basic-chromebook-laptop/'
  },
  { name: '09a-seniorplanet-hotline', url: 'https://seniorplanet.org/hotline' },
  { name: '09b-caconnect', url: 'https://caconnect.org/' },
  { name: '09c-techempower-discord-button', url: 'https://techempower.org/' }
]

const only = process.argv[3] ? process.argv[3].split(',') : null

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1920,1080',
    '--lang=en-US'
  ]
})

const dismissSelectors = [
  '#onetrust-accept-btn-handler',
  'button#truste-consent-button',
  '.cc-dismiss',
  '.cc-btn.cc-allow',
  'button[aria-label="Close"]',
  'button[aria-label="close"]',
  '.cookie-notice button',
  '#cookie-notice .cn-set-cookie',
  'button.cmplz-accept',
  '.cli_action_button.cli_accept',
  'button[title="Accept"]'
]

for (const t of targets) {
  if (only && !only.some((o) => t.name.startsWith(o))) continue
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'
  )
  try {
    await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 60000 })
  } catch (e) {
    console.log(`${t.name}: goto warning: ${e.message.split('\n')[0]}`)
  }
  await new Promise((r) => setTimeout(r, 2500))
  for (const sel of dismissSelectors) {
    try {
      const el = await page.$(sel)
      if (el) {
        await el.click().catch(() => null)
        await new Promise((r) => setTimeout(r, 600))
      }
    } catch {}
  }
  // Accept any text-based consent buttons
  try {
    await page.evaluate(() => {
      const re =
        /^(accept( all)?( cookies)?|i agree|got it|ok(ay)?|allow all|continue)$/i
      for (const b of document.querySelectorAll('button, a')) {
        if (re.test((b.textContent || '').trim())) {
          b.click()
        }
      }
    })
  } catch {}
  await new Promise((r) => setTimeout(r, 800))
  if (t.hover) {
    try {
      const h = await page.evaluateHandle(() => {
        const cands = [
          ...document.querySelectorAll(
            'a, button, input[type=button], input[type=submit]'
          )
        ]
        return (
          cands.find((e) =>
            /place hold|place request|request/i.test(
              e.textContent || e.value || e.title || ''
            )
          ) || null
        )
      })
      const el = h.asElement()
      if (el) {
        await el.scrollIntoView()
        await el.hover()
        await new Promise((r) => setTimeout(r, 500))
        console.log(`${t.name}: hovering hold button`)
      } else console.log(`${t.name}: no hold button found`)
    } catch (e) {
      console.log(`${t.name}: hover failed ${e.message}`)
    }
  }
  await page.screenshot({ path: `${OUT}/${t.name}.png` })
  await page.screenshot({ path: `${OUT}/${t.name}.full.png`, fullPage: true })
  const title = await page.title()
  console.log(`${t.name}: ${page.url()} | ${title}`)
  await page.close()
}
await browser.close()
