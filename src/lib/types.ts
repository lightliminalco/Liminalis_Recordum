/** User's chosen path through the app */
export type UserPath = 'experienced' | 'newcomer'

/** Mood/energy spectrum for tracking */
export type MoodLevel = 1 | 2 | 3 | 4 | 5

/** Shadow-light balance: -5 (deep shadow) to +5 (integrated light) */
export type ShadowBalance = -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5

/** User profile stored locally */
export interface UserProfile {
  id: string
  path: UserPath
  shadowName: string
  hasCompletedOnboarding: boolean
  createdAt: number
  passKeyCredentialId?: string
}

/** A single journal entry (stored encrypted) */
export interface JournalEntry {
  id: string
  timestamp: number
  path: UserPath
  /** For guided mode: structured responses keyed by step */
  guidedResponses?: Record<string, string>
  /** For freeform mode: full text */
  freeformText?: string
  /** The prompt that was shown */
  promptUsed?: string
  /** Was speech-to-text used */
  usedSpeechToText: boolean
  /** Mood at time of entry */
  moodLevel?: MoodLevel
  /** Shadow-light balance self-assessment */
  shadowBalance?: ShadowBalance
  /** The daily action committed to */
  dailyAction?: string
  /** Whether the user accepted, modified, or re-rolled the action */
  actionResponse?: 'accepted' | 'modified' | 'rerolled'
  /** Tags extracted for pattern recognition */
  tags: string[]
}

/** Pattern detected across entries */
export interface Pattern {
  id: string
  theme: string
  description: string
  entryIds: string[]
  firstDetected: number
  lastSeen: number
  frequency: number
}

/** Weekly reflection summary */
export interface WeeklyReflection {
  id: string
  weekStarting: number
  entryCount: number
  dominantMood: MoodLevel
  averageShadowBalance: number
  patternsNoticed: string[]
  challengeMessage: string
  celebrationMessage: string
  createdAt: number
}

/** Meditation session */
export interface MeditationSession {
  id: string
  meditationId: string
  completedAt: number
  durationSeconds: number
}

/** Mood tracking entry */
export interface MoodEntry {
  id: string
  timestamp: number
  moodLevel: MoodLevel
  shadowBalance: ShadowBalance
  note?: string
  journalEntryId?: string
}

/** Encryption metadata (stored unencrypted alongside encrypted data) */
export interface VaultMeta {
  salt: string
  iv: string
  verificationBlob: string
  wrappedKeyForPasskey?: string
  wrappedKeyIv?: string
  passkeyCredentialId?: string
}

/** App settings */
export interface AppSettings {
  shadowName: string
  path: UserPath
  weeklyReflectionEnabled: boolean
  dailyReminderEnabled: boolean
  shadowNameVisibility: 'everywhere' | 'reflections-only'
}
