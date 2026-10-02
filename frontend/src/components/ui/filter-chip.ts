/** Chip de filtro por categoría (Gastos y Productos). */
export function chipClass(active: boolean) {
  return [
    'inline-flex shrink-0 items-center gap-1.5 min-h-9 rounded-full border px-3.5 text-label font-semibold whitespace-nowrap transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
    active ? 'border-primary-600 bg-primary-600 text-white' : 'border-line bg-surface-card text-soft hover:text-main hover:border-line-strong',
  ].join(' ');
}
