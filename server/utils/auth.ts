import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const COOKIE = 'admin_session'
const MAX_AGE = 60 * 60 * 12 // 12 hours

function sign(payload: string) {
  const { sessionSecret } = useRuntimeConfig()
  return createHmac('sha256', sessionSecret).update(payload).digest('hex')
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function checkPassword(password: string) {
  return safeEqual(password, useRuntimeConfig().adminPassword)
}

export function startSession(event: H3Event) {
  const expires = Date.now() + MAX_AGE * 1000
  setCookie(event, COOKIE, `${expires}.${sign(String(expires))}`, {
    httpOnly: true,
    sameSite: 'strict',
    secure: !import.meta.dev,
    path: '/',
    maxAge: MAX_AGE,
  })
}

export function endSession(event: H3Event) {
  deleteCookie(event, COOKIE, { path: '/' })
}

export function isAuthenticated(event: H3Event) {
  const value = getCookie(event, COOKIE)
  if (!value) return false
  const [expires, sig] = value.split('.')
  if (!expires || !sig || Number(expires) < Date.now()) return false
  return safeEqual(sig, sign(expires))
}

export function requireAdmin(event: H3Event) {
  if (!isAuthenticated(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
