import type { Browser, BrowserContextOptions, Locator } from 'playwright'

// A fresh context per test, so no cookies leak between tests, in the locale the tests expect.
export const openPage = async (browser: Browser, options: BrowserContextOptions = {}) => {
  const context = await browser.newContext({ locale: 'en-US', ...options })
  const page = await context.newPage()
  page.setDefaultTimeout(5_000)
  return { context, page }
}

// Waits for the UI to settle on a value, since data loads after the page renders.
export const eventually = { timeout: 5_000, interval: 100 }

export const box = async (locator: Locator) => {
  const bounds = await locator.boundingBox()
  if (bounds === null) throw new Error('The element is hidden')
  return bounds
}

// Whether the two elements overlap vertically, as items of one row do.
export const sameRow = async (a: Locator, b: Locator) => {
  const first = await box(a)
  const second = await box(b)
  return second.y < first.y + first.height && second.y + second.height > first.y
}
