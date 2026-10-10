# Jai Rajveer Singh Shekhawat — Profile Site + Admin CMS

Personal profile website for **Jai Rajveer Singh Shekhawat**, founder of
[AIT World Automation Pvt. Ltd.](https://aitworld.co.in/), built with **Nuxt 3**.

- **Public site** (`/`) — hero with animated IoT-network background, about, career journey,
  ventures, solutions, products, expertise, expansion markets, awards, media, testimonials and
  a contact form that sends enquiries via WhatsApp or email. Light/dark mode, scroll reveal,
  responsive down to phone width.
- **Admin panel** (`/admin`) — password-protected CMS that edits every section of the site.
  Add / remove / reorder list items, upload images, switch to raw JSON per section, export a
  backup. Changes go live immediately.

## Quick start

```bash
npm install
cp .env.example .env   # then set a strong password + secret
npm run dev            # http://localhost:3000  and  http://localhost:3000/admin
```

## Production

```bash
npm run build
NUXT_ADMIN_PASSWORD='…' NUXT_SESSION_SECRET='…' node .output/server/index.mjs
```

Any Node 18+ host works (VPS, EC2, Render, Railway, Fly.io…). Content lives in
`data/profile.json` and uploaded images in `data/uploads/`, so the host needs a **persistent
disk** for admin edits to survive restarts/redeploys.

| Env var | Purpose |
| --- | --- |
| `NUXT_ADMIN_PASSWORD` | Password for `/admin` (**required** — the default is `change-me`) |
| `NUXT_SESSION_SECRET` | Secret used to sign the admin session cookie |

## Project structure

```
pages/index.vue                 Public profile page
pages/admin/index.vue           Admin CMS
components/admin/FieldEditor.vue  Schema-less recursive form editor
server/api/profile.get.ts       Public content API
server/api/admin/*              Login, logout, session, save, image upload
data/profile.json               All site content
assets/css/main.css             Design system (tokens, light/dark)
```

## Sources

Content compiled from the
[WikiFlux biography](https://en.wikiflux.org/wiki/index.php/Jai_Rajveer_Singh_Shekhawat) and
[aitworld.co.in](https://aitworld.co.in/). Product images © AIT World Automation.
