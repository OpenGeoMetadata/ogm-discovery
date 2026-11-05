import {
  useState,
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { CollectionPathways } from './CollectionPathways';
import { Menu, X } from 'lucide-react';
import { SearchField } from '../SearchField';
import { ResourceClassFilterTabs } from '../search/ResourceClassFilterTabs';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { ThemeLink } from '../../config/institution';
import { resolveThemeAssetUrl } from '../../utils/themeUrls';

function renderThemeLink(
  link: ThemeLink,
  label: string,
  className: string,
  style: CSSProperties | undefined,
  onClick?: () => void
) {
  if (link.external) {
    return (
      <a
        key={link.href}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        onClick={onClick}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      key={link.href}
      to={link.href}
      className={className}
      style={style}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { t, text } = useI18n();
  const banner = theme.site?.banner;
  const showResourceClassTabs = location.pathname !== '/search';
  const bannerText = text(banner?.text);
  const showBanner = banner?.enabled !== false && !!bannerText;
  const headerCfg = theme.institution?.header;
  const utilityLinks = theme.navigation?.utility_links || [];
  const navLinks = theme.navigation?.links || [
    { href: '/bookmarks', label: t('common.bookmarks'), external: false },
  ];
  const ctaLink = theme.navigation?.cta;
  const ctaStyle = theme.navigation?.cta_style || 'button';
  const logoUrl = resolveThemeAssetUrl(theme.institution.logo_url);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navPanelRef = useRef<HTMLDivElement>(null);
  const headerTextStyle = {
    color: 'var(--color-header-text)',
  } as CSSProperties;
  const utilityLinkClass =
    'theme-ui text-[0.72rem] uppercase tracking-[0.14em] transition-opacity hover:opacity-100 opacity-90';
  const desktopCtaClass =
    ctaStyle === 'utility'
      ? utilityLinkClass
      : 'theme-ui inline-flex items-center rounded-sm border border-white/15 bg-white/10 px-3 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-slate-900';
  const mobileCtaClass =
    ctaStyle === 'utility'
      ? 'theme-ui mt-3 rounded-md px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-white/90 hover:bg-white/10 hover:text-white'
      : 'theme-ui mt-3 inline-flex items-center justify-center rounded-sm border border-white/20 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 transition-colors hover:bg-slate-100';
  const bannerClass =
    banner?.tone === 'neon'
      ? 'theme-ui border-b-4 border-[#041e42] bg-[#007ab8] px-4 py-2 text-center text-[0.95rem] font-black text-white shadow-[0_0_18px_rgba(0,122,184,0.78),inset_0_-3px_0_rgba(4,30,66,0.88)] sm:text-base'
      : 'theme-ui theme-page-surface theme-border border-b px-4 py-2 text-center text-sm font-semibold theme-text-strong';

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams();
    newParams.set('q', query);

    const geoType = searchParams.get('include_filters[geo][type]');
    if (geoType === 'bbox') {
      const topLeftLat = searchParams.get(
        'include_filters[geo][top_left][lat]'
      );
      const topLeftLon = searchParams.get(
        'include_filters[geo][top_left][lon]'
      );
      const bottomRightLat = searchParams.get(
        'include_filters[geo][bottom_right][lat]'
      );
      const bottomRightLon = searchParams.get(
        'include_filters[geo][bottom_right][lon]'
      );

      if (topLeftLat && topLeftLon && bottomRightLat && bottomRightLon) {
        newParams.set('include_filters[geo][type]', 'bbox');
        newParams.set('include_filters[geo][field]', 'dcat_bbox');
        newParams.set('include_filters[geo][top_left][lat]', topLeftLat);
        newParams.set('include_filters[geo][top_left][lon]', topLeftLon);
        newParams.set(
          'include_filters[geo][bottom_right][lat]',
          bottomRightLat
        );
        newParams.set(
          'include_filters[geo][bottom_right][lon]',
          bottomRightLon
        );
      }
    }

    const categoryFilters = searchParams.getAll(
      'include_filters[gbl_resourceClass_sm][]'
    );
    const legacyCategoryFilters = searchParams.getAll(
      'fq[gbl_resourceClass_sm][]'
    );

    if (categoryFilters.length > 0) {
      categoryFilters.forEach((value) => {
        newParams.append('include_filters[gbl_resourceClass_sm][]', value);
      });
    } else if (legacyCategoryFilters.length > 0) {
      legacyCategoryFilters.forEach((value) => {
        newParams.append('include_filters[gbl_resourceClass_sm][]', value);
      });
    }

    navigate(`/search?${newParams.toString()}`);
  };

  const handleAdvancedSearchClick = () => {
    const newParams = new URLSearchParams(searchParams);

    if (location.pathname === '/search') {
      const currentShowAdvanced = newParams.get('showAdvanced') === 'true';
      if (currentShowAdvanced) {
        newParams.delete('showAdvanced');
      } else {
        newParams.set('showAdvanced', 'true');
      }
    } else {
      newParams.set('showAdvanced', 'true');
    }

    navigate(`/search?${newParams.toString()}`);
  };

  const handleHomeClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/') return;
    e.preventDefault();
    window.dispatchEvent(new Event('ogm-viewer:home-map-reset'));
  };

  return (
    <header className="sticky top-0 z-50 theme-header shadow-[0_10px_35px_rgba(0,0,0,0.18)]">
      {showBanner && (
        <div role="status" className={bannerClass}>
          <p className="mx-auto max-w-[96rem] break-words">{bannerText}</p>
        </div>
      )}

      {(utilityLinks.length > 0 || ctaLink) && (
        <div className="theme-utility-row border-b border-white/10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[2.75rem] flex-wrap items-center justify-between gap-3 py-2">
              {utilityLinks.length > 0 ? (
                <nav
                  className="hidden md:flex items-center gap-5"
                  aria-label={t('common.utilityNavigation')}
                >
                  {utilityLinks.map((link) =>
                    renderThemeLink(
                      link,
                      text(link.label),
                      utilityLinkClass,
                      undefined
                    )
                  )}
                </nav>
              ) : (
                <div />
              )}

              {ctaLink
                ? renderThemeLink(
                    ctaLink,
                    text(ctaLink.label),
                    desktopCtaClass,
                    undefined
                  )
                : null}
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 pb-4 xl:pb-0">
        <div className="grid min-w-0 grid-cols-12 grid-rows-2 items-center gap-x-4 gap-y-2 pt-3 md:gap-x-8 xl:gap-y-4">
          <div className="col-span-8 row-span-2 flex min-w-0 items-center justify-start xl:col-span-3">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={`flex w-full min-w-0 items-center text-xl font-bold${
                headerCfg?.lockup_gap_rem == null ? ' gap-3' : ''
              }`}
              style={
                headerCfg?.lockup_gap_rem == null
                  ? headerTextStyle
                  : {
                      ...headerTextStyle,
                      gap: `${headerCfg.lockup_gap_rem}rem`,
                    }
              }
            >
              <img
                src={logoUrl}
                alt={
                  text(theme.institution.logo_alt) ||
                  `${theme.institution.name} logo`
                }
                className={
                  headerCfg?.logo_height_rem == null
                    ? 'h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 w-auto object-contain shrink-0'
                    : 'w-auto object-contain shrink-0'
                }
                style={
                  headerCfg?.logo_height_rem == null
                    ? undefined
                    : {
                        height: `clamp(3.5rem, 4vw, ${headerCfg.logo_height_rem}rem)`,
                      }
                }
              />
              {theme.institution.logo_lockup?.right_text ? (
                <>
                  {theme.institution.logo_lockup.separator !== 'none' && (
                    <span
                      aria-hidden="true"
                      className="inline-block w-px shrink-0 bg-black/15"
                      style={{
                        height: `clamp(2rem, 2.5vw, ${
                          headerCfg?.lockup_separator_height_rem ?? 2
                        }rem)`,
                      }}
                    />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col leading-none">
                    <span
                      className={`block min-w-0 max-w-full font-semibold tracking-wide${
                        headerCfg?.lockup_text_size_rem == null
                          ? ' text-sm sm:text-base md:text-lg lg:text-xl'
                          : ''
                      }`}
                      style={{
                        fontFamily:
                          theme.institution.logo_lockup.right_text_style
                            ?.font_family,
                        fontWeight:
                          theme.institution.logo_lockup.right_text_style
                            ?.font_weight,
                        letterSpacing:
                          theme.institution.logo_lockup.right_text_style
                            ?.letter_spacing,
                        fontSize:
                          headerCfg?.lockup_text_size_rem == null
                            ? undefined
                            : `clamp(1.15rem, 1.5vw, ${headerCfg.lockup_text_size_rem}rem)`,
                      }}
                    >
                      {text(theme.institution.logo_lockup.right_text)}
                    </span>
                    {theme.institution.logo_lockup.subtext ? (
                      <span
                        className="mt-1 theme-ui text-[0.66rem] uppercase tracking-[0.18em] opacity-80"
                        style={{
                          fontFamily:
                            theme.institution.logo_lockup.subtext_style
                              ?.font_family,
                          fontWeight:
                            theme.institution.logo_lockup.subtext_style
                              ?.font_weight,
                          letterSpacing:
                            theme.institution.logo_lockup.subtext_style
                              ?.letter_spacing,
                        }}
                      >
                        {text(theme.institution.logo_lockup.subtext)}
                      </span>
                    ) : null}
                  </span>
                </>
              ) : null}
              <span className="sr-only">{theme.institution.name}</span>
            </Link>
          </div>

          <div className="col-span-12 order-3 flex min-w-0 items-center justify-center xl:order-none xl:col-span-6">
            <div className="relative top-0 w-full xl:top-[1.8125rem]">
              <SearchField
                placeholder={t('common.searchPlaceholder')}
                onSearch={handleSearch}
                showAdvancedButton={true}
                onAdvancedSearchClick={handleAdvancedSearchClick}
              />
            </div>
          </div>

          <nav
            className="hidden xl:flex relative top-[1.5625rem] col-span-3 items-center justify-end gap-1 pt-2"
            aria-label={t('common.mainNavigation')}
          >
            {navLinks.map((link) =>
              renderThemeLink(
                link,
                text(link.label),
                'theme-ui rounded-sm px-3 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.14em] opacity-90 transition-colors hover:opacity-100 hover:bg-black/5 whitespace-nowrap',
                headerTextStyle
              )
            )}
          </nav>

          <div className="col-span-4 flex justify-end xl:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="rounded-md p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-brand-active/60"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileNavOpen ? t('common.close') : t('common.menu')}
              style={headerTextStyle}
            >
              {mobileNavOpen ? (
                <X className="h-6 w-6" aria-hidden />
              ) : (
                <Menu className="h-6 w-6" aria-hidden />
              )}
            </button>
          </div>

          {showResourceClassTabs && (
            <div className="hidden xl:block col-span-6 col-start-4 self-end min-w-0">
              <ResourceClassFilterTabs variant="header" />
            </div>
          )}
        </div>
      </div>

      <div
        id="mobile-nav-panel"
        ref={navPanelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('common.menu')}
        className={`theme-utility-row fixed inset-y-0 right-0 z-[60] flex w-72 max-w-[88vw] transform flex-col shadow-xl transition-transform duration-200 ease-out xl:hidden ${
          mobileNavOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/20 px-4 py-4 shrink-0">
          <span className="theme-ui text-sm font-semibold uppercase tracking-[0.16em] text-white">
            {t('common.menu')}
          </span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-md p-2 -mr-2 text-white focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label={t('common.close')}
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </div>

        {utilityLinks.length > 0 && (
          <nav
            className="border-b border-white/15 px-4 py-4"
            aria-label={t('common.utilityNavigation')}
          >
            <div className="flex flex-col gap-1">
              {utilityLinks.map((link) =>
                renderThemeLink(
                  link,
                  text(link.label),
                  'theme-ui rounded-md px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-white/90 hover:bg-white/10 hover:text-white',
                  undefined,
                  () => setMobileNavOpen(false)
                )
              )}
            </div>
          </nav>
        )}

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
          aria-label={t('common.mainNavigation')}
        >
          {navLinks.map((link) =>
            renderThemeLink(
              link,
              text(link.label),
              'theme-ui rounded-md px-4 py-3 text-base font-semibold uppercase tracking-[0.14em] text-white/95 hover:bg-white/10 hover:text-white',
              undefined,
              () => setMobileNavOpen(false)
            )
          )}

          {ctaLink
            ? renderThemeLink(
                ctaLink,
                text(ctaLink.label),
                mobileCtaClass,
                undefined,
                () => setMobileNavOpen(false)
              )
            : null}
        </nav>

        {showResourceClassTabs && (
          <div className="border-t border-white/20 px-4 py-4">
            <ResourceClassFilterTabs variant="header" layout="vertical" />
          </div>
        )}
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/40 xl:hidden"
          aria-label={t('common.close')}
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <CollectionPathways />
    </header>
  );
}
