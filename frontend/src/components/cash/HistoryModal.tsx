import type { CashSessionDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { CashSessionRow } from './CashSessionRow';

interface HistoryModalProps {
  isOpen: boolean;
  sessions: CashSessionDto[];
  onClose: () => void;
}

export function HistoryModal({ isOpen, sessions, onClose }: HistoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cierres de caja" size="md">
      <ul className="-my-3 divide-y divide-line">
        {sessions.map((s) => <CashSessionRow key={s.id} session={s} />)}
      </ul>
    </Modal>
  );
}
