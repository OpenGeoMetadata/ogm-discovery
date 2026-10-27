import path from 'node:path';
import fs from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin, ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';

function githubPagesSpaFallback(): Plugin {
  let outDir = '';
  let rootDir = '';

  return {
    name: 'github-pages-spa-fallback',
    apply: 'build' as const,
    configResolved(config: ResolvedConfig) {
      rootDir = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async writeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      await Promise.all(
        ['404.html', '500.html'].map((fileName) =>
          fs.copyFile(indexPath, path.join(outDir, fileName))
        )
      );

      const themeIds = await discoverThemeIds(rootDir);
      await Promise.all(
        themeIds.map(async (themeId) => {
          const themeDir = path.join(outDir, encodeURIComponent(themeId));
          await fs.mkdir(themeDir, { recursive: true });
          await fs.copyFile(indexPath, path.join(themeDir, 'index.html'));
        })
      );
    },
  };
}

async function discoverThemeIds(rootDir: string): Promise<string[]> {
  const ids = new Set<string>();
  const addIdFromYaml = (raw: string, fallback?: string) => {
    const match = raw.match(/^id:\s*["']?([^"'\s#]+)["']?/m);
    if (match?.[1]) {
      ids.add(match[1]);
      return;
    }

    if (/^themes:\s*$/m.test(raw)) {
      for (const themeMatch of raw.matchAll(/^ {2}([^"'\s:#]+):\s*$/gm)) {
        ids.add(themeMatch[1]);
      }
      return;
    }

    ids.add(match?.[1] || fallback || 'default');
  };

  try {
    addIdFromYaml(await fs.readFile(path.join(rootDir, 'theme.yaml'), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
  }

  const themesDir = path.join(rootDir, 'themes');
  try {
    const fileNames = await fs.readdir(themesDir);
    await Promise.all(
      fileNames
        .filter((fileName) => /\.ya?ml$/i.test(fileName))
        .map(async (fileName) => {
          const filePath = path.join(themesDir, fileName);
          const fallback = path.basename(fileName, path.extname(fileName));
          addIdFromYaml(await fs.readFile(filePath, 'utf8'), fallback);
        })
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
  }

  return Array.from(ids).filter(Boolean).sort();
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [react(), githubPagesSpaFallback()],
    server: {
      port: 3000,
      allowedHosts: ['btaa-geoportal.ngrok.io'],
    },
    resolve: {
      alias: {
        'void-elements': path.resolve(__dirname, 'src/shims/void-elements.ts'),
      },
      dedupe: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['react-helmet-async', 'h3-js'],
    },
  };
});
