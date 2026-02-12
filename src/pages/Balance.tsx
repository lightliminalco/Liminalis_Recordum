import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAllEntries,
  getSettings,
  getWeeklyReflections,
  saveWeeklyReflection,
  generateId,
} from '../lib/db'
import { analyzePatterns } from '../lib/patterns'
import { generateWeeklyReflection, getThisWeeksEntries } from '../lib/reflection'
import type {
  JournalEntry,
  Pattern,
  WeeklyReflection,
  AppSettings,
} from '../lib/types'

export default function Balance() {
  const { masterKey } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [weeklyReflection, setWeeklyReflection] =
    useState<WeeklyReflection | null>(null)
  const [showReflection, setShowReflection] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!masterKey) return
      const [allEntries, s, reflections] = await Promise.all([
        getAllEntries(masterKey),
        getSettings(),
        getWeeklyReflections(masterKey),
      ])
      setEntries(allEntries)
      setSettings(s ?? null)
      setPatterns(analyzePatterns(allEntries))

      const weekMs = 7 * 24 * 60 * 60 * 1000
      const thisWeeksReflection = reflections.find(
        (r) => Date.now() - r.createdAt < weekMs,
      )
      setWeeklyReflection(thisWeeksReflection ?? null)
      setIsLoading(false)
    }
    load()
  }, [masterKey])

  const shadowName = settings?.shadowName ?? 'Shadow'
  const weekEntries = getThisWeeksEntries(entries)
  const recentMoods = entries.slice(0, 7).map((e) => e.moodLevel ?? 3).reverse()
  const recentBalances = entries.slice(0, 7).map((e) => e.shadowBalance ?? 0).reverse()

  async function handleGenerateReflection() {
    if (!masterKey || entries.length === 0) return
    const reflectionData = generateWeeklyReflection(entries, shadowName)
    const reflection: WeeklyReflection = {
      ...reflectionData,
      id: generateId(),
      createdAt: Date.now(),
    }
    await saveWeeklyReflection(reflection, masterKey)
    setWeeklyReflection(reflection)
    setShowReflection(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-light text-purple-100">The Balance</h2>
      <p className="mt-1 text-sm text-purple-300/50">
        Where {shadowName} stands in your energy field
      </p>

      {entries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-purple-800/30 bg-purple-950/20 p-6 text-center">
          <p className="text-sm text-purple-300/60">
            Start journaling to see your patterns emerge here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Mood trend */}
          <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
              Emotional Weight (Recent)
            </h3>
            <div className="mt-3 flex items-end gap-1">
              {recentMoods.map((mood, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-purple-700 to-purple-400 transition-all"
                    style={{ height: `${mood * 12}px` }}
                  />
                  <span className="text-[9px] text-purple-500/40">{mood}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-purple-500/30">
              <span>Older</span>
              <span>Recent</span>
            </div>
          </div>

          {/* Shadow-light balance trend */}
          <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
              Shadow-Light Balance
            </h3>
            <div className="mt-3 flex items-center gap-1">
              {recentBalances.map((bal, i) => (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="relative h-12 w-full">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-purple-800/30" />
                    <div
                      className={`absolute inset-x-0 rounded-sm transition-all ${
                        bal >= 0
                          ? 'bg-gradient-to-t from-purple-600/40 to-amber-500/60'
                          : 'bg-gradient-to-b from-purple-600/40 to-indigo-700/60'
                      }`}
                      style={{
                        top: bal >= 0 ? `${50 - Math.abs(bal) * 5}%` : '50%',
                        bottom: bal < 0 ? `${50 - Math.abs(bal) * 5}%` : '50%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-purple-500/30">
              <span>Shadow</span>
              <span>Balanced</span>
              <span>Light</span>
            </div>
          </div>

          {/* Patterns */}
          {patterns.length > 0 && (
            <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
                Patterns {shadowName} is showing you
              </h3>
              <div className="mt-3 space-y-3">
                {patterns.slice(0, 3).map((pattern) => (
                  <div
                    key={pattern.id}
                    className="rounded-lg border border-purple-800/20 bg-purple-900/10 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-200">
                        {pattern.theme}
                      </span>
                      <span className="text-[10px] text-purple-500/40">
                        {pattern.frequency}x
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-purple-300/60">
                      {pattern.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* This week summary */}
          <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
              This Week
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-light text-purple-200">{weekEntries.length}</p>
                <p className="text-[10px] text-purple-500/40">entries</p>
              </div>
              <div>
                <p className="text-2xl font-light text-purple-200">{patterns.length}</p>
                <p className="text-[10px] text-purple-500/40">patterns</p>
              </div>
              <div>
                <p className="text-2xl font-light text-purple-200">{entries.length}</p>
                <p className="text-[10px] text-purple-500/40">total</p>
              </div>
            </div>
          </div>

          {/* Weekly reflection */}
          {weekEntries.length >= 2 && (
            <>
              {showReflection && weeklyReflection ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-800/20 bg-amber-950/10 p-5">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-amber-300/70">
                      Your Week, Reflected
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-amber-200/70">
                      {weeklyReflection.celebrationMessage}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
                      The Loving Challenge
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-purple-300/60">
                      {weeklyReflection.challengeMessage}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateReflection}
                  className="w-full rounded-lg border border-purple-700/30 bg-purple-950/20 px-4 py-3 text-sm text-purple-200 transition-all hover:border-purple-600/50 hover:bg-purple-900/20"
                >
                  {weeklyReflection ? 'View Weekly Reflection' : 'Generate Weekly Reflection'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
