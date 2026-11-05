# Federal collection research pathways

These workspaces test whether the same metadata API can support three different research tasks. They are prototypes for evaluating workflows, not evidence of improved researcher outcomes. Task-based usability testing remains necessary: measure time to a valid comparison or GIS-ready asset selection, errors, confidence in provenance, and whether the source application is still needed.

Both pathways are first-class. Each collection opens the standard discovery home at `#/`, with the existing search, browse, map, filters and record interface. The optimized workspace remains directly linkable at `#/research`. A shared, always-visible “Search & browse” / “Research workspace” switch appears in both headers and on catalog results and record pages. It identifies the active pathway and remains visible on mobile. The older `#/about-collection` route remains a discovery-home alias, and the complete scoped catalog stays at `#/search`. Switching pathways does not convert catalog filters into workflow parameters; browser Back returns to the previous URL and its selections. Theme selection uses the existing shareable theme paths. No server or API contract changes are required.

## What each workspace does

| Collection                  | Research task                             | Implemented asset behavior                                                                                                                                                                                                                         |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NASA GIBS                   | Inspect one place on two dates            | Choose a curated layer or search collection metadata; validate dates against the upstream full daily time domain; request two WMS images with identical geographic extent and dimensions. Source viewer and full image requests remain accessible. |
| The National Map            | Assemble elevation tiles for a study area | Select bounds using coordinates or the current map view; intersect the 1/3 arc-second DEM index; select original tiles; open live API download links; export a JSON manifest with bounds, record IDs, source URLs and original tile URLs.          |
| Historical Topographic Maps | Compare editions of the same sheet        | Search map indexes by state/scale; group sheets within an index; distinguish edition, survey and printing dates; view two georeferenced TIFFs with synchronized pan/zoom; download GeoPDF/GeoTIFF and inspect full metadata.                       |

The starting examples are Terra/Aqua true color over California, 3DEP elevation near Iowa City, and Bright Angel's 1903 and 1962 editions. HTMC's example has **three editions and fourteen scans/printings**, not fourteen different editions. Search opens other matching index records; grouping is limited to the chosen index.

Selections are query parameters on the `#/research` hash route: `layer`, `before`, `after`, `bbox`; `index`, `bbox`, `tiles`; or `index`, `sheet` (a representative record ID), `left`, `right`. Omitted parameters use theme defaults. Map pan/zoom in the historical workspace is synchronized within the session, but is not encoded in the URL. The manifest records the actual elevation extent and selected assets. A manifest is not an immutable copy of the underlying data.

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

The [Arizona 1:48,000 index](https://ogm.geo4lib.app/api/v1/resources/usgs-htmc-index-az-48000) provides structured `title`, `scale`, `datePub`, `dateSurvey`, `dateReprnt`, geometry and `recId`. Grouping uses title + scale + normalized polygon, not a title regex. This is a conservative index-based grouping; it is not an API-supplied canonical sheet relationship.

Each selected record is fetched from the metadata API. `ogm-viewer` reads the georeferenced TIFF/COG asset; the 200-pixel browse thumbnails are never enlarged for comparison. Two MapLibre cameras are linked. Matching nominal footprints do not establish pixel-perfect registration. Printing year is displayed separately from edition year, and missing survey/printing dates remain explicitly unknown. [1903 source record](https://ogm.geo4lib.app/api/v1/resources/usgs-htmc-314254), [1962 source record](https://ogm.geo4lib.app/api/v1/resources/usgs-htmc-464619).

## Metadata API gaps and proposed additions

These are proposed backend improvements, not fields assumed by the frontend.

| Gap                                                                                          | Research consequence                                                                                                     | Proposed API support                                                                                |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Structured service capabilities, supported CRS/grid, cadence, full time domains/default time | GIBS needs a separate live domain request and configured service adapter; unsupported cadences cannot be compared safely | Typed service assets and temporal-domain links/values with provenance and refresh time              |
| Visualization versus measurement assets, resolution, legend and source-dataset relationships | Researchers could mistake rendered satellite colors for analytical values                                                | Explicit asset roles, units, legends and linked source datasets                                     |
| Canonical sheet IDs and edition/printing relationships                                       | HTMC grouping is restricted to matching geometry/name/scale within one index                                             | Stable sheet identity plus edition/printing relationships across indexes                            |
| Typed survey/edition/reprint dates and scale                                                 | Temporal strings cannot reliably support historical comparison                                                           | Separate event dates with event types and typed scale denominator                                   |
| Pixel spacing, horizontal CRS/datum, vertical datum, elevation units and nodata              | DEM suitability still requires reading source metadata                                                                   | Typed raster characteristics per asset, including regional differences                              |
| Numeric bytes, checksums, immutable version IDs/URLs                                         | Cannot calculate dependable total download size or reproduce a mutable `/current/` asset                                 | Versioned asset descriptors with byte count and checksums                                           |
| Nominal versus actual coverage geometry                                                      | Tile outlines can be confused with exact raster boundaries                                                               | Geometry roles and actual raster footprints                                                         |
| Indexed asset/relationship filtering and pagination                                          | Index discovery is a metadata search; the prototype shows 20 matches at a time and asks users to refine                  | Structured index/asset capability filters and paginated edition relationships                       |
| Processing endpoint for clipping/mosaicking                                                  | Exported DEM tiles still require desktop/notebook processing                                                             | Optional processing service with explicit job/output provenance; keep the static viewer independent |

## Review evidence

Screenshots are in `docs/screenshots/research-pathways/`. Desktop captures use a 1440px viewport; mobile captures use 390px. They show live NASA/USGS assets, not mock data. See the PR for embedded comparisons and validation results.

### Finding another historical-map location

The historical workspace keeps state/region search and **Browse all map indexes**
visible above the selected index. Search a state, choose an index at the desired
scale, then select its map sheet and editions. Results use the collection-scoped
metadata API with the Index maps resource-type filter and support pagination.
Changing indexes clears the previous sheet and edition selections. Panning the
comparison maps only moves the selected scans; it does not search for new sheets.

Use the collection path when sharing, for example
`/ogm-discovery/usgs-htmc/#/research?index=usgs-htmc-index-wi-62500`.
A research URL at the application root without a collection path depends on the
recipient's stored theme choice.
