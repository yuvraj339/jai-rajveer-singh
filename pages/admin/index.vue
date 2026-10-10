<script setup lang="ts">
useHead({ title: 'Admin · Profile CMS', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const SECTIONS: Record<string, { label: string; icon: string }> = {
  hero: { label: 'Hero', icon: '✨' },
  about: { label: 'About', icon: '👤' },
  experience: { label: 'Journey', icon: '🧭' },
  ventures: { label: 'Ventures', icon: '🚀' },
  companyStats: { label: 'Company stats', icon: '📊' },
  solutions: { label: 'Solutions', icon: '🏠' },
  products: { label: 'Products', icon: '📦' },
  expertise: { label: 'Expertise', icon: '🧠' },
  markets: { label: 'Expansion', icon: '🗺️' },
  awards: { label: 'Awards', icon: '🏆' },
  media: { label: 'Media', icon: '📰' },
  testimonials: { label: 'Testimonials', icon: '💬' },
  contact: { label: 'Contact', icon: '📞' },
  seo: { label: 'SEO', icon: '🔎' },
  brand: { label: 'Branding', icon: '🎨' },
}

const authed = ref<boolean | null>(null)
const password = ref('')
const loginError = ref('')
const loggingIn = ref(false)

const profile = ref<Record<string, any> | null>(null)
const savedSnapshot = ref('')
const section = ref('hero')
const mode = ref<'form' | 'json'>('form')
const jsonText = ref('')
const jsonError = ref('')
const saving = ref(false)
const toast = ref<{ text: string; ok: boolean } | null>(null)
const navOpen = ref(false)

const dirty = computed(() => !!profile.value && JSON.stringify(profile.value) !== savedSnapshot.value)
const sectionKeys = computed(() => {
  if (!profile.value) return []
  const known = Object.keys(SECTIONS).filter((k) => k in profile.value!)
  const extra = Object.keys(profile.value).filter((k) => !(k in SECTIONS))
  return [...known, ...extra]
})
const meta = (k: string) => SECTIONS[k] || { label: k, icon: '•' }

function flash(text: string, ok = true) {
  toast.value = { text, ok }
  setTimeout(() => (toast.value = null), 2800)
}

async function load() {
  const data = await $fetch<Record<string, any>>('/api/profile')
  profile.value = data
  savedSnapshot.value = JSON.stringify(data)
}

async function login() {
  loggingIn.value = true
  loginError.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    password.value = ''
    authed.value = true
    await load()
  } catch (e: any) {
    loginError.value = e?.data?.statusMessage || 'Login failed'
  } finally {
    loggingIn.value = false
  }
}

async function logout() {
  if (dirty.value && !confirm('You have unsaved changes. Log out anyway?')) return
  await $fetch('/api/admin/logout', { method: 'POST' })
  authed.value = false
  profile.value = null
}

function openJson() {
  jsonText.value = JSON.stringify(profile.value![section.value], null, 2)
  jsonError.value = ''
  mode.value = 'json'
}
function applyJson() {
  try {
    profile.value![section.value] = JSON.parse(jsonText.value)
    jsonError.value = ''
    mode.value = 'form'
  } catch (e: any) {
    jsonError.value = e.message
  }
}
function selectSection(k: string) {
  if (mode.value === 'json') applyJson()
  if (jsonError.value) return
  section.value = k
  navOpen.value = false
}

async function save() {
  if (mode.value === 'json') applyJson()
  if (jsonError.value) return
  saving.value = true
  try {
    await $fetch('/api/admin/profile', { method: 'PUT', body: profile.value })
    savedSnapshot.value = JSON.stringify(profile.value)
    flash('Changes published')
  } catch (e: any) {
    if (e?.status === 401) { authed.value = false; flash('Session expired — please log in again', false) }
    else flash(e?.data?.statusMessage || 'Save failed', false)
  } finally {
    saving.value = false
  }
}

function discard() {
  if (!confirm('Discard all unsaved changes?')) return
  profile.value = JSON.parse(savedSnapshot.value)
  mode.value = 'form'
}

function exportJson() {
  const blob = new Blob([JSON.stringify(profile.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'profile.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

const onKey = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's' && authed.value) { e.preventDefault(); save() }
}
const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty.value) e.preventDefault() }

onMounted(async () => {
  try {
    const t = localStorage.getItem('theme')
    if (t) document.documentElement.dataset.theme = t
  } catch {}
  const { authenticated } = await $fetch<{ authenticated: boolean }>('/api/admin/session')
  authed.value = authenticated
  if (authenticated) await load()
  addEventListener('keydown', onKey)
  addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => {
  removeEventListener('keydown', onKey)
  removeEventListener('beforeunload', beforeUnload)
})
</script>

<template>
  <div class="admin">
    <!-- Login -->
    <div v-if="authed === false" class="login-wrap">
      <form class="card login" @submit.prevent="login">
        <div class="brand" style="font-size: 1.8rem">Admin<span class="brand-dot">.</span></div>
        <p class="muted">Sign in to edit the profile site.</p>
        <div class="field">
          <label for="pw">Password</label>
          <input id="pw" v-model="password" type="password" class="input" autocomplete="current-password" autofocus required>
        </div>
        <p v-if="loginError" class="error">{{ loginError }}</p>
        <button class="btn btn-primary" :disabled="loggingIn">{{ loggingIn ? 'Signing in…' : 'Sign in' }}</button>
        <NuxtLink to="/" class="muted small">← Back to site</NuxtLink>
      </form>
    </div>

    <div v-else-if="authed === null || !profile" class="login-wrap muted">Loading…</div>

    <!-- Editor -->
    <div v-else class="shell">
      <aside class="side" :class="{ open: navOpen }">
        <div class="brand side-brand">{{ profile.brand?.short || 'Admin' }}<span class="brand-dot">.</span> <small>CMS</small></div>
        <nav>
          <button
            v-for="k in sectionKeys" :key="k" class="side-link" :class="{ active: section === k }"
            @click="selectSection(k)"
          >
            <span>{{ meta(k).icon }}</span>{{ meta(k).label }}
          </button>
        </nav>
        <div class="side-foot">
          <button class="side-link" @click="exportJson"><span>⬇️</span>Export JSON</button>
          <button class="side-link" @click="logout"><span>🚪</span>Log out</button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button class="icon-btn mobile-only" aria-label="Sections" @click="navOpen = !navOpen">☰</button>
          <div class="crumbs">
            <h1>{{ meta(section).icon }} {{ meta(section).label }}</h1>
            <span v-if="dirty" class="pill warn">Unsaved changes</span>
            <span v-else class="pill ok">All changes published</span>
          </div>
          <div class="actions">
            <div class="seg">
              <button :class="{ on: mode === 'form' }" @click="mode === 'json' ? applyJson() : null">Form</button>
              <button :class="{ on: mode === 'json' }" @click="mode === 'form' ? openJson() : null">JSON</button>
            </div>
            <a href="/" target="_blank" class="btn btn-ghost btn-sm">View site ↗</a>
            <button v-if="dirty" class="btn btn-ghost btn-sm" @click="discard">Discard</button>
            <button class="btn btn-primary btn-sm" :disabled="saving || !dirty" @click="save">
              {{ saving ? 'Publishing…' : 'Publish' }}
            </button>
          </div>
        </header>

        <div class="content">
          <div class="card editor">
            <template v-if="mode === 'form'">
              <AdminFieldEditor
                :key="section" :model-value="profile[section]" :label="meta(section).label" :field-key="section"
                @update:model-value="(v: any) => (profile![section] = v)"
              />
            </template>
            <template v-else>
              <textarea v-model="jsonText" class="textarea json" spellcheck="false" />
              <p v-if="jsonError" class="error">Invalid JSON: {{ jsonError }}</p>
              <button class="btn btn-ghost btn-sm" style="margin-top: 10px" @click="applyJson">Apply JSON</button>
            </template>
          </div>
          <p class="muted small hint">Tip: press ⌘/Ctrl + S to publish. Changes go live on the public site immediately.</p>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast" :class="{ bad: !toast.ok }">{{ toast.text }}</div>
  </div>
</template>

<style scoped>
.admin { min-height: 100vh; background: var(--bg-alt); }
.muted { color: var(--text-muted); }
.small { font-size: 0.85rem; }
.error { color: var(--red); font-size: 0.88rem; }
.login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
.login { width: min(380px, 100%); display: grid; gap: 14px; }
.login .btn { justify-content: center; }

.shell { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
.side { background: var(--surface); border-right: 1px solid var(--border); padding: 20px 14px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.side-brand { padding: 0 10px; }
.side-brand small { font-family: 'Inter', sans-serif; font-size: 0.7rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.1em; }
.side nav { display: grid; gap: 2px; }
.side-link { display: flex; gap: 10px; align-items: center; width: 100%; text-align: left; padding: 9px 10px; border-radius: 10px; border: 0; background: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--text-muted); }
.side-link:hover { background: var(--bg-alt); color: var(--text); }
.side-link.active { background: rgba(24, 119, 242, 0.1); color: var(--blue); }
.side-foot { margin-top: auto; border-top: 1px solid var(--border); padding-top: 10px; display: grid; gap: 2px; }

.main { min-width: 0; }
.topbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 14px 28px; background: var(--surface-glass); backdrop-filter: blur(14px); border-bottom: 1px solid var(--border); }
.crumbs { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.crumbs h1 { font-family: var(--font-display); font-size: 1.3rem; white-space: nowrap; }
.pill { font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.pill.warn { background: rgba(245, 158, 11, 0.15); color: var(--amber); }
.pill.ok { background: rgba(16, 185, 129, 0.12); color: var(--green); }
.actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.actions .btn:disabled { opacity: 0.5; cursor: default; transform: none; }
.seg { display: flex; border: 1px solid var(--border); border-radius: 999px; padding: 2px; background: var(--bg-alt); }
.seg button { border: 0; background: none; padding: 5px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: var(--text-muted); }
.seg button.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
.content { padding: 28px; max-width: 920px; }
.editor { padding: 24px; }
.json { min-height: 60vh; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; }
.hint { margin-top: 12px; }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--green); color: #fff; padding: 10px 18px; border-radius: 999px; font-weight: 600; box-shadow: var(--shadow-lg); z-index: 50; }
.toast.bad { background: var(--red); }
.mobile-only { display: none; }

@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; }
  .side { position: fixed; left: 0; top: 0; z-index: 40; width: 260px; transform: translateX(-100%); transition: transform 0.25s; box-shadow: var(--shadow-lg); }
  .side.open { transform: none; }
  .mobile-only { display: flex; }
  .topbar, .content { padding-left: 16px; padding-right: 16px; }
}
</style>
