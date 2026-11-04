import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { Database } from '../src/db/database.js'
import { users } from '../src/db/schema.js'
import { seedUser } from '../src/db/seed.js'
import {
  INVALID_TOKENS,
  type TestApp,
  accessTokenFor,
  createTestApp,
  signAccessToken,
  withBearer,
} from './app.js'

const USERNAME = 'ana'
const PASSWORD = 'correct-horse-battery-staple'

describe('GET /v1/profile (e2e)', () => {
  let app: TestApp

  beforeEach(async () => {
    app = await createTestApp()
    await seedUser(app.get(Database), { username: USERNAME, password: PASSWORD })
  })

  afterEach(async () => {
    await app.close()
  })

  const profile = (token: string | null) =>
    withBearer(request(app.getHttpServer()).get('/v1/profile'), token)

  it('answers with the logged-in user', async () => {
    const response = await profile(await accessTokenFor(app, USERNAME, PASSWORD))

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ username: USERNAME })
  })

  it('rejects a request without a token with 401', async () => {
    expect((await profile(null)).status).toBe(401)
  })

  it('rejects another authorization scheme with 401', async () => {
    const token = await accessTokenFor(app, USERNAME, PASSWORD)

    const response = await request(app.getHttpServer())
      .get('/v1/profile')
      .set('Authorization', `Basic ${token}`)

    expect(response.status).toBe(401)
  })

  it.each(INVALID_TOKENS)('rejects %s with 401', async (_case, token) => {
    expect((await profile(await token())).status).toBe(401)
  })

  it('rejects a valid token whose user no longer exists with 401', async () => {
    const token = await signAccessToken()
    await app.get(Database).db.delete(users)

    expect((await profile(token)).status).toBe(401)
  })
})
