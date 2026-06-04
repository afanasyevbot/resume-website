import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'engine_session'
const ALG = 'HS256'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.ENGINE_SESSION_SECRET
  if (!secret) throw new Error('ENGINE_SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

/** Sign a session token. Call after a successful password check. */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: 'matthew' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

/** Verify a session token (signature + expiry). Edge-safe. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, secretKey(), { algorithms: [ALG] })
    return true
  } catch {
    return false
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS
