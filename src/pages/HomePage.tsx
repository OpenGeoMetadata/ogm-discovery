import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  lazy,
  type ReactNode,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { useApi } from '../context/ApiContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Seo } from '../components/Seo';
import { CampusMapBackground } from '../components/home/CampusMapBackground';
import { GinBlogSection } from '../components/home/GinBlogSection';
import { HomepageFeaturedCollection } from '../components/home/HomepageFeaturedCollection';
import { FacetMoreModal } from '../components/search/FacetMoreModal';
import { LightboxModal } from '../components/ui/LightboxModal';

const HomePageHexMapBackground = lazy(() =>
  import('../components/home/HomePageHexMapBackground.client').then((m) => ({
    default: m.HomePageHexMapBackground,
  }))
);
import { ArrowRight, X } from 'lucide-react';
import { fetchFacetValues, fetchHomeBlogPosts } from '../services/api';
import { formatCount } from '../utils/formatNumber';
import {
  BTAA_PARTNER_INSTITUTIONS,
  getPartnerInstitutionSearchHref,
  getPartnerInstitutionStaticMapUrl,
} from '../constants/partnerInstitutions';
import { resolveThemeAssetUrl } from '../utils/themeUrls';
import { getActiveThemeId } from '../config/institution';
import type { HomeBlogPost } from '../types/api';
import { normalizeFacetId } from '../utils/facetLabels';
import { normalizeFacetValueForUrl } from '../utils/searchParams';
import { primaryCtaClass, secondaryCtaClass } from '../styles/cta';

type FacetItem = { value: string; label: string; count: number };
const FEATURED_MEDIA_MODAL_ID = 'featured-media-modal';
const FEATURED_MEDIA_MODAL_TITLE_ID = 'featured-media-modal-title';

function useSectionActivation<T extends HTMLElement>(rootMargin = '320px') {
  const ref = useRef<T | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active || typeof window === 'undefined') return;

    if (typeof window.IntersectionObserver !== 'function') {
      setActive(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [active, rootMargin]);

  return { active, ref };
}

function useIdleActivation(timeout = 1200) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active || typeof window === 'undefined') return;

    let cancelled = false;
    let idleCallbackId: number | null = null;

    const activate = () => {
      if (!cancelled) setActive(true);
    };

    if (
      'requestIdleCallback' in window &&
      typeof window.requestIdleCallback === 'function'
    ) {
      idleCallbackId = window.requestIdleCallback(activate, { timeout });
    } else {
      activate();
    }

    return () => {
      cancelled = true;
      if (
        idleCallbackId !== null &&
        'cancelIdleCallback' in window &&
        typeof window.cancelIdleCallback === 'function'
      ) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [active, timeout]);

  return active;
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { t, text } = useI18n();
  const { setLastApiUrl } = useApi();
  const announcement = theme.homepage?.announcement;
  const showAnnouncement =
    !!announcement?.enabled &&
    !!announcement.text &&
    !!announcement.link_label &&
    !!announcement.link_url;
  const partnerInstitutions = (theme.homepage?.partner_institutions ||
    BTAA_PARTNER_INSTITUTIONS) as Array<{
    slug: string;
    name: string;
    iconSlug?: string;
    iconSrc?: string;
    monochrome?: boolean;
    logoClassName?: string;
    campusMap?: { latitude: number; longitude: number; zoom: number };
    searchHref?: string;
    media?: {
      enabled?: boolean;
      embed_url: string;
      title?: string | Record<string, string>;
      subtitle?: string | Record<string, string>;
      button_aria_label?: string | Record<string, string>;
    };
  }>;
  const homepageMedia = theme.homepage?.media;
  const heroActions = theme.homepage?.hero_actions || [];
  const showHomepageMedia = homepageMedia?.enabled === true;
  const [resourceTypeList, setResourceTypeList] = useState<FacetItem[]>([]);
  const [placeList, setPlaceList] = useState<FacetItem[]>([]);
  const [themeList, setThemeList] = useState<FacetItem[]>([]);
  const [publisherList, setPublisherList] = useState<FacetItem[]>([]);
  const [resourceTypeFacetId, setResourceTypeFacetId] = useState(
    'gbl_resourceType_sm'
  );
  const [placeFacetId, setPlaceFacetId] = useState('dct_spatial_sm');
  const [themeFacetId, setThemeFacetId] = useState('dcat_theme_sm');
  const [publisherFacetId, setPublisherFacetId] = useState('dct_publisher_sm');
  const [activeFacetModal, setActiveFacetModal] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<HomeBlogPost[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showHeroDescription, setShowHeroDescription] = useState(true);
  const [isFeaturedMediaOpen, setIsFeaturedMediaOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  const blogCfg = theme.homepage?.blog;
  const blogEnabled = blogCfg?.enabled === true;
  const blogLimit = blogCfg?.limit || 3;
  const browseSection = useSectionActivation<HTMLDivElement>('960px');
  const browseFacetPrefetch = useIdleActivation();
  const blogSection = useSectionActivation<HTMLDivElement>('480px');
  const shouldLoadBrowseFacets = browseSection.active || browseFacetPrefetch;

  function facetValuesToItems(
    data: Array<{
      attributes?: { value?: unknown; label?: unknown; hits?: number };
    }>
  ): FacetItem[] {
    const items: FacetItem[] = [];
    if (!Array.isArray(data)) return items;
    data.forEach((item) => {
      const value = item?.attributes?.value;
      const hits = item?.attributes?.hits;
      const label = item?.attributes?.label ?? value;
      if (value !== undefined) {
        items.push({
          value: String(value),
          label: String(label ?? value),
          count: Number(hits) || 0,
        });
      }
    });
    return items;
  }

  function topItems(items: FacetItem[], limit: number): FacetItem[] {
    const cleanedItems = items.filter(
      (item) => item.value.trim().length > 0 && item.label.trim().length > 0
    );
    cleanedItems.sort((a, b) => b.count - a.count);
    return cleanedItems.slice(0, limit);
  }

  useEffect(() => {
    if (!shouldLoadBrowseFacets) return;

    const fetchFacets = async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('q', '');
      const facetIds = [
        'gbl_resourceType_sm',
        'dct_spatial_sm',
        'dcat_theme_sm',
        'dct_publisher_sm',
      ] as const;
      try {
        const [resourceTypeRes, placeRes, themeRes, publisherRes] =
          await Promise.all(
            facetIds.map((facetName) =>
              fetchFacetValues({
                facetName,
                searchParams,
                page: 1,
                perPage: 5,
                sort: 'count_desc',
                onApiCall: setLastApiUrl,
              })
            )
          );

        const resourceTypeItems = facetValuesToItems(
          resourceTypeRes.data ?? []
        );
        const placeItems = facetValuesToItems(placeRes.data ?? []);
        const themeItems = facetValuesToItems(themeRes.data ?? []);
        const publisherItems = facetValuesToItems(publisherRes.data ?? []);

        setResourceTypeFacetId('gbl_resourceType_sm');
        setPlaceFacetId('dct_spatial_sm');
        setThemeFacetId('dcat_theme_sm');
        setPublisherFacetId('dct_publisher_sm');

        setResourceTypeList(topItems(resourceTypeItems, 5));
        setPlaceList(topItems(placeItems, 5));
        setThemeList(topItems(themeItems, 5));
        setPublisherList(topItems(publisherItems, 5));
      } catch (error) {
        console.error('Error fetching facets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFacets();
  }, [setLastApiUrl, shouldLoadBrowseFacets]);

  useEffect(() => {
    const handleHeroDescriptionVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ visible?: boolean }>;
      if (typeof customEvent.detail?.visible === 'boolean') {
        setShowHeroDescription(customEvent.detail.visible);
      }
    };
    window.addEventListener(
      'ogm-viewer:hero-description-visibility',
      handleHeroDescriptionVisibility as EventListener
    );
    return () => {
      window.removeEventListener(
        'ogm-viewer:hero-description-visibility',
        handleHeroDescriptionVisibility as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (!blogEnabled) {
      setBlogLoading(false);
      setBlogError(null);
      setBlogPosts([]);
      return;
    }
    if (!blogSection.active) return;

    const fetchBlogPosts = async () => {
      setBlogLoading(true);
      setBlogError(null);
      try {
        const response = await fetchHomeBlogPosts({
          limit: blogLimit,
          theme: getActiveThemeId(),
          onApiCall: setLastApiUrl,
        });
        setBlogPosts(response.data || []);
      } catch (error) {
        console.error('Error fetching homepage blog posts:', error);
        setBlogPosts([]);
        setBlogError('Unable to load GIN stories right now.');
      } finally {
        setBlogLoading(false);
      }
    };

    void fetchBlogPosts();
  }, [blogEnabled, blogLimit, blogSection.active, setLastApiUrl]);

  const handleResourceTypeClick = (value: string) => {
    navigate(
      `/search?q=&include_filters[gbl_resourceType_sm][]=${encodeURIComponent(value)}`
    );
  };

  const handlePlaceClick = (value: string) => {
    navigate(
      `/search?q=&include_filters[dct_spatial_sm][]=${encodeURIComponent(value)}`
    );
  };

  const handleThemeClick = (value: string) => {
    navigate(
      `/search?q=&include_filters[dcat_theme_sm][]=${encodeURIComponent(value)}`
    );
  };

  const handlePublisherClick = (value: string) => {
    navigate(
      `/search?q=&include_filters[dct_publisher_sm][]=${encodeURIComponent(value)}`
    );
  };

  const handleBrowseAll = () => {
    navigate('/search?q=');
  };

  const handleFacetModalToggle = (
    field: string,
    value: string | number,
    type: 'include' | 'exclude'
  ) => {
    const normalizedField = normalizeFacetId(field);
    const normalizedValue = normalizeFacetValueForUrl(
      normalizedField,
      String(value)
    );
    const params = new URLSearchParams();
    params.set('q', '');
    params.append(
      `${type === 'include' ? 'include' : 'exclude'}_filters[${normalizedField}][]`,
      normalizedValue
    );
    navigate(`/search?${params.toString()}`);
  };

  const homepageSearchParams = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    if (!params.has('q')) params.set('q', '');
    return params;
  }, [searchParams]);

  const renderFacetColumn = (
    title: string,
    facetId: string,
    items: FacetItem[],
    onClick: (value: string) => void,
    iconRenderer?: (value: string) => ReactNode
  ) => {
    return (
      <div>
        <h3 className="theme-ui mb-3 text-sm font-semibold uppercase tracking-[0.14em] theme-text-muted">
          {title}
        </h3>
        <div className="space-y-2">
          {isLoading && items.length === 0
            ? Array.from({ length: 5 }, (_, index) => (
                <div
                  key={`${title.toLowerCase()}-skeleton-${index}`}
                  className="theme-page-surface-muted h-[46px] animate-pulse border"
                />
              ))
            : items.map((item) => {
                const formattedCount = !isLoading
                  ? formatCount(item.count)
                  : '';
                const rowAriaLabel = !isLoading
                  ? `${title} ${item.label}, ${formattedCount} resources`
                  : `${title} ${item.label}`;

                return (
                  <button
                    key={`${title.toLowerCase()}-${item.value}`}
                    onClick={() => onClick(item.value)}
                    className="theme-facet-button group flex w-full items-center gap-2 border border-l-[3px] border-l-brand px-3 py-2 text-left transition-colors"
                    aria-label={rowAriaLabel}
                  >
                    <div className="flex w-full items-center gap-2">
                      {iconRenderer && (
                        <div className="shrink-0 theme-text-muted">
                          {iconRenderer(item.value)}
                        </div>
                      )}
                      <span className="truncate theme-text-strong">
                        {item.label}
                      </span>
                      <span className="ml-auto shrink-0 px-1.5 py-0.5 text-sm font-semibold tabular-nums theme-text-strong">
                        {formattedCount}
                      </span>
                    </div>
                  </button>
                );
              })}
        </div>
        <button
          type="button"
          onClick={() => setActiveFacetModal({ id: facetId, label: title })}
          className={`${secondaryCtaClass} mt-3 px-3 py-1.5`}
        >
          {t('common.viewMore')}
        </button>
      </div>
    );
  };

  return (
    <div className="theme-shell flex min-h-screen flex-col">
      <Seo title={text(theme.site?.title) || theme.institution.name} />
      {showAnnouncement && (
        <div className="theme-page-surface border-b px-4 py-2 text-sm theme-text-strong sm:px-6 lg:px-8">
          <p className="text-center">
            {text(announcement.text)}{' '}
            <a
              href={announcement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-active underline underline-offset-2 hover:no-underline"
            >
              {text(announcement.link_label)}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </a>
          </p>
        </div>
      )}
      <Header />

      <main className="theme-shell flex flex-1 flex-col">
        <h1 className="sr-only">{theme.institution.name}</h1>
        <div className="theme-border relative h-[calc(82vh-4rem)] min-h-[28rem] flex-shrink-0 overflow-hidden border-b">
          {mounted && (
            <Suspense fallback={null}>
              <HomePageHexMapBackground />
            </Suspense>
          )}
          {theme.homepage?.hero_background_image_url ? (
            <div
              aria-hidden="true"
              className="theme-photo-overlay pointer-events-none absolute inset-0 z-20 opacity-35"
            />
          ) : null}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_38%),linear-gradient(180deg,rgba(4,30,66,0.18),rgba(4,30,66,0.28))]"
          />
          {showHeroDescription && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center px-4 pt-24 sm:px-6 lg:items-center lg:justify-start lg:px-8">
              <div className="theme-hero-panel relative w-full max-w-4xl overflow-hidden rounded-[1.15rem] p-6 pointer-events-auto lg:ml-6 lg:p-8">
                <div className="theme-hero-accent absolute inset-y-0 left-0 z-20 w-2.5" />
                <div className="pointer-events-none absolute inset-y-0 left-2.5 right-0 z-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.1)_48%,rgba(255,255,255,0)_100%)]" />
                <button
                  type="button"
                  onClick={() => setShowHeroDescription(false)}
                  className="theme-page-surface absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center border text-slate-500 transition-colors hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-active"
                  aria-label={t('common.hide')}
                  title={t('common.hide')}
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="theme-ui theme-kicker relative z-10 text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
                  {theme.site?.short_name || theme.institution.name}
                </p>
                <p className="theme-text-strong relative z-10 mt-3 max-w-3xl text-[2.15rem] font-semibold leading-[0.98] sm:text-[2.75rem] lg:text-[3.45rem]">
                  {text(theme.institution.hero_text) ||
                    'Search geospatial resources from this collection.'}
                </p>
                <p className="theme-text-muted relative z-10 mt-4 max-w-2xl text-base leading-7">
                  {text(theme.institution.hero_description) ||
                    'Browse and download GIS data, maps, and other geospatial resources.'}
                </p>
                {heroActions.length > 0 ? (
                  <div className="relative z-10 mt-6 flex flex-wrap gap-3">
                    {heroActions.map((link, index) =>
                      link.external ? (
                        <a
                          key={`${link.href}-${text(link.label)}`}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`theme-ui ${
                            index === 0 ? primaryCtaClass : secondaryCtaClass
                          } uppercase tracking-[0.14em]`}
                        >
                          {text(link.label)}
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </a>
                      ) : (
                        <Link
                          key={`${link.href}-${text(link.label)}`}
                          to={link.href}
                          className={`theme-ui ${
                            index === 0 ? primaryCtaClass : secondaryCtaClass
                          } uppercase tracking-[0.14em]`}
                        >
                          {text(link.label)}
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      )
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
        <HomepageFeaturedCollection />
        <div
          ref={browseSection.ref}
          className="theme-page-surface theme-border w-full flex-shrink-0 border-y px-4 py-10 sm:px-6 lg:px-8"
        >
          <div>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="theme-ui theme-kicker mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
                  {theme.institution.name}
                </p>
                <h2 className="theme-text-strong text-2xl font-semibold sm:text-3xl">
                  {t('common.browseAllResources')}
                </h2>
              </div>
              <button
                onClick={handleBrowseAll}
                className={`${primaryCtaClass} theme-ui uppercase tracking-[0.14em]`}
              >
                {t('common.viewAllResources')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {renderFacetColumn(
                t('common.resourceType'),
                resourceTypeFacetId,
                resourceTypeList,
                handleResourceTypeClick
              )}
              {renderFacetColumn(
                t('common.place'),
                placeFacetId,
                placeList,
                handlePlaceClick
              )}
              {renderFacetColumn(
                t('common.topic'),
                themeFacetId,
                themeList,
                handleThemeClick
              )}
              {renderFacetColumn(
                t('common.publisher'),
                publisherFacetId,
                publisherList,
                handlePublisherClick
              )}
            </div>
          </div>
        </div>
        {partnerInstitutions.length > 0 && (
          <section className="theme-page-surface theme-border w-full border-t px-4 py-10 sm:px-6 lg:px-8">
            <div className="w-full">
              <p className="theme-ui theme-kicker mb-2 text-center text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
                {theme.site?.short_name || theme.institution.name}
              </p>
              <h2 className="theme-text-strong mb-4 text-center text-2xl font-semibold sm:text-3xl">
                {t('common.partnerInstitutions')}
              </h2>

              <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                {partnerInstitutions.map((institution) => {
                  const searchHref =
                    institution.searchHref ||
                    getPartnerInstitutionSearchHref(institution);
                  const institutionMedia =
                    institution.media ||
                    (institution.slug === 'big-ten-academic-alliance'
                      ? homepageMedia
                      : undefined);
                  const shouldOpenMedia =
                    institutionMedia?.enabled === true &&
                    !!institutionMedia.embed_url;
                  const campusMapUrl =
                    getPartnerInstitutionStaticMapUrl(institution);
                  const tileContent = (
                    <div className="relative flex h-full min-h-[84px] w-full items-center justify-center overflow-hidden bg-brand p-3">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]"
                      />
                      {campusMapUrl && (
                        <CampusMapBackground
                          key={campusMapUrl}
                          url={campusMapUrl}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-center rounded-md bg-brand/70 px-3 py-2 shadow-sm backdrop-blur-[1px] transition-colors group-hover:bg-brand/80">
                        <img
                          src={resolveThemeAssetUrl(
                            institution.iconSrc ||
                              `/icons/${institution.iconSlug}.svg`
                          )}
                          alt={`${institution.name} logo`}
                          title={institution.name}
                          loading="lazy"
                          className={`w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] ${institution.logoClassName || ''} ${
                            institution.iconSrc ? 'h-10' : 'h-8'
                          } ${
                            institution.monochrome === false
                              ? 'opacity-95'
                              : 'brightness-0 invert opacity-90'
                          }`}
                        />
                      </div>
                    </div>
                  );

                  return (
                    <li
                      key={institution.name}
                      title={institution.name}
                      className="group text-center"
                    >
                      {shouldOpenMedia ? (
                        <button
                          type="button"
                          onClick={() => setIsFeaturedMediaOpen(true)}
                          aria-label={
                            text(institutionMedia?.button_aria_label) ||
                            t('home.openMedia')
                          }
                          className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-active focus-visible:ring-offset-2"
                        >
                          {tileContent}
                        </button>
                      ) : searchHref ? (
                        <Link
                          to={searchHref}
                          aria-label={`Search resources near ${institution.name}`}
                          className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-active focus-visible:ring-offset-2"
                        >
                          {tileContent}
                        </Link>
                      ) : (
                        tileContent
                      )}
                    </li>
                  );
                })}
              </ul>
              {partnerInstitutions.some(
                (institution) => institution.campusMap
              ) && (
                <p className="mt-2 text-right text-xs">
                  <a href="https://openfreemap.org/">OpenFreeMap</a>
                  {' · '}© <a href="https://openmaptiles.org/">OpenMapTiles</a>
                  {' · '}©{' '}
                  <a href="https://www.openstreetmap.org/copyright">
                    OpenStreetMap
                  </a>
                </p>
              )}
            </div>
          </section>
        )}
        {blogEnabled && (
          <div ref={blogSection.ref} className="w-full">
            <GinBlogSection
              posts={blogPosts}
              loading={blogLoading}
              error={blogError}
              title={text(blogCfg?.title) || t('common.featuredCollections')}
              subtitle={text(blogCfg?.subtitle)}
              ctaLabel={text(blogCfg?.cta_label) || t('common.viewAllStories')}
              ctaUrl={blogCfg?.cta_url || 'https://gin.btaa.org/blog/'}
            />
          </div>
        )}
      </main>

      {activeFacetModal && (
        <FacetMoreModal
          facetId={activeFacetModal.id}
          facetLabel={activeFacetModal.label}
          isOpen
          onClose={() => setActiveFacetModal(null)}
          searchParams={homepageSearchParams}
          onToggleInclude={(value) =>
            handleFacetModalToggle(activeFacetModal.id, value, 'include')
          }
          onToggleExclude={(value) =>
            handleFacetModalToggle(activeFacetModal.id, value, 'exclude')
          }
          onToggleFacetInclude={(field, value) =>
            handleFacetModalToggle(field, value, 'include')
          }
          onToggleFacetExclude={(field, value) =>
            handleFacetModalToggle(field, value, 'exclude')
          }
          isValueIncluded={() => false}
          isValueExcluded={() => false}
        />
      )}

      {showHomepageMedia && homepageMedia?.embed_url ? (
        <LightboxModal
          isOpen={isFeaturedMediaOpen}
          onClose={() => setIsFeaturedMediaOpen(false)}
          id={FEATURED_MEDIA_MODAL_ID}
          labelledBy={FEATURED_MEDIA_MODAL_TITLE_ID}
          title={text(homepageMedia?.title) || t('home.openMedia')}
          subtitle={text(homepageMedia?.subtitle)}
          contentClassName="max-w-4xl"
          data-testid={
            homepageMedia?.modal_test_id || 'featured-media-modal-overlay'
          }
        >
          <div className="aspect-video w-full bg-black">
            <iframe
              src={homepageMedia.embed_url}
              title={text(homepageMedia?.title) || t('home.openMedia')}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </LightboxModal>
      ) : null}

      <Footer />
    </div>
  );
}
