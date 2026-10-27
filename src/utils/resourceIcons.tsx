import React from 'react';

import {
  DatasetsIcon,
  MapsIcon,
  WebServicesIcon,
  CollectionsIcon,
  ImageryIcon,
  WebsitesIcon,
  OtherIcon,
} from '../components/resource/ResourceClassIcons';

const DEFAULT_ICON_CLASS = 'w-24 h-24';

function normalizeResourceClass(resourceClass: string | undefined): string {
  const rc = (resourceClass || '').toLowerCase().trim();
  if (rc.includes('map')) return 'maps';
  if (
    rc.includes('dataset') ||
    rc.includes('point') ||
    rc.includes('polygon') ||
    rc.includes('raster') ||
    rc.includes('vector')
  ) {
    return 'datasets';
  }
  if (rc.includes('web service')) return 'web services';
  if (rc.includes('collection')) return 'collections';
  if (rc.includes('imager') || rc.includes('aerial')) return 'imagery';
  if (rc.includes('website')) return 'websites';
  if (
    rc === 'datasets' ||
    rc === 'maps' ||
    rc === 'web services' ||
    rc === 'collections' ||
    rc === 'imagery' ||
    rc === 'websites' ||
    rc === 'other'
  ) {
    return rc;
  }
  return 'other';
}

export function getResourceIcon(
  resourceClass: string | undefined,
  options?: { className?: string }
): React.ReactNode {
  const cn = options?.className ?? DEFAULT_ICON_CLASS;
  switch (normalizeResourceClass(resourceClass)) {
    case 'datasets':
      return <DatasetsIcon className={cn} />;
    case 'maps':
      return <MapsIcon className={cn} />;
    case 'web services':
      return <WebServicesIcon className={cn} />;
    case 'collections':
      return <CollectionsIcon className={cn} />;
    case 'imagery':
      return <ImageryIcon className={cn} />;
    case 'websites':
      return <WebsitesIcon className={cn} />;
    default:
      return <OtherIcon className={cn} />;
  }
}
