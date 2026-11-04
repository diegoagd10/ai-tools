import { GENERIC_ERROR_MESSAGE } from '@ai-tools/shared'
import { type Browser, type BrowserContext, type Page, chromium } from 'playwright'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vite-plus/test'
import type { Database } from '../../api/src/db/database'
import { eventually } from './browser'
import { deleteUser } from './database'
import { clearFault, injectFault } from './fault-proxy'
import { SEEDED } from './fixtures'
import { connectDatabase, sessionCookie, signedInPage } from './session'

const { proxyUrl: PROXY_URL, webUrl: WEB_URL } = SEEDED

describe('Home page (e2e)', () => {
  let browser: Browser
  let database: Database
  let context: BrowserContext
  let page: Page
  let username: string

  beforeAll(async () => {
    browser = await chromium.launch()
    database = await connectDatabase()
  })

  afterAll(async () => {
    database.close()
    await browser.close()
  })

  beforeEach(async () => {
    ;({ context, page, username } = await signedInPage(browser, database))
  })

  afterEach(async () => {
    await clearFault(PROXY_URL, username)
    await context.close()
  })

  const welcome = () => page.getByRole('heading', { name: `Welcome, ${username}` })
  const failure = () => page.getByRole('alert').filter({ hasText: GENERIC_ERROR_MESSAGE })

  it('greets the logged-in user', async () => {
    await page.goto(`${WEB_URL}/`)

    await expect.poll(() => welcome().isVisible(), eventually).toBe(true)
    expect(await failure().count()).toBe(0)
  })

  it.each([
    ['responds 500', { status: 500 }],
    ['is unreachable', 'connection-reset'],
  ] as const)('shows a generic error when the backend %s', async (_case, fault) => {
    await injectFault(PROXY_URL, fault, username)

    await page.goto(`${WEB_URL}/`)

    await expect.poll(() => failure().count(), eventually).toBe(1)
    expect(await welcome().count()).toBe(0)
  })

  it('shows a generic error when the backend answers something that is not a profile', async () => {
    await injectFault(PROXY_URL, { status: 200, body: '{"name":"ana"}' }, username)

    await page.goto(`${WEB_URL}/`)

    await expect.poll(() => failure().count(), eventually).toBe(1)
  })

  it('deletes the session and shows the login page when the user no longer exists', async () => {
    await deleteUser(SEEDED, username)

    await page.goto(`${WEB_URL}/`)
    await page.waitForURL(`${WEB_URL}/login`)

    expect(await sessionCookie(context)).toBeUndefined()
    expect(await page.getByRole('form', { name: 'Log in' }).isVisible()).toBe(true)
  })
})
