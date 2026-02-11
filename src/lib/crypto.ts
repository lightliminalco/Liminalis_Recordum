/**
 * Encryption layer for Liminalis Recordum
 *
 * All journal data is encrypted with AES-256-GCM before touching IndexedDB.
 * The encryption key is derived from the user's password via PBKDF2 (600k iterations).
 * The key exists only in memory during the session -- never persisted in plaintext.
 *
 * Security model:
 * - Password → PBKDF2 → masterKey (AES-256-GCM)
 * - Each encrypted blob gets a unique IV (12 bytes)
 * - A verification blob proves password correctness without storing the password
 * - Optional passkey wrapping: masterKey is wrapped with a PRF-derived key
 */

const PBKDF2_ITERATIONS = 600_000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const VERIFICATION_PLAINTEXT = 'liminalis-recordum-vault-verified'

/** Convert ArrayBuffer to base64 string for storage */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** Convert base64 string back to ArrayBuffer */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

/** Generate a cryptographically random salt */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return bufferToBase64(salt.buffer as ArrayBuffer)
}

/** Generate a random IV for each encryption operation */
function generateIV(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as Uint8Array<ArrayBuffer>
}

/** Derive an AES-256-GCM key from password + salt using PBKDF2 */
export async function deriveKey(
  password: string,
  saltBase64: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  const salt = base64ToBuffer(saltBase64)

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt'],
  )
}

/** Encrypt plaintext string → { ciphertext, iv } as base64 strings */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder()
  const iv = generateIV()

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
  }
}

/** Decrypt ciphertext back to plaintext string */
export async function decrypt(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey,
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64)
  const iv = base64ToBuffer(ivBase64)

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(plaintextBuffer)
}

/** Create a verification blob that proves the password is correct */
export async function createVerificationBlob(
  key: CryptoKey,
): Promise<string> {
  const { ciphertext, iv } = await encrypt(VERIFICATION_PLAINTEXT, key)
  return JSON.stringify({ ciphertext, iv })
}

/** Verify a password by attempting to decrypt the verification blob */
export async function verifyPassword(
  key: CryptoKey,
  verificationBlob: string,
): Promise<boolean> {
  try {
    const { ciphertext, iv } = JSON.parse(verificationBlob)
    const decrypted = await decrypt(ciphertext, iv, key)
    return decrypted === VERIFICATION_PLAINTEXT
  } catch {
    return false
  }
}

/**
 * Wrap the master key for passkey storage.
 * Uses a wrapping key derived from WebAuthn PRF output.
 */
export async function wrapMasterKey(
  masterKeyPassword: string,
  saltBase64: string,
  wrappingKey: CryptoKey,
): Promise<{ wrappedKey: string; iv: string }> {
  // Re-derive the master key as exportable for wrapping
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKeyPassword),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const salt = base64ToBuffer(saltBase64)
  const exportableMasterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // extractable for wrapping
    ['encrypt', 'decrypt'],
  )

  const rawKey = await crypto.subtle.exportKey('raw', exportableMasterKey)
  const iv = generateIV()

  const wrappedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    rawKey,
  )

  return {
    wrappedKey: bufferToBase64(wrappedBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
  }
}

/** Unwrap a master key using the PRF-derived wrapping key */
export async function unwrapMasterKey(
  wrappedKeyBase64: string,
  ivBase64: string,
  wrappingKey: CryptoKey,
): Promise<CryptoKey> {
  const wrappedKey = base64ToBuffer(wrappedKeyBase64)
  const iv = base64ToBuffer(ivBase64)

  const rawKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    wrappedKey,
  )

  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable once unwrapped
    ['encrypt', 'decrypt'],
  )
}

/** Encrypt a JSON-serializable object */
export async function encryptObject<T>(
  obj: T,
  key: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  return encrypt(JSON.stringify(obj), key)
}

/** Decrypt back to a typed object */
export async function decryptObject<T>(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey,
): Promise<T> {
  const json = await decrypt(ciphertextBase64, ivBase64, key)
  return JSON.parse(json) as T
}
