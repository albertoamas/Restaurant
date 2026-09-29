/**
 * Monto para las marcas del eje: "30k" en vez de "Bs 30000". Con el prefijo y
 * cinco cifras la etiqueta no entra en el ancho del eje y se parte en dos
 * renglones; la unidad la dice el subtítulo del gráfico. El valor exacto, con
 * su "Bs", sigue en el tooltip y en la tabla.
 */
export function formatAmountAxis(v: number | string): string {
  const n = Number(v);
  if (Math.abs(n) < 1000) return n.toFixed(0);
  const k = n / 1000;
  return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}k`;
}

/** Monto exacto para tooltips. */
export function formatBsFull(v: number | string): string {
  return `Bs ${Number(v).toFixed(2)}`;
}
