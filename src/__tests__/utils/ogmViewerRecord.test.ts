import { describe, expect, it } from 'vitest';
import {
  hasResourcePreview,
  toOgmViewerRecord,
  type ViewerDocument,
} from '../../utils/ogmViewerRecord';

const wms = 'http://www.opengis.net/def/serviceType/ogc/wms';
function document(
  references: string | Record<string, string> = {}
): ViewerDocument {
  return {
    attributes: {
      ogm: {
        id: 'record',
        dct_title_s: 'Map',
        dct_accessRights_s: 'Restricted',
        dct_references_s: references,
        gbl_wxsIdentifier_s: 'layer',
      },
    },
    meta: {
      ui: {
        viewer: {
          protocol: 'wms',
          endpoint: 'https://example.com/wms',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-94, 44],
                [-93, 44],
                [-93, 45],
                [-94, 45],
                [-94, 44],
              ],
            ],
          },
        },
      },
    },
  };
}
describe('toOgmViewerRecord', () => {
  it.each([
    JSON.stringify({ [wms]: 'https://example.com/original' }),
    { [wms]: 'https://example.com/original' },
  ])('preserves references and access rights', (references) => {
    const data = document(references);
    const result = toOgmViewerRecord(data);
    expect(JSON.parse(result.dct_references_s!)[wms]).toBe(
      'https://example.com/original'
    );
    expect(result).toMatchObject({
      dct_accessRights_s: 'Restricted',
      gbl_wxsIdentifier_s: 'layer',
      dcat_bbox: 'ENVELOPE(-94,-93,45,44)',
    });
    expect(data.attributes.ogm.dct_references_s).toEqual(references);
  });
  it.each(['{bad', '{}', 'null', '[]'])(
    'falls back to the API preview for %s',
    (references) => {
      expect(
        JSON.parse(toOgmViewerRecord(document(references)).dct_references_s!)[
          wms
        ]
      ).toBe('https://example.com/wms');
    }
  );
  it('preserves declared bounds and adds a COG resource version', () => {
    const data = document({
      'https://github.com/cogeotiff/cog-spec':
        'https://example.com/map.tif?token=abc',
    });
    data.attributes.ogm.dcat_bbox = 'ENVELOPE(1,2,4,3)';
    data.attributes.ogm.gbl_mdModified_dt = '2026-01-01';
    const result = toOgmViewerRecord(data);
    expect(result.dcat_bbox).toBe('ENVELOPE(1,2,4,3)');
    const url = new URL(
      JSON.parse(result.dct_references_s!)[
        'https://github.com/cogeotiff/cog-spec'
      ]
    );
    expect(url.searchParams.get('token')).toBe('abc');
    expect(url.searchParams.get('ogm_v')).toBe('record:2026-01-01');
  });
});

describe('hasResourcePreview', () => {
  it('discovers references without the API viewer hint', () => {
    const data = document({ [wms + '/']: 'https://example.com/wms' });
    delete data.meta;
    expect(hasResourcePreview(data)).toBe(true);
    expect(JSON.parse(toOgmViewerRecord(data).dct_references_s!)[wms]).toBe(
      'https://example.com/wms'
    );
  });
  it('does not add an empty preview for download-only records', () => {
    const data = document({
      'http://schema.org/downloadUrl': 'https://example.com/file.zip',
    });
    delete data.meta;
    expect(hasResourcePreview(data)).toBe(false);
  });
});
