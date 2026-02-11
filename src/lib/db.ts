/**
 * IndexedDB layer for Liminalis Recordum
 *
 * All sensitive data (journal entries, reflections, mood entries) is stored
 * encrypted. Only the vault metadata (salt, verification blob, credential ID)
 * and user profile are stored in a readable form -- and the profile contains
 * no sensitive journal content.
 */

import { openDB, type IDBPDatabase } from 'idb'
import {
  encrypt,
  encryptObject,
  decryptObject,
} from './crypto'
import type {
  UserProfile,
  JournalEntry,
  Pattern,
  WeeklyReflection,
  MeditationSession,
  MoodEntry,
  VaultMeta,
  AppSettings,
} from './types'

const DB_NAME = 'liminalis-recordum'
const DB_VERSION = 1

interface EncryptedRecord {
  id: string
  ciphertext: string
  iv: string
  timestamp: number
}

type LiminalisDB = {
  vault: {
    key: string
    value: VaultMeta
  }
  profile: {
    key: string
    value: UserProfile
  }
  settings: {
    key: string
    value: AppSettings
  }
  entries: {
    key: string
    value: EncryptedRecord
    indexes: { 'by-timestamp': number }
  }
  patterns: {
    key: string
    value: EncryptedRecord
    indexes: { 'by-timestamp': number }
  }
  reflections: {
    key: string
    value: EncryptedRecord
    indexes: { 'by-timestamp': number }
  }
  meditations: {
    key: string
    value: EncryptedRecord
    indexes: { 'by-timestamp': number }
  }
  moods: {
    key: string
    value: EncryptedRecord
    indexes: { 'by-timestamp': number }
  }
}

let dbInstance: IDBPDatabase<LiminalisDB> | null = null

async function getDB(): Promise<IDBPDatabase<LiminalisDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<LiminalisDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Unencrypted stores
      db.createObjectStore('vault', { keyPath: 'salt' })
      db.createObjectStore('profile', { keyPath: 'id' })
      db.createObjectStore('settings', { keyPath: 'shadowName' })

      // Encrypted stores
      const entries = db.createObjectStore('entries', { keyPath: 'id' })
      entries.createIndex('by-timestamp', 'timestamp')

      const patterns = db.createObjectStore('patterns', { keyPath: 'id' })
      patterns.createIndex('by-timestamp', 'timestamp')

      const reflections = db.createObjectStore('reflections', { keyPath: 'id' })
      reflections.createIndex('by-timestamp', 'timestamp')

      const meditations = db.createObjectStore('meditations', { keyPath: 'id' })
      meditations.createIndex('by-timestamp', 'timestamp')

      const moods = db.createObjectStore('moods', { keyPath: 'id' })
      moods.createIndex('by-timestamp', 'timestamp')
    },
  })

  return dbInstance
}

/** Generate a unique ID */
function generateId(): string {
  return crypto.randomUUID()
}

// ──── Vault Operations (unencrypted metadata) ────

export async function getVaultMeta(): Promise<VaultMeta | undefined> {
  const db = await getDB()
  const all = await db.getAll('vault')
  return all[0]
}

export async function saveVaultMeta(meta: VaultMeta): Promise<void> {
  const db = await getDB()
  await db.put('vault', meta)
}

// ──── Profile Operations (unencrypted) ────

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB()
  const all = await db.getAll('profile')
  return all[0]
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB()
  await db.put('profile', profile)
}

// ──── Settings Operations (unencrypted) ────

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB()
  const all = await db.getAll('settings')
  return all[0]
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB()
  await db.put('settings', settings)
}

// ──── Journal Entries (encrypted) ────

export async function saveEntry(
  entry: JournalEntry,
  key: CryptoKey,
): Promise<void> {
  const db = await getDB()
  const { ciphertext, iv } = await encryptObject(entry, key)
  await db.put('entries', {
    id: entry.id,
    ciphertext,
    iv,
    timestamp: entry.timestamp,
  })
}

export async function getEntry(
  id: string,
  key: CryptoKey,
): Promise<JournalEntry | undefined> {
  const db = await getDB()
  const record = await db.get('entries', id)
  if (!record) return undefined
  return decryptObject<JournalEntry>(record.ciphertext, record.iv, key)
}

export async function getAllEntries(
  key: CryptoKey,
): Promise<JournalEntry[]> {
  const db = await getDB()
  const records = await db.getAllFromIndex('entries', 'by-timestamp')
  const entries: JournalEntry[] = []
  for (const record of records) {
    try {
      const entry = await decryptObject<JournalEntry>(
        record.ciphertext,
        record.iv,
        key,
      )
      entries.push(entry)
    } catch {
      // Skip corrupted entries
    }
  }
  return entries.reverse() // newest first
}

export async function getEntryCount(): Promise<number> {
  const db = await getDB()
  return db.count('entries')
}

export async function getEntriesSince(
  since: number,
  key: CryptoKey,
): Promise<JournalEntry[]> {
  const db = await getDB()
  const range = IDBKeyRange.lowerBound(since)
  const records = await db.getAllFromIndex('entries', 'by-timestamp', range)
  const entries: JournalEntry[] = []
  for (const record of records) {
    try {
      const entry = await decryptObject<JournalEntry>(
        record.ciphertext,
        record.iv,
        key,
      )
      entries.push(entry)
    } catch {
      // Skip corrupted entries
    }
  }
  return entries.reverse()
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('entries', id)
}

// ──── Patterns (encrypted) ────

export async function savePattern(
  pattern: Pattern,
  key: CryptoKey,
): Promise<void> {
  const db = await getDB()
  const { ciphertext, iv } = await encryptObject(pattern, key)
  await db.put('patterns', {
    id: pattern.id,
    ciphertext,
    iv,
    timestamp: pattern.lastSeen,
  })
}

export async function getAllPatterns(key: CryptoKey): Promise<Pattern[]> {
  const db = await getDB()
  const records = await db.getAllFromIndex('patterns', 'by-timestamp')
  const patterns: Pattern[] = []
  for (const record of records) {
    try {
      patterns.push(
        await decryptObject<Pattern>(record.ciphertext, record.iv, key),
      )
    } catch {
      // Skip corrupted
    }
  }
  return patterns.reverse()
}

// ──── Mood Entries (encrypted) ────

export async function saveMoodEntry(
  entry: MoodEntry,
  key: CryptoKey,
): Promise<void> {
  const db = await getDB()
  const { ciphertext, iv } = await encryptObject(entry, key)
  await db.put('moods', {
    id: entry.id,
    ciphertext,
    iv,
    timestamp: entry.timestamp,
  })
}

export async function getMoodEntries(
  key: CryptoKey,
  limit?: number,
): Promise<MoodEntry[]> {
  const db = await getDB()
  const records = await db.getAllFromIndex('moods', 'by-timestamp')
  const entries: MoodEntry[] = []
  const reversed = records.reverse()
  for (const record of reversed.slice(0, limit ?? reversed.length)) {
    try {
      entries.push(
        await decryptObject<MoodEntry>(record.ciphertext, record.iv, key),
      )
    } catch {
      // Skip corrupted
    }
  }
  return entries
}

// ──── Weekly Reflections (encrypted) ────

export async function saveWeeklyReflection(
  reflection: WeeklyReflection,
  key: CryptoKey,
): Promise<void> {
  const db = await getDB()
  const { ciphertext, iv } = await encryptObject(reflection, key)
  await db.put('reflections', {
    id: reflection.id,
    ciphertext,
    iv,
    timestamp: reflection.weekStarting,
  })
}

export async function getWeeklyReflections(
  key: CryptoKey,
): Promise<WeeklyReflection[]> {
  const db = await getDB()
  const records = await db.getAllFromIndex('reflections', 'by-timestamp')
  const reflections: WeeklyReflection[] = []
  for (const record of records) {
    try {
      reflections.push(
        await decryptObject<WeeklyReflection>(
          record.ciphertext,
          record.iv,
          key,
        ),
      )
    } catch {
      // Skip corrupted
    }
  }
  return reflections.reverse()
}

// ──── Meditation Sessions (encrypted) ────

export async function saveMeditationSession(
  session: MeditationSession,
  key: CryptoKey,
): Promise<void> {
  const db = await getDB()
  const { ciphertext, iv } = await encryptObject(session, key)
  await db.put('meditations', {
    id: session.id,
    ciphertext,
    iv,
    timestamp: session.completedAt,
  })
}

// ──── Data Export / Delete ────

export async function exportAllData(
  key: CryptoKey,
): Promise<string> {
  const [entries, patterns, moods, reflections, profile, settings] =
    await Promise.all([
      getAllEntries(key),
      getAllPatterns(key),
      getMoodEntries(key),
      getWeeklyReflections(key),
      getProfile(),
      getSettings(),
    ])

  const exportData = {
    version: 1,
    exportedAt: Date.now(),
    profile,
    settings,
    entries,
    patterns,
    moods,
    reflections,
  }

  // Re-encrypt the entire export as a single blob
  const { ciphertext, iv } = await encrypt(JSON.stringify(exportData), key)
  return JSON.stringify({ ciphertext, iv, version: 1 })
}

export async function deleteAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['vault', 'profile', 'settings', 'entries', 'patterns', 'reflections', 'meditations', 'moods'],
    'readwrite',
  )
  await Promise.all([
    tx.objectStore('vault').clear(),
    tx.objectStore('profile').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('entries').clear(),
    tx.objectStore('patterns').clear(),
    tx.objectStore('reflections').clear(),
    tx.objectStore('meditations').clear(),
    tx.objectStore('moods').clear(),
    tx.done,
  ])
}

export { generateId }
