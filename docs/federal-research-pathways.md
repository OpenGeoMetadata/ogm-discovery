# Federal collection research pathways

These workspaces test whether the same metadata API can support three different research tasks. They are prototypes for evaluating workflows, not evidence of improved researcher outcomes. Task-based usability testing remains necessary: measure time to a valid comparison or GIS-ready asset selection, errors, confidence in provenance, and whether the source application is still needed.

Both pathways are first-class. Each collection opens the standard discovery home at `#/`, with the existing search, browse, map, filters and record interface. The optimized workspace remains directly linkable at `#/research`. A shared, always-visible “Search & browse” / “Research workspace” switch appears in both headers and on catalog results and record pages. It identifies the active pathway and remains visible on mobile. The older `#/about-collection` route remains a discovery-home alias, and the complete scoped catalog stays at `#/search`. Switching pathways does not convert catalog filters into workflow parameters; browser Back returns to the previous URL and its selections. Theme selection uses the existing shareable theme paths. No server or API contract changes are required.

## What each workspace does

| Collection                  | Research task                             | Implemented asset behavior                                                                                                                                                                                                                         |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NASA GIBS                   | Inspect one place on two dates            | Choose a curated layer or search collection metadata; validate dates against the upstream full daily time domain; request two WMS images with identical geographic extent and dimensions. Source viewer and full image requests remain accessible. |
| The National Map            | Assemble elevation tiles for a study area | Select bounds using coordinates or the current map view; intersect the 1/3 arc-second DEM index; select original tiles; open live API download links; export a JSON manifest with bounds, record IDs, source URLs and original tile URLs.          |
| Historical Topographic Maps | Compare editions of the same sheet        | Find a place, search map coverage, filter publication years, select original scans and inspect related loaded records; optionally compare two synchronized maps; inspect descriptions, original map margins and citations.                         |

The starting examples are Terra/Aqua true color over California and 3DEP elevation near Iowa City. Historical discovery starts at the theme’s overview bounds with no selected scan or forced state index.

Selections remain in the static `#/research` route. Imagery uses `layer`, `before`, `after`, `bbox`; elevation uses `index`, `bbox`, `tiles`. Historical exploration uses `area=west,south,east,north` or `q` for map-name search, optional `place`, publication-year `start`/`end`, `active`, `compare`, `opacity`, `point` and `view=longitude,latitude,zoom`. **Create link to this view** snapshots the current camera. Paging is intentionally not serialized; reopening loads the first page plus explicit selected/comparison records. Legacy `left`, `right`, `sheet` or the first `printings` ID resolves through that record’s footprint. An old index-only link opens discovery without forcing its old sheet. No theme defaults silently select Arizona.

## Asset semantics and limits

### GIBS

[The live Terra record](https://ogm.geo4lib.app/api/v1/resources/nasa-gibs-modis_terra_correctedreflectance_truecolor) exposes a WMS reference and `gbl_wxsIdentifier_s`. The theme specifies the verified geographic WMS endpoint and the WMTS DescribeDomains endpoint/grid. Requests use WMS 1.1.1, `SRS=EPSG:4326`, explicit `TIME`, and longitude-first bounds.

[DescribeDomains](https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=DescribeDomains&VERSION=1.0.0&LAYER=MODIS_Terra_CorrectedReflectance_TrueColor&TILEMATRIXSET=GoogleMapsCompatible_Level9) returned eleven disjoint daily intervals during development. The implementation checks every interval, including the missing 2025-08-09 day. [NASA documents nearest-time behavior](https://nasa-gibs.github.io/gibs-api-docs/access-basics/); checking only minimum and maximum dates would permit a silently substituted observation. The full domain is used rather than the truncated recent-period capabilities list.

Only daily `P1D` intervals and individual ISO dates are supported in this prototype. Static, subdaily, monthly, unavailable-domain or unsupported-grid layers display an explicit unavailable state and retain source/metadata access. A failed domain request is never interpreted as proof that a layer is static. Polar and antimeridian-crossing extents are not supported. Coverage on a valid day does not guarantee cloud-free or complete imagery. These are rendered visualizations, not the underlying analytical measurements.

### Elevation

The index URL comes from the live [DEM collection record](https://ogm.geo4lib.app/api/v1/resources/usgs-tnm-index-dem13), using its OpenIndexMaps reference. It contains 1,449 nominal tile footprints. Selection tests positive-area bounding-box overlap; the configured index consists of rectangular geographic tiles. Boundary-only contact does not select an adjacent tile. A future irregular-footprint index would need polygon intersection.

[Tile n42w092](https://ogm.geo4lib.app/api/v1/resources/usgs-tnm-dem13-n42w092) has an actual raster collar outside its nominal index footprint. The API supplies a human-readable `GeoTIFF (457.4 MB)` label but no typed numeric bytes. The manifest exports original assets; it does not clip, mosaic, reproject, estimate complete coverage or perform elevation analysis. Review source metadata for CRS, vertical datum, units and nodata. `/current/` download URLs can change.

The initial elevation product is intentionally the verified 1/3 arc-second DEM index. Other TNM assets remain accessible in the catalog; hydrography, lidar and map packages should not inherit DEM-specific claims.

### Historical maps

The interaction model follows the [official topoView guide](https://ngmdb.usgs.gov/topoview/help/): separate location and map-name searches, geographic discovery, date filtering, original-map overlays and downloads. The implementation uses the existing metadata API and does not depend on topoView’s internal services or copy its application code.

Location search calls `/gazetteers/nominatim/search`; disambiguated results provide the bounds for an intersecting `dcat_bbox` search. “Minneapolis” offers Minnesota and Kansas. The Minnesota bounds returned 76 maps during verification; a nearby search around its center returned 17. Map-name search queries actual topographic records, not the `Index maps` facet that caused the earlier empty result. Panning waits for **Search this area**; a map click uses a small bounding area around the point. The deployed API ignored a zero-area box and returned the collection; a very narrow box also returned an unexpected empty result. Nearby searches use an outward-rounded 0.01–0.02° envelope and are labeled as area searches, never exact point-in-polygon results. Wrapped viewports use the full longitude range and preserve the latitude range.

Results load 20 at a time with an explicit loaded/total count and **Load more maps**. Only loaded records have coverage outlines. Errors have retry controls and never masquerade as a successful empty result. Selected and comparison scans use original georeferenced assets through `ogm-viewer`; thumbnails are not enlarged. The primary map persists across scan changes, with an optional synchronized second map, opacity and fit controls. Spatial searches clear the previous selection; year filters change the result list while the explicitly selected scan remains available for inspection.

The related-scan strip conservatively matches structured alternative names and exact bounding boxes among loaded records. It is not a canonical sheet relationship or a complete edition series; scales may differ. Original titles preserve printing/scale text without parsing it into invented typed metadata. The API record lacks dependable structured scale, printing and survey dates, so unsupported scale filters are not simulated. Missing structured evidence directs the reader to descriptions and map margins.

### Checking what a map date means

“Inspect dates, map margins & citation” shows publication years and directs missing structured date/scale fields to the original evidence, and exposes the API description and citation. The original GeoPDF opens the full sheet, including legends and marginal notes; USGS source and original XML metadata links remain available when supplied. For example, the [Madison 1892 record printed in 1903](https://ogm.geo4lib.app/api/v1/resources/usgs-htmc-801212) reports a survey in 1887. Publication-year groups are provisional browsing groups, not assertions of independent surveys or change dates.

[USGS explains the distinct dates in map margins](https://www.usgs.gov/programs/national-geospatial-program/historical-topographic-maps-preserving-past). Compilation, revision, aerial-photo and field-check dates can differ within a sheet; a newer printing is not evidence that every feature was resurveyed. Differences in symbology, scale and registration also need interpretation. This workspace supports visual inspection and source access, not automatic change detection or positional measurement.

No observation, annotation, note-storage or notebook export/import functionality is included. Researchers can use the original GeoTIFF/GeoPDF assets and stable metadata links in their existing GIS and citation workflows.

## Metadata API gaps and proposed additions

These are proposed backend improvements, not fields assumed by the frontend.

| Gap                                                                                          | Research consequence                                                                                                      | Proposed API support                                                                                |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Structured service capabilities, supported CRS/grid, cadence, full time domains/default time | GIBS needs a separate live domain request and configured service adapter; unsupported cadences cannot be compared safely  | Typed service assets and temporal-domain links/values with provenance and refresh time              |
| Visualization versus measurement assets, resolution, legend and source-dataset relationships | Researchers could mistake rendered satellite colors for analytical values                                                 | Explicit asset roles, units, legends and linked source datasets                                     |
| Canonical sheet IDs and edition/printing relationships                                       | HTMC related scans are limited to matching names/bounds among loaded results, without verified scale or series membership | Stable sheet identity plus edition/printing relationships across indexes                            |
| Typed survey/compilation/revision/aerial-photo/reprint dates and scale                       | Index dates and descriptive text do not establish feature-level currency; map collars still require inspection            | Typed event dates with provenance, revision scope and typed scale denominator                       |
| Pixel spacing, horizontal CRS/datum, vertical datum, elevation units and nodata              | DEM suitability still requires reading source metadata                                                                    | Typed raster characteristics per asset, including regional differences                              |
| Numeric bytes, checksums, immutable version IDs/URLs                                         | Cannot calculate dependable total download size or reproduce a mutable `/current/` asset                                  | Versioned asset descriptors with byte count and checksums                                           |
| Nominal versus actual coverage geometry                                                      | Tile outlines can be confused with exact raster boundaries                                                                | Geometry roles and actual raster footprints                                                         |
| Indexed asset/relationship filtering and pagination                                          | Map discovery shows 20 matches at a time; related scans can remain incomplete until all pages are loaded                  | Structured index/asset capability filters and paginated edition relationships                       |
| Processing endpoint for clipping/mosaicking                                                  | Exported DEM tiles still require desktop/notebook processing                                                              | Optional processing service with explicit job/output provenance; keep the static viewer independent |

## Review evidence

Current historical-workspace screenshots are in `docs/screenshots/topoview-research/` (desktop discovery, original scan, comparison and 390px mobile). Earlier federal workspace captures remain in `docs/screenshots/research-pathways/`. All show live assets, not mock data. See the PR for embedded comparisons and validation results.

### Finding another historical-map location

Search a city or place using **Location**, choose the intended result, and select a
scan from **Maps in this area**. Click a different location or pan and choose
**Search this area** to discover elsewhere. Use **Map name** for catalog text search.
The standard scoped catalog remains available through **Search & browse**.

Use the collection path when sharing, for example
`/ogm-discovery/usgs-htmc/#/research?area=-93.329125,44.8906175,-93.193859,45.0512576`.
A research URL at the application root without a collection path depends on the
recipient’s stored theme choice.

Further API work: validated spatial queries (reject invalid/degenerate envelopes
instead of ignoring them), reliable point-intersection search, typed scale facets,
and canonical paginated sheet/edition relationships would allow closer parity
with topoView without client-side inference or downloading whole state indexes.
