import { randomBytes } from 'node:crypto'

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_BYTES = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file')
  const ext = file?.type ? TYPES[file.type] : undefined
  if (!file || !ext) throw createError({ statusCode: 400, statusMessage: 'Upload a JPG, PNG, WebP or GIF image' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Image must be under 5 MB' })

  const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`
  await useStorage('content').setItemRaw(`uploads:${name}`, file.data)
  return { url: `/uploads/${name}` }
})
