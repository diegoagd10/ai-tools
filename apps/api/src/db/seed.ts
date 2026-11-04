import { newUserSchema } from '@ai-tools/shared'
import { hashPassword } from '../auth/password.js'
import { normalizeUsername } from '../users/users.service.js'
import type { Database } from './database.js'
import { users } from './schema.js'

export type SeedUser = { username: string; password: string }

// Development and test data only: the API itself never seeds users. Users follow the same rules as
// registration, so it never creates a user that could not have been registered.
export const seedUser = async (database: Database, user: SeedUser) => {
  const result = newUserSchema.safeParse(user)
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => issue.message).join('\n'))
  }

  const username = normalizeUsername(result.data.username)
  const passwordHash = await hashPassword(result.data.password)
  await database.db
    .insert(users)
    .values({ username, passwordHash })
    .onConflictDoUpdate({ target: users.username, set: { passwordHash } })
}
