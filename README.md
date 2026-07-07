# Sweet Confections by Kelsey

Live site: **[sctreatsbakery.com](https://sctreatsbakery.com)**

Handcrafted cakes, cupcakes, cookies, and signature treats from a licensed home bakery in Pittsfield, MA. Serving the Berkshires, Western MA, Eastern NY, Southern VT, and Northwest CT.

## Tech

Static HTML/CSS/JS. No build step — deploy the folder as-is.

- **Hosting:** Netlify (auto-deploys from this repo's `main` branch)
- **Domain:** sctreatsbakery.com (via Netlify Domains)
- **Forms:** Netlify Forms (contact page → email notification)
- **DNS:** Netlify DNS

## Local development

```bash
# Serve locally at http://localhost:8000
python -m http.server 8000
```

## Deploy

Push to `main` and Netlify auto-deploys. Or manually:

```bash
netlify deploy --prod --dir=.
```

## Structure

- `index.html` — homepage
- `shop.html` — menu / product cards
- `events.html` — cake bar packages + wedding packages
- `gallery.html` — 162-photo portfolio grid + lightbox
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `404.html`
- `style.css` — full design system
- `app.js` — cart, nav, form, gallery, lightbox
- `assets/` — images, logos, favicon set
- `sitemap.xml`, `robots.txt`, `site.webmanifest` — SEO / PWA
