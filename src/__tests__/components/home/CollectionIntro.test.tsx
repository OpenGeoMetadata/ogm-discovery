import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { CollectionIntro } from '../../../components/home/CollectionIntro';
import { ThemeProvider } from '../../../context/ThemeContext';
import { I18nProvider } from '../../../context/I18nContext';
import { getThemeConfig, THEME_STORAGE_KEY } from '../../../config/institution';
import { buildThemeHomePath } from '../../../utils/appRoutes';

const themes = [
  ['nasa-gibs', 'A new perspective on our planet.', 'Explore imagery'],
  ['usgs-tnm', 'The foundations of a nation, mapped.', 'Find datasets'],
  ['usgs-htmc', 'Every landscape has a history.', 'Explore historical maps'],
];

describe('collection portals', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    window.localStorage.clear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    'berkeley',
    'geobtaa',
    'gmu',
    'harvard',
    'hdx',
    'lunaris',
    'princeton',
    'stanford',
    'usda-naip',
    'utexas',
    'uwm',
  ])('renders the %s repository portal without a placeholder image', (id) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
    vi.stubEnv('BASE_URL', '/ogm-discovery/');
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider initialThemeId={id}>
          <I18nProvider>
            <CollectionIntro />
          </I18nProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Search this collection' })
    ).toHaveAttribute('href', '/search?q=&view=gallery');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      container.querySelector('.collection-intro-grid-text')
    ).toBeInTheDocument();
    expect(buildThemeHomePath(id)).toBe(`/ogm-discovery/${id}/`);
  });

  it.each(themes)(
    'renders %s with accessible asset and discovery links',
    (id, title, action) => {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
      vi.stubEnv('BASE_URL', '/ogm-discovery/');
      render(
        <MemoryRouter>
          <ThemeProvider initialThemeId={id}>
            <I18nProvider>
              <CollectionIntro />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      );
      expect(
        screen.getByRole('heading', { level: 1, name: title })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: action })).toHaveAttribute(
        'href',
        expect.stringContaining('/search?')
      );
      expect(screen.getByRole('img')).toHaveAttribute(
        'alt',
        expect.any(String)
      );
      expect(screen.getByRole('img').getAttribute('alt')).not.toBe('');
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        expect.stringContaining('/ogm-discovery/collection-assets/')
      );
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
      expect(buildThemeHomePath(id)).toBe(`/ogm-discovery/${id}/`);
    }
  );

  it('keeps NASA and historical maps scoped by collection, and separates the USGS catalogs', () => {
    expect(getThemeConfig('nasa-gibs').api.default_query_params).toContain(
      'include_filters[pcdm_memberOf_sm][]=nasa-gibs'
    );
    expect(getThemeConfig('usgs-htmc').api.default_query_params).toContain(
      'include_filters[pcdm_memberOf_sm][]=usgs-htmc'
    );
    expect(getThemeConfig('usgs-tnm').api.default_query_params).toEqual([
      'include_filters[schema_provider_s][]=U.S. Geological Survey',
      'include_filters[dcat_keyword_sm][]=The National Map',
    ]);
  });

  it('switches away from an explicit theme URL without retaining old catalog filters', () => {
    vi.stubEnv('BASE_URL', '/ogm-discovery/');
    window.history.replaceState(
      null,
      '',
      '/ogm-discovery/unr/?ogm_theme=unr#/search?q=Nevada'
    );
    expect(buildThemeHomePath('usgs-htmc')).toBe('/ogm-discovery/usgs-htmc/');
    expect(buildThemeHomePath('unknown')).toBe('/ogm-discovery/');
  });

  it('leaves the BTAA home on its existing layout', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'btaa');
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider initialThemeId="btaa">
          <I18nProvider>
            <CollectionIntro />
          </I18nProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
