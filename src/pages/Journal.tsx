import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getProfile,
  getSettings,
  saveEntry,
  getAllEntries,
  getEntryCount,
  generateId,
} from '../lib/db'
import { analyzePatterns, generateDailyAction } from '../lib/patterns'
import SpeechInput from '../components/SpeechInput'
import { getDailyPrompt, getRandomPrompt, GUIDED_STEPS } from '../data/prompts'
import type { AppSettings, UserProfile, JournalEntry, MoodLevel, ShadowBalance } from '../lib/types'

type JournalPhase = 'write' | 'mood' | 'submitted'

export default function Journal() {
  const { masterKey } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [entryCount, setEntryCount] = useState(0)
  const [phase, setPhase] = useState<JournalPhase>('write')

  // Freeform state
  const [prompt, setPrompt] = useState(getDailyPrompt)
  const [freeformText, setFreeformText] = useState('')
  const [usedSpeech, setUsedSpeech] = useState(false)

  // Guided state
  const [guidedStep, setGuidedStep] = useState(0)
  const [guidedResponses, setGuidedResponses] = useState<Record<string, string>>({})

  // Mood state
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(3)
  const [shadowBalance, setShadowBalance] = useState<ShadowBalance>(0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Post-submission state (The Mirror + The Step)
  const [dailyAction, setDailyAction] = useState('')
  const [mirrorInsight, setMirrorInsight] = useState('')

  useEffect(() => {
    async function load() {
      const [p, s, count] = await Promise.all([
        getProfile(),
        getSettings(),
        getEntryCount(),
      ])
      setProfile(p ?? null)
      setSettings(s ?? null)
      setEntryCount(count)
    }
    load()
  }, [])

  const isExperienced = profile?.path === 'experienced'
  const shadowName = settings?.shadowName ?? 'Shadow'

  const handleSpeechTranscript = useCallback(
    (text: string) => {
      setUsedSpeech(true)
      if (isExperienced) {
        setFreeformText((prev) => (prev ? prev + ' ' + text : text))
      } else {
        const step = GUIDED_STEPS[guidedStep]
        setGuidedResponses((prev) => ({
          ...prev,
          [step.id]: (prev[step.id] ? prev[step.id] + ' ' : '') + text,
        }))
      }
    },
    [isExperienced, guidedStep],
  )

  function handleNewPrompt() {
    setPrompt(getRandomPrompt(prompt))
  }

  function handleGuidedNext() {
    if (guidedStep < GUIDED_STEPS.length - 1) {
      setGuidedStep(guidedStep + 1)
    } else {
      setPhase('mood')
    }
  }

  function handleGuidedBack() {
    if (guidedStep > 0) {
      setGuidedStep(guidedStep - 1)
    }
  }

  function handleFreeformSubmit() {
    if (!freeformText.trim()) return
    setPhase('mood')
  }

  async function handleFinalSubmit() {
    if (!masterKey || isSubmitting) return
    setIsSubmitting(true)

    // Fetch existing entries for pattern analysis
    const existingEntries = await getAllEntries(masterKey)

    const entry: JournalEntry = {
      id: generateId(),
      timestamp: Date.now(),
      path: profile?.path ?? 'experienced',
      usedSpeechToText: usedSpeech,
      moodLevel,
      shadowBalance,
      tags: [],
      ...(isExperienced
        ? { freeformText, promptUsed: prompt }
        : { guidedResponses }),
    }

    // Analyze patterns including the new entry
    const allEntries = [entry, ...existingEntries]
    const patterns = analyzePatterns(allEntries)
    const action = generateDailyAction(entry, patterns, shadowName)

    // Attach daily action to the entry
    entry.dailyAction = action

    // Find if this entry triggered/contributed to a pattern
    if (patterns.length > 0) {
      const relevantPattern = patterns.find((p) => p.entryIds.includes(entry.id))
      if (relevantPattern) {
        setMirrorInsight(relevantPattern.description)
      }
    }

    setDailyAction(action)
    await saveEntry(entry, masterKey)

    setPhase('submitted')
    setEntryCount((c) => c + 1)
  }

  // ── Submitted confirmation with The Mirror + The Step ──
  if (phase === 'submitted') {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6 mt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/30">
            <span className="text-2xl">&#x2728;</span>
          </div>
          <h2 className="text-xl font-light text-purple-100">
            Entry Recorded
          </h2>
          <p className="mt-2 text-sm text-purple-300/50">
            {shadowName} has been heard. That alone shifts something.
          </p>
          {entryCount > 1 && (
            <p className="mt-1 text-xs text-purple-500/40">
              Entry #{entryCount} in your record
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* The Mirror -- pattern insight */}
          {mirrorInsight && (
            <section className="animate-fade-in rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
                The Mirror
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-purple-200/80">
                {mirrorInsight}
              </p>
            </section>
          )}

          {/* The Step -- daily action */}
          <section className="animate-fade-in rounded-xl border border-amber-800/20 bg-amber-950/10 p-5" style={{ animationDelay: mirrorInsight ? '200ms' : '0ms' }}>
            <h3 className="text-xs font-medium uppercase tracking-wider text-amber-300/70">
              Your Step for Tomorrow
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-amber-200/70">
              {dailyAction}
            </p>
          </section>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                setPhase('write')
                setFreeformText('')
                setGuidedResponses({})
                setGuidedStep(0)
                setPrompt(getDailyPrompt())
                setUsedSpeech(false)
                setDailyAction('')
                setMirrorInsight('')
              }}
              className="w-full rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-violet-600 hover:to-purple-500"
            >
              Write Another Entry
            </button>
            <button
              onClick={() => navigate('/record')}
              className="w-full rounded-lg border border-purple-700/30 px-4 py-3 text-sm text-purple-300/70 transition-colors hover:border-purple-600/50"
            >
              View Your Record
            </button>
            <button
              onClick={() => navigate('/balance')}
              className="w-full py-2 text-xs text-purple-500/40 transition-colors hover:text-purple-400/60"
            >
              See Your Balance
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Mood/Energy check-in ──
  if (phase === 'mood') {
    return (
      <div className="mx-auto max-w-lg">
        <h2 className="text-xl font-light text-purple-100">
          Check In With Yourself
        </h2>
        <p className="mt-1 text-sm text-purple-300/50">
          Before we seal this entry, let&apos;s mark where you are right now.
        </p>

        <div className="mt-8 space-y-8">
          {/* Mood level */}
          <div>
            <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-purple-300/70">
              How heavy does this feel? (1 = light, 5 = heavy)
            </label>
            <div className="flex justify-between gap-2">
              {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setMoodLevel(level)}
                  className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                    moodLevel === level
                      ? 'bg-purple-700 text-white shadow-lg shadow-purple-900/40'
                      : 'border border-purple-800/30 bg-purple-950/20 text-purple-400/60 hover:border-purple-700/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-purple-500/40">
              <span>Light</span>
              <span>Heavy</span>
            </div>
          </div>

          {/* Shadow-light balance */}
          <div>
            <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-purple-300/70">
              Shadow-Light Balance
            </label>
            <p className="mb-3 text-xs text-purple-400/50">
              Where do you feel {shadowName}&apos;s energy right now?
            </p>
            <input
              type="range"
              min="-5"
              max="5"
              value={shadowBalance}
              onChange={(e) =>
                setShadowBalance(Number(e.target.value) as ShadowBalance)
              }
              className="w-full accent-purple-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-purple-500/40">
              <span>Deep Shadow</span>
              <span>Balanced</span>
              <span>Integrated Light</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <button
            onClick={() => setPhase('write')}
            className="rounded-lg border border-purple-700/30 px-4 py-3 text-sm text-purple-300/70 transition-colors hover:border-purple-600/50"
          >
            Back
          </button>
          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-violet-600 hover:to-purple-500 disabled:opacity-40"
          >
            {isSubmitting ? 'Saving...' : 'Seal This Entry'}
          </button>
        </div>
      </div>
    )
  }

  // ── Main journaling interface ──
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-light text-purple-100">
          {entryCount === 0
            ? `Welcome. ${shadowName} has been waiting.`
            : `Welcome back`}
        </h2>
        <p className="mt-1 text-sm text-purple-300/50">
          {isExperienced
            ? 'What needs to come to the surface today?'
            : "Let's explore what's beneath the surface, one step at a time."}
        </p>
      </div>

      {isExperienced ? (
        /* ── Freeform Mode ── */
        <div className="space-y-4">
          <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm italic text-purple-300/70">{prompt}</p>
              <button
                onClick={handleNewPrompt}
                className="shrink-0 rounded-lg border border-purple-800/30 px-2 py-1 text-[10px] text-purple-400/50 transition-colors hover:border-purple-700/50 hover:text-purple-300/70"
                title="Get a different prompt"
              >
                New prompt
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder={`Write freely. ${shadowName} is listening...`}
              rows={10}
              className="w-full resize-none rounded-xl border border-purple-800/30 bg-purple-950/20 px-4 py-3 text-sm leading-relaxed text-purple-100 placeholder-purple-500/30 outline-none transition-colors focus:border-purple-600/50"
            />
            <div className="mt-2 flex items-center justify-between">
              <SpeechInput
                onTranscript={handleSpeechTranscript}
                onListeningChange={(l) => l && setUsedSpeech(true)}
              />
              <span className="text-[10px] text-purple-500/30">
                {freeformText.length} chars
              </span>
            </div>
          </div>

          <button
            onClick={handleFreeformSubmit}
            disabled={!freeformText.trim()}
            className="w-full rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-violet-600 hover:to-purple-500 disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      ) : (
        /* ── Guided Mode ── */
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex gap-1">
            {GUIDED_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i === guidedStep
                    ? 'bg-purple-400'
                    : i < guidedStep
                      ? 'bg-purple-600/60'
                      : 'bg-purple-800/30'
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
            <p className="text-sm font-medium text-purple-200">
              {GUIDED_STEPS[guidedStep].question}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-purple-400/50">
              {GUIDED_STEPS[guidedStep].hint}
            </p>
          </div>

          <div className="relative">
            <textarea
              value={guidedResponses[GUIDED_STEPS[guidedStep].id] ?? ''}
              onChange={(e) =>
                setGuidedResponses((prev) => ({
                  ...prev,
                  [GUIDED_STEPS[guidedStep].id]: e.target.value,
                }))
              }
              placeholder={GUIDED_STEPS[guidedStep].placeholder}
              rows={5}
              className="w-full resize-none rounded-xl border border-purple-800/30 bg-purple-950/20 px-4 py-3 text-sm leading-relaxed text-purple-100 placeholder-purple-500/30 outline-none transition-colors focus:border-purple-600/50"
            />
            <div className="mt-2">
              <SpeechInput
                onTranscript={handleSpeechTranscript}
                onListeningChange={(l) => l && setUsedSpeech(true)}
              />
            </div>
          </div>

          {/* Step navigation */}
          <div className="flex gap-3">
            {guidedStep > 0 && (
              <button
                onClick={handleGuidedBack}
                className="rounded-lg border border-purple-700/30 px-4 py-3 text-sm text-purple-300/70 transition-colors hover:border-purple-600/50"
              >
                Back
              </button>
            )}
            <button
              onClick={handleGuidedNext}
              disabled={
                !GUIDED_STEPS[guidedStep].optional &&
                !(guidedResponses[GUIDED_STEPS[guidedStep].id]?.trim())
              }
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-violet-600 hover:to-purple-500 disabled:opacity-40"
            >
              {guidedStep === GUIDED_STEPS.length - 1
                ? 'Continue'
                : GUIDED_STEPS[guidedStep].optional
                  ? 'Skip'
                  : 'Next'}
            </button>
          </div>

          {/* Step indicator */}
          <p className="text-center text-[10px] text-purple-500/30">
            Step {guidedStep + 1} of {GUIDED_STEPS.length}
            {GUIDED_STEPS[guidedStep].optional && ' (optional)'}
          </p>
        </div>
      )}
    </div>
  )
}
