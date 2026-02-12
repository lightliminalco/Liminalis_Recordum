import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSettings, saveMeditationSession, generateId } from '../lib/db'
import { MEDITATIONS, type MeditationContent } from '../data/meditations'
import type { AppSettings } from '../lib/types'

type MeditatePhase = 'list' | 'session' | 'complete'

export default function Meditate() {
  const { masterKey } = useAuth()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [phase, setPhase] = useState<MeditatePhase>('list')
  const [activeMeditation, setActiveMeditation] =
    useState<MeditationContent | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [sessionStart, setSessionStart] = useState(0)

  useEffect(() => {
    getSettings().then((s) => setSettings(s ?? null))
  }, [])

  const shadowName = settings?.shadowName ?? 'Shadow'

  function startMeditation(meditation: MeditationContent) {
    setActiveMeditation(meditation)
    setCurrentStep(0)
    setSessionStart(Date.now())
    setPhase('session')
  }

  async function completeMeditation() {
    if (!masterKey || !activeMeditation) return
    const durationSeconds = Math.round((Date.now() - sessionStart) / 1000)
    await saveMeditationSession(
      {
        id: generateId(),
        meditationId: activeMeditation.id,
        completedAt: Date.now(),
        durationSeconds,
      },
      masterKey,
    )
    setPhase('complete')
  }

  function handleNextStep() {
    if (!activeMeditation) return
    if (currentStep < activeMeditation.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeMeditation()
    }
  }

  // ── Completion screen ──
  if (phase === 'complete') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 mt-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/30">
            <span className="text-2xl">&#x1f54a;</span>
          </div>
          <h2 className="text-xl font-light text-purple-100">
            Session Complete
          </h2>
          <p className="mt-2 text-sm text-purple-300/50">
            {shadowName} has been with you. Carry what you found.
          </p>
        </div>
        <button
          onClick={() => {
            setPhase('list')
            setActiveMeditation(null)
            setCurrentStep(0)
          }}
          className="w-full rounded-lg border border-purple-700/30 px-4 py-3 text-sm text-purple-200 transition-colors hover:border-purple-600/50"
        >
          Return to Meditations
        </button>
      </div>
    )
  }

  // ── Active session ──
  if (phase === 'session' && activeMeditation) {
    const step = activeMeditation.steps[currentStep]
    const isLast = currentStep === activeMeditation.steps.length - 1

    return (
      <div className="mx-auto max-w-lg">
        {/* Progress */}
        <div className="mb-6 flex gap-0.5">
          {activeMeditation.steps.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all ${
                i === currentStep
                  ? 'bg-purple-400'
                  : i < currentStep
                    ? 'bg-purple-600/50'
                    : 'bg-purple-800/30'
              }`}
            />
          ))}
        </div>

        <p className="mb-2 text-[10px] text-purple-500/40">
          {activeMeditation.title} -- Step {currentStep + 1} of{' '}
          {activeMeditation.steps.length}
        </p>

        {/* Instruction */}
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-6">
          <p className="text-sm leading-relaxed text-purple-200/90">
            {step.instruction.replace(/\{shadowName\}/g, shadowName)}
          </p>
          <p className="mt-4 text-[10px] text-purple-500/40">
            Take about {step.durationHint}
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="rounded-lg border border-purple-700/30 px-4 py-3 text-sm text-purple-300/70 transition-colors hover:border-purple-600/50"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNextStep}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-violet-600 hover:to-purple-500"
          >
            {isLast ? 'Complete' : 'Next'}
          </button>
        </div>

        {/* Exit */}
        <button
          onClick={() => {
            setPhase('list')
            setActiveMeditation(null)
          }}
          className="mt-4 w-full py-2 text-xs text-purple-500/40 transition-colors hover:text-purple-400/60"
        >
          End session early
        </button>
      </div>
    )
  }

  // ── Meditation list ──
  const themeLabels: Record<string, string> = {
    'shadow-meeting': 'Shadow Meeting',
    'energy-reclaim': 'Energy Work',
    sovereign: 'Inner Sovereign',
    integration: 'Integration',
    release: 'Release',
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-light text-purple-100">The Meditation</h2>
      <p className="mt-1 text-sm text-purple-300/50">
        Guided sessions for balancing {shadowName} with your light
      </p>

      <div className="mt-6 space-y-3">
        {MEDITATIONS.map((meditation) => (
          <button
            key={meditation.id}
            onClick={() => startMeditation(meditation)}
            className="w-full rounded-xl border border-purple-800/30 bg-purple-950/20 p-5 text-left transition-all hover:border-purple-700/40 hover:bg-purple-900/15"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-purple-200">
                  {meditation.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-purple-400/60">
                  {meditation.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="rounded-full border border-purple-800/30 px-2 py-0.5 text-[10px] text-purple-400/50">
                  {themeLabels[meditation.theme]}
                </span>
                <p className="mt-1 text-[10px] text-purple-500/30">
                  {meditation.estimatedMinutes} min
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
