import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { useApi } from '../../context/ApiContext';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { isAbsoluteUrl, resolveThemeAssetUrl } from '../../utils/themeUrls';

interface FooterProps {
  id?: string;
}

function interpolateUrlTemplate(template: string | undefined, id?: string) {
  if (!template || !id) return null;
  return template.replace('{id}', encodeURIComponent(id));
}

function FooterLink({
  href,
  label,
  external,
  className,
}: {
  href: string;
  label: string;
  external?: boolean;
  className: string;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

export default function Footer({ id }: FooterProps) {
  const { lastApiUrl } = useApi();
  const { theme, themeId, themes, themeSelectorEnabled, setThemeId } =
    useTheme();
  const { locale, locales, setLocale, t, text } = useI18n();

  const footerStyle = theme.footer?.style || 'simple';
  const isPhotoFooter = footerStyle === 'photo';
  const footerLinkClass =
    footerStyle === 'network' || isPhotoFooter
      ? 'text-white/85 hover:text-white hover:underline'
      : 'text-sm text-gray-500 hover:text-gray-900';
  const outerClass =
    footerStyle === 'network'
      ? 'bg-brand text-white print:hidden'
      : isPhotoFooter
        ? 'theme-footer-photo text-white print:hidden'
        : 'bg-white shadow-sm print:hidden';
  const panelClass =
    footerStyle === 'network'
      ? 'bg-[#002a41] border border-white/15'
      : isPhotoFooter
        ? 'theme-footer-panel border rounded-2xl'
        : 'bg-gray-50 border border-gray-200';
  const currentYear = new Date().getFullYear();
  const footerTitle =
    text(theme.footer?.title) ||
    theme.site?.short_name ||
    theme.institution.name;
  const addressLines = theme.footer?.address_lines || [];
  const copyright =
    text(theme.footer?.copyright) ||
    `${currentYear} ${theme.institution.name}. ${t('common.allRightsReserved')}`;
  const originalRecordUrl =
    interpolateUrlTemplate(theme.footer?.original_record_url_template, id) ||
    interpolateUrlTemplate(theme.api?.original_record_url_template, id);
  const originalRecordLabel =
    text(theme.footer?.original_record_label) || t('common.viewOriginal');
  const logoUrl = resolveThemeAssetUrl(
    theme.footer?.logo_url || theme.institution.logo_url
  );
  const logoHref = theme.footer?.logo_href || '/';
  const logoLinkIsExternal = isAbsoluteUrl(logoHref);
  const logoImage = logoUrl ? (
    <img
      src={logoUrl}
      alt={
        text(theme.footer?.logo_alt) ||
        text(theme.institution.logo_alt) ||
        theme.institution.name
      }
      className={`w-auto ${
        isPhotoFooter ? 'mx-auto h-14 rounded-sm' : 'h-16 rounded'
      }`}
    />
  ) : null;
  const showThemeSelector = themeSelectorEnabled && themes.length > 1;
  const showLocaleSelector =
    theme.site?.show_locale_selector === true && locales.length > 1;
  const showApiDebug = theme.footer?.show_api_debug === true;

  return (
    <footer className={outerClass}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          <div
            className={`flex flex-col gap-8 ${
              isPhotoFooter
                ? 'items-center text-center'
                : 'lg:flex-row lg:justify-between'
            }`}
          >
            <div className={isPhotoFooter ? 'max-w-xl' : 'max-w-sm'}>
              {logoImage ? (
                logoLinkIsExternal ? (
                  <a href={logoHref}>{logoImage}</a>
                ) : (
                  <Link to={logoHref}>{logoImage}</Link>
                )
              ) : (
                <div
                  className={`text-lg font-semibold ${
                    isPhotoFooter || footerStyle === 'network'
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}
                >
                  {theme.institution.name}
                </div>
              )}

              <div className={isPhotoFooter ? 'mt-4 space-y-2' : 'mt-3'}>
                <h2
                  className={
                    isPhotoFooter
                      ? 'text-2xl font-semibold text-white'
                      : 'text-lg font-semibold text-gray-900'
                  }
                >
                  {footerTitle}
                </h2>
                {addressLines.length > 0 ? (
                  <div
                    className={
                      isPhotoFooter
                        ? 'space-y-1 text-sm text-white/80'
                        : 'space-y-1 text-sm text-gray-500'
                    }
                  >
                    {addressLines.map((line, index) => (
                      <p key={`${footerTitle}-${index}`}>{text(line)}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {(theme.footer?.link_groups?.length ||
              theme.footer?.network_members?.length) && (
              <div
                className={`grid gap-8 ${
                  isPhotoFooter
                    ? `${panelClass} w-full px-6 py-6 sm:grid-cols-2 lg:grid-cols-4`
                    : 'flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {(theme.footer?.link_groups || []).map((group) => (
                  <div key={text(group.title)}>
                    <h3
                      className={`mb-3 text-lg font-bold ${
                        isPhotoFooter || footerStyle === 'network'
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                    >
                      {text(group.title)}
                    </h3>
                    <ul className="space-y-2">
                      {group.links.map((link) => (
                        <li key={`${link.href}-${text(link.label)}`}>
                          <FooterLink
                            href={link.href}
                            label={text(link.label)}
                            external={link.external}
                            className={footerLinkClass}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {theme.footer?.network_members?.length ? (
                  <div className="lg:col-span-2">
                    <h3
                      className={`mb-3 text-lg font-bold ${
                        isPhotoFooter || footerStyle === 'network'
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                    >
                      {text(theme.footer.network_title) ||
                        t('common.partnerInstitutions')}
                    </h3>
                    <ul
                      className={
                        footerStyle === 'network'
                          ? 'grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-white/85'
                          : 'grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-500'
                      }
                    >
                      {theme.footer.network_members.map((member) => (
                        <li key={text(member)}>{text(member)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <hr
            className={
              footerStyle === 'network' || isPhotoFooter
                ? 'border-white/20'
                : 'border-gray-200'
            }
          />

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4">
              <div
                className={
                  footerStyle === 'network' || isPhotoFooter
                    ? 'text-white/70'
                    : 'text-gray-500'
                }
              >
                © {copyright}
              </div>

              {showApiDebug ? (
                lastApiUrl ? (
                  <div
                    className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-mono ${panelClass}`}
                  >
                    <span
                      className={
                        footerStyle === 'network' || isPhotoFooter
                          ? 'text-white/60'
                          : 'text-gray-500'
                      }
                    >
                      {t('common.api')}:
                    </span>
                    <a
                      href={lastApiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 truncate"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-[400px]">
                        {lastApiUrl}
                      </span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                ) : (
                  <div
                    className={
                      footerStyle === 'network' || isPhotoFooter
                        ? 'text-xs text-white/60'
                        : 'text-xs text-gray-500'
                    }
                  >
                    {t('footer.lastApiRequest')} {t('common.noApiRequestsYet')}
                  </div>
                )
              ) : null}
            </div>

            <div
              className={`flex flex-wrap items-center gap-4 rounded-lg px-4 py-3 ${panelClass}`}
            >
              {showThemeSelector ? (
                <label className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span>{t('common.theme')}</span>
                  <select
                    value={themeId}
                    onChange={(event) => {
                      const nextThemeId = event.target.value;
                      if (nextThemeId === themeId) return;
                      setThemeId(nextThemeId);
                      window.location.reload();
                    }}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                  >
                    {themes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showLocaleSelector ? (
                <label className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span>{t('common.language')}</span>
                  <select
                    value={locale}
                    onChange={(event) => setLocale(event.target.value)}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                  >
                    {locales.map((item) => (
                      <option key={item} value={item}>
                        {item.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {originalRecordUrl ? (
                <a
                  href={originalRecordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium"
                >
                  {originalRecordLabel}
                  <ExternalLink size={14} />
                </a>
              ) : null}

              {(theme.footer?.bottom_links || []).map((link) => (
                <FooterLink
                  key={`${link.href}-${text(link.label)}`}
                  href={link.href}
                  label={text(link.label)}
                  external={link.external}
                  className={footerLinkClass}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
