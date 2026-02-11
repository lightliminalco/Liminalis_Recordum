import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { saveProfile, saveSettings, generateId } from '../lib/db'
import type { UserPath } from '../lib/types'

export default function Threshold() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'path' | 'name'>('path')
  const [selectedPath, setSelectedPath] = useState<UserPath | null>(null)
  const [shadowName, setShadowName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handlePathSelect(path: UserPath) {
    setSelectedPath(path)
    setStep('name')
  }

  async function handleComplete() {
    if (!selectedPath || isSubmitting) return
    setIsSubmitting(true)

    const name = shadowName.trim() || (selectedPath === 'experienced' ? 'Shadow' : 'Shadow')
    const profileData = {
      id: profile?.id ?? generateId(),
      path: selectedPath,
      shadowName: name,
      hasCompletedOnboarding: selectedPath === 'experienced',
      createdAt: Date.now(),
    }

    await saveProfile(profileData)
    await saveSettings({
      shadowName: name,
      path: selectedPath,
      weeklyReflectionEnabled: true,
      dailyReminderEnabled: false,
      shadowNameVisibility: 'everywhere',
    })

    if (selectedPath === 'newcomer') {
      navigate('/introduction', { replace: true })
    } else {
      navigate('/journal', { replace: true })
    }
  }

  if (step === 'path') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-shadow-950 px-6">
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-light tracking-wide text-purple-100">
            Choose Your Path
          </h1>
          <p className="mt-2 text-sm text-purple-300/50">
            This shapes your experience. You can change it later.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* Experienced path */}
          <button
            onClick={() => handlePathSelect('experienced')}
            className="group w-full rounded-xl border border-purple-700/30 bg-purple-950/30 p-6 text-left transition-all hover:border-purple-500/50 hover:bg-purple-900/20"
          >
            <h2 className="text-lg font-medium text-purple-200 group-hover:text-purple-100">
              I walk with my shadow
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-purple-400/60">
              You're familiar with shadow work and journaling. You want open
              space to explore, with pattern recognition and energy framing
              as companions on the path.
            </p>
          </button>

          {/* Newcomer path */}
          <button
            onClick={() => handlePathSelect('newcomer')}
            className="group w-full rounded-xl border border-purple-700/30 bg-purple-950/30 p-6 text-left transition-all hover:border-purple-500/50 hover:bg-purple-900/20"
          >
            <h2 className="text-lg font-medium text-purple-200 group-hover:text-purple-100">
              Show me my shadow
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-purple-400/60">
              You're curious about understanding yourself more deeply. We'll
              guide you step by step with gentle prompts, explaining
              everything along the way.
            </p>
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Name your shadow
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-shadow-950 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-light tracking-wide text-purple-100">
          Name Your Inner Sovereign
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-purple-300/50">
          Your shadow carries immense energy. As you reclaim it, it becomes
          your inner empress or emperor -- a source of power, not pain.
          Give it a name, or keep the default.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div>
          <label
            htmlFor="shadow-name"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-purple-300/70"
          >
            Your shadow's name
          </label>
          <input
            id="shadow-name"
            type="text"
            value={shadowName}
            onChange={(e) => setShadowName(e.target.value)}
            placeholder="Shadow"
            maxLength={30}
            className="w-full rounded-lg border border-purple-800/50 bg-purple-950/30 px-4 py-3 text-purple-100 placeholder-purple-500/50 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
          />
          <p className="mt-2 text-xs text-purple-400/40">
            This name will appear throughout your journey. You can change it
            anytime in settings.
          </p>
        </div>

        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-600 hover:to-purple-500 disabled:opacity-40"
        >
          {isSubmitting ? 'Preparing...' : 'Begin'}
        </button>
      </div>
    </div>
  )
}
