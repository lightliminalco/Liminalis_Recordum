import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  deriveKey,
  generateSalt,
  createVerificationBlob,
  verifyPassword,
  wrapMasterKey,
  unwrapMasterKey,
} from '../lib/crypto'
import {
  getVaultMeta,
  saveVaultMeta,
  getProfile,
} from '../lib/db'
import type { VaultMeta } from '../lib/types'
import {
  isPasskeySupported,
  registerPasskey,
  authenticatePasskey,
} from '../lib/webauthn'
import type { UserProfile } from '../lib/types'

interface AuthState {
  isUnlocked: boolean
  isNewUser: boolean
  isLoading: boolean
  masterKey: CryptoKey | null
  profile: UserProfile | null
  passkeyAvailable: boolean
  passkeyRegistered: boolean
  error: string | null
}

interface AuthActions {
  checkVault: () => Promise<void>
  createVault: (password: string) => Promise<boolean>
  unlock: (password: string) => Promise<boolean>
  unlockWithPasskey: () => Promise<boolean>
  registerPasskeyForVault: (password: string) => Promise<boolean>
  lock: () => void
  clearError: () => void
}

type AuthContextType = AuthState & AuthActions

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isUnlocked: false,
    isNewUser: true,
    isLoading: true,
    masterKey: null,
    profile: null,
    passkeyAvailable: false,
    passkeyRegistered: false,
    error: null,
  })

  const checkVault = useCallback(async () => {
    try {
      const [vaultMeta, profile, passkeySupported] = await Promise.all([
        getVaultMeta(),
        getProfile(),
        isPasskeySupported(),
      ])

      setState((prev) => ({
        ...prev,
        isNewUser: !vaultMeta,
        isLoading: false,
        profile: profile ?? null,
        passkeyAvailable: passkeySupported,
        passkeyRegistered: !!vaultMeta?.passkeyCredentialId,
      }))
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check vault status',
      }))
    }
  }, [])

  const createVault = useCallback(async (password: string): Promise<boolean> => {
    try {
      const salt = generateSalt()
      const key = await deriveKey(password, salt)
      const verificationBlob = await createVerificationBlob(key)

      const vaultMeta: VaultMeta = {
        salt,
        iv: '', // Not used at vault level -- each entry has its own IV
        verificationBlob,
      }
      await saveVaultMeta(vaultMeta)

      setState((prev) => ({
        ...prev,
        isUnlocked: true,
        isNewUser: false,
        masterKey: key,
        error: null,
      }))
      return true
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Failed to create vault',
      }))
      return false
    }
  }, [])

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      const vaultMeta = await getVaultMeta()
      if (!vaultMeta) {
        setState((prev) => ({ ...prev, error: 'No vault found' }))
        return false
      }

      const key = await deriveKey(password, vaultMeta.salt)
      const isValid = await verifyPassword(key, vaultMeta.verificationBlob)

      if (!isValid) {
        setState((prev) => ({
          ...prev,
          error: 'Incorrect password',
        }))
        return false
      }

      const profile = await getProfile()

      setState((prev) => ({
        ...prev,
        isUnlocked: true,
        masterKey: key,
        profile: profile ?? null,
        error: null,
      }))
      return true
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Failed to unlock vault',
      }))
      return false
    }
  }, [])

  const unlockWithPasskey = useCallback(async (): Promise<boolean> => {
    try {
      const vaultMeta = await getVaultMeta()
      if (
        !vaultMeta?.passkeyCredentialId ||
        !vaultMeta?.wrappedKeyForPasskey ||
        !vaultMeta?.wrappedKeyIv
      ) {
        setState((prev) => ({
          ...prev,
          error: 'No passkey registered',
        }))
        return false
      }

      const authResult = await authenticatePasskey(
        vaultMeta.passkeyCredentialId,
      )
      if (!authResult) {
        setState((prev) => ({
          ...prev,
          error: 'Passkey authentication failed',
        }))
        return false
      }

      const masterKey = await unwrapMasterKey(
        vaultMeta.wrappedKeyForPasskey,
        vaultMeta.wrappedKeyIv,
        authResult.wrappingKey,
      )

      // Verify the unwrapped key actually works
      const isValid = await verifyPassword(
        masterKey,
        vaultMeta.verificationBlob,
      )
      if (!isValid) {
        setState((prev) => ({
          ...prev,
          error: 'Passkey unlock failed -- key mismatch',
        }))
        return false
      }

      const profile = await getProfile()

      setState((prev) => ({
        ...prev,
        isUnlocked: true,
        masterKey,
        profile: profile ?? null,
        error: null,
      }))
      return true
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Passkey authentication failed',
      }))
      return false
    }
  }, [])

  const registerPasskeyForVault = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const vaultMeta = await getVaultMeta()
        if (!vaultMeta) return false

        const userId = (await getProfile())?.id ?? 'default-user'
        const result = await registerPasskey(userId)
        if (!result || !result.prfSupported) {
          setState((prev) => ({
            ...prev,
            error:
              'Your device does not support secure passkey encryption. Password-only mode will be used.',
          }))
          return false
        }

        // Wrap the master key with the PRF-derived wrapping key
        const { wrappedKey, iv } = await wrapMasterKey(
          password,
          vaultMeta.salt,
          result.wrappingKey,
        )

        const updatedMeta: VaultMeta = {
          ...vaultMeta,
          passkeyCredentialId: result.credentialId,
          wrappedKeyForPasskey: wrappedKey,
          wrappedKeyIv: iv,
        }
        await saveVaultMeta(updatedMeta)

        setState((prev) => ({
          ...prev,
          passkeyRegistered: true,
          error: null,
        }))
        return true
      } catch {
        setState((prev) => ({
          ...prev,
          error: 'Failed to register passkey',
        }))
        return false
      }
    },
    [],
  )

  const lock = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isUnlocked: false,
      masterKey: null,
      error: null,
    }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        checkVault,
        createVault,
        unlock,
        unlockWithPasskey,
        registerPasskeyForVault,
        lock,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
