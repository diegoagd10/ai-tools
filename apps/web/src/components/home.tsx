'use client'

import { GENERIC_ERROR_MESSAGE } from '@ai-tools/shared'
import { Alert } from '@/components/alert'
import { AppHeader } from '@/components/app-header'
import { useLogOut } from '@/components/use-log-out'
import { useProfile } from '@/components/use-profile'

// The page a logged-in user lands on: replace its content with the app.
export function Home() {
  const logOut = useLogOut()
  const profile = useProfile()

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AppHeader logOut={logOut} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:px-8">
        {(logOut.failed || profile.status === 'failed') && <Alert>{GENERIC_ERROR_MESSAGE}</Alert>}
        {profile.status === 'loaded' && (
          <h1 className="font-serif text-[34px] leading-tight tracking-tight">
            Welcome, {profile.profile.username}
          </h1>
        )}
      </main>
    </div>
  )
}
