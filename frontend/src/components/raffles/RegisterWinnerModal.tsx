import { useId, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { positionLabel } from '../../utils/raffle-utils';

interface Props {
  position:  number;
  prize?:    string;
  loading:   boolean;
  onClose:   () => void;
  onConfirm: (ticketNumber: number) => void;
}

/** El sorteo se hace en el ánfora: se saca un ticket y aquí se escribe su número. */
export function RegisterWinnerModal({ position, prize, loading, onClose, onConfirm }: Props) {
  const formId = useId();
  const [value, setValue] = useState('');
  const ticketNumber = Number(value);
  const valid = Number.isInteger(ticketNumber) && ticketNumber >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid && !loading) onConfirm(ticketNumber);
  };

  return (
    <Modal
      isOpen
      onClose={loading ? () => {} : onClose}
      title={`Registrar el ${positionLabel(position)}`}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Volver</Button>
          <Button type="submit" form={formId} loading={loading} disabled={!valid}>Registrar ganador</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {prize && <p className="text-body text-soft">Premio: <span className="font-semibold text-main">{prize}</span></p>}
        <Input
          label="Número del ticket sorteado"
          type="number"
          inputMode="numeric"
          min={1}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          hint="Saca un ticket del ánfora y escribe el número que dice."
        />
      </form>
    </Modal>
  );
}
