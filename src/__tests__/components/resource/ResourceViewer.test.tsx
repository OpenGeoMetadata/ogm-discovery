import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GeoDocument } from '../../../types/api';

const { loadRecord, makeRecord } = vi.hoisted(() => ({
  loadRecord: vi.fn().mockResolvedValue(undefined),
  makeRecord: vi.fn(function (json) {
    return { json };
  }),
}));
vi.mock('ogm-viewer', () => {
  if (!customElements.get('ogm-viewer')) {
    customElements.define(
      'ogm-viewer',
      class extends HTMLElement {
        loadRecord = loadRecord;
      }
    );
  }
  return {};
});
vi.mock('ogm-viewer/lib', () => ({ OgmRecord: makeRecord }));
import 'ogm-viewer';
import { ResourceViewer } from '../../../components/resource/ResourceViewer';

function resource(id: string, protocol = 'wms'): GeoDocument {
  return {
    id,
    type: 'resource',
    attributes: { ogm: { id, dct_title_s: id, gbl_wxsIdentifier_s: id } },
    meta: {
      ui: { viewer: { protocol, endpoint: `https://example.com/${id}` } },
    },
  };
}

describe('ResourceViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadRecord.mockResolvedValue(undefined);
  });
  it.each([
    'wms',
    'cog',
    'pmtiles',
    'iiif_image',
    'iiif_manifest',
    'arcgis_feature_layer',
    'open_index_map',
  ])('loads %s without requiring geometry', async (protocol) => {
    const { container } = render(
      <ResourceViewer data={resource('first', protocol)} pageValue="SHOW" />
    );
    await waitFor(() => expect(loadRecord).toHaveBeenCalledOnce());
    expect(makeRecord.mock.calls[0][0]).toMatchObject({
      id: 'first',
      gbl_mdVersion_s: 'Aardvark',
    });
    expect(container.querySelector('ogm-viewer')).toHaveAttribute(
      'aria-label',
      'Resource preview'
    );
    expect(container.querySelector('[data-controller]')).toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('replaces the component on record navigation', async () => {
    const { container, rerender } = render(
      <ResourceViewer data={resource('first')} pageValue="SHOW" />
    );
    await waitFor(() => expect(loadRecord).toHaveBeenCalledOnce());
    const first = container.querySelector('ogm-viewer');
    rerender(<ResourceViewer data={resource('second')} pageValue="SHOW" />);
    await waitFor(() => expect(loadRecord).toHaveBeenCalledTimes(2));
    expect(container.querySelector('ogm-viewer')).not.toBe(first);
    expect(makeRecord.mock.calls[1][0]).toMatchObject({
      id: 'second',
      gbl_wxsIdentifier_s: 'second',
    });
  });
  it('reports viewer bootstrap failures', async () => {
    loadRecord.mockRejectedValueOnce(new Error('Unavailable'));
    render(<ResourceViewer data={resource('failed')} pageValue="SHOW" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load the resource preview.'
    );
  });
  it('isolates oEmbed HTML from the app', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          html: '<p>Embedded content</p>',
        })
      )
    );
    const { container } = render(
      <ResourceViewer data={resource('embed', 'oembed')} pageValue="SHOW" />
    );
    await waitFor(() =>
      expect(container.querySelector('iframe')).not.toBeNull()
    );
    expect(container.querySelector('iframe')).toHaveAttribute(
      'sandbox',
      'allow-scripts allow-popups allow-popups-to-escape-sandbox'
    );
    expect(container.querySelector('ogm-viewer')).toBeNull();
    fetchSpy.mockRestore();
  });
});
