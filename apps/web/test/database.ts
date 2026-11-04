import { type InValue, createClient } from '@libsql/client'
import type { Environment } from './fixtures'

// Writes straight to the environment's SQLite file, for states the API offers no way to reach.
const execute = async ({ databasePath }: Environment, sql: string, args: InValue[] = []) => {
  // Waits for the API's locks instead of failing with SQLITE_BUSY, like the API's own client.
  const client = createClient({ url: `file:${databasePath}`, timeout: 5_000 })
  try {
    await client.execute({ sql, args })
  } finally {
    client.close()
  }
}

// Returns to the "no account yet" state.
export const deleteAllUsers = (environment: Environment) =>
  execute(environment, 'DELETE FROM users')

// Deletes a user behind the page's back, leaving their token valid.
export const deleteUser = (environment: Environment, username: string) =>
  execute(environment, 'DELETE FROM users WHERE username = ?', [username])
