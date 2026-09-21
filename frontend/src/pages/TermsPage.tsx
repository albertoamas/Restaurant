import { Link } from 'react-router-dom';
import { LegalLayout, LegalSection, LegalP, LegalList } from '../components/legal/LegalLayout';

const UPDATED_AT = '21 de septiembre de 2026';
const CONTACT_EMAIL = 'albertoamasv@gmail.com';

export function TermsPage() {
  return (
    <LegalLayout icon="document" title="Términos y Condiciones" updatedAt={UPDATED_AT}>

      <LegalSection title="1. Quién ofrece el servicio">
        <LegalP>
          YankoPOS es un servicio de software (SaaS) para la gestión de restaurantes: pedidos, cocina, caja,
          reportes, gastos, clientes y sorteos. Lo ofrece <strong className="text-[var(--color-text-main)]">Alberto Amas Villarroel</strong>,
          persona natural con domicilio en Tarija, Bolivia (en adelante, "nosotros" o "el Proveedor").
        </LegalP>
        <LegalP>
          Al usar YankoPOS, la persona o negocio que contrata el servicio (en adelante, "el Cliente" o "tú") acepta
          estos Términos y Condiciones. Si no estás de acuerdo, no debes usar el servicio.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Cómo se accede al servicio">
        <LegalP>
          YankoPOS no tiene registro público: las cuentas se activan directamente por nosotros una vez acordado el
          plan (Básico, Pro o Negocio) con el Cliente. El Cliente designa un usuario propietario ("Owner"), quien a
          su vez puede crear cuentas de cajero para su personal dentro de los límites de su plan.
        </LegalP>
        <LegalP>
          El Cliente es responsable de mantener la confidencialidad de las credenciales de todas las cuentas de su
          negocio y de toda actividad que ocurra bajo ellas.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Planes y pago">
        <LegalP>
          Los planes disponibles y sus precios en bolivianos (Bs) son los publicados en{' '}
          <Link to="/" className="font-semibold text-primary-500 hover:underline">nuestro sitio</Link>. Las
          condiciones de pago se coordinan directamente con el Proveedor al contratar o renovar el servicio.
        </LegalP>
        <LegalP>
          Podemos actualizar los precios de los planes. Cualquier cambio se te comunicará con anticipación y no
          afectará al período ya pagado.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Tus datos y los datos de tus clientes">
        <LegalP>
          El Cliente conserva la propiedad de toda la información que carga en el sistema: su catálogo de productos,
          historial de ventas, gastos y los datos de sus propios clientes (nombre, teléfono, correo) que registre
          para seguimiento de pedidos, fidelización o sorteos.
        </LegalP>
        <LegalP>
          El Cliente es responsable de contar con una base legítima para recolectar y tratar los datos de sus
          propios clientes finales (por ejemplo, haberles informado para qué se usan). Nosotros actuamos como
          encargados del tratamiento de esos datos: los almacenamos y procesamos para que el sistema funcione,
          pero no los usamos con fines propios ni los compartimos con terceros ajenos al servicio. Más detalle en
          nuestra <Link to="/privacidad" className="font-semibold text-primary-500 hover:underline">Política de Privacidad</Link>.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Uso aceptable">
        <LegalP>Al usar YankoPOS, el Cliente se compromete a no:</LegalP>
        <LegalList>
          <li>Usar el servicio para fines ilícitos o para procesar datos de terceros sin su consentimiento.</li>
          <li>Intentar vulnerar, escanear o sobrecargar la infraestructura del servicio.</li>
          <li>Revender, sublicenciar o compartir el acceso contratado con negocios distintos al propio.</li>
          <li>Realizar ingeniería inversa del software con fines de copia o competencia directa.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="6. Disponibilidad del servicio">
        <LegalP>
          Nos esforzamos por mantener YankoPOS disponible de forma continua. El servicio puede sufrir
          interrupciones por mantenimiento programado, actualizaciones, causas de fuerza mayor o fallos de
          proveedores externos de infraestructura (hosting, red, terceros). En esos casos, trabajaremos para
          restablecer el servicio lo antes posible.
        </LegalP>
        <LegalP>
          Realizamos respaldos periódicos de la información, pero recomendamos al Cliente exportar y conservar sus
          propios registros críticos (por ejemplo, reportes de ventas) según su necesidad.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Propiedad intelectual">
        <LegalP>
          El software, el nombre "YankoPOS", su diseño y su código son propiedad del Proveedor. Estos Términos no
          transfieren ningún derecho de propiedad intelectual sobre el software al Cliente. Solo otorgan un
          derecho de uso mientras el servicio esté contratado y vigente.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Suspensión y cancelación">
        <LegalP>
          Podemos suspender o cancelar el acceso al servicio si el Cliente incumple estos Términos, no realiza el
          pago acordado, o hace un uso indebido del sistema. El Cliente puede solicitar la cancelación de su
          cuenta en cualquier momento contactándonos.
        </LegalP>
        <LegalP>
          Tras la cancelación, conservaremos los datos del Cliente durante un período razonable por si desea
          reactivar el servicio o exportar su información, y luego procederemos a eliminarlos conforme a lo
          descrito en nuestra Política de Privacidad.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Limitación de responsabilidad">
        <LegalP>
          YankoPOS se ofrece "tal cual". En la medida permitida por la ley, no seremos responsables por pérdidas
          indirectas, lucro cesante, o daños derivados de interrupciones del servicio, errores de terceros
          proveedores de infraestructura, o del uso que el Cliente haga del sistema (por ejemplo, precios o datos
          cargados incorrectamente).
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Cambios a estos Términos">
        <LegalP>
          Podemos actualizar estos Términos para reflejar cambios en el servicio o en la normativa aplicable. Los
          cambios relevantes se comunicarán al Cliente con anticipación razonable. El uso continuado del servicio
          después de una actualización implica su aceptación.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Ley aplicable">
        <LegalP>
          Estos Términos se rigen por las leyes del Estado Plurinacional de Bolivia. Cualquier controversia se
          resolverá ante los tribunales competentes de la ciudad de Tarija, salvo que la ley disponga otra cosa.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Contacto">
        <LegalP>
          Para consultas sobre estos Términos, escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-500 hover:underline">{CONTACT_EMAIL}</a>.
        </LegalP>
      </LegalSection>

    </LegalLayout>
  );
}
