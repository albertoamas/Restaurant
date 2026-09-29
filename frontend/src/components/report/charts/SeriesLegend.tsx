interface Props {
  items: { key: string; name: string; color: string }[];
}

/**
 * Leyenda de un gráfico multiserie. El texto va en tinta neutra y el color lo
 * lleva solo la muestra: pintar el nombre con el color de la serie lo hace
 * ilegible en los tonos claros (ámbar, lima) sobre fondo blanco.
 */
export function SeriesLegend({ items }: Props) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: item.color }} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}
