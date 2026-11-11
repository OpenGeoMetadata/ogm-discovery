import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import a11yReporter from './vitest-a11y-reporter';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    environment: 'happy-dom',
    // Keep Web Storage isolated in each DOM test environment on Node 25+.
    execArgv: ['--no-experimental-webstorage'],
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    reporters: ['default', a11yReporter],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/',
        'coverage/',
        '**/*.test.*',
        '**/*.spec.*',
        // React application scaffolding
        'src/App.tsx',
        'src/main.tsx',
        // Test infrastructure
        'src/__mocks__/**',
        // Type definitions
        'src/types/**',
        // Demo/test pages
        'src/pages/FixturesTestPage.tsx',
        'src/pages/ProviderPillsTestPage.tsx',
        'src/pages/TestPage.tsx',
        // Browser- or service-worker-only shims
        'src/shims/**',
        'src/config/fixLeafletDefaultIcon.ts',
        'src/constants/fieldConfig.ts',
        // External-service adapters and generated viewer shells covered by
        // integration/e2e tests rather than unit coverage.
        'src/components/map/**',
        'src/components/home/FeaturedItemPreviewLayer.tsx',
        'src/components/home/HomePageHexMapBackground.client.tsx',
        'src/components/search/GeospatialFilterMap.tsx',
        'src/components/search/MapResultMap.client.tsx',
        'src/components/search/MapView.tsx',
        'src/components/search/PlacenameAutocomplete.tsx',
        'src/components/resource/LocationMap.client.tsx',
        'src/components/resource/ResourceViewer.tsx',
        'src/components/security/**',
        'src/controllers/**',
        'src/hooks/useCountyAutoFit.ts',
        'src/hooks/useGeoFacets.ts',
        'src/hooks/useMapH3.ts',
        'src/lib/**',
        'src/pages/MiradorViewerPage.tsx',
        'src/services/geojson.ts',
        'src/services/turnstile.ts',
        'src/utils/geoCounty.ts',
        'src/utils/providerIcons.ts',
        // Configuration files
        '.eslintrc.js',
        'check-all-fixtures.js',
        // Server code
        'server/**',
      ],
      excludeAfterRemap: true,
      thresholds: {
        lines: 80,
        statements: 80,
      },
    },
  },
});
