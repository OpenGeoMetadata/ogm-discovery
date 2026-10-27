import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { resolveThemeAssetUrl } from '../utils/themeUrls';

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book';
}

export function Seo({
  title,
  description,
  image = '/thumbnail_placeholder.png', // We should check if we have a better default
  url,
  type = 'website',
}: SeoProps) {
  const location = useLocation();
  const { theme } = useTheme();
  const { t, text } = useI18n();
  const isClient = typeof window !== 'undefined';
  const siteTitle =
    text(theme.site?.title) ||
    theme.site?.short_name ||
    t('seo.defaultSiteTitle');
  const siteDescription =
    description || text(theme.site?.description) || t('seo.defaultDescription');
  const fullTitle = title === siteTitle ? siteTitle : `${title} - ${siteTitle}`;

  // Get URL: use provided url (from loader), or fall back to constructing from location
  const currentUrl =
    url ||
    (isClient
      ? window.location.href
      : theme.site?.canonical_url
        ? `${theme.site.canonical_url}${location.pathname}${location.search}`
        : `${location.pathname}${location.search}`);

  // Ensure image is absolute URL
  const origin =
    (isClient ? window.location.origin : '') || theme.site?.canonical_url || '';
  const resolvedImage = resolveThemeAssetUrl(image) || image;
  const absoluteImage = resolvedImage?.startsWith('http')
    ? resolvedImage
    : `${origin}${resolvedImage?.startsWith('/') ? '' : '/'}${resolvedImage}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={siteDescription} />
      {theme.site?.canonical_url ? (
        <link rel="canonical" href={currentUrl} />
      ) : null}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content={theme.site?.locale || 'en'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
}
