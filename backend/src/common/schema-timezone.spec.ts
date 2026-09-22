import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guarda de regresión del esquema.
 *
 * Todas las columnas de fecha deben ser `timestamptz`. Cuando eran `timestamp` sin zona
 * guardaban UTC, pero el SQL crudo de los reportes las trataba como si tuvieran zona: los
 * reportes agrupaban por día UTC en vez de día Bolivia (las ventas de 20:00 a 23:59 caían en
 * el día siguiente), el mapa de horas salía corrido 4 h y el arqueo de caja sumaba las ventas
 * de las 4 horas previas a la apertura, marcando faltantes que no existían.
 *
 * Un campo `DateTime` nuevo sin `@db.Timestamptz(3)` reintroduce ese bug solo para esa
 * columna, y no lo detecta ningún otro test porque las pruebas unitarias no tocan la base.
 */
describe('schema.prisma — zona horaria', () => {
  const schema = readFileSync(join(__dirname, '../../prisma/schema.prisma'), 'utf-8');

  const dateTimeFields = schema
    .split(/\r?\n/)
    .map((line, i) => ({ line: line.trim(), n: i + 1 }))
    .filter(({ line }) => /^\w+\s+DateTime\b/.test(line));

  it('encuentra los campos DateTime (si no, el test de abajo pasaría en vacío)', () => {
    expect(dateTimeFields.length).toBeGreaterThan(15);
  });

  it('todos los campos DateTime declaran @db.Timestamptz(3)', () => {
    const sinZona = dateTimeFields
      .filter(({ line }) => !line.includes('@db.Timestamptz(3)'))
      .map(({ line, n }) => `linea ${n}: ${line}`);

    expect(sinZona).toEqual([]);
  });
});
