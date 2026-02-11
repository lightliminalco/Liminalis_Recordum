import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Gate() {
  const {
    isNewUser,
    passkeyAvailable,
    passkeyRegistered,
    error,
    createVault,
    unlock,
    unlockWithPasskey,
    clearError,
  } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  // Timer for lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const isLockedOut = lockoutUntil !== null && now < lockoutUntil
  const lockoutRemaining = isLockedOut
    ? Math.ceil((lockoutUntil! - now) / 1000)
    : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isSubmitting || isLockedOut) return
    clearError()

    if (isNewUser) {
      if (password.length < 8) {
        return
      }
      if (password !== confirmPassword) {
        return
      }
      setIsSubmitting(true)
      await createVault(password)
      setIsSubmitting(false)
    } else {
      setIsSubmitting(true)
      const success = await unlock(password)
      setIsSubmitting(false)

      if (!success) {
        const attempts = failedAttempts + 1
        setFailedAttempts(attempts)
        if (attempts >= 3) {
          // Exponential lockout: 15s, 30s, 60s, 120s...
          const lockoutSeconds = 15 * Math.pow(2, attempts - 3)
          setLockoutUntil(Date.now() + lockoutSeconds * 1000)
        }
      }
    }
  }

  async function handlePasskeyUnlock() {
    if (isSubmitting) return
    clearError()
    setIsSubmitting(true)
    await unlockWithPasskey()
    setIsSubmitting(false)
  }

  const passwordValid = password.length >= 8
  const passwordsMatch = password === confirmPassword
  const canSubmitNew = passwordValid && passwordsMatch && !isSubmitting
  const canSubmitExisting = password.length > 0 && !isSubmitting && !isLockedOut

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f0a1a] px-6">
      {/* Title */}
      <div className="mb-12 text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-400 opacity-80 shadow-lg shadow-violet-900/50" />
        </div>
        <h1 className="text-3xl font-light tracking-wide text-purple-100">
          Liminalis Recordum
        </h1>
        <p className="mt-2 text-sm text-purple-300/60">
          {isNewUser
            ? 'Create your sanctuary'
            : 'Welcome back, Guardian'}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        {/* Password input */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-purple-300/70"
          >
            {isNewUser ? 'Create your password' : 'Password'}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isNewUser ? 'At least 8 characters' : 'Enter your password'}
            autoComplete={isNewUser ? 'new-password' : 'current-password'}
            disabled={isLockedOut}
            className="w-full rounded-lg border border-purple-800/50 bg-purple-950/30 px-4 py-3 text-purple-100 placeholder-purple-500/50 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 disabled:opacity-50"
          />
          {isNewUser && password.length > 0 && !passwordValid && (
            <p className="mt-1 text-xs text-amber-400/70">
              At least 8 characters needed
            </p>
          )}
        </div>

        {/* Confirm password (new users only) */}
        {isNewUser && (
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-purple-300/70"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-purple-800/50 bg-purple-950/30 px-4 py-3 text-purple-100 placeholder-purple-500/50 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-amber-400/70">
                Passwords don't match
              </p>
            )}
          </div>
        )}

        {/* Security notice for new users */}
        {isNewUser && (
          <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 p-3">
            <p className="text-xs leading-relaxed text-amber-200/70">
              This password encrypts your journal locally on this device.
              We never see or store it. If you lose it, your entries cannot
              be recovered. You are your own Guardian.
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-red-800/30 bg-red-950/20 p-3">
            <p className="text-xs text-red-300/80">{error}</p>
          </div>
        )}

        {/* Lockout display */}
        {isLockedOut && (
          <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 p-3">
            <p className="text-xs text-amber-200/70">
              Too many attempts. Try again in{' '}
              <span className="font-medium text-amber-300">
                {lockoutRemaining}s
              </span>
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isNewUser ? !canSubmitNew : !canSubmitExisting}
          className="w-full rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-600 hover:to-purple-500 disabled:opacity-40 disabled:hover:from-violet-700 disabled:hover:to-purple-600"
        >
          {isSubmitting
            ? 'Opening...'
            : isNewUser
              ? 'Create Sanctuary'
              : 'Enter'}
        </button>

        {/* Passkey unlock (returning users with passkey) */}
        {!isNewUser && passkeyRegistered && (
          <button
            type="button"
            onClick={handlePasskeyUnlock}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-purple-700/40 bg-purple-950/40 px-4 py-3 text-sm text-purple-200 transition-all hover:border-purple-600/60 hover:bg-purple-900/30 disabled:opacity-40"
          >
            <span className="mr-2">&#x1f5dd;</span>
            Unlock with Passkey
          </button>
        )}

        {/* Passkey setup hint (new users, after vault creation) */}
        {isNewUser && passkeyAvailable && (
          <p className="text-center text-xs text-purple-400/50">
            You'll be able to add biometric unlock after creating your sanctuary
          </p>
        )}
      </form>

      {/* Footer */}
      <p className="mt-16 text-xs text-purple-500/30">
        Your data never leaves this device
      </p>
    </div>
  )
}
