# Adopting The Viewer On GitHub Pages

Last reviewed: May 6, 2026.

This guide walks through adopting this repository as an institution-branded
OpenGeoMetadata viewer that runs on GitHub Pages. The happy path is:

1. Fork this project into the repository that matches the public Pages URL you
   want.
2. Make your institution the default `theme.yaml`.
3. Keep institution-specific assets in `public/` and copy in theme-localized
   fields.
4. Deploy the Vite build output from `dist/` with GitHub Pages Actions.
5. Keep a clean path for pulling upstream improvements over time.

## 1. Choose The GitHub Pages URL Shape

Choose this first because it determines the repository name and the Vite base
path.

| URL shape                       | Repository name        | `VITE_BASE_URL` |
| ------------------------------- | ---------------------- | --------------- |
| `https://OWNER.github.io/`      | `OWNER.github.io`      | `/`             |
| `https://OWNER.github.io/REPO/` | `REPO`                 | `/REPO/`        |
| `https://geo.example.edu/`      | usually any Pages repo | `/`             |

For the long-term benefit of receiving upstream fixes, start from a fork rather
than copying files into a fresh repository. If GitHub does not let you create the
fork with the final Pages repository name immediately, fork first and then rename
the fork.

Keep a remote named `upstream` pointing at the original project:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/ORIGINAL_REPO.git
```

Use your fork as `origin`. Your institutional work can live on `main`, while
upstream changes are periodically merged or rebased into that branch.

## 2. Install And Run Locally

Install dependencies:

```bash
npm ci
```

Create a local environment file if you need local overrides:

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

`npm run build` writes static files to `dist/`. GitHub Pages should publish that
folder, not the source files in `src/`.

## 3. Model Your Institution Theme

For a single public institution site, make root `theme.yaml` your source of
truth. The `themes/*.yaml` files are useful examples and optional local
variations, but the root `theme.yaml` is the simplest default for production.

You can scaffold a starter variation:

```bash
npm run scaffold -- my-institution "My Institution"
```

Then use the generated `themes/my-institution.yaml` as a checklist while editing
root `theme.yaml`, or copy the generated fields into `theme.yaml` once you are
ready for your site to default to that institution.

Configure these sections first:

- `id` and `label`: stable theme id and human-readable institution label.
- `site`: title, short name, description, locale, shared hash routing,
  canonical URL, manifest colors, and the theme icon pack.
- `institution`: name, logo, logo alt text, header sizing, hero text, and hero
  description.
- `branding`: colors, font stacks, and optional institution-hosted font
  stylesheets.
- `api`: backend API root endpoint, endpoint paths, client name, and default
  query parameters that scope the catalog.
- `navigation`: header links, utility links, and calls to action.
- `homepage`: hero actions, featured records, collection spotlights, partner
  institutions, media, and blog modules.
- `footer`: logo, link groups, address lines, network members, copyright, and
  original-record links.

Create the matching favicon, Apple touch icon, and PWA PNGs under
`public/theme-icons/<theme-id>/`, then point `site.icons` at those files. The
site generator writes a manifest for each theme so installed PWAs reopen with
the theme's path-based hash URL.

Use localized objects for user-facing copy, even when launching English-only:

```yaml
site:
  title:
    en: My Institution Geoportal
  description:
    en: Search geospatial resources from My Institution.
institution:
  logo_alt:
    en: My Institution Geoportal logo
```

Plain strings still work in many existing examples, but localized objects keep
the site ready for later translation and reduce future churn.

## 4. Add Logos, Images, And Icons

Place static assets in `public/`. Files there are copied to the root of the
static build, so a file at `public/my-logo.svg` is referenced as:

```yaml
institution:
  logo_url: /my-logo.svg
```

Theme asset paths are runtime strings, not imported Vite assets. The viewer
normalizes root-relative theme assets against `import.meta.env.BASE_URL` before
rendering them.

For user/org Pages sites and custom domains at the root, root-relative paths are
fine:

```yaml
institution:
  logo_url: /my-logo.svg
```

For project Pages sites at `/REPO/`, root-relative paths in supported theme
asset fields are rewritten to include the repository base path. For example,
`/my-logo.svg` renders as `/REPO/my-logo.svg`.

This applies to theme-managed logos, homepage spotlight images, homepage and
footer background images, and theme font stylesheets. For other custom runtime
URLs you add in local code, use one of these safer options:

- Include the repository path in the theme value, such as
  `/REPO/my-logo.svg`.
- Use a full URL, such as `https://OWNER.github.io/REPO/my-logo.svg`.
- Use relative asset paths only if you are using hash routing and have tested
  deep links carefully.

Use descriptive localized alt text:

```yaml
institution:
  logo_alt:
    en: My Institution Libraries logo
homepage:
  collection_spotlights:
    - image_src: /historical-maps-featured.png
      image_alt:
        en: Historical map preview for My Institution collections
```

## 5. Configure The Backend API Root And API Key

The viewer reads the active theme's `api.base_url` as the backend API root. The
starter default is:

```yaml
api:
  base_url: https://ogm.geo4lib.app/api/v1/
```

Use that default when your institution's metadata is available from the public
OpenGeoMetadata API. Point `api.base_url` at a different compatible deployment
only when you operate one yourself:

```yaml
api:
  base_url: https://geo.example.edu/api/v1/
```

If the API deployment requires a browser key, use only a capped public key. A
key in a static GitHub Pages build is visible to anyone who opens the site, so it
must not be a private backend or administrator secret.

For one GitHub Pages build that should use the same key across every bundled
theme, add `VITE_API_PUBLIC_KEY` to `.github/workflows/deploy.yml`:

```yaml
jobs:
  deploy:
    env:
      VITE_API_PUBLIC_KEY: browser-safe-rate-limited-key
```

For an institution-specific theme, add the key beside the API root:

```yaml
api:
  base_url: https://ogm.geo4lib.app/api/v1/
  public_api_key: browser-safe-rate-limited-key
```

The static viewer sends either value as `Authorization: Bearer <key>`. Do not
use `X-API-Key` for browser deployments unless the API's CORS policy explicitly
allows it. Every visitor shares the same key quota, so pick a rate limit that can
absorb normal public traffic.

`VITE_API_BASE_URL` still exists as a legacy fallback for deployments whose
theme does not define `api.base_url`, but new institutional sites should keep the
API root in theme configuration.

## 6. Scope Search Results

Use `api.default_query_params` when the BTAA Geospatial API already supports the
filter you need. This keeps institutional scope in configuration instead of
hardcoding it into components.

Examples from included themes:

```yaml
api:
  default_query_params:
    - include_filters[ogm_repo][]=edu.nyu
```

UW-Madison searches the OGM API with both the source identifier for its BTAA API
harvest and the campus provider. The viewer reads the indexed OGM copy.

```yaml
api:
  base_url: https://ogm.geo4lib.app/api/v1/
  default_query_params:
    - include_filters[ogm_repo][]=btaa-api.uwmadison
    - include_filters[schema_provider_s][]=University of Wisconsin-Madison
```

Only use parameters that the API contract supports. If the available API fields
cannot express your institutional scope cleanly, document the needed backend
filter instead of adding frontend-only filtering that hides results after they
arrive.

## 7. Use Shared Hash Routing

All themes use the same runtime router. For GitHub Pages and other static hosts,
that router is hash based:

```yaml
site:
  routing:
    mode: hash
```

The build emits `dist/<theme-id>/index.html` for every configured theme, so each
theme can have a stable static URL:

- `/REPO/#/` for the default theme
- `/REPO/unr/#/` for the `unr` theme
- `/REPO/btaa/#/resources/<id>` for a BTAA resource route

The hash portion is handled entirely in the browser, which avoids relying on
GitHub Pages' `404.html` fallback for resource, search, and bookmark routes.
This also prevents the fallback HTML from being mistaken for asset URLs such as
thumbnails or static maps.

`npm run build` still writes `404.html` and `500.html` as copies of the SPA entry
point for host-level fallbacks, but public links should use the hash URL shape.

## 8. Configure The Vite Base Path

This repo reads the public base path from `VITE_BASE_URL` in `vite.config.ts`.

For a user or organization Pages site:

```bash
VITE_BASE_URL=/ npm run build
```

For a project Pages site:

```bash
VITE_BASE_URL=/REPO/ npm run build
```

For a custom domain at the domain root:

```bash
VITE_BASE_URL=/ npm run build
```

Do not put secrets in `VITE_*` variables. Vite embeds those values in the
browser bundle.

## 9. Deploy With GitHub Pages Actions

In the GitHub repository, go to Settings, Pages, and set the source to GitHub
Actions. Vite needs a build step, so a Pages Actions workflow is the clearest
deployment path.

For a new institutional fork, prefer a first-party Pages workflow like this:

```yaml
name: Deploy static content to Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    env:
      VITE_BASE_URL: /REPO/
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

Replace `/REPO/` with your project repository name, or `/` for a user/org site
or custom domain.

This repository also includes `.github/workflows/deploy.yml`. It may be useful
for existing deployments, but new adopters should review its branch trigger,
Pages source mode, and environment variables before relying on it unchanged.

## 10. Configure A Custom Domain

If you use a custom domain, add it in the repository's Pages settings and follow
your institution's DNS process. GitHub recommends verifying custom domains to
reduce the risk of takeover.

When the custom domain hosts the site at the root, keep:

```text
VITE_BASE_URL=/
```

Also update:

```yaml
site:
  canonical_url: https://geo.example.edu
```

## 11. Keep Upstream Updates Manageable

Most institutional customization should stay in:

- `theme.yaml`
- `public/`
- `docs/` additions that describe local operations
- narrowly scoped local components, if you need custom UI

Avoid changing shared services, API behavior, route wiring, or generic
components unless the feature truly belongs in the reusable product.

A typical update flow:

```bash
git fetch upstream
git checkout main
git merge upstream/main
npm ci
npm run lint
npm run test
npm run build
```

If this project's canonical branch is `develop` in your upstream, merge
`upstream/develop` instead. Resolve conflicts by preserving your institution's
theme and assets while accepting reusable fixes from upstream.

## 12. Add Or Customize Components Today

The current app does not have a formal component override registry. Routes in
`src/App.tsx` import pages directly, and pages import components directly from
`src/components/`.

What is possible today:

- Add a new component under `src/components/` and import it into the page where
  it should appear.
- Add a route by editing `src/App.tsx` and creating a page under `src/pages/`.
- Replace an existing component by editing that component file directly.
- Keep shared UI copy in `src/i18n/messages.ts`.
- Keep institution-specific copy in localized `theme.yaml` fields.

What is not durable yet:

- Drop-in component replacement from theme YAML.
- Runtime loading of institution-specific React components.
- A stable slot API for overriding header, homepage, search result, or resource
  detail regions without touching core files.

If you customize components in a fork, keep those edits small and label them in
the code. Expect upstream merge conflicts when the same core component changes.

## 13. Plan For Durable Component Overrides

To make component customization safe for long-lived institutional forks, the
project should add an explicit extension layer. A practical plan:

1. Define named slots for high-value extension points:
   `HeaderBrand`, `HomeHeroSupplement`, `HomeBeforeSpotlights`,
   `SearchResultActions`, `ResourcePrimaryActions`, `ResourceSidebar`, and
   `FooterSupplement`.
2. Add a default override registry, probably under `src/site/overrides.tsx`,
   that exports an empty map in the upstream project.
3. Create a small helper that renders an adopter override when present and falls
   back to the default component otherwise.
4. Give each slot a typed props contract based on stable product concepts, not
   page internals.
5. Keep all slot copy localizable by passing i18n helpers and theme-localized
   values instead of hardcoded strings.
6. Add tests showing that default slots render unchanged and a sample override
   can replace or supplement them.
7. Document which files adopters are expected to edit so upstream merges do not
   repeatedly collide with custom code.

The first implementation should favor supplement slots over full replacement.
That gives institutions room for local UI while preserving the shared search,
map, metadata, and accessibility behavior.

## References

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html)
- [GitHub Docs: Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Docs: Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [GitHub Docs: About custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
