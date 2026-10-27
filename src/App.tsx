import { Routes, Route, Navigate, useSearchParams } from 'react-router';
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

function App() {
  const [searchParams] = useSearchParams();
  const hasSearchParams = Array.from(searchParams.entries()).length > 0;

  // Build search string from URLSearchParams to avoid window.location issues
  const searchString = hasSearchParams ? `?${searchParams.toString()}` : '';

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
