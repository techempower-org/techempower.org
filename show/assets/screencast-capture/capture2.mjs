// Second pass: framed shots — scroll a specific text beat into view, hide distractions.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const OUT = process.argv[2] || 'out'
fs.mkdirSync(OUT, { recursive: true })

const targets = [
  {
    name: '05a-library-hotspots-lending-policy',
    url: 'https://www.nevadacountyca.gov/3934/Hotspots',
    hide: [
      '.emergency-alert',
      '#alertWrapper',
      '[class*="Alert"]',
      '[id*="alert" i]',
      'iframe[title*="chat" i]',
      '[class*="chat" i]',
      '#google_translate_element',
      '.goog-te-banner-frame'
    ],
    scrollText: 'Lending Policies',
    offset: 260
  },
  {
    name: '06b-tmobile-200gb-5-years',
    url: 'https://www.t-mobile.com/brand/project-10-million',
    scrollText: 'Free 200GB of internet per year for 5 years',
    offset: 300,
    hide: ['[class*="chat" i]', '[id*="chat" i]']
  },
  {
    name: '07b-c4c-price-sheet-150-desktop',
    url: 'https://computersforclassrooms.org/buy-a-computer/price-sheet/',
    scrollText: 'Desktop Computers',
    offset: 120
  },
  {
    name: '08c-humanit-laptops-category',
    url: 'https://store.human-i-t.org/categories/laptop/',
    hide: [
      '[class*="chat" i]',
      '[id*="chat" i]',
      '#gorgias-chat-container',
      'iframe[title*="chat" i]',
      '.weglot-container',
      '#weglot-listbox'
    ]
  },
  {
    name: '08a-humanit-store-clean',
    url: 'https://store.human-i-t.org/',
    hide: [
      '[class*="chat" i]',
      '[id*="chat" i]',
      '#gorgias-chat-container',
      'iframe[title*="chat" i]',
      '.weglot-container',
      '#weglot-listbox'
    ]
  },
  {
    name: '09c-techempower-open-discord',
    url: 'https://techempower.org/',
    scrollText: 'Open Discord',
    offset: 400,
    hide: [
      '[class*="chat" i]',
      '[id*="chat" i]',
      'button[aria-label*="chat" i]'
    ]
  }
]

const only = process.argv[3] ? process.argv[3].split(',') : null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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
  await sleep(2500)
  // Text-based consent dismissal
  try {
    await page.evaluate(() => {
      const re =
        /^(accept( all)?( cookies)?|i agree|got it|ok(ay)?|allow all|continue)$/i
      for (const b of document.querySelectorAll('button, a'))
        if (re.test((b.textContent || '').trim())) b.click()
    })
  } catch {}
  if (t.hide?.length) {
    await page.evaluate((sels) => {
      for (const s of sels) {
        try {
          document.querySelectorAll(s).forEach((e) => {
            e.style.setProperty('display', 'none', 'important')
          })
        } catch {}
      }
    }, t.hide)
  }
  if (t.scrollText) {
    const found = await page.evaluate(
      (txt, offset) => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT
        )
        let node
        const needle = txt.toLowerCase()
        while ((node = walker.nextNode())) {
          if ((node.textContent || '').toLowerCase().includes(needle)) {
            const el = node.parentElement
            if (!el || el.closest('script,style,noscript')) continue
            const r = el.getBoundingClientRect()
            if (r.width === 0 && r.height === 0) continue
            const y = window.scrollY + r.top - offset
            window.scrollTo({ top: Math.max(0, y), behavior: 'instant' })
            return `${el.tagName} @y=${Math.round(window.scrollY + r.top)}`
          }
        }
        return null
      },
      t.scrollText,
      t.offset ?? 200
    )
    console.log(
      `${t.name}: scroll target ${found ? 'found ' + found : 'NOT FOUND'}`
    )
    await sleep(1200)
    // Re-hide anything that popped up on scroll (sticky headers we keep; chat widgets we hide)
    if (t.hide?.length)
      await page.evaluate((sels) => {
        for (const s of sels) {
          try {
            document
              .querySelectorAll(s)
              .forEach((e) =>
                e.style.setProperty('display', 'none', 'important')
              )
          } catch {}
        }
      }, t.hide)
  }
  await page.screenshot({ path: `${OUT}/${t.name}.png` })
  console.log(`${t.name}: ${page.url()} | ${await page.title()}`)
  await page.close()
}
await browser.close()
