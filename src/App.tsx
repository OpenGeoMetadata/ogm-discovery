import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useSearchParams,
} from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { SearchPage } from './pages/SearchPage';
import { ResourceView } from './pages/ResourceView';
import { ResourceAdminPage } from './pages/ResourceAdminPage';
import { HomePage } from './pages/HomePage';
import { MiradorViewerPage } from './pages/MiradorViewerPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { FixturesTestPage } from './pages/FixturesTestPage';
import { ProviderPillsTestPage } from './pages/ProviderPillsTestPage';
import { TestPage } from './pages/TestPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServerErrorPage } from './pages/ServerErrorPage';
import { TurnstileGate } from './components/security/TurnstileGate';

function ensureGeoblacklightModalRoot() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('blacklight-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'blacklight-modal';
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.appendChild(modal);
}

function App() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasSearchParams = Array.from(searchParams.entries()).length > 0;

  // Build search string from URLSearchParams to avoid window.location issues
  const searchString = hasSearchParams ? `?${searchParams.toString()}` : '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Resource previews manage their own OGM Viewer lifecycle.
    if (location.pathname.startsWith('/resources/')) return;

    let cancelled = false;

    async function boot() {
      if (cancelled) return;

      try {
        const globalScope = window as typeof window & {
          Stimulus?: unknown;
          GeoblacklightCore?: { activate?: (event: Event) => void };
        };

        if (!globalScope.Stimulus) {
          const { Application } = await import('@hotwired/stimulus');
          globalScope.Stimulus = Application.start();
        }

        ensureGeoblacklightModalRoot();

        if (!globalScope.GeoblacklightCore) {
          const mod =
            await import('@geoblacklight/frontend/app/javascript/geoblacklight/core');
          globalScope.GeoblacklightCore =
            (mod as { default?: { activate?: (event: Event) => void } })
              .default || (mod as { activate?: (event: Event) => void });
        }

        setTimeout(() => {
          try {
            globalScope.GeoblacklightCore?.activate?.(
              new Event('ogm-viewer:navigation')
            );
          } catch (error) {
            console.warn('GeoBlacklight activation failed:', error);
          }
        }, 0);
      } catch (error) {
        console.warn('GeoBlacklight boot failed:', error);
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [location.key, location.pathname]);

  return (
    <HelmetProvider>
      <TurnstileGate>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/mirador" element={<MiradorViewerPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/resources/:id/admin" element={<ResourceAdminPage />} />
          <Route path="/resources/:id" element={<ResourceView />} />
          <Route
            path="/test/fixtures/providers"
            element={<ProviderPillsTestPage />}
          />
          <Route path="/test/fixtures" element={<FixturesTestPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="/500.html" element={<ServerErrorPage />} />
          <Route
            path="/"
            element={
              hasSearchParams ? (
                <Navigate to={`/search${searchString}`} replace />
              ) : (
                <HomePage />
              )
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </TurnstileGate>
    </HelmetProvider>
  );
}

export default App;
