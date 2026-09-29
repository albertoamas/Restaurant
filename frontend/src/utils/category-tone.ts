import type { CategoryDto } from '@pos/shared';

/**
 * Tono de una categoría para las tarjetas de producto sin foto (bloque con la inicial).
 *
 * El tono se asigna por la posición de la categoría en la lista completa ordenada
 * (sortOrder, luego nombre), no por la lista filtrada: así un producto conserva su color al
 * cambiar de categoría o buscar. Mismo criterio que los colores de sucursal en reportes.
 *
 * Tintes translúcidos + texto con variante oscura: legibles en ambos temas.
 */
export const CATEGORY_TONES = [
  'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  // purple y no violet: la escala violet tiene tonos propios del tema oscuro que no sirven como texto.
  'bg-purple-500/15 text-purple-800 dark:text-purple-300',
  'bg-rose-500/15 text-rose-800 dark:text-rose-300',
  'bg-teal-500/15 text-teal-800 dark:text-teal-300',
  'bg-orange-500/15 text-orange-800 dark:text-orange-300',
  'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300',
] as const;

/** Mapa categoryId → clases de tono, estable para toda la lista de categorías. */
export function buildCategoryTones(categories: CategoryDto[]): Map<string, string> {
  const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  return new Map(ordered.map((c, i) => [c.id, CATEGORY_TONES[i % CATEGORY_TONES.length]]));
}

/** Primera letra del nombre (ignora espacios y signos iniciales), en mayúscula. */
export function productInitial(name: string): string {
  const match = name.trim().match(/\p{L}|\p{N}/u);
  return match ? match[0].toLocaleUpperCase('es') : '?';
}
