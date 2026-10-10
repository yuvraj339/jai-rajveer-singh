export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body) || !body.hero) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid profile data' })
  }
  await writeProfile(body)
  return { ok: true, savedAt: new Date().toISOString() }
})
