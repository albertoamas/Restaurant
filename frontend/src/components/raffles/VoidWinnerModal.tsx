import { useId, useState } from 'react';
import type { RaffleWinnerDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { positionLabel } from '../../utils/raffle-utils';

const MIN_REASON_LENGTH = 3;

interface Props {
  winner:    RaffleWinnerDto;
  loading:   boolean;
  onClose:   () => void;
  onConfirm: (reason: string) => void;
}

/** Anular un ganador exige un motivo: queda registrado con el usuario y la fecha. */
export function VoidWinnerModal({ winner, loading, onClose, onConfirm }: Props) {
  const formId = useId();
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= MIN_REASON_LENGTH;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid && !loading) onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen
      onClose={loading ? () => {} : onClose}
      title={`Anular a ${winner.customer.name}`}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Volver</Button>
          <Button type="submit" form={formId} variant="danger" loading={loading} disabled={!valid}>Anular ganador</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <p className="text-body text-soft">
          El {positionLabel(winner.position)} queda sin ganador y se puede volver a sortear.
        </p>
        <Textarea
          label="Motivo de la anulación"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          required
          hint="Queda registrado con tu usuario y la fecha."
        />
      </form>
    </Modal>
  );
}
