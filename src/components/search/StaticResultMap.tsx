import { useEffect, useState } from 'react';
import { useStaticMapImage } from '../../hooks/useStaticMapImage';
import { useI18n } from '../../hooks/useI18n';
import type { GeoDocument } from '../../types/api';
import { getResultStaticMapUrl } from '../../utils/resourceAssets';

interface StaticResultMapProps {
  result: GeoDocument;
}

export function StaticResultMap({ result }: StaticResultMapProps) {
  return (
    <StaticResultMapImage
      key={getResultStaticMapUrl(result)}
      imageUrl={getResultStaticMapUrl(result)}
    />
  );
}

function StaticResultMapImage({ imageUrl }: { imageUrl: string }) {
  const { t } = useI18n();
  const {
    element: imgRef,
    src,
    failed,
  } = useStaticMapImage(imageUrl, imageUrl.includes('/geometry/native'));
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Handle cases where the image is already in the browser cache and the `load`
  // event can fire before React attaches the handler.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setIsLoading(false);
    }
  }, [src, imgRef]);

  // If image failed to load, show placeholder
  if (imageError || failed) {
    return (
      <div className="h-48 w-48 flex items-center justify-center bg-gray-50 rounded-r-lg">
        <span className="text-xs text-gray-400">{t('map.dataError')}</span>
      </div>
    );
  }

  return (
    <div className="h-48 w-48 rounded-r-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        {...({ fetchpriority: 'low' } as const)}
        className={`h-full w-full object-contain bg-gray-50 transition-opacity duration-150 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setImageError(true);
        }}
      />
    </div>
  );
}
