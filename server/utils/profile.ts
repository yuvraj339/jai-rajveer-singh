import profileSeed from '../../data/profile.json'

const KEY = 'profile.json'

export async function readProfile() {
  const data = await useStorage('content').getItem<Record<string, any>>(KEY)
  // Keep the committed profile available in serverless deployments where the
  // runtime filesystem does not include the repository's data directory.
  return data ?? profileSeed
}

export async function writeProfile(data: Record<string, any>) {
  await useStorage('content').setItem(KEY, data)
}
