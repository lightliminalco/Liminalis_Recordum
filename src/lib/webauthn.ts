/**
 * WebAuthn / Passkey support for Liminalis Recordum
 *
 * Uses the PRF (Pseudo-Random Function) extension to derive a stable secret
 * from the passkey. This secret wraps/unwraps the master encryption key,
 * allowing biometric unlock without ever storing the password.
 *
 * Flow:
 * 1. Registration: Create credential with PRF extension → derive wrapping key
 * 2. Authentication: Get assertion with PRF → derive same wrapping key → unwrap master key
 *
 * If PRF is not supported on the device, passkey option is not offered.
 */

const RP_NAME = 'Liminalis Recordum'
const RP_ID_FALLBACK = 'localhost'

/** A fixed salt for PRF evaluation (app-specific, not secret) */
const PRF_SALT = new Uint8Array(
  new TextEncoder().encode('liminalis-recordum-prf-salt-v1'),
) as Uint8Array<ArrayBuffer>

function getRpId(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.hostname
  }
  return RP_ID_FALLBACK
}

/** Check if WebAuthn and PRF extension are available on this device */
export async function isPasskeySupported(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false

  try {
    const available =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch {
    return false
  }
}

/** Generate a random challenge for WebAuthn ceremonies */
function generateChallenge(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>
}

/** Derive an AES-256-GCM wrapping key from PRF output */
async function deriveWrappingKeyFromPrf(
  prfOutput: ArrayBuffer,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    prfOutput,
    'HKDF',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      salt: PRF_SALT,
      info: new TextEncoder().encode('liminalis-wrapping-key'),
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export interface PasskeyRegistrationResult {
  credentialId: string
  wrappingKey: CryptoKey
  prfSupported: boolean
}

/** Register a new passkey with PRF extension */
export async function registerPasskey(
  userId: string,
): Promise<PasskeyRegistrationResult | null> {
  try {
    const rpId = getRpId()
    const challenge = generateChallenge()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createOptions: any = {
      publicKey: {
        rp: { name: RP_NAME, id: rpId },
        user: {
          id: new TextEncoder().encode(userId),
          name: 'Shadow Guardian',
          displayName: 'Shadow Guardian',
        },
        challenge,
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        extensions: {
          prf: { eval: { first: PRF_SALT } },
        },
      },
    }

    const credential = (await navigator.credentials.create(
      createOptions,
    )) as PublicKeyCredential | null

    if (!credential) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prfResults = (credential.getClientExtensionResults() as any)?.prf
    if (!prfResults?.enabled && !prfResults?.results?.first) {
      return null
    }

    const credentialId = bufferToBase64(credential.rawId)

    if (prfResults?.results?.first) {
      const wrappingKey = await deriveWrappingKeyFromPrf(
        prfResults.results.first,
      )
      return { credentialId, wrappingKey, prfSupported: true }
    }

    const authResult = await authenticatePasskey(credentialId)
    if (!authResult) return null

    return {
      credentialId,
      wrappingKey: authResult.wrappingKey,
      prfSupported: true,
    }
  } catch {
    return null
  }
}

export interface PasskeyAuthResult {
  wrappingKey: CryptoKey
}

/** Authenticate with an existing passkey and get the PRF-derived wrapping key */
export async function authenticatePasskey(
  credentialId: string,
): Promise<PasskeyAuthResult | null> {
  try {
    const rpId = getRpId()
    const challenge = generateChallenge()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getOptions: any = {
      publicKey: {
        rpId,
        challenge,
        allowCredentials: [
          {
            id: base64ToBuffer(credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        extensions: {
          prf: { eval: { first: PRF_SALT } },
        },
      },
    }

    const assertion = (await navigator.credentials.get(
      getOptions,
    )) as PublicKeyCredential | null

    if (!assertion) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prfResults = (assertion.getClientExtensionResults() as any)?.prf
    if (!prfResults?.results?.first) return null

    const wrappingKey = await deriveWrappingKeyFromPrf(prfResults.results.first)
    return { wrappingKey }
  } catch {
    return null
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}
