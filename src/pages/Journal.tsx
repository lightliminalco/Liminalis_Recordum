import { useEffect, useState } from 'react'
import { getProfile, getSettings } from '../lib/db'
import type { AppSettings, UserProfile } from '../lib/types'

export default function Journal() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    async function load() {
      const [p, s] = await Promise.all([getProfile(), getSettings()])
      setProfile(p ?? null)
      setSettings(s ?? null)
    }
    load()
  }, [])

  const shadowName = settings?.shadowName ?? 'Shadow'

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h2 className="text-xl font-light text-purple-100">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-purple-300/50">
          {shadowName} is waiting. What needs to come to the surface today?
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-6 text-center">
          <p className="text-sm text-purple-300/60">
            Journal entry interface coming in Stage B
          </p>
          <p className="mt-2 text-xs text-purple-500/40">
            The {profile?.path === 'newcomer' ? 'guided' : 'freeform'} journaling experience will appear here
          </p>
        </div>
      </div>
    </div>
  )
}
