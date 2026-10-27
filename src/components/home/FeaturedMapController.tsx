import { useEffect, useRef } from 'react';
import { useMap } from '../../context/MapLibreContext';
import type { GeoDocumentDetails } from '../../types/api';
import { parseBboxToLeafletBounds } from '../../utils/bbox';
import { toLngLat, toMapBounds } from '../../utils/mapGeometry';
import { HOME_PAGE_MAP_CENTER, DEFAULT_US_ZOOM } from '../../config/mapView';
import type { FeaturedMapCameraConfig } from '../../config/featured';
import { hasAllmapsViewer } from '../../utils/ogmViewerRecord';
interface Props {
  activeIndex: number;
  featuredDetails: (GeoDocumentDetails | null)[];
  featuredCamera?: FeaturedMapCameraConfig;
  featuredInitiated: boolean;
  programmaticFlyRef: React.MutableRefObject<boolean>;
  initialHomeViewRef?: React.MutableRefObject<{
    center: [number, number];
    zoom: number;
  } | null>;
}
export function FeaturedMapController({
  activeIndex,
  featuredDetails,
  featuredCamera: camera,
  featuredInitiated,
  programmaticFlyRef,
  initialHomeViewRef,
}: Props) {
  const map = useMap();
  const wasInitiated = useRef(false);
  useEffect(() => {
    if (!featuredInitiated && !wasInitiated.current) return;
    wasInitiated.current = featuredInitiated;
    const home = initialHomeViewRef?.current ?? {
      center: toLngLat(HOME_PAGE_MAP_CENTER),
      zoom: DEFAULT_US_ZOOM - 1,
    };
    const done = () => {
      programmaticFlyRef.current = false;
    };
    map.once('moveend', done);
    programmaticFlyRef.current = true;
    const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches
      ? 0
      : (camera?.duration ?? 1.5) * 1000;
    if (!featuredInitiated) {
      map.flyTo({ ...home, duration: Math.min(duration, 600) });
      return () => {
        map.off('moveend', done);
      };
    }
    const detail = featuredDetails[activeIndex];
    const parsed = parseBboxToLeafletBounds(detail?.attributes.ogm.dcat_bbox);
    const padding =
      camera?.padding ?? (hasAllmapsViewer(detail) ? [20, 20] : [60, 60]);
    const maxZoom =
      (camera?.maxZoom ?? (hasAllmapsViewer(detail) ? 12 : 10)) - 1;
    const minZoom = (camera?.minZoom ?? 0) - 1;
    const pad = {
      top: camera?.paddingTopLeft?.[1] ?? padding[1],
      left: camera?.paddingTopLeft?.[0] ?? padding[0],
      bottom: camera?.paddingBottomRight?.[1] ?? padding[1],
      right: camera?.paddingBottomRight?.[0] ?? padding[0],
    };
    const fit = parsed
      ? map.cameraForBounds(toMapBounds(parsed), { padding: pad, maxZoom })
      : null;
    if (
      camera?.mode === 'flyTo' ||
      camera?.center ||
      camera?.zoom !== undefined
    ) {
      map.flyTo({
        center: camera?.center
          ? toLngLat(camera.center)
          : (fit?.center ?? home.center),
        zoom: Math.min(
          maxZoom,
          Math.max(
            minZoom,
            camera?.zoom !== undefined
              ? camera.zoom - 1
              : (fit?.zoom ?? home.zoom)
          )
        ),
        duration,
        offset: [0, -(camera?.verticalOffsetPx ?? 0)],
      });
    } else if (parsed)
      map.fitBounds(toMapBounds(parsed), { padding: pad, maxZoom, duration });
    else map.flyTo({ ...home, duration });
    return () => {
      map.off('moveend', done);
    };
  }, [
    map,
    activeIndex,
    featuredDetails,
    camera,
    featuredInitiated,
    programmaticFlyRef,
    initialHomeViewRef,
  ]);
  return null;
}
