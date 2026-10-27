# MapLibre migration review — 2026-10-23

## Regressions corrected

- **MapLibre worker URL:** Vite dependency optimization relocated the MapLibre
  module without its relative worker. Chrome reported “Worker failed to load”;
  basemap controls appeared but the canvas remained blank. The SPA now explicitly
  bundles the worker and sets its URL before rendering. A production build served
  beneath `/ogm-discovery/` rendered maps successfully.
- **Featured preview readiness:** mounting an item while the style was loading
  could skip its preview permanently. An idle retry now waits for readiness,
  without repeatedly restarting successful or failed previews.
- **Featured preview cancellation:** a pending adapter could mutate the next
  basemap before its `style.load` event. Basemap replacement now revokes the
  adapter lease before calling `setStyle`. Tests cover late writes during that
  interval and restoration after the replacement loads.

## Live Chrome checks completed

Used native browser controls, the direct public API, and both Vite development
and production servers. Production was served beneath `/ogm-discovery/`.

| Check                         | Observed result                                                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero H3 density               | Hex fills and outlines rendered over Maptoolkit Light.                                                                                                                                                            |
| Accessible H3 table           | Current view contained 926 cells; first cell `822a17fffffffff` had 9,541 resources.                                                                                                                               |
| H3 search action              | Navigated with `include_filters[h3_res2][]=822a17fffffffff`; search returned 9,541 resources.                                                                                                                     |
| Zoom-dependent H3             | Featured camera move to Chicago fetched resolution 6 and rendered finer cells.                                                                                                                                    |
| Basemap choices               | Maptoolkit Light, Street, OpenFreeMap Liberty, and Esri imagery rendered.                                                                                                                                         |
| Preference persistence        | Selection persisted across hero, search, and resource navigation.                                                                                                                                                 |
| Featured ArcGIS FeatureServer | Migration Routes record `c69b75a12ca64324a0109d48db735f6d_0` rendered route lines; H3, footprint, and selection survived switching to Esri imagery.                                                               |
| Missing featured preview      | Chicago record `a10a0f50-994e-0134-2096-0050569601ca-c` currently supplies only a footprint and landing-page reference in the homepage API response. Footprint and localized unavailable status remained visible. |
| Overlapping result markers    | Expanded NYC overlap and selected result 3 independently; its record popup opened.                                                                                                                                |
| Production resource maps      | OGM Viewer rendered the ArcGIS layer with OpenFreeMap; location map rendered its extent with Maptoolkit Street and attribution.                                                                                   |
| Primary style outage          | DevTools blocking `*://styles.maptoolkit.org/*` switched both search maps to OpenFreeMap without changing the selected preference.                                                                                |
| Both providers unavailable    | Also blocking `*://tiles.openfreemap.org/*` showed neutral fallback, localized status/retry controls, and retained numbered record markers.                                                                       |
| Retry recovery                | Removing blocking rules and clicking Retry restored Maptoolkit on both maps. All temporary rules were removed and blocking disabled.                                                                              |

## Institutional smoke checks

BTAA loaded beneath `/ogm-discovery/btaa/`; its hero table contained 930 cells
and the first cell retained its 9,541 count. UW-Madison and NYU loaded their
institutional branding and map controls, but their current API scopes produced
empty H3 tables. A direct UW-Madison API check confirmed `globalCount: 0` and
`hexes: []`; scoped search also returned `totalCount: 0`. The browser displayed
the localized empty-data state. Those two configured scopes need data verification. UNR provided a positive-data
check: resolution-5 cell `85298e0bfffffff` showed four resources, and its
subpath search link returned exactly four institution-scoped results.

## Automated verification

- Full test suite: **70 files, 828 tests passed**.
- Production build with `--base=/ogm-discovery/`: passed; emitted a bundled
  `maplibre-gl-worker-*.js` asset.
- ESLint on this review's changed TypeScript files: no errors; existing
  Fast Refresh export warnings remain.
- Formatting and whitespace checks passed for this review's changes.

## Acceptance checks still outstanding

This is not evidence of complete migration acceptance. The following have not
been verified in a real browser during this review:

- Featured WMS, WMTS, ArcGIS dynamic/tiled/image, XYZ/TMS, TileJSON, index-map,
  and Allmaps fixtures. Protocol mapping tests do not prove remote rendering.
- Injected tile, sprite, and glyph failures (style outages were tested live).
- Mobile/touch, translated long labels, reduced motion, rectangle cancellation,
  fullscreen attribution, and complete keyboard interaction.
- Complete preset browser sweeps (the BTAA, UNR, UW-Madison, and NYU smoke
  checks above are narrower).
- Dense-H3 performance comparison, request-volume baseline, and retained WebGL
  instance/memory measurements after repeated navigation.

The earlier repository-wide lint and formatting failures are separate from the
passing checks on files changed in this review; those unrelated files were not
reformatted or repaired here.
