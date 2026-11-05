import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CollectionPathways } from '../../components/layout/CollectionPathways';
import { I18nProvider } from '../../context/I18nContext';
import { THEME_STORAGE_KEY } from '../../config/institution';
import { ThemeProvider } from '../../context/ThemeContext';

function Location() {
  const location = useLocation();
  return (
    <output aria-label="Current route">
      {location.pathname}
      {location.search}
    </output>
  );
}
function renderPathways(themeId: string, path: string) {
  window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider initialThemeId={themeId}>
        <I18nProvider>
          <CollectionPathways />
          <Location />
        </I18nProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}
describe('collection pathway navigation', () => {
  beforeEach(() => window.localStorage.clear());
  it.each(['nasa-gibs', 'usgs-tnm', 'usgs-htmc'])(
    'switches both directions for %s without treating search filters as research settings',
    async (theme) => {
      renderPathways(theme, '/search?q=water');
      const discovery = screen.getByRole('link', { name: /Search & browse/ });
      const research = screen.getByRole('link', { name: /Research workspace/ });
      expect(discovery).toHaveAttribute('aria-current', 'true');
      expect(research).not.toHaveAttribute('aria-current');
      await userEvent.click(research);
      expect(screen.getByLabelText('Current route')).toHaveTextContent(
        /^\/research$/
      );
      expect(research).toHaveAttribute('aria-current', 'true');
      expect(discovery).not.toHaveAttribute('aria-current');
      await userEvent.click(discovery);
      expect(screen.getByLabelText('Current route')).toHaveTextContent(/^\/$/);
      expect(discovery).toHaveAttribute('aria-current', 'true');
    }
  );
  it('recognizes deep-linked research selections', () => {
    renderPathways('nasa-gibs', '/research?before=2024-06-01');
    expect(
      screen.getByRole('link', { name: /Research workspace/ })
    ).toHaveAttribute('aria-current', 'true');
  });
  it.each(['btaa', 'unr'])(
    'does not offer an unconfigured research pathway for %s',
    (theme) => {
      renderPathways(theme, '/');
      expect(
        screen.queryByRole('navigation', { name: 'Collection pathways' })
      ).not.toBeInTheDocument();
    }
  );
});
