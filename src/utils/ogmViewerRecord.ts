import type { GeoBlacklightSchemaAardvark } from 'ogm-viewer/lib';
import type { GeoDocument } from '../types/api';
import { getBboxFromGeometry } from './geometryUtils';

export type ViewerDocument = Pick<GeoDocument, 'attributes' | 'meta'> & {
  id?: string;
};

// The API's selected preview is a fallback for records without references.
const protocolReferences: Record<string, string> = {
  wms: 'http://www.opengis.net/def/serviceType/ogc/wms',
  wmts: 'http://www.opengis.net/def/serviceType/ogc/wmts',
  cog: 'https://github.com/cogeotiff/cog-spec',
  pmtiles: 'https://github.com/protomaps/PMTiles',
  geo_json: 'http://geojson.org/geojson-spec.html',
  iiif_image: 'http://iiif.io/api/image',
  iiif_manifest: 'http://iiif.io/api/presentation#manifest',
  open_index_map: 'https://openindexmaps.org',
  tile_json: 'https://github.com/mapbox/tilejson-spec',
  tile_map_service:
    'https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification',
  xyz_tiles: 'https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames',
  arcgis_dynamic_map_layer: 'urn:x-esri:serviceType:ArcGIS#DynamicMapLayer',
  arcgis_feature_layer: 'urn:x-esri:serviceType:ArcGIS#FeatureLayer',
  arcgis_image_map_layer: 'urn:x-esri:serviceType:ArcGIS#ImageMapLayer',
  arcgis_tiled_map_layer: 'urn:x-esri:serviceType:ArcGIS#TiledMapLayer',
};

function readReferences(value: unknown): Record<string, unknown> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [
          key.replace(/\/+$/, ''),
          value,
        ])
      );
    }
  } catch {
    // A malformed reference field must not hide the API-provided preview.
  }
  return {};
}

export function hasResourcePreview(data: ViewerDocument): boolean {
  const viewer = data.meta?.ui?.viewer;
  if (
    viewer?.endpoint &&
    (viewer.protocol === 'oembed' || protocolReferences[viewer.protocol || ''])
  )
    return true;
  const references = readReferences(data.attributes.ogm.dct_references_s);
  return Object.values(protocolReferences).some(
    (key) => typeof references[key] === 'string' && !!references[key]
  );
}

export function toOgmViewerRecord(
  data: ViewerDocument
): GeoBlacklightSchemaAardvark {
  const ogm = data.attributes.ogm;
  const references = readReferences(ogm.dct_references_s);
  const viewer = data.meta?.ui?.viewer;
  const reference = protocolReferences[viewer?.protocol || ''];
  if (reference && viewer?.endpoint && !references[reference]) {
    references[reference] = viewer.endpoint;
  }
  const allmaps = data.meta?.ui?.allmaps;
  if (allmaps?.allmaps_annotated && allmaps.allmaps_annotation_url) {
    references['https://iiif.io/api/extension/georef/1/context.json'] ??=
      allmaps.allmaps_annotation_url;
  }

  // Retain the resource version used to invalidate stale COG tiles.
  const cogReference = protocolReferences.cog;
  if (typeof references[cogReference] === 'string' && ogm.id) {
    try {
      const url = new URL(references[cogReference]);
      url.searchParams.set(
        'ogm_v',
        [ogm.id, ogm.gbl_mdModified_dt].filter(Boolean).join(':')
      );
      references[cogReference] = url.toString();
    } catch {
      // Preserve URLs that cannot be parsed as absolute URLs.
    }
  }
  let bbox = ogm.dcat_bbox;
  if (!bbox && viewer?.geometry) {
    const bounds = getBboxFromGeometry(viewer.geometry);
    if (bounds)
      bbox = `ENVELOPE(${bounds[0][1]},${bounds[1][1]},${bounds[1][0]},${bounds[0][0]})`;
  }
  return {
    ...ogm,
    id: ogm.id || data.id || '',
    gbl_mdVersion_s: 'Aardvark',
    gbl_resourceClass_sm: (ogm.gbl_resourceClass_sm ||
      []) as GeoBlacklightSchemaAardvark['gbl_resourceClass_sm'],
    dct_accessRights_s:
      ogm.dct_accessRights_s as GeoBlacklightSchemaAardvark['dct_accessRights_s'],
    gbl_wxsIdentifier_s:
      ogm.gbl_wxsIdentifier_s ||
      (ogm.gbl_wxsidentifier_s as string | undefined),
    dcat_bbox: bbox,
    dct_references_s: JSON.stringify(references),
  };
}
