import { useState } from 'react';
import { Icon } from '../ui/Icon';

/**
 * Lista que muestra los primeros N elementos y despliega el resto bajo demanda.
 * La usan los rankings de productos y de clientes.
 */
export function ExpandableList<T>({
  items, renderItem, initialCount = 5,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  initialCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, initialCount);
  const hidden  = items.length - initialCount;

  return (
    <>
      <div className="space-y-3">
        {visible.map(renderItem)}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          data-print-hide
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-primary-500/15 bg-primary-500/5 px-3 py-2 text-xs font-semibold text-primary-600 transition-all duration-150 hover:bg-primary-500/10 hover:text-primary-700 active:scale-[0.99]"
        >
          <span>{showAll ? 'Mostrar menos' : `Mostrar más (${hidden} más)`}</span>
          <Icon name={showAll ? 'chevron-up' : 'chevron-down'} size={14} strokeWidth={2.5} />
        </button>
      )}
    </>
  );
}
