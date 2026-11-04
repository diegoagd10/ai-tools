import type { Page } from 'playwright'

// The header every logged-in page shares.
export const header = (page: Page) => {
  const banner = page.getByRole('banner')
  return {
    logo: () => banner.getByText('AI Tools'),
    logOut: () => banner.getByRole('button', { name: 'Log out' }),
  }
}
