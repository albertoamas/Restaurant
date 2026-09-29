import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';
import { BRAND_COLOR } from './src/theme-colors';

// Íconos de la PWA a partir del logo. Regenerar con `pnpm --filter frontend pwa:assets`
// cada vez que cambie public/favicon.svg.
//
// Maskable y apple-touch rellenan el margen con el mismo naranja del logo: así las esquinas
// transparentes del cuadrado redondeado se funden con el fondo en vez de quedar blancas
// cuando Android o iOS aplican su propia máscara.

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { background: BRAND_COLOR },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: BRAND_COLOR },
    },
  },
  images: ['public/favicon.svg'],
});
