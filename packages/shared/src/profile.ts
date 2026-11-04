import { z } from 'zod'

// What the API tells a logged-in user about themselves.
export const profileSchema = z.object({ username: z.string() })

export type Profile = z.infer<typeof profileSchema>
