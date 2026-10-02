import { LegalContact, LegalLayout, LegalLink, LegalList, LegalP, LegalSection, type LegalSectionRef } from '../components/legal/LegalLayout';

const UPDATED_AT = '2 de octubre de 2026';

const SECTIONS: LegalSectionRef[] = [
  { id: 'responsable', title: '1. Responsable del tratamiento' },
  { id: 'datos', title: '2. Qué datos recolectamos' },
  { id: 'imagenes', title: '3. Imágenes que subes' },
  { id: 'uso', title: '4. Para qué usamos los datos' },
  { id: 'terceros', title: '5. Con quién compartimos los datos' },
  { id: 'seguridad', title: '6. Cómo protegemos tus datos' },
  { id: 'conservacion', title: '7. Cuánto tiempo conservamos los datos' },
  { id: 'navegador', title: '8. Almacenamiento en tu navegador' },
  { id: 'derechos', title: '9. Tus derechos' },
  { id: 'menores', title: '10. Menores de edad' },
  { id: 'cambios', title: '11. Cambios a esta Política' },
  { id: 'contacto', title: '12. Contacto' },
];

export function PrivacyPage() {
  return (
    <LegalLayout
      icon="lock"
      title="Política de privacidad"
      summary="Qué datos guarda YankoPOS, para qué los usa, con quién los comparte y cómo puedes pedir que los corrijamos o borremos."
      updatedAt={UPDATED_AT}
      sections={SECTIONS}
    >

      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <LegalP>
          Esta Política aplica al servicio YankoPOS, operado por{' '}
          <strong className="text-main">Alberto Amas Villarroel</strong>, persona natural con
          domicilio en Tarija, Bolivia. Para cualquier consulta sobre tus datos, puedes escribirnos a{' '}
          <LegalContact />.
        </LegalP>
        <LegalP>
          YankoPOS es un servicio de negocio a negocio (B2B): lo contratan restaurantes, no consumidores
          individuales. Por eso esta Política distingue dos roles:
        </LegalP>
        <LegalList>
          <li>
            <strong className="text-main">Datos del Cliente</strong> (el restaurante y su
            personal): aquí nosotros somos responsables del tratamiento.
          </li>
          <li>
            <strong className="text-main">Datos de los clientes del restaurante</strong>{' '}
            (los comensales que el Cliente registra en el sistema): aquí el Cliente es responsable, y nosotros
            actuamos como encargados. Almacenamos y procesamos esos datos por cuenta del Cliente, no con fines
            propios.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="datos" title="2. Qué datos recolectamos">
        <LegalP><strong className="text-main">Del Cliente y su equipo:</strong></LegalP>
        <LegalList>
          <li>Nombre, correo electrónico y contraseña (almacenada de forma cifrada, nunca en texto plano).</li>
          <li>Rol (propietario o cajero) y sucursal asignada.</li>
          <li>Datos del negocio: nombre comercial, dirección, teléfono y la frase del recibo, si los configuras.</li>
        </LegalList>

        <LegalP className="pt-2"><strong className="text-main">Sobre la operación del restaurante:</strong></LegalP>
        <LegalList>
          <li>Pedidos, productos, precios, pagos, gastos y sesiones de caja registrados en el sistema.</li>
          <li>Datos de los clientes del restaurante que el Cliente decida registrar: nombre, teléfono, correo,
            notas y su historial de pedidos o participación en sorteos.</li>
        </LegalList>

        <LegalP className="pt-2"><strong className="text-main">Datos técnicos:</strong></LegalP>
        <LegalList>
          <li>Un token de sesión (JWT) guardado en el navegador para mantener tu sesión iniciada.</li>
          <li>Registros técnicos del servidor (dirección IP, fecha y hora de las solicitudes) usados para
            seguridad y diagnóstico.</li>
          <li>Métricas de uso agregadas de la infraestructura (tiempos de respuesta, errores), que no perfilan
            a personas y sirven solo para mantener el servicio funcionando.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="imagenes" title="3. Imágenes que subes">
        <LegalP>
          Las imágenes que subes al sistema (fotos de productos) se guardan con un nombre de archivo
          aleatorio y quedan accesibles mediante una URL pública. Cualquier persona que conozca esa URL exacta
          puede ver la imagen, aunque no esté listada ni sea buscable. Por eso, no subas imágenes con información
          sensible.
        </LegalP>
      </LegalSection>

      <LegalSection id="uso" title="4. Para qué usamos los datos">
        <LegalList>
          <li>Prestar el servicio: procesar pedidos, generar reportes, administrar caja y usuarios.</li>
          <li>Mantener la seguridad de las cuentas y prevenir accesos no autorizados.</li>
          <li>Comunicarnos contigo sobre tu cuenta, cambios en el servicio o soporte técnico.</li>
          <li>Diagnosticar y corregir errores del sistema.</li>
        </LegalList>
        <LegalP>
          No usamos los datos para publicidad, no los vendemos ni los compartimos con terceros para fines
          comerciales propios de esos terceros. No hay rastreadores de publicidad ni de redes sociales en el
          sitio ni en la aplicación; la única medición de visitas es la de Cloudflare, descrita abajo.
        </LegalP>
      </LegalSection>

      <LegalSection id="terceros" title="5. Con quién compartimos los datos">
        <LegalP>
          Usamos proveedores externos únicamente para operar la infraestructura del servicio, no para fines
          propios de ellos:
        </LegalP>
        <LegalList>
          <li>Un proveedor de servidor (VPS) donde corre la aplicación y la base de datos.</li>
          <li>Cloudflare, como proxy de red que cifra el tráfico entre tu navegador y nuestros servidores.
            También mide las visitas al sitio (Cloudflare Web Analytics) de forma agregada y sin cookies: cuenta
            páginas vistas, no identifica a personas.</li>
          <li>Grafana Cloud, para monitorear el rendimiento técnico de la infraestructura. Recibe métricas
            operativas, no tus datos de negocio.</li>
        </LegalList>
        <LegalP>
          Solo compartiríamos datos con autoridades si una ley boliviana nos obliga a hacerlo.
        </LegalP>
      </LegalSection>

      <LegalSection id="seguridad" title="6. Cómo protegemos tus datos">
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

      <LegalSection id="conservacion" title="7. Cuánto tiempo conservamos los datos">
        <LegalP>
          Conservamos los datos mientras tu cuenta esté activa. Si cancelas el servicio, conservamos la
          información por un período razonable por si deseas reactivarlo o exportar tus registros, y luego la
          eliminamos, salvo que debamos conservar ciertos datos por más tiempo para cumplir una obligación legal
          (por ejemplo, registros con relevancia contable).
        </LegalP>
      </LegalSection>

      <LegalSection id="navegador" title="8. Almacenamiento en tu navegador">
        <LegalP>
          El sistema guarda en tu navegador (localStorage) tu sesión y algunas preferencias para no pedírtelas en
          cada visita: la sucursal seleccionada, el tema claro u oscuro, el menú contraído, el sonido de la
          cocina y las opciones de ese dispositivo (mostrar fotos de productos, imprimir la comanda al
          confirmar). Con "Recordar sesión" la sesión dura hasta 30 días; sin marcarlo, solo hasta cerrar el
          navegador. No usamos cookies de rastreo ni de terceros.
        </LegalP>
      </LegalSection>

      <LegalSection id="derechos" title="9. Tus derechos">
        <LegalP>
          Puedes solicitarnos acceder, corregir o eliminar tus datos personales, o los de tu negocio, escribiendo a{' '}
          <LegalContact />.
          Si eres un cliente final de un restaurante que usa YankoPOS y quieres ejercer estos derechos sobre tus
          propios datos, contacta directamente a ese restaurante: es quien decide qué información tuya registra.
        </LegalP>
      </LegalSection>

      <LegalSection id="menores" title="10. Menores de edad">
        <LegalP>
          YankoPOS es un servicio dirigido a negocios, no a menores de edad. No solicitamos intencionalmente datos
          de menores más allá de los que un restaurante pueda registrar como parte del historial de un pedido.
        </LegalP>
      </LegalSection>

      <LegalSection id="cambios" title="11. Cambios a esta Política">
        <LegalP>
          Podemos actualizar esta Política para reflejar cambios en el servicio o en la normativa aplicable. La
          fecha de "Última actualización" al inicio de esta página indica la versión vigente.
        </LegalP>
      </LegalSection>

      <LegalSection id="contacto" title="12. Contacto">
        <LegalP>
          Para cualquier consulta sobre esta Política o el tratamiento de tus datos, escríbenos a{' '}
          <LegalContact />.
          También puedes revisar nuestros{' '}
          <LegalLink to="/terminos">Términos y condiciones</LegalLink>.
        </LegalP>
      </LegalSection>

    </LegalLayout>
  );
}
