import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { BRAND_COLOR, THEME_COLORS } from './src/theme-colors';

// Interruptor de emergencia. Si una versión del service worker sale rota a producción,
// poner `true` y desplegar: se publica un sw.js que se desregistra solo y borra sus cachés en
// cada cliente la próxima vez que abra la app (sw.js se sirve con no-cache, así que lo recibe
// enseguida). La app sigue funcionando como web normal. Volver a `false` para reactivar la PWA.
const PWA_KILL_SWITCH = false;

// El mismo proxy para `vite` y `vite preview`: sin él, el build con service worker no puede
// probarse en local contra la API.
const backendProxy: Record<string, ProxyOptions> = {
  '/api':       { target: 'http://localhost:3000', changeOrigin: true },
  '/uploads':   { target: 'http://localhost:3000', changeOrigin: true },
  '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
};

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      selfDestroying: PWA_KILL_SWITCH,
      // Nunca recargar sola: un cajero a mitad de un cobro no puede ver la pantalla reiniciarse.
      // La app pregunta antes de activar una versión nueva.
      registerType: 'prompt',
      // El registro lo hace la app (hook de actualización), no un script inyectado.
      injectRegister: false,
      // globPatterns ya precarga los íconos; sin esto quedarían duplicados en la precarga.
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'YankoPOS — Punto de venta',
        short_name: 'YankoPOS',
        description: 'Punto de venta para restaurantes y negocios de comida.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/pos',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        // Fondo de la pantalla de arranque: el del tema por defecto (oscuro).
        background_color: THEME_COLORS.dark,
        theme_color: BRAND_COLOR,
        categories: ['business', 'food', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png',   sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Punto de venta', url: '/pos',     icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Pedidos',        url: '/orders',  icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Cocina',         url: '/kitchen', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Solo el esqueleto de la app. Sin runtimeCaching: la API, /uploads y el socket
        // siempre van a la red — la app no tiene modo sin conexión.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // Sin esto, abrir /uploads/x.webp o /health en una pestaña devolvería el index.html
        // del SPA en vez del archivo real.
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/socket\.io\//, /^\/health/],
        cleanupOutdatedCaches: true,
        // El bundle principal ya pasa de 1,5 MB. Con el tope por defecto (2 MB) Workbox lo
        // dejaría fuera de la precarga sin error en cuanto crezca un poco.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: backendProxy,
  },
  preview: {
    port: 4173,
    proxy: backendProxy,
  },
});
