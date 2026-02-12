/**
 * Weekly reflection generator
 *
 * Aggregates entries from the past week and creates a compassionate
 * but challenging summary. All processing is local.
 */

import type {
  JournalEntry,
  WeeklyReflection,
  MoodLevel,
  Pattern,
} from './types'
import { analyzePatterns } from './patterns'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Get entries from the past 7 days */
export function getThisWeeksEntries(entries: JournalEntry[]): JournalEntry[] {
  const weekAgo = Date.now() - WEEK_MS
  return entries.filter((e) => e.timestamp >= weekAgo)
}

/** Calculate dominant mood from entries */
function dominantMood(entries: JournalEntry[]): MoodLevel {
  if (entries.length === 0) return 3
  const sum = entries.reduce((acc, e) => acc + (e.moodLevel ?? 3), 0)
  return Math.round(sum / entries.length) as MoodLevel
}

/** Calculate average shadow balance */
function averageBalance(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0
  const sum = entries.reduce((acc, e) => acc + (e.shadowBalance ?? 0), 0)
  return Math.round((sum / entries.length) * 10) / 10
}

/** Generate the celebration/acknowledgment message */
function generateCelebration(
  entryCount: number,
  _avgBalance: number,
  shadowName: string,
): string {
  if (entryCount >= 7) {
    return `You showed up every day this week. That consistency tells ${shadowName} something powerful: you're not running anymore. You're turning toward what's real.`
  }
  if (entryCount >= 4) {
    return `${entryCount} entries this week. You're building a relationship with ${shadowName} -- not forcing it, not avoiding it. That middle ground is where integration happens.`
  }
  if (entryCount >= 2) {
    return `You came back ${entryCount} times this week. Each return is a choice to see yourself more clearly. ${shadowName} notices, even when no one else does.`
  }
  return `You showed up this week. That matters more than you might think. One entry is infinitely more than none. ${shadowName} heard you.`
}

/** Generate the loving challenge message */
function generateChallenge(
  patterns: Pattern[],
  dominantMoodVal: MoodLevel,
  avgBalance: number,
  shadowName: string,
): string {
  // If mood is consistently heavy
  if (dominantMoodVal >= 4) {
    return `This was a heavy week. The weight you're carrying is real -- but notice if you're also carrying weight that isn't yours. ${shadowName} doesn't need you to suffer to prove the work is happening. Integration can also feel like relief.`
  }

  // If balance is very negative (deep shadow)
  if (avgBalance < -2) {
    return `You've been spending a lot of time in shadow territory. That's not wrong -- sometimes you need to go deep to bring something back. But check in: are you exploring, or are you stuck? If it's the latter, consider reaching out. The Lifeline is always there.`
  }

  // If there's a dominant pattern
  if (patterns.length > 0) {
    const top = patterns[0]
    return `"${top.theme}" keeps surfacing. Here's the loving truth: noticing a pattern and changing a pattern are different things. You've done the noticing. This week, pick one moment where that pattern starts to play out, and choose differently. Just once. That's how integration begins.`
  }

  // If balance is very positive
  if (avgBalance > 2) {
    return `Your balance has been trending toward the light this week. That's beautiful -- and also worth questioning gently. Are you integrating, or are you performing wellness? ${shadowName} doesn't need to be "fixed." It needs to be included.`
  }

  // General challenge
  return `You've been doing the work. Now ask yourself: is anything you wrote about this week still just words on a screen? Choose one insight from this week and make it real. Not next week. Tomorrow. ${shadowName} is ready when you are.`
}

/** Generate a full weekly reflection */
export function generateWeeklyReflection(
  entries: JournalEntry[],
  shadowName: string,
): Omit<WeeklyReflection, 'id' | 'createdAt'> {
  const weekEntries = getThisWeeksEntries(entries)
  const patterns = analyzePatterns(weekEntries)
  const mood = dominantMood(weekEntries)
  const balance = averageBalance(weekEntries)
  const weekStart = Date.now() - WEEK_MS

  return {
    weekStarting: weekStart,
    entryCount: weekEntries.length,
    dominantMood: mood,
    averageShadowBalance: balance,
    patternsNoticed: patterns.map((p) => p.theme),
    celebrationMessage: generateCelebration(
      weekEntries.length,
      balance,
      shadowName,
    ),
    challengeMessage: generateChallenge(
      patterns,
      mood,
      balance,
      shadowName,
    ),
  }
}
