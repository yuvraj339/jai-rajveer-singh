export default defineNuxtConfig({
  compatibilityDate: '2024-10-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Amplify exposes these values during the build; include them in the
    // server-only runtime config so Nitro's SSR handler can use them.
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || 'change-me',
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'dev-session-secret-change-me',
  },
  nitro: {
    storage: {
      content: { driver: 'fs', base: './data' },
    },
    devStorage: {
      content: { driver: 'fs', base: './data' },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;700&display=swap',
        },
      ],
    },
  },
})
