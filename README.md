# OpenGeoMetadata Discovery

The official OpenGeoMetadata community frontend for configurable,
static-site-friendly geospatial discovery using metadata served by the BTAA
Geospatial API.

This project is evolving the BTAA Geoportal frontend into a reusable
OpenGeoMetadata viewer that can be branded for different institutions without
forking the application. The goal is a lightweight React/Vite app that runs well
on static hosting, keeps institutional content in configuration, and preserves
BTAA as the reference preset.

## What It Does

- Searches and displays geospatial records from the BTAA Geospatial API.
- Provides search, map, bookmark, and resource detail views.
- Uses `theme.yaml` and optional `themes/*.yaml` files for institution
  branding, navigation, homepage content, API paths, locale settings, and
  deployment-facing metadata.
- Supports localized shared UI strings through `src/i18n/`.
- Builds as static assets that can be hosted on services such as GitHub Pages.

## Project Shape

The active application lives in `src/`:

- `src/config/institution.ts` parses the default `theme.yaml`, merges optional
  theme variations from `themes/`, and applies theme settings.
- `src/services/api.ts` talks directly to the BTAA Geospatial API.
- `src/i18n/` contains shared message catalogs and locale helpers.
- `src/components/` and `src/pages/` implement the viewer experience.
- `public/` contains static assets used by themes and the generated site.
- `scripts/` contains scaffolding, site generation, and QA helpers.

The `app/` and `server/` directories are legacy or transitional code from an
earlier SSR/BFF setup. Prefer the SPA path in `src/` for new product work unless
a task explicitly calls for those older surfaces.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

Build the static site:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

For the full adoption workflow, including GitHub Pages setup, theme modeling,
and component customization guidance, see
[docs/adopting-github-pages.md](docs/adopting-github-pages.md).

## Configuration

The main configuration file is `theme.yaml`. It should read like a complete
starter site for one institution, not a packed list of every example.

The default theme is `opengeometadata`, a fictitious OpenGeoMetadata institution
with a Bauhaus-inspired starter palette. Additional examples live as one theme
per file in `themes/`, including `themes/btaa.yaml` as the reference preset for
BTAA Geoportal behavior and localization.

Theme configuration controls:

- site title, description, locale support, and web app manifest colors
- optional localized sitewide notice banners
- theme-specific favicon, Apple touch icon, and PWA install icons
- institution name, logo, header lockup, and hero copy
- brand colors, fonts, and optional institution-hosted font stylesheets
- navigation links, utility links, and calls to action
- homepage hero content, featured records, collection spotlights, media, and
  blog modules
- footer layout, links, institutional address, and copyright text
- backend API root endpoint, endpoint paths, optional public API key, and
  default query parameters

The default backend API root is `https://ogm.geo4lib.app/api/v1/`. Override
`api.base_url` in `theme.yaml` when an institution needs to point at a different
compatible API deployment.

Set `navigation.cta_style: utility` when a theme should keep the CTA in the
right-side header slot but render it with the same compact treatment as utility
links. Omit the field, or set it to `button`, for the default button treatment.

Set `homepage.hero_map.center` as `[latitude, longitude]` and
`homepage.hero_map.zoom` to choose the homepage map's initial camera. Use
`homepage.hero_map.initial_pan_px: [0, 0]` when a theme should not apply the
default horizontal map pan after initial render.

Set `site.banner` when a theme needs a sitewide message above the header. The
banner text supports localized values. Use `tone: neon` only for temporary,
high-visibility notices such as experimental proof-of-concept deployments.

```yaml
site:
  banner:
    enabled: true
    tone: neon
    text:
      en: 'NOTICE: This is an experimental proof-of-concept.'
```

Static browser deployments can also set `api.public_api_key` to a rate-limited,
browser-safe key. The viewer sends it as `Authorization: Bearer <key>`. Treat
this value as public because it is embedded in the built site and shares one
quota across all visitors.

### Adding A Public API Key

Use only capped, browser-safe API keys in this frontend. A key in a static build
is visible to anyone who opens the site, so it must not be a private backend or
administrator secret.

For the repository's GitHub Pages deployment, add the key to the Pages workflow
environment so it applies to the built site:

```yaml
env:
  VITE_API_PUBLIC_KEY: browser-safe-rate-limited-key
```

For an institution-specific theme, add the key beside the API root:

```yaml
api:
  base_url: https://ogm.geo4lib.app/api/v1/
  public_api_key: browser-safe-rate-limited-key
```

Both approaches send the key on API requests as `Authorization: Bearer <key>`.
Prefer `VITE_API_PUBLIC_KEY` when one GitHub Pages build should use the same key
for every included theme variation. Prefer `api.public_api_key` when a copied or
forked theme needs to carry its own public API credentials.

For a new institutional deployment, copy `theme.yaml` for a single-site build or
add a new `themes/<theme-id>.yaml` file when you want it available alongside the
included examples. Prefer theme fields over hardcoding institution-specific
behavior in components.

### Theme Icons And PWA Install Assets

Each theme can define its browser and install icons through `site.icons`.
Included themes keep their packs in `public/theme-icons/<theme-id>/`:

```yaml
site:
  icons:
    manifest: /theme-icons/my-institution/manifest.webmanifest
    favicon: /theme-icons/my-institution/favicon.ico
    favicon_svg: /theme-icons/my-institution/favicon.svg # optional
    apple_touch_icon: /theme-icons/my-institution/apple-touch-icon-180x180.png
    pwa:
      - src: /theme-icons/my-institution/pwa-64x64.png
        sizes: 64x64
        type: image/png
      - src: /theme-icons/my-institution/pwa-192x192.png
        sizes: 192x192
        type: image/png
      - src: /theme-icons/my-institution/pwa-512x512.png
        sizes: 512x512
        type: image/png
```

`npm run generate:site` writes a web app manifest for every configured theme.
Theme manifests use path-based hash URLs such as `/my-institution/#/` so a
launched PWA opens with the installed theme active. When adding a theme, create
the matching icon pack before publishing the build.

## Environment Variables

Most deployment behavior should come from `theme.yaml`. Environment variables
are reserved for local development, legacy fallbacks, or deployment secrets.

Common variables:

- `VITE_BASE_URL`: base path for Vite builds, usually `/`.
- `VITE_API_BASE_URL`: legacy API base URL fallback when a theme does not define
  `api.base_url`. Prefer `api.base_url` in `theme.yaml`; the default public root
  is `https://ogm.geo4lib.app/api/v1/`.
- `VITE_API_PUBLIC_KEY`: optional browser-visible fallback key sent as
  `Authorization: Bearer`. This is useful for deployment-wide static builds,
  such as GitHub Pages workflows.
- `VITE_CSRF_TOKEN`: optional CSRF token placeholder for deployments that need
  it.
- `VITE_APP_VERSION`: version label sent in API diagnostic headers.
- `VITE_ENABLE_DEBUG_LOGS`: enables client debug logging when true.
- `VITE_TURNSTILE_ENABLED`: enables or disables Turnstile checks.
- `VITE_TURNSTILE_SITE_KEY`: Cloudflare Turnstile site key.
- `VITE_TURNSTILE_ACTION`: Turnstile action name.

Do not commit real `.env` files or private API keys. A capped public browser key
may live in theme config only when it is intentionally safe to expose.

## Scripts

```bash
npm run dev             # generate site files and start Vite
npm run build           # generate site files and build static assets
npm run preview         # preview the built site
npm run test            # run Vitest
npm run test:ci         # run Vitest once with coverage thresholds
npm run lint            # run ESLint
npm run lint:fix        # run ESLint with automatic fixes
npm run format          # run Prettier
npm run format:check    # check formatting
npm run scaffold        # create a starter themes/<theme-id>.yaml file
npm run deploy          # publish dist/ with gh-pages
```

## Creating A New Institution Theme

Use the scaffold helper to create a starter theme file:

```bash
npm run scaffold -- my-institution "My Institution"
```

The scaffold is written to `themes/my-institution.yaml`. The root `theme.yaml`
is still the simplest copyable example when building a single institution site.

When adding a new theme:

- keep one institution per YAML file
- keep `btaa` working as the reference implementation
- keep copy localizable by using localized objects for configurable text
- add a favicon, Apple touch icon, and PWA icon pack under
  `public/theme-icons/<theme-id>/`
- use theme fields for institution names, logos, links, colors, and homepage
  content
- avoid server-only assumptions so the site remains static-host friendly
- update this README when new public configuration fields are introduced

## Deployment

This app builds to `dist/` and can be hosted as static files.

`npm run generate:site` writes a deny-all `public/robots.txt` so themable
preview and pilot sites do not invite crawler traffic before an institution is
ready to publish.

`npm run build` also emits `dist/404.html` and `dist/500.html` as copies of the
built SPA entry point, plus `dist/<theme-id>/index.html` for every configured
theme. GitHub Pages deployments use hash routing for all themes, with URLs such
as `/ogm-discovery/unr/#/resources/<id>`. Hosts that support a custom
server-error fallback can serve `500.html`.

The repository includes a GitHub Pages workflow in
`.github/workflows/deploy.yml`. Review its branch trigger and required secrets
before relying on it for a new deployment.

Manual deployment through the `gh-pages` package is available with:

```bash
npm run deploy
```

## Development Notes

- `theme.yaml` is the source of truth for the default institution branding and
  deployment configuration; `themes/*.yaml` files provide optional variations.
- Shared UI copy belongs in `src/i18n/messages.ts`.
- Institution-specific copy should stay in localized theme fields.
- Generic product work should usually happen in `src/`, not `app/` or `server/`.
- Keep the viewer map-forward, accessible, localizable, and static-host
  compatible.
