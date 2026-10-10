const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') || ''
  const ext = name.split('.').pop() || ''
  if (!/^[\w-]+\.\w+$/.test(name) || !TYPES[ext]) throw createError({ statusCode: 404 })
  const data = await useStorage('content').getItemRaw(`uploads:${name}`)
  if (!data) throw createError({ statusCode: 404 })
  setHeader(event, 'Content-Type', TYPES[ext])
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return data
})
