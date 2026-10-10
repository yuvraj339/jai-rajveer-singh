<script setup lang="ts">
defineOptions({ name: 'AdminFieldEditor' })

const props = defineProps<{ modelValue: any; label?: string; fieldKey?: string; depth?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: any] }>()

const depth = computed(() => props.depth ?? 0)
const kind = computed(() => {
  const v = props.modelValue
  if (Array.isArray(v)) return 'array'
  if (v && typeof v === 'object') return 'object'
  if (typeof v === 'number') return 'number'
  if (typeof v === 'boolean') return 'boolean'
  return 'string'
})

const LONG_KEYS = ['description', 'lede', 'quote', 'text', 'intro', 'role']
const IMAGE_KEYS = ['photo', 'image']
const isImage = computed(() => IMAGE_KEYS.includes(props.fieldKey || ''))
const isLong = computed(() =>
  LONG_KEYS.includes(props.fieldKey || '') || (typeof props.modelValue === 'string' && props.modelValue.length > 90))

const humanize = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())

function blank(v: any): any {
  if (Array.isArray(v)) return []
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]))
  if (typeof v === 'number') return 0
  if (typeof v === 'boolean') return false
  return ''
}

function itemTitle(item: any, i: number) {
  if (typeof item === 'string') return item || `Item ${i + 1}`
  for (const k of ['name', 'title', 'label', 'category', 'period', 'value']) {
    if (typeof item?.[k] === 'string' && item[k]) return item[k]
  }
  return `Item ${i + 1}`
}

const open = ref<Record<number, boolean>>({})
const list = computed(() => props.modelValue as any[])

function add() {
  const template = list.value.length ? blank(list.value[0]) : ''
  list.value.push(template)
  open.value[list.value.length - 1] = true
}
function remove(i: number) {
  if (confirm(`Remove "${itemTitle(list.value[i], i)}"?`)) list.value.splice(i, 1)
}
function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= list.value.length) return
  const [item] = list.value.splice(i, 1)
  list.value.splice(j, 0, item)
}

const uploading = ref(false)
async function upload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    const { url } = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body })
    emit('update:modelValue', url)
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Upload failed')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <!-- Object -->
  <div v-if="kind === 'object'" class="fe-object" :class="{ nested: depth > 0 }">
    <AdminFieldEditor
      v-for="(_, k) in modelValue" :key="k"
      :model-value="modelValue[k]" :label="humanize(String(k))" :field-key="String(k)" :depth="depth + 1"
      @update:model-value="(v: any) => (modelValue[k] = v)"
    />
  </div>

  <!-- Array -->
  <div v-else-if="kind === 'array'" class="fe-field">
    <div class="fe-label">{{ label }} <span class="fe-count">{{ list.length }}</span></div>
    <div class="fe-list">
      <div v-for="(item, i) in list" :key="i" class="fe-item">
        <div v-if="typeof item === 'string'" class="fe-inline">
          <input :value="item" class="input" @input="list[i] = ($event.target as HTMLInputElement).value">
          <div class="fe-tools">
            <button type="button" title="Move up" :disabled="i === 0" @click="move(i, -1)">↑</button>
            <button type="button" title="Move down" :disabled="i === list.length - 1" @click="move(i, 1)">↓</button>
            <button type="button" title="Remove" class="danger" @click="remove(i)">✕</button>
          </div>
        </div>
        <template v-else>
          <div class="fe-item-head" @click="open[i] = !open[i]">
            <span class="fe-caret" :class="{ open: open[i] }">▸</span>
            <span class="fe-item-title">{{ itemTitle(item, i) }}</span>
            <div class="fe-tools" @click.stop>
              <button type="button" title="Move up" :disabled="i === 0" @click="move(i, -1)">↑</button>
              <button type="button" title="Move down" :disabled="i === list.length - 1" @click="move(i, 1)">↓</button>
              <button type="button" title="Remove" class="danger" @click="remove(i)">✕</button>
            </div>
          </div>
          <div v-if="open[i]" class="fe-item-body">
            <AdminFieldEditor :model-value="item" :depth="depth + 1" @update:model-value="(v: any) => (list[i] = v)" />
          </div>
        </template>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm fe-add" @click="add">+ Add {{ label?.replace(/s$/, '').toLowerCase() || 'item' }}</button>
  </div>

  <!-- Scalars -->
  <div v-else class="fe-field">
    <label class="fe-label">{{ label }}</label>
    <div v-if="isImage" class="fe-image">
      <img v-if="modelValue" :src="modelValue" alt="">
      <div class="fe-image-controls">
        <input :value="modelValue" class="input" placeholder="/images/… or https://…" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)">
        <label class="btn btn-ghost btn-sm">
          {{ uploading ? 'Uploading…' : 'Upload image' }}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="upload">
        </label>
      </div>
    </div>
    <input
      v-else-if="kind === 'number'" type="number" :value="modelValue" class="input"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    >
    <label v-else-if="kind === 'boolean'" class="fe-check">
      <input type="checkbox" :checked="modelValue" @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"> Enabled
    </label>
    <textarea
      v-else-if="isLong" :value="modelValue" class="textarea" rows="3"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <input v-else :value="modelValue" class="input" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)">
  </div>
</template>

<style scoped>
.fe-object { display: grid; gap: 16px; }
.fe-object.nested { gap: 12px; }
.fe-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
.fe-count { font-size: 0.7rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 999px; padding: 0 8px; }
.fe-list { display: grid; gap: 8px; }
.fe-item { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.fe-inline { display: flex; gap: 8px; align-items: center; padding: 6px; }
.fe-inline .input { border: 0; background: transparent; padding: 6px 8px; }
.fe-item-head { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; user-select: none; }
.fe-caret { transition: transform 0.2s; color: var(--text-muted); }
.fe-caret.open { transform: rotate(90deg); }
.fe-item-title { flex: 1; font-weight: 600; font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fe-item-body { padding: 4px 14px 16px; border-top: 1px solid var(--border); padding-top: 14px; }
.fe-tools { display: flex; gap: 4px; flex: none; }
.fe-tools button { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-alt); cursor: pointer; font-size: 0.8rem; }
.fe-tools button:disabled { opacity: 0.35; cursor: default; }
.fe-tools button.danger:hover { background: var(--red); color: #fff; border-color: var(--red); }
.fe-add { margin-top: 10px; }
.fe-image { display: flex; gap: 12px; align-items: center; }
.fe-image img { width: 72px; height: 72px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-alt); flex: none; }
.fe-image-controls { flex: 1; display: grid; gap: 8px; justify-items: start; }
.fe-check { display: flex; gap: 8px; align-items: center; }
</style>
