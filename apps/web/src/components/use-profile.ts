import { type Profile, profileSchema } from '@ai-tools/shared'
import { useEffect, useState } from 'react'

type ProfileState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'loaded'; profile: Profile }

// The token can outlive its user, in which case the proxy still sees a valid session and would
// send /login back here. Deleting the cookie first makes the login page show.
const leaveForLogin = async () => {
  await fetch('/api/logout', { method: 'POST' }).catch(() => undefined)
  window.location.replace('/login')
}

const requestProfile = async (): Promise<ProfileState | undefined> => {
  try {
    const response = await fetch('/api/profile')
    if (response.status === 401) {
      await leaveForLogin()
      return undefined
    }
    const body = profileSchema.safeParse(await response.json())
    return response.ok && body.success
      ? { status: 'loaded', profile: body.data }
      : { status: 'failed' }
  } catch {
    return { status: 'failed' }
  }
}

// Loads the logged-in user, or leaves for the login page when the session is no longer valid.
export const useProfile = () => {
  const [state, setState] = useState<ProfileState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    void requestProfile().then((next) => {
      if (active && next !== undefined) setState(next)
    })
    return () => {
      active = false
    }
  }, [])

  return state
}
