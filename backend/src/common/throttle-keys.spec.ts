import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Guarda de regresión de los límites de intentos.
 *
 * `@Throttle({ <clave>: {...} })` solo sobreescribe el limitador cuyo nombre es esa clave. El
 * de `AppModule` se llama 'global': con `default` (el ejemplo de la documentación) la
 * sobreescritura se ignora en silencio y el login aceptaba 100 intentos por minuto en vez de 10.
 */
describe('@Throttle usa el nombre del limitador de AppModule', () => {
  const root = join(__dirname, '..');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts') && !p.endsWith('.spec.ts')) files.push(p);
    }
  };
  walk(root);

  const appModule = readFileSync(join(root, 'app.module.ts'), 'utf-8');
  const names = [...appModule.matchAll(/name:\s*'(\w+)'/g)].map((m) => m[1]);

  const usages = files.flatMap((f) =>
    [...readFileSync(f, 'utf-8').matchAll(/@Throttle\(\{\s*(\w+)\s*:/g)].map((m) => ({ file: f.slice(root.length + 1), key: m[1] })),
  );

  it('encuentra el limitador y los @Throttle (si no, el test de abajo pasaría en vacío)', () => {
    expect(names).toContain('global');
    expect(usages.length).toBeGreaterThanOrEqual(4);
  });

  it('cada @Throttle usa una clave que existe', () => {
    expect(usages.filter((u) => !names.includes(u.key))).toEqual([]);
  });
});
