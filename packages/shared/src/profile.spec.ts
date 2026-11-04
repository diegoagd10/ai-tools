import { describe, expect, it } from 'vite-plus/test'
import { profileSchema } from './profile'

describe('profileSchema', () => {
  it('accepts a username', () => {
    expect(profileSchema.parse({ username: 'ana' })).toEqual({ username: 'ana' })
  })

  it.each([
    ['a missing username', {}],
    ['a non-string username', { username: 42 }],
  ])('rejects %s', (_case, body) => {
    expect(profileSchema.safeParse(body).success).toBe(false)
  })
})
