import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';
import { getGeneratedThumbnailUrl } from '../../utils/resourceAssets';

/** Adapted from the BTAA Geoportal: resolve cold thumbnails and retry queued captures. */
export function ThumbnailImage({
  resourceId,
  src,
  fallback,
  imageRef,
  onUnavailable,
  onError,
  ...props
}: ComponentProps<'img'> & {
  resourceId: string;
  fallback: ReactNode;
  imageRef?: Ref<HTMLImageElement>;
  onUnavailable?: () => void;
}) {
  const unavailableCallback = useRef(onUnavailable);
  unavailableCallback.current = onUnavailable;
  const [recoverSource, setRecoverSource] = useState<string>();
  const [resolved, setResolved] = useState<{ source: string; url?: string }>();
  let source: URL | undefined;
  try {
    if (src) source = new URL(src, 'https://api.invalid');
  } catch {
    // Invalid URLs use the local icon.
  }
  const resolver =
    /\/(resources\/[^/]+\/thumbnail|static-maps\/[^/]+\/resource-class-icon)$/.test(
      source?.pathname ?? ''
    );
  const requestUrl = resolver
    ? src
    : src && recoverSource === src
      ? getGeneratedThumbnailUrl(resourceId, 'list')
      : undefined;

  useEffect(() => {
    if (!requestUrl) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let objectUrl: string | undefined;
    let attempts = 0;
    const load = async () => {
      attempts++;
      const attemptController = new AbortController();
      const abort = () => attemptController.abort();
      controller.signal.addEventListener('abort', abort, { once: true });
      const timeout = setTimeout(abort, 10000);
      try {
        const response = await fetch(requestUrl, {
          signal: attemptController.signal,
          cache: 'no-store',
        });
        const contentType = response.headers.get('Content-Type')?.toLowerCase();
        if (!response.ok || !contentType?.startsWith('image/'))
          throw new Error('Thumbnail unavailable');
        const blob = await response.blob();
        // Cross-origin APIs may not expose X-Placeholder. Inspect SVG text too:
        // a successful image response can contain the unavailable message itself.
        const unavailable =
          contentType.startsWith('image/svg+xml') &&
          /thumbnail\s+unavailable/i.test(await blob.text());
        if (controller.signal.aborted) return;
        if (unavailable || response.headers.get('X-Placeholder') === 'true') {
          setResolved({ source: requestUrl });
        } else {
          const previous = objectUrl;
          objectUrl = URL.createObjectURL(blob);
          setResolved({ source: requestUrl, url: objectUrl });
          if (previous) URL.revokeObjectURL(previous);
        }
        if (
          unavailable ||
          response.headers.get('X-Thumbnail-Pending') !== 'true'
        ) {
          if (unavailable || response.headers.get('X-Placeholder') === 'true')
            unavailableCallback.current?.();
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
        setResolved({ source: requestUrl });
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener('abort', abort);
      }
      if (attempts < 12)
        timer = setTimeout(load, Math.min(2000 * 2 ** (attempts - 1), 10000));
      else unavailableCallback.current?.();
    };
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requestUrl]);

  const displayUrl = requestUrl
    ? resolved?.source === requestUrl
      ? resolved.url
      : undefined
    : source
      ? src
      : undefined;
  if (!displayUrl) return <>{fallback}</>;
  return (
    <img
      {...props}
      ref={imageRef}
      src={displayUrl}
      onError={(event) => {
        if (!requestUrl) setRecoverSource(src);
        else {
          setResolved({ source: requestUrl });
          onError?.(event);
        }
      }}
    />
  );
}
