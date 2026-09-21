import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ExpenseConceptsPanel } from './ExpenseConceptsPanel';
import { ExpenseCategoriesPanel } from './ExpenseCategoriesPanel';

type Tab = 'concepts' | 'categories';

/** Configuración de gastos: la lista de gastos y sus categorías. */
export function ExpenseConceptsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('concepts');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Administrar" size="2xl">
      <div className="mb-5 inline-flex w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] p-1 sm:w-auto">
        <TabButton active={tab === 'concepts'}   onClick={() => setTab('concepts')}   icon="receipt" label="Gastos" />
        <TabButton active={tab === 'categories'} onClick={() => setTab('categories')} icon="box"     label="Categorías" />
      </div>

      {tab === 'concepts' ? <ExpenseConceptsPanel /> : <ExpenseCategoriesPanel />}

      <div className="flex justify-end pt-5">
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}

function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: 'receipt' | 'box';
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition sm:flex-none ${
        active
          ? 'bg-[var(--color-surface-card)] text-gray-900 shadow-card'
          : 'text-gray-400 hover:text-gray-700'
      }`}
    >
      <Icon name={icon} size={14} /> {label}
    </button>
  );
}
