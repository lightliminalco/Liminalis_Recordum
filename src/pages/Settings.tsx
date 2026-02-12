import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  getSettings,
  saveSettings,
  getProfile,
  saveProfile,
  exportAllData,
  deleteAllData,
} from '../lib/db'
import type { AppSettings, UserPath } from '../lib/types'

export default function Settings() {
  const { masterKey, lock, passkeyAvailable, passkeyRegistered, registerPasskeyForVault } =
    useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [shadowNameInput, setShadowNameInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [passkeyPassword, setPasskeyPassword] = useState('')
  const [showPasskeySetup, setShowPasskeySetup] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )

  useEffect(() => {
    async function load() {
      const s = await getSettings()
      if (s) {
        setSettings(s)
        setShadowNameInput(s.shadowName)
      }
    }
    load()
  }, [])

  async function handleSaveName() {
    if (!settings || !shadowNameInput.trim()) return
    setIsSaving(true)
    const updated = { ...settings, shadowName: shadowNameInput.trim() }
    await saveSettings(updated)
    const profile = await getProfile()
    if (profile) {
      await saveProfile({ ...profile, shadowName: shadowNameInput.trim() })
    }
    setSettings(updated)
    setMessage({ type: 'success', text: 'Shadow name updated' })
    setIsSaving(false)
    setTimeout(() => setMessage(null), 2000)
  }

  async function handleTogglePath() {
    if (!settings) return
    const newPath: UserPath =
      settings.path === 'experienced' ? 'newcomer' : 'experienced'
    const updated = { ...settings, path: newPath }
    await saveSettings(updated)
    const profile = await getProfile()
    if (profile) {
      await saveProfile({ ...profile, path: newPath })
    }
    setSettings(updated)
    setMessage({
      type: 'success',
      text: `Switched to ${newPath === 'experienced' ? 'freeform' : 'guided'} mode`,
    })
    setTimeout(() => setMessage(null), 2000)
  }

  async function handleToggleWeekly() {
    if (!settings) return
    const updated = {
      ...settings,
      weeklyReflectionEnabled: !settings.weeklyReflectionEnabled,
    }
    await saveSettings(updated)
    setSettings(updated)
  }

  async function handleExport() {
    if (!masterKey) return
    try {
      const data = await exportAllData(masterKey)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liminalis-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Backup downloaded' })
      setTimeout(() => setMessage(null), 2000)
    } catch {
      setMessage({ type: 'error', text: 'Export failed' })
    }
  }

  async function handleDelete() {
    if (deleteConfirmText !== 'DELETE') return
    await deleteAllData()
    lock()
    navigate('/', { replace: true })
  }

  async function handleRegisterPasskey() {
    if (!passkeyPassword) return
    const success = await registerPasskeyForVault(passkeyPassword)
    if (success) {
      setMessage({ type: 'success', text: 'Passkey registered! You can now use biometric unlock.' })
      setShowPasskeySetup(false)
      setPasskeyPassword('')
    }
    setTimeout(() => setMessage(null), 3000)
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-light text-purple-100">Settings</h2>
      <p className="mt-1 text-sm text-purple-300/50">
        Your sanctuary, your rules
      </p>

      {/* Status message */}
      {message && (
        <div
          className={`mt-4 rounded-lg border p-3 text-xs ${
            message.type === 'success'
              ? 'border-green-800/30 bg-green-950/20 text-green-300/80'
              : 'border-red-800/30 bg-red-950/20 text-red-300/80'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Shadow name */}
        <section className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
            Shadow Name
          </h3>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={shadowNameInput}
              onChange={(e) => setShadowNameInput(e.target.value)}
              maxLength={30}
              className="flex-1 rounded-lg border border-purple-800/30 bg-purple-900/20 px-3 py-2 text-sm text-purple-100 outline-none focus:border-purple-600/50"
            />
            <button
              onClick={handleSaveName}
              disabled={
                isSaving || shadowNameInput.trim() === settings.shadowName
              }
              className="rounded-lg bg-purple-700/50 px-4 py-2 text-xs text-purple-100 transition-colors hover:bg-purple-600/50 disabled:opacity-40"
            >
              Save
            </button>
          </div>
          <p className="mt-2 text-[10px] text-purple-500/40">
            This name appears throughout your journal experience
          </p>
        </section>

        {/* Path toggle */}
        <section className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
            Journal Mode
          </h3>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-200">
                {settings.path === 'experienced'
                  ? 'Freeform (Experienced)'
                  : 'Guided (Newcomer)'}
              </p>
              <p className="text-[10px] text-purple-500/40">
                {settings.path === 'experienced'
                  ? 'Open journaling with shadow prompts'
                  : 'Step-by-step guided questions'}
              </p>
            </div>
            <button
              onClick={handleTogglePath}
              className="rounded-lg border border-purple-700/30 px-3 py-1.5 text-xs text-purple-300/70 transition-colors hover:border-purple-600/50"
            >
              Switch
            </button>
          </div>
        </section>

        {/* Weekly reflection toggle */}
        <section className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
            Weekly Reflection
          </h3>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-purple-200">
              {settings.weeklyReflectionEnabled ? 'Enabled' : 'Disabled'}
            </p>
            <button
              onClick={handleToggleWeekly}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.weeklyReflectionEnabled
                  ? 'bg-purple-600'
                  : 'bg-purple-800/40'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.weeklyReflectionEnabled
                    ? 'translate-x-5'
                    : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Passkey management */}
        <section className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
            Guardian Key (Passkey / Biometric)
          </h3>
          {passkeyRegistered ? (
            <p className="mt-3 text-sm text-green-400/70">
              Passkey is active. You can unlock with biometrics.
            </p>
          ) : passkeyAvailable ? (
            <>
              {showPasskeySetup ? (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-purple-400/60">
                    Enter your password to register a passkey. This wraps your
                    encryption key with your device's biometric security.
                  </p>
                  <input
                    type="password"
                    value={passkeyPassword}
                    onChange={(e) => setPasskeyPassword(e.target.value)}
                    placeholder="Your current password"
                    className="w-full rounded-lg border border-purple-800/30 bg-purple-900/20 px-3 py-2 text-sm text-purple-100 outline-none focus:border-purple-600/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPasskeySetup(false)}
                      className="rounded-lg border border-purple-700/30 px-3 py-2 text-xs text-purple-300/70"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegisterPasskey}
                      disabled={!passkeyPassword}
                      className="flex-1 rounded-lg bg-purple-700/50 px-3 py-2 text-xs text-purple-100 transition-colors hover:bg-purple-600/50 disabled:opacity-40"
                    >
                      Register Passkey
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPasskeySetup(true)}
                  className="mt-3 w-full rounded-lg border border-purple-700/30 px-4 py-2.5 text-sm text-purple-200 transition-colors hover:border-purple-600/50"
                >
                  Set Up Biometric Unlock
                </button>
              )}
            </>
          ) : (
            <p className="mt-3 text-xs text-purple-500/40">
              Passkey/biometric unlock is not available on this device.
            </p>
          )}
        </section>

        {/* Data management */}
        <section className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
            Your Data
          </h3>
          <div className="mt-3 space-y-3">
            <button
              onClick={handleExport}
              className="w-full rounded-lg border border-purple-700/30 px-4 py-2.5 text-sm text-purple-200 transition-colors hover:border-purple-600/50"
            >
              Export Encrypted Backup
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-lg border border-red-900/30 px-4 py-2.5 text-sm text-red-400/60 transition-colors hover:border-red-700/40 hover:text-red-300/70"
              >
                Delete All Data
              </button>
            ) : (
              <div className="rounded-lg border border-red-800/30 bg-red-950/20 p-4">
                <p className="text-xs text-red-300/70">
                  This permanently deletes everything -- all entries, patterns,
                  reflections, and settings. This cannot be undone.
                </p>
                <p className="mt-2 text-xs text-red-300/70">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-red-800/30 bg-red-950/30 px-3 py-2 text-sm text-red-200 outline-none"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="rounded-lg border border-purple-700/30 px-3 py-2 text-xs text-purple-300/70"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== 'DELETE'}
                    className="flex-1 rounded-lg bg-red-800/50 px-3 py-2 text-xs text-red-100 transition-colors hover:bg-red-700/50 disabled:opacity-40"
                  >
                    Permanently Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Lock */}
        <button
          onClick={lock}
          className="w-full rounded-lg border border-purple-700/40 bg-purple-950/40 px-4 py-3 text-sm text-purple-200 transition-all hover:border-purple-600/60 hover:bg-purple-900/30"
        >
          Lock Sanctuary
        </button>

        {/* Ethos */}
        <section className="rounded-xl border border-purple-800/20 bg-purple-950/10 p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/70">
            Our Ethos
          </h3>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-purple-400/50">
            <p>
              Your data belongs to you. It is encrypted on your device and never
              leaves it. We cannot read it, sell it, or access it.
            </p>
            <p>
              There are no analytics. No tracking. No ads. No server storing
              your thoughts. This app exists to serve your growth, nothing else.
            </p>
            <p>
              You are the guardian of your own sanctuary.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
