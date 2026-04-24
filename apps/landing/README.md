# apps/landing — aissisted.me

Public marketing page for aissisted. Static HTML, zero build step, deploys on Vercel.

## Structure

```
apps/landing/
├── index.html          # Main landing page
├── privacy.html        # Placeholder privacy stub (noindex)
├── terms.html          # Placeholder terms stub (noindex)
├── contact.html        # Contact stub (noindex)
├── aissisted-logo.svg  # Brand logo
├── favicon.svg         # Favicon (a-mark on brand red)
├── robots.txt          # Allows /, blocks stubs
├── sitemap.xml         # Single URL (/) for now
├── vercel.json         # Security headers + clean URLs
└── README.md           # This file
```

## Local preview

```bash
cd apps/landing
python3 -m http.server 4000
# open http://localhost:4000
```

## Deploy

Vercel project: **aissisted-landing**
- Framework: **Other** (static)
- Root directory: `apps/landing`
- Build command: *(leave empty)*
- Output directory: `.`
- Install command: *(leave empty)*

Domain: **aissisted.me** (apex) + **www.aissisted.me** → 308 redirect to apex.

## HubSpot form wiring (REQUIRED before launch)

The email capture on `/` posts to HubSpot Forms API. Portal ID is hardcoded (339176), form GUID is not.

### Steps

1. Go to HubSpot → Marketing → Forms → Create form → Embedded form.
2. Form name: `Landing Waitlist — aissisted.me`.
3. Fields: **Email** (contact property, required). No other fields.
4. Options tab:
   - What should happen after a visitor submits? → **Display a thank you message** (doesn't matter, we override UI).
   - Notification emails → add Ron.
5. Save → Publish → click the embed code panel → copy the **formGuid** (UUID after `formId:`).
6. In `apps/landing/index.html`, find:
   ```js
   var FORM_GUID = "REPLACE_WITH_HUBSPOT_FORM_GUID";
   ```
7. Replace with the GUID you just copied. Commit + redeploy.

### Why client-side (not server-side)

Keeps the landing as pure static (no serverless function needed). HubSpot's forms submission API (`api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`) accepts unauthenticated POSTs — designed for public forms. No API key is exposed.

### If HubSpot goes down

The form includes a failsafe: if `FORM_GUID` is still the placeholder, the UI optimistically shows "You're on the list" but logs a warning to console. **This means we don't lose signups during the form-setup window — but submissions during that window are silently dropped.** Wire HubSpot before announcing the URL anywhere.

## Analytics

Vercel Analytics is loaded via `<script defer src="/_vercel/insights/script.js">`. Enable the integration in the Vercel project dashboard — no key needed. Privacy-friendly, no cookie banner required.

## Brand + a11y posture

- Tokens match locked brand anchors: `#EE2B37`, `#0B1D3A`, `#00C2D1`, IBM Plex family.
- FDA wellness disclaimer in footer.
- Semantic HTML, aria-labels on decorative elements, visually-hidden form label for screen readers.
- Body-text contrast: `rgba(28,28,30,0.56)` on white ≈ 4.7:1 (WCAG AA pass for body, borderline).

## To-dos before product launch (not blocking marketing launch)

- Fill in full Privacy Policy (`/privacy`) — HIPAA posture + wearable integrations disclosure.
- Fill in full Terms of Service (`/terms`).
- Replace OG image (`og-image.png`) with a branded 1200×630 render.
- Add `apple-touch-icon.png` (180×180) + `favicon.png` (32×32) rasters from `favicon.svg`.
- Consider porting to Next.js App Router when the marketing site grows beyond 5 pages.
