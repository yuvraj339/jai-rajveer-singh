const KEY = 'profile.json'

export async function readProfile() {
  const data = await useStorage('content').getItem<Record<string, any>>(KEY)
  if (!data) throw createError({ statusCode: 500, statusMessage: 'Profile data missing' })
  return data
}

export async function writeProfile(data: Record<string, any>) {
  await useStorage('content').setItem(KEY, data)
}
