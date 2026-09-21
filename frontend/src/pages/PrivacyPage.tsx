import { Link } from 'react-router-dom';
import { LegalLayout, LegalSection, LegalP, LegalList } from '../components/legal/LegalLayout';

const UPDATED_AT = '21 de septiembre de 2026';
const CONTACT_EMAIL = 'albertoamasv@gmail.com';

export function PrivacyPage() {
  return (
    <LegalLayout icon="lock" title="Política de Privacidad" updatedAt={UPDATED_AT}>

      <LegalSection title="1. Responsable del tratamiento">
        <LegalP>
          Esta Política aplica al servicio YankoPOS, operado por{' '}
          <strong className="text-[var(--color-text-main)]">Alberto Amas Villarroel</strong>, persona natural con
          domicilio en Tarija, Bolivia. Para cualquier consulta sobre tus datos, puedes escribir a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-500 hover:underline">{CONTACT_EMAIL}</a>.
        </LegalP>
        <LegalP>
          YankoPOS es un servicio de negocio a negocio (B2B): lo contratan restaurantes, no consumidores
          individuales. Por eso esta Política distingue dos roles:
        </LegalP>
        <LegalList>
          <li>
            <strong className="text-[var(--color-text-main)]">Datos del Cliente</strong> (el restaurante y su
            personal): aquí nosotros somos responsables del tratamiento.
          </li>
          <li>
            <strong className="text-[var(--color-text-main)]">Datos de los clientes del restaurante</strong>{' '}
            (los comensales que el Cliente registra en el sistema): aquí el Cliente es responsable, y nosotros
            actuamos como encargados. Almacenamos y procesamos esos datos por cuenta del Cliente, no con fines
            propios.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. Qué datos recolectamos">
        <LegalP><strong className="text-[var(--color-text-main)]">Del Cliente y su equipo:</strong></LegalP>
        <LegalList>
          <li>Nombre, correo electrónico y contraseña (almacenada de forma cifrada, nunca en texto plano).</li>
          <li>Rol (propietario o cajero) y sucursal asignada.</li>
          <li>Datos del negocio: nombre comercial, dirección, teléfono y logotipo, si los configuras.</li>
        </LegalList>

        <LegalP className="pt-2"><strong className="text-[var(--color-text-main)]">Sobre la operación del restaurante:</strong></LegalP>
        <LegalList>
          <li>Pedidos, productos, precios, pagos, gastos y sesiones de caja registrados en el sistema.</li>
          <li>Datos de los clientes del restaurante que el Cliente decida registrar: nombre, teléfono, correo,
            notas y su historial de pedidos o participación en sorteos.</li>
        </LegalList>

        <LegalP className="pt-2"><strong className="text-[var(--color-text-main)]">Datos técnicos:</strong></LegalP>
        <LegalList>
          <li>Un token de sesión (JWT) guardado en el navegador para mantener tu sesión iniciada.</li>
          <li>Registros técnicos del servidor (dirección IP, fecha y hora de las solicitudes) usados para
            seguridad y diagnóstico.</li>
          <li>Métricas de uso agregadas de la infraestructura (tiempos de respuesta, errores), que no perfilan
            a personas y sirven solo para mantener el servicio funcionando.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Imágenes que subes">
        <LegalP>
          Las imágenes que subes al sistema (fotos de productos, logotipo) se guardan con un nombre de archivo
          aleatorio y quedan accesibles mediante una URL pública. Cualquier persona que conozca esa URL exacta
          puede ver la imagen, aunque no esté listada ni sea buscable. Por eso, no subas imágenes con información
          sensible.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Para qué usamos los datos">
        <LegalList>
          <li>Prestar el servicio: procesar pedidos, generar reportes, administrar caja y usuarios.</li>
          <li>Mantener la seguridad de las cuentas y prevenir accesos no autorizados.</li>
          <li>Comunicarnos contigo sobre tu cuenta, cambios en el servicio o soporte técnico.</li>
          <li>Diagnosticar y corregir errores del sistema.</li>
        </LegalList>
        <LegalP>
          No usamos los datos para publicidad, no los vendemos ni los compartimos con terceros para fines
          comerciales propios de esos terceros. No hay rastreadores de publicidad ni de redes sociales en el
          sitio ni en la aplicación.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Con quién compartimos los datos">
        <LegalP>
          Usamos proveedores externos únicamente para operar la infraestructura del servicio, no para fines
          propios de ellos:
        </LegalP>
        <LegalList>
          <li>Un proveedor de servidor (VPS) donde corre la aplicación y la base de datos.</li>
          <li>Cloudflare, como proxy de red que cifra el tráfico entre tu navegador y nuestros servidores.</li>
          <li>Grafana Cloud, para monitorear el rendimiento técnico de la infraestructura. Recibe métricas
            operativas, no tus datos de negocio.</li>
        </LegalList>
        <LegalP>
          Solo compartiríamos datos con autoridades si una ley boliviana nos obliga a hacerlo.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Cómo protegemos tus datos">
        <LegalList>
          <li>Las contraseñas se almacenan cifradas (hash), nunca en texto plano.</li>
          <li>Todo el tráfico entre tu navegador y el servicio viaja cifrado (HTTPS).</li>
          <li>Las sesiones expiran automáticamente tras un período de inactividad.</li>
          <li>Cada negocio (tenant) tiene sus datos aislados de los demás dentro del sistema.</li>
          <li>Hacemos respaldos periódicos de la base de datos.</li>
        </LegalList>
        <LegalP>
          Ningún sistema es 100% invulnerable. Si detectamos un incidente de seguridad que afecte tus datos, te lo
          notificaremos.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Cuánto tiempo conservamos los datos">
        <LegalP>
          Conservamos los datos mientras tu cuenta esté activa. Si cancelas el servicio, conservamos la
          información por un período razonable por si deseas reactivarlo o exportar tus registros, y luego la
          eliminamos, salvo que debamos conservar ciertos datos por más tiempo para cumplir una obligación legal
          (por ejemplo, registros con relevancia contable).
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Almacenamiento en tu navegador">
        <LegalP>
          El sistema guarda en tu navegador (localStorage) tu token de sesión y la sucursal que seleccionaste, para
          no pedírtelos de nuevo en cada visita. No usamos cookies de rastreo ni de terceros.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Tus derechos">
        <LegalP>
          Puedes solicitarnos acceder, corregir o eliminar tus datos personales, o los de tu negocio, escribiendo a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-500 hover:underline">{CONTACT_EMAIL}</a>.
          Si eres un cliente final de un restaurante que usa YankoPOS y quieres ejercer estos derechos sobre tus
          propios datos, contacta directamente a ese restaurante: es quien decide qué información tuya registra.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Menores de edad">
        <LegalP>
          YankoPOS es un servicio dirigido a negocios, no a menores de edad. No solicitamos intencionalmente datos
          de menores más allá de los que un restaurante pueda registrar como parte del historial de un pedido.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Cambios a esta Política">
        <LegalP>
          Podemos actualizar esta Política para reflejar cambios en el servicio o en la normativa aplicable. La
          fecha de "Última actualización" al inicio de esta página indica la versión vigente.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Contacto">
        <LegalP>
          Para cualquier consulta sobre esta Política o el tratamiento de tus datos, escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-500 hover:underline">{CONTACT_EMAIL}</a>.
          También puedes revisar nuestros{' '}
          <Link to="/terminos" className="font-semibold text-primary-500 hover:underline">Términos y Condiciones</Link>.
        </LegalP>
      </LegalSection>

    </LegalLayout>
  );
}
