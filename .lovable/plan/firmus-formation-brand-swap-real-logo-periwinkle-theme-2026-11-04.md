# Firmus Formation brand swap: real logo + periwinkle theme

Replace the old "F" box mark and the emerald+gold theme with the uploaded logo and its own colors, wire the admin brand settings, and refresh favicon / share image.

## 1. Prepare the logo assets (from the upload)

The uploaded JPEG shows the logo in light periwinkle (~#788EFE) on a dark textured background. The site is light, so:

- Programmatically remove the dark background (luminance keying with PIL, despeckle edges) — exact pixel-level method so lettering and colors are untouched, never recolored, never stretched or cropped. Fallback if quality is poor: `imagegen--edit_image` background removal, then compare against the original.
- Save the clean full logo (mark + FIRMUS FORMATION wordmark) as the one canonical asset, uploaded via `lovable-assets`, imported by a single shared component.
- Cut the circular mark (left emblem) into its own square PNG for favicon and tight spaces — mark-only version, same colors.
- Build a 1200x630 share image: the logo centered on the ivory page background (composed with PIL from the transparent asset, no regeneration).

## 2. One shared logo component

Create `src/components/BrandLogo.tsx` with `full` and `mark` variants, and optional `logoUrl` override. Replace every old "F" box + wordmark with it in:

- Public site header (desktop + mobile menu) — `Header.tsx`
- Public footer — `Footer.tsx`
- Admin sidebar — `AdminShell.tsx`
- Client portal sidebar — `PortalShell.tsx`
- Admin login — `admin.login.tsx`
- Portal login — `portal.login.tsx`
- Password reset page — `reset-password.tsx`

No page keeps a different third version. Small spots use the mark variant.

## 3. New theme (replaces Emerald Prestige entirely)

Colors sampled from the logo (final exact values sampled during implementation, from the upload):

- Dominant periwinkle `#788EFE` → accent, links, focus rings, highlights, glow.
- A deepened version of the same hue (`~#3D4EC7`) → `--primary` so white text on primary buttons stays clearly readable (the logo blue itself is too light for white-on-primary text).
- Foreground/borders shift to a neutral dark indigo; pages and cards stay white/ivory.

In `src/styles.css`: replace all emerald/gold token values (including the existing `--gold` token and every `color-mix(... gold ...)` shadow/gradient), gradients, glows, and the `cta-luxe` / `text-gradient-*` classes. The existing utility class names (`bg-gradient-gold`, `text-gradient-emerald`, etc. used across ~40 files) stay as the stable API but their values are remapped to the new palette, so no emerald or gold color remains anywhere. Fonts, layout, and copy unchanged.

## 4. Favicon and social sharing

- New `public/favicon.png` from the mark-only PNG (64x64, padded, not stretched); referenced from `__root.tsx` head; delete the default `public/favicon.ico`.
- `og:image` / `twitter:image` on the homepage point to the new 1200x630 share image (hosted asset URL) — removes the old preview screenshot. Note: the live URL shows the new share image only after the next publish.

## 5. Make admin brand settings actually work

`company_settings` is already readable by everyone (verified: public SELECT policy exists) and already stores `logo_url` and `brand_primary`. Wire it via a small `useBrand` hook + context that loads these two fields once and provides fallbacks:

- `logo_url` set → header, footer, and both sidebars show that URL (falling back to the uploaded logo when empty or a broken image).
- `brand_primary` set → applied at runtime as a CSS variable override for `--primary` (and a matching darker companion for readable white-on-primary text); empty → the logo-based defaults. No broken theme in either state.
- Shells render skeletons/no-flicker defaults until settings load.

## 6. Verification before finishing

- Playwright through every page in section 2: logo renders, not stretched/cut/pixelated; no old "F" box anywhere.
- Screenshot sweep for any remaining emerald/gold color on buttons, links, gradients, headers.
- Favicon visible in the browser tab; homepage `og:image` tags updated.
- In admin settings, change Logo URL and Brand primary color once, confirm they take effect on the site, then set them back.
- Confirm nothing else changed: same pages, text, layout, fonts, features.
- Report the exact sampled hex values (primary + accent), every logo placement, and anything not verified.
