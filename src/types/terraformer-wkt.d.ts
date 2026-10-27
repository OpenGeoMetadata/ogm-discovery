declare module '@terraformer/wkt' {
  export function wktToGeoJSON(wkt: string): import('geojson').Geometry;
}
