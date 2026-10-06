import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // Ensures assets load correctly on GitHub Pages (subpaths & custom domains)
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      plugins: [
        {
          name: 'downloads-header-plugin',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url && req.url.includes('/downloads/')) {
                const filename = req.url.split('/').pop()?.split('?')[0];
                if (filename?.endsWith('.aab')) {
                  res.setHeader('Content-Type', 'application/octet-stream');
                  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                } else if (filename?.endsWith('.apk')) {
                  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
                  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                } else if (filename?.endsWith('.zip')) {
                  res.setHeader('Content-Type', 'application/zip');
                  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                }
              }
              next();
            });
          }
        },
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
          manifest: {
            id: '/',
            name: 'Language app Dour - بازی دورهمی یادگیری زبان',
            short_name: 'دور - Turn',
            description: 'بازی دورهمی آموزش و یادگیری زبان به صورت چندزبانه، جذاب و تعاملی برای گروه‌های ۴، ۶ و ۸ نفره',
            theme_color: '#241442',
            background_color: '#170B2C',
            display: 'standalone',
            orientation: 'portrait',
            start_url: './',
            scope: './',
            icons: [
              {
                src: './pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: './pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: './pwa-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
          devOptions: {
            enabled: true,
          },
        }),
      ],
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './tests/setup.ts',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

