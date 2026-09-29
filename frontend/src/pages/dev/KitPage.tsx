import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { Icon } from '../../components/ui/Icon';
import { PageShell } from '../../components/ui/PageShell';
import { useTheme } from '../../hooks/useTheme';

/**
 * Galería del kit (solo en desarrollo, ruta /dev/kit). Referencia visual para migrar cada
 * pantalla: si algo no está acá, primero se agrega al kit.
 */
export default function KitPage() {
  const { theme, toggle } = useTheme();
  const [view, setView] = useState<'op' | 'hist'>('op');
  const [status, setStatus] = useState<'all' | 'pending' | 'prep' | 'done'>('all');
  const [on, setOn] = useState(true);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState<null | 'primary' | 'danger'>(null);

  return (
    <div className="min-h-screen bg-surface-page">
      <PageShell maxWidth="5xl">
        <PageHeader
          title="Kit de componentes"
          description="Referencia visual de la base. Revisar en tema claro y oscuro."
          meta={<Badge variant="info">Desarrollo</Badge>}
          actions={
            <Button variant="secondary" onClick={toggle}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
              Tema {theme === 'dark' ? 'claro' : 'oscuro'}
            </Button>
          }
        >
          <SegmentedControl
            label="Vista"
            value={view}
            onChange={setView}
            options={[{ value: 'op', label: 'Operación' }, { value: 'hist', label: 'Historial' }]}
          />
        </PageHeader>

        <div className="space-y-6">
          <Section title="Tipografía">
            <p className="text-display font-bold font-heading">Bs 1.248,50</p>
            <p className="text-title font-bold font-heading">Título de pantalla</p>
            <p className="text-heading font-semibold font-heading">Título de sección</p>
            <p className="text-body text-main">Texto base: el pedido se envía a cocina al cobrar.</p>
            <p className="text-label text-soft">Etiqueta o texto secundario</p>
            <p className="text-caption text-muted">Nota o metadato, 29 de septiembre, 08:00</p>
          </Section>

          <Section title="Botones">
            <Row>
              <Button>Guardar cambios</Button>
              <Button variant="secondary">Cancelar</Button>
              <Button variant="ghost">Ver detalle</Button>
              <Button variant="danger">Eliminar</Button>
              <Button variant="success">Cobrar</Button>
            </Row>
            <Row>
              <Button size="sm">Chico</Button>
              <Button size="md">Normal</Button>
              <Button size="lg">Grande</Button>
              <Button size="xl" variant="success">Cobrar Bs 65,00</Button>
            </Row>
            <Row>
              <Button disabled>Deshabilitado</Button>
              <Button variant="success" disabled>Cobrar</Button>
              <Button loading>Guardando</Button>
            </Row>
          </Section>

          <Section title="Campos">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Nombre" placeholder="Ej.: Pique macho" />
              <Input label="Precio" leftAddon="Bs" placeholder="0,00" hint="Precio final con impuestos" />
              <Select label="Categoría" defaultValue="1">
                <option value="1">Platos principales</option>
                <option value="2">Bebidas</option>
              </Select>
              <Input label="Correo" defaultValue="cajero@" error="Ingresa un correo válido" />
              <div className="sm:col-span-2"><Textarea label="Notas" placeholder="Sin cebolla, mesa 5…" /></div>
            </div>
          </Section>

          <Section title="Estados y selección">
            <Row>
              <Badge variant="success" dot>Caja abierta</Badge>
              <Badge variant="warning" dot>Pendiente</Badge>
              <Badge variant="error" dot>Anulado</Badge>
              <Badge variant="info">Plan PRO</Badge>
              <Badge>Sin sucursal</Badge>
            </Row>
            <Row>
              <SegmentedControl
                label="Estado del pedido"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'Todos', count: 12 },
                  { value: 'pending', label: 'Pendientes', count: 4 },
                  { value: 'prep', label: 'Preparando', count: 3 },
                  { value: 'done', label: 'Entregados', count: 5 },
                ]}
              />
              <label className="inline-flex items-center gap-3 text-body text-main">
                <Toggle checked={on} onChange={() => setOn((v) => !v)} label="Producto activo" />
                Producto activo
              </label>
              <Spinner />
            </Row>
          </Section>

          <Section title="Tarjetas">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card><p className="text-heading font-semibold">default</p><p className="text-label text-soft">Tarjeta sobre la página</p></Card>
              <Card variant="panel"><p className="text-heading font-semibold">panel</p><p className="text-label text-soft">Bloque secundario</p></Card>
              <Card variant="inset"><p className="text-heading font-semibold">inset</p><p className="text-label text-soft">Zona hundida</p></Card>
            </div>
          </Section>

          <Section title="Vacío y carga">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card padding="none">
                <EmptyState compact icon="orders" title="Sin pedidos hoy" description="Los pedidos cobrados aparecen aquí al instante." />
              </Card>
              <Card><Skeleton variant="title" w="50%" /><div className="mt-3 space-y-2"><Skeleton /><Skeleton w="80%" /></div></Card>
            </div>
          </Section>

          <Section title="Modales">
            <Row>
              <Button variant="secondary" onClick={() => setModal(true)}>Abrir modal</Button>
              <Button variant="secondary" onClick={() => setConfirm('primary')}>Confirmar</Button>
              <Button variant="secondary" onClick={() => setConfirm('danger')}>Confirmar destructivo</Button>
            </Row>
          </Section>
        </div>

        <Modal
          isOpen={modal}
          onClose={() => setModal(false)}
          title="Nuevo producto"
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
              <Button onClick={() => setModal(false)}>Crear producto</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input label="Nombre" placeholder="Ej.: Hamburguesa clásica" />
            <Input label="Precio" leftAddon="Bs" placeholder="0,00" />
            <Select label="Categoría"><option>Platos principales</option></Select>
          </div>
        </Modal>
        <ConfirmModal
          isOpen={confirm !== null}
          onClose={() => setConfirm(null)}
          onConfirm={() => setConfirm(null)}
          variant={confirm ?? 'primary'}
          title={confirm === 'danger' ? 'Eliminar producto' : 'Cerrar caja'}
          message={confirm === 'danger'
            ? 'El producto deja de aparecer en el punto de venta. Los pedidos anteriores no cambian.'
            : 'Se registrará el arqueo con el efectivo contado.'}
          confirmLabel={confirm === 'danger' ? 'Eliminar' : 'Cerrar caja'}
        />
      </PageShell>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="text-heading font-semibold font-heading mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
