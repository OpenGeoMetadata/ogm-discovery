import { useEffect, useRef, useState } from 'react';

/** Load near the viewport; retry only queued renders, never missing records. */
export function useStaticMapImage(url: string, native = true) {
  const element = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!native) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let objectUrl: string | undefined;
    let started = false;
    let attempts = 0;
    setSrc(undefined);
    setFailed(false);
    const load = async () => {
      attempts++;
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 503 || response.status === 429) {
          if (attempts >= 20) throw new Error('Render unavailable');
          const seconds = Number(response.headers.get('Retry-After')) || 2;
          timer = setTimeout(
            load,
            Math.min(10000, Math.max(1000, seconds * 1000))
          );
          return;
        }
        if (!response.ok) throw new Error('Image unavailable');
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    };
    const start = () => {
      if (started) return;
      started = true;
      void load();
    };
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined' && element.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            start();
          }
        },
        { rootMargin: '400px' }
      );
      observer.observe(element.current);
    } else start();
    return () => {
      controller.abort();
      observer?.disconnect();
      clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, native]);
  return { element, src: native ? src : url, failed };
}
