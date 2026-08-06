// Rendered-verification screenshot script for Arc's Railway redesign.
// Usage: node scripts/screens.mjs [baseUrl]
// Default baseUrl is the local dev server; pass the live URL to re-shoot prod.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const baseUrl = process.argv[2] ?? 'http://localhost:8201'
const outDir = '/tmp/arc-shots'
mkdirSync(outDir, { recursive: true })

const EMAIL = process.env.ARC_EMAIL ?? 'admin@example.com'
const PASSWORD = process.env.ARC_PASSWORD ?? 'changeme'

const routes = [
  { path: '/', name: 'dashboard' },
  { path: '/applications', name: 'applications' },
  { path: '/pipeline', name: 'pipeline' },
  { path: '/login', name: 'login', skipAuth: true },
]

async function shootTheme(context, page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('arc-theme', t)
  }, theme)
  for (const route of routes.filter((r) => !r.skipAuth)) {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' })
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
    await page
      .waitForFunction(() => !document.body.innerText.includes('Loading…'), { timeout: 5000 })
      .catch(() => {})
    await page.waitForTimeout(300)
    if (route.path === '/applications') {
      // also grab a detail view
      const firstLink = page.locator('table a[href^="/applications/"]').first()
      if (await firstLink.count()) {
        await firstLink.click()
        await page.waitForLoadState('networkidle')
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
        await page.waitForTimeout(300)
        await page.screenshot({ path: `${outDir}/detail-${theme}.png`, fullPage: true })
        await page.goBack()
        await page.waitForLoadState('networkidle')
        await page
          .waitForFunction(() => !document.body.innerText.includes('Loading…'), { timeout: 5000 })
          .catch(() => {})
        await page.waitForTimeout(300)
      }
    }
    await page.screenshot({ path: `${outDir}/${route.name}-${theme}.png`, fullPage: true })
    console.log(`Saved ${route.name}-${theme}.png`)
  }
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

// Login screenshots first (pre-auth), light + dark.
for (const theme of ['light', 'dark']) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await page.evaluate((t) => {
    localStorage.setItem('arc-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }, theme)
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${outDir}/login-${theme}.png`, fullPage: true })
  console.log(`Saved login-${theme}.png`)
}

// Authenticate via the API directly (sets the cookie the app reads).
const loginResp = await context.request.post(`${baseUrl.replace('8201', '8000')}/api/auth/login`, {
  data: { email: EMAIL, password: PASSWORD },
})
if (!loginResp.ok()) {
  console.error('Login failed', loginResp.status(), await loginResp.text())
  process.exit(1)
}

for (const theme of ['light', 'dark']) {
  await shootTheme(context, page, theme)
}

await browser.close()
console.log('Done. Screenshots in', outDir)
