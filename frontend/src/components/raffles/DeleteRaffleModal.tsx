import { useId, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';

interface Props {
  raffleName: string;
  loading:    boolean;
  /** Hay tickets o ganadores que valga la pena guardar antes de borrar. */
  hasRecord:  boolean;
  onExport:   () => void;
  onClose:    () => void;
  onConfirm:  () => void;
}

/** Eliminar es definitivo: se confirma escribiendo el nombre y se puede descargar el registro antes. */
export function DeleteRaffleModal({ raffleName, loading, hasRecord, onExport, onClose, onConfirm }: Props) {
  const formId = useId();
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === raffleName.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matches && !loading) onConfirm();
  };

  return (
    <Modal
      isOpen
      onClose={loading ? () => {} : onClose}
      title={`Eliminar "${raffleName}"`}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Volver</Button>
          <Button type="submit" form={formId} variant="danger" loading={loading} disabled={!matches}>Eliminar sorteo</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <p className="text-body text-soft">
          Se eliminan también sus tickets, ganadores y consumos acumulados. Esta acción no se puede deshacer.
        </p>
        {hasRecord && (
          <Button type="button" variant="secondary" size="sm" onClick={onExport}>
            <Icon name="download" size={16} />
            Descargar registro
          </Button>
        )}
        <Input
          label="Escribe el nombre del sorteo para confirmar"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={raffleName}
          autoComplete="off"
        />
      </form>
    </Modal>
  );
}
