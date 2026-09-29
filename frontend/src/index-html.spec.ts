// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { THEME_COLORS } from './theme-colors';

/**
 * El script anti-FOUC de index.html corre antes que la app, así que no puede importar nada:
 * lo que sabe lo tiene copiado. Estos tests vigilan que esas copias no se desincronicen.
 */
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

// Producción se construye en Linux: el navegador hashea el script con finales LF, aunque
// en Windows git lo haya dejado en CRLF.
const indexHtml     = read('../index.html').replace(/\r\n/g, '\n');
const inlineScripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

describe('CSP de nginx vs scripts inline de index.html', () => {
  // La CSP de producción solo deja correr scripts inline cuyo sha256 esté listado. Si alguien
  // edita el script sin actualizar el hash, el navegador lo bloquea en silencio y vuelve el
  // parpadeo de tema.
  const headers = read('../security-headers.conf');

  it('hay un script inline que proteger', () => {
    expect(inlineScripts.length).toBeGreaterThan(0);
  });

  it.each(inlineScripts.map((s, i) => [i, s]))('el script inline #%i está autorizado por hash', (_i, script) => {
    const hash = `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
    expect(headers, `Copiar ${hash} en script-src de frontend/security-headers.conf`).toContain(hash);
  });
});

describe('colores de theme-color en index.html', () => {
  it('usa los mismos fondos que theme-colors.ts', () => {
    const script = inlineScripts.join('\n');
    expect(script).toContain(`'${THEME_COLORS.dark}'`);
    expect(script).toContain(`'${THEME_COLORS.light}'`);
    // Sin tema guardado arranca en claro, el predeterminado.
    expect(indexHtml).toContain(`<meta name="theme-color" content="${THEME_COLORS.light}" />`);
  });
});
