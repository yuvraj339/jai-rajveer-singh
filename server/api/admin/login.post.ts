export default defineEventHandler(async (event) => {
  if (!import.meta.dev && useRuntimeConfig().adminPassword === 'change-me') {
    throw createError({ statusCode: 503, statusMessage: 'Set NUXT_ADMIN_PASSWORD before using the admin panel' })
  }
  const { password } = await readBody<{ password?: string }>(event)
  if (!password || !checkPassword(password)) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }
  startSession(event)
  return { ok: true }
})
