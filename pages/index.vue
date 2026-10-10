<script setup lang="ts">
const { data: p } = await useFetch<Record<string, any>>('/api/profile')

useSeoMeta({
  title: () => p.value?.seo?.title,
  description: () => p.value?.seo?.description,
  ogTitle: () => p.value?.seo?.title,
  ogDescription: () => p.value?.seo?.description,
  ogImage: () => p.value?.hero?.photo,
  ogType: 'profile',
})

const nav = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Journey' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'products', label: 'Products' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'awards', label: 'Awards' },
  { id: 'media', label: 'Media' },
  { id: 'contact', label: 'Contact' },
]

const menuOpen = ref(false)
const loaded = ref(false)
const active = ref('')
const scrollPct = ref(0)
const theme = ref<'light' | 'dark'>('light')
const glow = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()

const form = reactive({ name: '', phone: '', interest: 'Home Automation', message: '' })
const year = new Date().getFullYear()

const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('')
const hasText = (v?: string) => !!v && v.trim().length > 0

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme.value
  try { localStorage.setItem('theme', theme.value) } catch {}
}

function enquiryText() {
  return [
    `Hello, I'm ${form.name || '—'}.`,
    `Interested in: ${form.interest}.`,
    form.phone && `Phone: ${form.phone}.`,
    form.message,
  ].filter(Boolean).join('\n')
}
function sendWhatsApp() {
  const wa = p.value?.contact?.whatsapp
  if (wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(enquiryText())}`, '_blank', 'noopener')
}
function sendEmail() {
  const email = p.value?.contact?.email
  if (email) location.href = `mailto:${email}?subject=${encodeURIComponent(`Enquiry: ${form.interest}`)}&body=${encodeURIComponent(enquiryText())}`
}

// Connected-nodes background — a nod to IoT networks
function startNetwork(el: HTMLCanvasElement) {
  const ctx = el.getContext('2d')!
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let w = 0, h = 0, raf = 0
  let nodes: { x: number; y: number; vx: number; vy: number }[] = []
  const resize = () => {
    w = el.clientWidth; h = el.clientHeight
    el.width = w * dpr; el.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const count = Math.round(Math.min(70, (w * h) / 16000))
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    }))
  }
  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy
      if (n.x < 0 || n.x > w) n.vx *= -1
      if (n.y < 0 || n.y > h) n.vy *= -1
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < 130) {
          ctx.strokeStyle = `rgba(24,119,242,${0.18 * (1 - d / 130)})`
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
      }
      ctx.fillStyle = 'rgba(24,119,242,0.55)'
      ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2); ctx.fill()
    }
    raf = requestAnimationFrame(draw)
  }
  resize()
  window.addEventListener('resize', resize)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(); cancelAnimationFrame(raf)
  } else draw()
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
}

let cleanup: (() => void)[] = []

onMounted(() => {
  try {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    theme.value = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  } catch {}
  document.documentElement.dataset.theme = theme.value
  setTimeout(() => (loaded.value = true), 350)

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target) }
  }, { threshold: 0.12 })
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))

  const sections = nav.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    scrollPct.value = max > 0 ? (scrollY / max) * 100 : 0
    const current = sections.filter((s) => s.offsetTop - 120 <= scrollY).pop()
    active.value = current?.id || ''
  }
  const onMove = (e: MouseEvent) => {
    if (glow.value) glow.value.style.transform = `translate(${e.clientX - 210}px, ${e.clientY - 210}px)`
  }
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('mousemove', onMove, { passive: true })
  onScroll()
  if (canvas.value) cleanup.push(startNetwork(canvas.value))
  cleanup.push(() => {
    io.disconnect()
    removeEventListener('scroll', onScroll)
    removeEventListener('mousemove', onMove)
  })
})
onBeforeUnmount(() => cleanup.forEach((fn) => fn()))
</script>

<template>
  <div v-if="p">
    <div class="preloader" :class="{ hidden: loaded }">
      <div class="preloader-mark">{{ p.brand.initial }}<span>.</span></div>
    </div>
    <div ref="glow" class="cursor-glow" style="transform: translate(-999px, -999px)" />

    <header class="nav">
      <div class="nav-inner">
        <a href="#home" class="brand">{{ p.brand.short }}<span class="brand-dot">.</span></a>
        <nav class="nav-links" aria-label="Sections">
          <a v-for="n in nav" :key="n.id" :href="`#${n.id}`" :class="{ active: active === n.id }">{{ n.label }}</a>
        </nav>
        <div class="nav-actions">
          <button class="icon-btn" :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`" @click="toggleTheme">
            <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          </button>
          <button class="icon-btn menu-toggle" aria-label="Toggle menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
            <span /><span /><span />
          </button>
        </div>
      </div>
      <nav class="nav-links-mobile" :class="{ open: menuOpen }">
        <a v-for="n in nav" :key="n.id" :href="`#${n.id}`" @click="menuOpen = false">{{ n.label }}</a>
      </nav>
      <div class="scroll-progress"><div class="scroll-progress-bar" :style="{ width: `${scrollPct}%` }" /></div>
    </header>

    <main>
      <!-- Hero -->
      <section id="home" class="hero">
        <canvas ref="canvas" class="hero-canvas" aria-hidden="true" />
        <div class="hero-blob b1" /><div class="hero-blob b2" />
        <div class="hero-inner">
          <div data-reveal>
            <p class="eyebrow">{{ p.hero.eyebrow }}</p>
            <h1 class="hero-title"><span class="grad-text">{{ p.hero.name }}</span></h1>
            <p class="role">{{ p.hero.role }}</p>
            <p class="lede">{{ p.hero.lede }}</p>
            <div class="badges"><span v-for="b in p.hero.badges" :key="b" class="badge">{{ b }}</span></div>
            <div class="hero-cta">
              <a href="#ventures" class="btn btn-primary">Explore ventures →</a>
              <a href="#contact" class="btn btn-ghost">Get in touch</a>
              <a v-if="p.ventures[0]?.url" :href="p.ventures[0].url" target="_blank" rel="noopener" class="btn btn-ghost">AIT World ↗</a>
            </div>
          </div>
          <div class="hero-photo" data-reveal>
            <img :src="p.hero.photo" :alt="p.hero.name" width="360" height="480">
            <div class="photo-chip c1">🏆 Best Home Automation Co.</div>
            <div class="photo-chip c2">⚡ Since 2012</div>
          </div>
        </div>
        <div class="stats">
          <div v-for="s in p.hero.stats" :key="s.label" class="stat" data-reveal>
            <div class="stat-value grad-text">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </section>

      <!-- About -->
      <section id="about" class="section alt">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">About</p>
            <h2 class="section-title">From IT infrastructure to <span class="grad-text">smart automation</span></h2>
          </div>
          <div class="about-grid">
            <div class="about-text" data-reveal>
              <p v-for="(para, i) in p.about.paragraphs" :key="i">{{ para }}</p>
            </div>
            <dl class="card facts" data-reveal>
              <template v-for="f in p.about.facts" :key="f.label">
                <dt>{{ f.label }}</dt><dd>{{ f.value }}</dd>
              </template>
            </dl>
          </div>
        </div>
      </section>

      <!-- Journey -->
      <section id="journey" class="section">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Journey</p>
            <h2 class="section-title">Career & entrepreneurship</h2>
          </div>
          <div class="timeline">
            <div v-for="e in p.experience" :key="e.period + e.title" class="tl-item" data-reveal>
              <div class="card hover">
                <div class="tl-period">{{ e.period }}</div>
                <h3 class="tl-title">{{ e.title }}</h3>
                <div class="tl-org">{{ e.org }}<template v-if="hasText(e.location)"> · {{ e.location }}</template></div>
                <ul class="tl-points"><li v-for="pt in e.points" :key="pt">{{ pt }}</li></ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Ventures -->
      <section id="ventures" class="section alt">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Ventures</p>
            <h2 class="section-title">What he's building</h2>
          </div>
          <div class="grid grid-3">
            <article v-for="v in p.ventures" :key="v.name" class="card hover venture" data-reveal>
              <div class="venture-head">
                <div class="venture-icon">{{ v.icon }}</div>
                <span class="status" :class="{ dev: !/active/i.test(v.status) }">{{ v.status }}</span>
              </div>
              <h3>{{ v.name }}</h3>
              <div class="tagline">{{ v.tagline }}</div>
              <p>{{ v.description }}</p>
              <div class="tags"><span v-for="t in v.tags" :key="t" class="tag">{{ t }}</span></div>
              <a v-if="hasText(v.url)" :href="v.url" target="_blank" rel="noopener" class="link-arrow">Visit website ↗</a>
            </article>
          </div>
          <div class="band" data-reveal>
            <div v-for="s in p.companyStats" :key="s.label">
              <div class="stat-value">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Solutions -->
      <section id="solutions" class="section">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Solutions</p>
            <h2 class="section-title">Automation for every space</h2>
            <p class="section-sub">{{ p.solutions.intro }}</p>
          </div>
          <div class="grid grid-3">
            <component
              :is="hasText(s.url) ? 'a' : 'div'"
              v-for="s in p.solutions.items" :key="s.title"
              :href="hasText(s.url) ? s.url : undefined" :target="hasText(s.url) ? '_blank' : undefined" rel="noopener"
              class="card hover solution" data-reveal
            >
              <div class="solution-icon">{{ s.icon }}</div>
              <div><h3>{{ s.title }}</h3><p>{{ s.description }}</p></div>
            </component>
          </div>
        </div>
      </section>

      <!-- Products -->
      <section id="products" class="section alt">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Products</p>
            <h2 class="section-title">The AIT smart home range</h2>
          </div>
          <div class="grid grid-4">
            <a
              v-for="pr in p.products" :key="pr.name" :href="hasText(pr.url) ? pr.url : undefined"
              target="_blank" rel="noopener" class="card hover product" data-reveal
            >
              <div class="product-img"><img :src="pr.image" :alt="pr.name" loading="lazy"></div>
              <div class="product-body"><h3>{{ pr.name }}</h3><p>{{ pr.description }}</p></div>
            </a>
          </div>
        </div>
      </section>

      <!-- Expertise + markets -->
      <section id="expertise" class="section">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Expertise</p>
            <h2 class="section-title">Where technology meets business</h2>
          </div>
          <div class="grid grid-4">
            <div v-for="c in p.expertise" :key="c.category" class="card skill-cat" data-reveal>
              <h3>{{ c.category }}</h3>
              <ul><li v-for="it in c.items" :key="it">{{ it }}</li></ul>
            </div>
          </div>

          <div class="section-head" style="margin-top: 72px" data-reveal>
            <p class="section-kicker">Expansion</p>
            <h2 class="section-title">Growing across India</h2>
            <p class="section-sub">{{ p.markets.intro }}</p>
          </div>
          <div class="markets">
            <div class="card centre" data-reveal>
              <p class="section-kicker">Experience Centre</p>
              <h3>{{ p.markets.centre }}</h3>
              <p style="opacity: 0.9; margin-top: 8px">See, touch and try AIT's smart home products in person.</p>
            </div>
            <div class="card" data-reveal>
              <p class="section-kicker">Expansion markets</p>
              <div class="city-list"><span v-for="c in p.markets.cities" :key="c" class="city">📍 {{ c }}</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Awards -->
      <section id="awards" class="section alt">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Recognition</p>
            <h2 class="section-title">Awards</h2>
          </div>
          <div class="grid grid-2">
            <article v-for="a in p.awards" :key="a.title" class="card hover award" data-reveal>
              <div class="award-icon">{{ a.icon }}</div>
              <div class="award-date">{{ a.date }}</div>
              <h3>{{ a.title }}</h3>
              <div class="event">{{ a.event }}</div>
              <p>{{ a.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- Media + testimonials -->
      <section id="media" class="section">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Media</p>
            <h2 class="section-title">In the news</h2>
          </div>
          <div class="grid grid-3">
            <article v-for="m in p.media" :key="m.title" class="card hover media-card" data-reveal>
              <span class="media-label">{{ m.label }}</span>
              <h3>{{ m.title }}</h3>
              <div class="media-meta">{{ m.outlet }}<template v-if="hasText(m.date)"> · {{ m.date }}</template></div>
              <p>{{ m.description }}</p>
              <a v-if="hasText(m.url)" :href="m.url" target="_blank" rel="noopener" class="link-arrow">Read more ↗</a>
            </article>
          </div>

          <div class="section-head" style="margin-top: 72px" data-reveal>
            <p class="section-kicker">Testimonials</p>
            <h2 class="section-title">What clients say</h2>
          </div>
          <div class="grid grid-2">
            <figure v-for="t in p.testimonials" :key="t.name" class="card quote" data-reveal>
              <p>{{ t.quote }}</p>
              <figcaption class="quote-by">
                <div class="avatar">{{ initials(t.name) }}</div>
                <div><strong>{{ t.name }}</strong><small>{{ t.role }}</small></div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section id="contact" class="section alt">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-kicker">Contact</p>
            <h2 class="section-title">{{ p.contact.heading }}</h2>
            <p class="section-sub">{{ p.contact.text }}</p>
          </div>
          <div class="contact-grid">
            <div class="card" data-reveal>
              <div v-if="hasText(p.contact.phone)" class="contact-row">
                <div class="ic">📞</div>
                <div><small>Phone</small><a :href="`tel:${p.contact.phone.replace(/\s/g, '')}`">{{ p.contact.phone }}</a></div>
              </div>
              <div v-if="hasText(p.contact.email)" class="contact-row">
                <div class="ic">✉️</div>
                <div><small>Email</small><a :href="`mailto:${p.contact.email}`">{{ p.contact.email }}</a></div>
              </div>
              <div v-if="hasText(p.contact.location)" class="contact-row">
                <div class="ic">📍</div>
                <div><small>Address</small>{{ p.contact.location }}</div>
              </div>
              <div v-for="l in p.contact.links" :key="l.url" class="contact-row">
                <div class="ic">🔗</div>
                <div><small>{{ l.label }}</small><a :href="l.url" target="_blank" rel="noopener">{{ l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') }}</a></div>
              </div>
            </div>
            <form class="card form" data-reveal @submit.prevent="sendWhatsApp">
              <div class="field"><label for="f-name">Your name</label><input id="f-name" v-model="form.name" class="input" required></div>
              <div class="field"><label for="f-phone">Phone</label><input id="f-phone" v-model="form.phone" class="input" type="tel"></div>
              <div class="field">
                <label for="f-int">Interested in</label>
                <select id="f-int" v-model="form.interest" class="select">
                  <option v-for="s in p.solutions.items" :key="s.title">{{ s.title }}</option>
                  <option>Franchise partnership</option>
                  <option>Media / press</option>
                </select>
              </div>
              <div class="field"><label for="f-msg">Message</label><textarea id="f-msg" v-model="form.message" class="textarea" /></div>
              <div class="hero-cta">
                <button v-if="hasText(p.contact.whatsapp)" type="submit" class="btn btn-primary">Send on WhatsApp</button>
                <button v-if="hasText(p.contact.email)" type="button" class="btn btn-ghost" @click="sendEmail">Send by email</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container">
        <span>© {{ year }} {{ p.hero.name }}. Built with care.</span>
        <span><a href="#home">Back to top ↑</a></span>
      </div>
    </footer>

    <a v-if="hasText(p.contact.whatsapp)" :href="`https://wa.me/${p.contact.whatsapp}`" target="_blank" rel="noopener" class="wa-fab" aria-label="Chat on WhatsApp">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" /></svg>
    </a>
  </div>
</template>
