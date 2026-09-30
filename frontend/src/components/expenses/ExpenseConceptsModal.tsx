import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ExpenseConceptsPanel } from './ExpenseConceptsPanel';
import { ExpenseCategoriesPanel } from './ExpenseCategoriesPanel';

type Tab = 'concepts' | 'categories';

/** Administración de la lista de gastos: qué gastos existen y en qué categorías se agrupan. */
export function ExpenseConceptsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('concepts');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lista de gastos"
      size="2xl"
      footer={<div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Cerrar</Button></div>}
    >
      <div className="mb-5">
        <SegmentedControl
          label="Qué administrar"
          value={tab}
          onChange={setTab}
          options={[{ value: 'concepts', label: 'Gastos' }, { value: 'categories', label: 'Categorías' }]}
        />
      </div>
      {tab === 'concepts' ? <ExpenseConceptsPanel /> : <ExpenseCategoriesPanel />}
    </Modal>
  );
}
