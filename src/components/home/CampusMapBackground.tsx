import { useState } from 'react';
import { useStaticMapImage } from '../../hooks/useStaticMapImage';

/** Warm nearby campus images without cache-busting successful responses. */
export function CampusMapBackground({ url }: { url: string }) {
  const { element, src } = useStaticMapImage(url);
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      ref={element}
      src={src}
      alt=""
      aria-hidden="true"
      decoding="async"
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(false)}
    />
  );
}
