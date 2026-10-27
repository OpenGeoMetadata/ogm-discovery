import { previewMapLease } from '../../utils/previewMapLease';
import { mapLifecycleEvents } from '../../utils/mapEvents';
import { useEffect, useState } from 'react';
import type { MapPreviewer } from 'ogm-viewer/lib';
import { useMap } from '../../context/MapLibreContext';
import type { GeoDocumentDetails } from '../../types/api';
import { toOgmViewerRecord } from '../../utils/ogmViewerRecord';
import { useI18n } from '../../hooks/useI18n';
export function FeaturedItemPreviewLayer({
  activeIndex,
  featuredDetails,
  featuredInitiated,
}: {
  activeIndex: number;
  featuredDetails: (GeoDocumentDetails | null)[];
  featuredInitiated: boolean;
}) {
  const map = useMap();
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const detail = featuredDetails[activeIndex];
    if (!featuredInitiated || !detail) {
      setFailed(false);
      return;
    }
    let disposed = false;
    let generation = 0;
    let active: MapPreviewer | null = null;
    let lease: ReturnType<typeof previewMapLease> | null = null;
    let started = false;
    const reset = () => {
      generation++;
      started = false;
      lease?.dispose();
      lease = null;
      void active?.clearPreview().catch(() => {});
      active = null;
    };
    setFailed(false);
    const draw = async () => {
      if (disposed || started || !map.isStyleLoaded()) return;
      started = true;
      const current = ++generation;
      setFailed(false);
      try {
        const {
          OgmRecord,
          resourcesFor,
          previewersForResources,
          MapLibreTheme,
        } = await import('ogm-viewer/lib');
        const previewers = await previewersForResources(
          resourcesFor(new OgmRecord(toOgmViewerRecord(detail)))
        );
        if (disposed || current !== generation) return;
        const previewer = previewers.find(
          (p): p is MapPreviewer =>
            p.renderer === 'map' && p.kind !== 'location'
        );
        if (!previewer) {
          setFailed(true);
          return;
        }
        const style = new MapLibreTheme(map.getContainer(), 'light').getStyle();
        style.opacity = 0.75;
        active = previewer;
        previewer.onError = () => {
          if (!disposed && current === generation) setFailed(true);
        };
        lease = previewMapLease(map);
        previewer.attach(lease.map, style);
        await previewer.preview();
        if (disposed || current !== generation) return;
        // Keep imagery above hexes and the footprint, independent of style listener order.
        for (const id of previewer.layerIds)
          if (map.getLayer(id)) map.moveLayer(id);
      } catch {
        if (!disposed && current === generation) setFailed(true);
      }
    };
    void draw();
    mapLifecycleEvents(map).on('discovery:stylechanging', reset);
    map.on('style.load', draw);
    map.on('idle', draw);
    return () => {
      disposed = true;
      mapLifecycleEvents(map).off('discovery:stylechanging', reset);
      map.off('style.load', draw);
      map.off('idle', draw);
      reset();
    };
  }, [map, activeIndex, featuredDetails, featuredInitiated]);
  return failed ? (
    <p className="discovery-map-status" role="status">
      {t('map.overlayError')}
    </p>
  ) : null;
}
