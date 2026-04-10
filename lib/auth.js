import { createHmac } from 'crypto'

const SECRET    = 'habbup_secret_key_2025'
export const ADMIN_USER  = 'Kryon'
export const ADMIN_PASS  = '33476373'
const EXPIRY    = 24 * 60 * 60 * 1000  // 24 h

export function createToken() {
  const ts   = Date.now()
  const hash = createHmac('sha256', SECRET)
    .update(`${ADMIN_USER}:${ADMIN_PASS}:${ts}`)
    .digest('hex')
  return Buffer.from(`${ts}:${hash}`).toString('base64url')
}

export function verifyToken(token) {
  if (!token) return false
  try {
    const decoded     = Buffer.from(token, 'base64url').toString()
    const colonIdx    = decoded.indexOf(':')
    const ts          = decoded.slice(0, colonIdx)
    const hash        = decoded.slice(colonIdx + 1)
    if (Date.now() - parseInt(ts) > EXPIRY) return false
    const expected    = createHmac('sha256', SECRET)
      .update(`${ADMIN_USER}:${ADMIN_PASS}:${ts}`)
      .digest('hex')
    return hash === expected
  } catch {
    return false
  }
}

export function getTokenFromReq(req) {
  return req.headers['x-admin-token'] || ''
}

