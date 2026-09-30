import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

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
      <ol className="space-y-4">
        {visible.map(renderItem)}
      </ol>
      {hidden > 0 && (
        <Button variant="ghost" fullWidth className="mt-3" onClick={() => setShowAll((prev) => !prev)}>
          {showAll ? 'Ver menos' : `Ver los ${hidden} restantes`}
          <Icon name={showAll ? 'chevron-up' : 'chevron-down'} size={16} />
        </Button>
      )}
    </>
  );
}
