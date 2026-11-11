# OpenGeoMetadata Discovery

A proof-of-concept OpenGeoMetadata community frontend for configurable,
static-site-friendly geospatial discovery using metadata served by the
OpenGeoMetadata API.

This project is evolving the BTAA Geoportal frontend into a reusable
OpenGeoMetadata viewer that can be branded for different institutions without
forking the application. The goal is a lightweight React/Vite app that runs well
on static hosting, keeps institutional content in configuration, and preserves
BTAA as the reference preset.

## What It Does

- Searches and displays geospatial records from the OpenGeoMetadata API.
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
- `src/services/api.ts` talks directly to the OpenGeoMetadata API.
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
npm run typecheck       # check application, tests, and Vite configuration
npm run lint:fix        # run ESLint with automatic fixes
npm run format          # run Prettier
npm run format:check    # check formatting
npm run scaffold        # create a starter themes/<theme-id>.yaml file
npm run deploy          # publish dist/ with gh-pages
```

### Matching CI locally

CI runs on the current Node LTS release. Verify its reported Node version when
reproducing a failure; a passing run on a different runtime is not a CI result.
Local development requires Node 22.13+ on the 22.x line, or Node 24+, matching
the accessibility tooling's supported runtimes.
Run `npm ci`, `npm run lint -- --max-warnings=0`, `npm run typecheck`,
`npm run test:ci`, and `npm run build`. The coverage command enforces the existing
80% line and statement thresholds; a plain `vitest run` does not.

Vitest workers disable Node's native Web Storage with
`--no-experimental-webstorage` so happy-dom and jsdom provide isolated browser
storage. Vitest 4 configures this through `test.execArgv`, without a shared storage
file or changing application behavior.

### Dependency security updates

Use `npm ci` to reproduce the committed dependency tree and `npm audit` to check
current advisories. Keep Vitest, its UI, and its coverage provider on matching
versions. Security overrides in `package.json` keep transitive dependencies on
patched releases where their consumers still request vulnerable versions:

- `fflate` 0.7 and PostCSS selector parser 6 stay on their existing API lines.
- Modern `glob` and `minimatch` consumers use patched releases; legacy consumers
  retain their existing major versions and calling conventions.
- Luma's glTF loader uses the matching Loaders.gl 4.5 packages, which remove the
  required `texture-compressor` / vulnerable `image-size` dependency chain.
- Pa11y CI 5 uses newer Puppeteer tooling without the unpatched `extract-zip`
  dependency.

As of November 11, 2026, all 180 open repository Dependabot alerts were checked
against the updated lockfile's package versions and vulnerable version ranges.
The separate low-severity
[deepmerge advisory (GHSA-gcqx-w48m-w2h4)](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
still has no published fix and is reported by `npm audit` through Mirador and
build tooling. It is not suppressed or worked around by downgrading to an older
release. Revisit it when upstream publishes a fix or a compatible replacement.

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

## Resource previews

Resource pages use [OGM Viewer](https://github.com/OpenGeoMetadata/ogm-viewer)
(`ogm-viewer` 1.5) for map and IIIF previews, layer controls, and feature inspection.
The viewer loads on demand and receives the Aardvark record already fetched by the
app, preserving direct service URLs and static hosting support. Object and JSON
string reference fields are normalized; the API's selected preview and geometry
provide fallbacks when references or bounds are missing. COG URLs retain the
resource version parameter used for cache invalidation.

OGM Viewer owns its preview tabs and controls. The surrounding loading/error
messages are localized; upstream viewer controls currently use English. oEmbed
content is displayed in a sandboxed iframe because OGM Viewer does not provide
an oEmbed preview. Featured homepage layers and discovery maps keep their existing
implementation; GeoBlacklight remains a dependency for the homepage layers.

For deployments with a Content Security Policy, follow OGM Viewer's
[CSP requirements](https://github.com/OpenGeoMetadata/ogm-viewer#content-security-policy),
including `worker-src blob:`, `script-src 'wasm-unsafe-eval'`, and `connect-src data:`
alongside the metadata, basemap, and layer service origins.

### Thumbnail fallbacks

Search-result and related-item thumbnails use the canonical API thumbnail
resolver, with the BTAA Geoportal's `variant=icon-gradient` fallback for list
cards. Missing, restricted, or failed thumbnails show a resource-class icon;
HTTP-success SVGs containing "Thumbnail unavailable" are never displayed.
Ready immutable thumbnails retain normal browser image loading. Queued captures
retry at most 12 times and stop when the card is removed. For cross-origin
pending-thumbnail updates, the API must expose `X-Thumbnail-Pending` and
`X-Placeholder` through CORS; unavailable SVG detection also works without those
headers. Requests use the configured API base URL and need no frontend proxy.

### Interactive maps and basemap resilience

Discovery uses MapLibre GL JS for its hero, search filter, search results,
bookmarks, and resource location maps. H3 aggregation still comes directly from
`api.map_h3_path`; cell IDs, search filters, counts, and resolution levels 2–8
retain the existing API contract. The accessible hex table remains available.
OGM Viewer continues to own resource previews and IIIF rendering.

The Place facet fits each new search to its full H3 result extent using a
resolution-2 request without a viewport bounding box. Active search filters still
apply, and explicit location bounds take precedence. Panning, zooming, and
pagination preserve the camera; visible hexes continue loading for the current
viewport. Empty results leave the camera in place.

`map` in `theme.yaml` (or an institutional theme) configures the basemaps:

- `basemaps`: ordered entries with a stable `id` and localized `label`.
  Supply `style_url` for a MapLibre style, or `tiles`, `tile_size` (default 256),
  `max_zoom` (default 19), and `attribution` for raster tiles. Optional `logo`
  contains `src`, `href`, and localized `alt`.
- `default_basemap` and `fallback_basemap`: entry IDs. Both default to OpenFreeMap
  Liberty. Shipped choices are Liberty, Positron, and Dark. Unknown or retired
  saved choices (including Maptoolkit and Esri) use the configured default.
- `viewer_light_style` and `viewer_dark_style`: style URLs passed through OGM
  Viewer's public properties; defaults use OpenFreeMap to avoid CARTO.

A style-load error, a 15-second style timeout, or three distinct basemap tile
failures within ten seconds switches Discovery maps to the fallback. Each
provider is attempted once; if both fail, resource overlays remain on a neutral
background with a retry button. Overlay/API failures do not change providers.
Automatic fallback does not overwrite the visitor's saved basemap choice.

OpenFreeMap supplies all shipped basemaps, viewer styles, and native-generated
campus/resource map images. Preserve the style's OpenFreeMap, OpenMapTiles, and
OpenStreetMap attribution. See the [OpenFreeMap setup guide](https://openfreemap.org/quick_start/).
Hosted service availability is not guaranteed. Institutions can configure their
own style endpoints. With the default Liberty selection, a basemap failure goes
directly to the neutral background and retry control; switching between OFM
styles does not provide independent-provider resilience. No persistent tile cache
is added.

Existing theme hero centers and featured camera centers stay `[latitude,
longitude]`; existing camera zoom values retain their Leaflet-era scale for
backward compatibility. They are converted at the boundary to MapLibre
`[longitude, latitude]` and zoom minus one. New internal map geometry uses
longitude first. Browser map requests remain direct HTTPS requests; CSP must
permit configured styles, tiles, sprites, glyphs, logo origins, and MapLibre's
worker (`worker-src 'self' blob:`). The SPA entrypoint explicitly bundles the
MapLibre module worker through Vite so development and subpath deployments
resolve it correctly. Keep that initialization before rendering maps. No server
proxy is required.

Backend-generated static-map images, external embeds, and the legacy `app/`
SSR implementation are separate from this frontend migration. Legacy Leaflet
assets/dependencies needed by `app/` remain isolated from the SPA entrypoint.

### Generated static maps

Partner campus backgrounds use API-generated MapLibre PNGs behind the bundled
school logos. Discovery requests `/static-maps/institutions/{slug}/native` with
the configured campus center and zoom. Deploy the API's optional native-map
renderer/Celery integration before enabling these images in production; older
APIs return 404 and Discovery retains its branded fallback. It never requests
legacy CARTO campus images. Cold renders retry briefly without hiding the logo.

Images normally use the active API base. For local integration testing only, set
`VITE_STATIC_MAP_API_BASE_URL=http://127.0.0.1:3007/api/v1` when building to send
campus and resource geography images to the local asset API while search still uses the configured API.
Omit this override from production builds. Campus-image provider credits are
visible below the partner grid; this integration currently uses OpenFreeMap.

Search-result geography thumbnails request `/static-maps/{id}/geometry/native`.
This endpoint generates missing images through Celery and stores them in the
existing content-addressed asset system. Discovery bypasses legacy API static-map
URLs (including immutable hashes containing CARTO error tiles); custom external
map URLs remain supported. Deploy the native API route and worker before this
frontend change. Pending images retry briefly, then show a localized unavailable
state rather than falling back to legacy tiles. Existing immutable assets are
not overwritten.

Static-map loading uses status-aware fetches near the viewport (400px preload
margin). Only pending/rate-limited responses (503/429) retry, using Retry-After;
missing records fail immediately. Successful URLs stay stable so browser caching
works. Native endpoints require CORS access from the frontend origin; CSP must
allow the asset API in `connect-src` and `blob:` in `img-src`. Custom external
map images continue to load directly. Search cards request the 384×288
`?size=thumbnail` variant; full-size assets remain available without this query.
The API caches successful native responses in the browser for one hour.

For predictable first-page speed, prime campus maps and frequently viewed
resource thumbnails before deployment. A cold render still depends on remote
basemap data and available worker capacity. The local preview harness now loads
missing public resource geometry into its isolated test database on demand;
this behavior is not installed in the production API.

### Aardvark repository themes

The theme selector covers all 16 repositories whose OGM GitHub
`supported_schemas` property includes `Aardvark` as of November 11, 2026.
The new portals follow the USGS collection layout: localized introductory copy,
three discovery pathways, a scoped interactive map, and source-repository links.
Each theme is a standalone YAML file; no component or route registration is needed.

| Repository                                                                  | Theme / static home path |
| --------------------------------------------------------------------------- | ------------------------ |
| [ca.lunaris](https://github.com/OpenGeoMetadata/ca.lunaris)                 | `lunaris/`               |
| [edu.berkeley](https://github.com/OpenGeoMetadata/edu.berkeley)             | `berkeley/`              |
| [edu.gmu](https://github.com/OpenGeoMetadata/edu.gmu)                       | `gmu/`                   |
| [edu.harvard](https://github.com/OpenGeoMetadata/edu.harvard)               | `harvard/`               |
| [edu.nyu](https://github.com/OpenGeoMetadata/edu.nyu)                       | `nyu/` (existing)        |
| [edu.princeton.arks](https://github.com/OpenGeoMetadata/edu.princeton.arks) | `princeton/`             |
| [edu.stanford.purl](https://github.com/OpenGeoMetadata/edu.stanford.purl)   | `stanford/`              |
| [edu.unr](https://github.com/OpenGeoMetadata/edu.unr)                       | `unr/` (existing)        |
| [edu.utexas](https://github.com/OpenGeoMetadata/edu.utexas)                 | `utexas/`                |
| [edu.uwm](https://github.com/OpenGeoMetadata/edu.uwm)                       | `uwm/`                   |
| [geobtaa](https://github.com/OpenGeoMetadata/geobtaa)                       | `geobtaa/`               |
| [gov.nasa.gibs](https://github.com/OpenGeoMetadata/gov.nasa.gibs)           | `nasa-gibs/` (existing)  |
| [gov.usda.naip](https://github.com/OpenGeoMetadata/gov.usda.naip)           | `usda-naip/`             |
| [gov.usgs.htmc](https://github.com/OpenGeoMetadata/gov.usgs.htmc)           | `usgs-htmc/` (existing)  |
| [gov.usgs.tnm](https://github.com/OpenGeoMetadata/gov.usgs.tnm)             | `usgs-tnm/` (existing)   |
| [org.humdata](https://github.com/OpenGeoMetadata/org.humdata)               | `hdx/`                   |

Append these paths to the deployment base, for example
`https://opengeometadata.github.io/ogm-discovery/usda-naip/`.
The `?ogm_theme=<id>` selector also works. New repository portals use the existing
`api.default_query_params` contract to scope requests by provenance:

```yaml
api:
  base_url: https://ogm.geo4lib.app/api/v1/
  default_query_params:
    - include_filters[ogm_repo][]=gov.usda.naip
```

The separate `geobtaa` portal scopes to that repository; `btaa` remains the
unchanged reference preset. Existing institutional and federal themes retain
their established scopes and research tools. Archived campus repositories with
cleared schema properties are not separate current Aardvark sources, even if
their old `ogm-aardvark` topics remain. `uwmadison` remains an additional preset;
`edu.wisc` currently declares only the legacy 1.0 schema.

Harvard and George Mason declared Aardvark but returned zero records from the
reference API during verification on November 11, 2026. Their portals retain
the correct repository filters and empty featured lists. Harvesting/indexing
those sources is a backend task; the frontend does not widen their searches.
The other 14 repository filters returned records. Featured IDs in the new
portals were selected from public records returned by their own repository scope.

Collection images are optional. These new portals use a text introduction and
the live discovery map until a verified, attributed image is configured.
`homepage.featured_items: []` (or `featured_resource_ids: []`) disables the
featured carousel, while omitting both fields preserves the legacy fallback.
Theme-specific manifests reuse the bundled default icons; replace `site.icons`
when adopting a portal with institutional branding. All new copy uses English
localized objects, ready for additional translations.

To refresh coverage, inspect the organization's `supported_schemas` properties
with `gh api 'orgs/OpenGeoMetadata/properties/values?per_page=100' --paginate`,
compare the Aardvark entries with this table, and verify the API repository filter
before choosing featured records. Do not infer ingestion from a repository topic.

### Federal collection prototypes

The theme selector includes three collection portals, also available at stable
static paths (append to your deployment base URL):

| Theme                            | Home path    | Catalog scope                                        |
| -------------------------------- | ------------ | ---------------------------------------------------- |
| NASA GIBS                        | `nasa-gibs/` | `pcdm_memberOf_sm = nasa-gibs`                       |
| USGS The National Map            | `usgs-tnm/`  | USGS provider + `dcat_keyword_sm = The National Map` |
| USGS Historical Topographic Maps | `usgs-htmc/` | `pcdm_memberOf_sm = usgs-htmc`                       |

For example, `https://opengeometadata.github.io/ogm-discovery/nasa-gibs/`
and `https://opengeometadata.github.io/ogm-discovery/usgs-htmc/#/resources/usgs-htmc-314262`.
The existing `?ogm_theme=<id>` entry point also works. Selecting a theme opens
its home URL and clears the previous collection's route and filters. These are
community prototypes, not official agency websites.

Set the optional `homepage.collection_intro` to use an asset-led collection
home above the interactive discovery map. Existing themes keep their current
hero layout when the field is absent. All copy fields accept localized objects:

- `eyebrow`: short collection identifier above the existing `institution.hero_text`
  and `institution.hero_description`.
- `image` (optional): `src` (bundled or remote), localized `alt` and `caption`, and an internal
  `href` to a record or search. The caption should include source attribution.
- `facts`: an array of localized `value` / `label` pairs. Use stable collection
  characteristics, not hardcoded live record counts.
- `pathways`: an array of localized `label`, `title`, `description`, plus an internal
  `href` for a curated discovery route.
- `map_heading` and `map_description`: localized context for the live map.

Reuse `homepage.hero_actions`, `hero_map`, `featured_items`, and branding tokens
for actions, map coverage, previews and palette. Local images resolve against the
Vite base path. No new API or server is required. See
[the collection research and asset notes](docs/federal-collection-themes.md)
for source provenance, preview limitations and screenshots.

### Asset-specific research workspaces

An optional top-level `research` configuration enables an asset-specific workspace
at `#/research` alongside the standard discovery experience. Every collection
home (`#/`) retains its search, browse and map interface. A shared “Search & browse” /
“Research workspace” switch appears in both interfaces, including catalog results
and record pages. Themes without `research` keep their existing navigation.
The older `#/about-collection` link remains a compatible alias for the discovery home.

- `kind`: `imagery`, `elevation`, or `editions` (workflow capabilities, not institution IDs).
- `title`, `description`, `note`: localized text objects.
- `records`: initial metadata record IDs with localized `label` objects.
- `bbox`: default `[west, south, east, north]` geographic study area.
- `search`: optional collection metadata search; optional `resource_type` adds an existing API facet filter.
- Imagery: `dates` and `imagery.map_endpoint`, `imagery.domain_endpoint`, `imagery.tile_matrix_set` configure a daily WMS/WMTS adapter.
- Editions: `sheet` and `editions` select the initial sheet name and pair of record IDs.

See the federal YAML presets for complete examples and
[research pathways and API gaps](docs/federal-research-pathways.md) for semantics,
supported assets, URL state, and limitations. The elevation example deliberately
supports the configured rectangular DEM index rather than treating every TNM
asset as an elevation raster.
