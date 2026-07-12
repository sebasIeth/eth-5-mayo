import type { ReactNode } from "react";
import { OPERADOR } from "@/lib/legal";

export type DocLegal = { slug: string; titulo: string; intro: string; cuerpo: ReactNode };

const { nombreComercial, razonSocial, contacto, sitio } = OPERADOR;

// ============ TÉRMINOS Y CONDICIONES ============
const terminos: ReactNode = (
  <>
    <h2>1. Aceptación</h2>
    <p>
      Los presentes Términos y Condiciones (los “Términos”) regulan el acceso y
      uso de la plataforma digital del <strong>Sello de Turismo de Salud</strong>{" "}
      (la “Plataforma”), operada por {razonSocial} (“{nombreComercial}”, el
      “Operador”). Al iniciar sesión, marcar la casilla de aceptación y utilizar
      la Plataforma, el usuario (el “Establecimiento” o “Usuario”) declara haber
      leído, entendido y aceptado estos Términos, el Aviso de Privacidad y el
      apartado de Propiedad Intelectual. Si no está de acuerdo, deberá abstenerse
      de usar la Plataforma.
    </p>

    <h2>2. Objeto de la Plataforma</h2>
    <p>
      La Plataforma es una herramienta tecnológica que digitaliza el proceso de
      registro, verificación y seguimiento para la obtención del distintivo
      “Sello de Turismo de Salud”. Permite al Establecimiento capturar
      información, cargar evidencias y dar seguimiento a la revisión que realiza
      el consultor autorizado. La Plataforma <strong>no otorga por sí misma</strong>{" "}
      ninguna certificación, distintivo, aval o reconocimiento oficial; es un
      medio para gestionar el trámite.
    </p>

    <h2>3. Acceso y credenciales</h2>
    <p>
      El acceso se realiza mediante el correo y el código de acceso que el
      consultor comparte con cada Establecimiento. El Usuario es el único
      responsable de mantener la confidencialidad de dichas credenciales y de
      toda actividad realizada desde su cuenta. Deberá notificar de inmediato al
      Operador cualquier uso no autorizado. El Operador podrá suspender o
      cancelar accesos por motivos de seguridad, incumplimiento de estos Términos
      o inactividad.
    </p>

    <h2>4. Obligaciones del Usuario</h2>
    <p>El Usuario se obliga a:</p>
    <ul>
      <li>
        Proporcionar información <strong>veraz, completa y actualizada</strong>, y
        responder por su autenticidad. La captura de datos o evidencias falsas,
        alteradas o que no correspondan al establecimiento es causa de rechazo y
        de cancelación del proceso.
      </li>
      <li>
        Cargar únicamente documentación y fotografías de las que sea titular o
        cuente con autorización para usar.
      </li>
      <li>
        No utilizar la Plataforma para fines ilícitos, ni intentar vulnerar su
        seguridad, integridad o disponibilidad.
      </li>
      <li>Cumplir con la legislación aplicable en materia sanitaria y turística.</li>
    </ul>

    <h2>5. Proceso de verificación</h2>
    <p>
      La revisión de la información y el otorgamiento o negativa del distintivo
      corresponden al consultor y a las instancias competentes, conforme a sus
      propios criterios y a la normatividad aplicable. El resultado del proceso{" "}
      <strong>no está garantizado</strong> por el uso de la Plataforma. Los
      tiempos de revisión son estimados y pueden variar.
    </p>

    <h2>6. Limitación de responsabilidad</h2>
    <p>
      La Plataforma se ofrece “tal cual” y “según disponibilidad”. En la máxima
      medida permitida por la ley, el Operador no será responsable por daños
      directos o indirectos, pérdida de datos, lucro cesante o perjuicios
      derivados de: (i) el uso o imposibilidad de uso de la Plataforma; (ii)
      información capturada por el Usuario; (iii) decisiones de las autoridades o
      consultores; o (iv) fallas, interrupciones o causas de fuerza mayor. El
      Usuario es responsable de conservar copia de la información que carga.
    </p>

    <h2>7. Disponibilidad y modificaciones</h2>
    <p>
      El Operador podrá modificar, suspender o descontinuar total o parcialmente
      la Plataforma, así como actualizar estos Términos en cualquier momento. Las
      modificaciones relevantes se notificarán en la Plataforma y requerirán una
      nueva aceptación en el siguiente inicio de sesión.
    </p>

    <h2>8. Ley aplicable y jurisdicción</h2>
    <p>
      Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para
      la interpretación y cumplimiento, las partes se someten a los tribunales
      competentes de la Ciudad de México, renunciando a cualquier otro fuero que
      pudiera corresponderles.
    </p>

    <h2>9. Contacto</h2>
    <p>
      Para dudas sobre estos Términos: <a href={`mailto:${contacto}`}>{contacto}</a>.
    </p>
  </>
);

// ============ AVISO DE PRIVACIDAD ============
const privacidad: ReactNode = (
  <>
    <p>
      En cumplimiento de la <strong>Ley Federal de Protección de Datos
      Personales en Posesión de los Particulares</strong> (LFPDPPP), su
      Reglamento y los Lineamientos del Aviso de Privacidad, se pone a
      disposición el presente Aviso.
    </p>

    <h2>1. Responsable</h2>
    <p>
      {razonSocial} (“{nombreComercial}”), con domicilio en México y sitio{" "}
      {sitio}, es responsable del tratamiento y protección de sus datos
      personales.
    </p>

    <h2>2. Datos que recabamos</h2>
    <p>Para las finalidades descritas podemos recabar:</p>
    <ul>
      <li>
        <strong>De identificación y contacto:</strong> nombre, correo
        electrónico, teléfono, cargo y firma.
      </li>
      <li>
        <strong>Del establecimiento:</strong> razón social, RFC, domicilio,
        giro, datos del representante y del ejecutivo responsable.
      </li>
      <li>
        <strong>Del proceso:</strong> respuestas de verificación, documentos y
        fotografías (evidencias) que usted cargue.
      </li>
    </ul>
    <p>
      No recabamos datos personales sensibles de forma intencional. En caso de
      que las evidencias que usted cargue los contengan, es su responsabilidad
      contar con el consentimiento correspondiente.
    </p>

    <h2>3. Finalidades</h2>
    <p>
      <strong>Primarias</strong> (necesarias para el servicio): gestionar su
      registro y verificación del Sello de Turismo de Salud; permitir la revisión
      del consultor; generar los formatos oficiales; darle seguimiento y
      contactarlo sobre el trámite.
    </p>
    <p>
      <strong>Secundarias</strong> (no necesarias): envío de información,
      novedades o mejoras del servicio. Si no desea que sus datos se usen para
      fines secundarios, puede manifestarlo en cualquier momento al correo de
      contacto; ello no será condición para el servicio.
    </p>

    <h2>4. Transferencias y encargados</h2>
    <p>
      Utilizamos proveedores tecnológicos que tratan datos por nuestra cuenta
      (alojamiento, base de datos, almacenamiento de archivos y envío de correo).
      Sus datos podrán compartirse con el consultor autorizado y con las
      autoridades competentes cuando el trámite lo requiera o por mandato legal.
      No comercializamos sus datos personales.
    </p>

    <h2>5. Derechos ARCO</h2>
    <p>
      Usted puede ejercer sus derechos de <strong>Acceso, Rectificación,
      Cancelación u Oposición</strong> (ARCO), así como revocar su
      consentimiento, enviando su solicitud a{" "}
      <a href={`mailto:${contacto}`}>{contacto}</a>, indicando su nombre, el
      establecimiento y una descripción clara de los datos y el derecho que desea
      ejercer. Daremos respuesta en los plazos que marca la ley.
    </p>

    <h2>6. Conservación y seguridad</h2>
    <p>
      Conservamos sus datos durante el tiempo necesario para el proceso y para
      cumplir obligaciones legales. Aplicamos medidas de seguridad
      administrativas, técnicas y físicas razonables para proteger su
      información.
    </p>

    <h2>7. Uso de cookies</h2>
    <p>
      La Plataforma utiliza cookies estrictamente necesarias para el inicio de
      sesión y el funcionamiento del sitio.
    </p>

    <h2>8. Cambios al Aviso</h2>
    <p>
      Este Aviso puede actualizarse. Las modificaciones se publicarán en la
      Plataforma y, cuando corresponda, se solicitará nuevamente su aceptación.
    </p>
  </>
);

// ============ PROPIEDAD INTELECTUAL ============
const propiedad: ReactNode = (
  <>
    <h2>1. Titularidad</h2>
    <p>
      El software, diseño, código, interfaces, textos, gráficos y demás
      elementos de la Plataforma son propiedad del Operador o de sus licenciantes
      y están protegidos por la legislación de propiedad industrial y derechos de
      autor aplicable en México y por tratados internacionales.
    </p>

    <h2>2. Marcas y distintivos oficiales</h2>
    <p>
      Las denominaciones, logotipos y distintivos “Sello de Turismo de Salud”,
      “Turismo de Salud México”, así como los emblemas de la Secretaría de
      Turismo y del Gobierno de México, son marcas y símbolos de sus respectivos
      titulares. Su uso en la Plataforma es exclusivamente para efectos del
      trámite y no concede al Usuario ningún derecho sobre ellos. Queda prohibido
      su uso, reproducción o exhibición fuera del marco autorizado.
    </p>

    <h2>3. Contenido del Usuario</h2>
    <p>
      El Usuario conserva la titularidad de la documentación y fotografías que
      carga. Al subirlas, otorga al Operador y al consultor una licencia limitada,
      no exclusiva y sin costo para almacenarlas, procesarlas, reproducirlas y
      usarlas <strong>únicamente</strong> con el fin de gestionar y evidenciar el
      proceso de verificación. El Usuario declara contar con los derechos y
      autorizaciones necesarios sobre dicho contenido.
    </p>

    <h2>4. Conductas prohibidas</h2>
    <p>Salvo autorización previa y por escrito del Operador, queda prohibido:</p>
    <ul>
      <li>Copiar, modificar, distribuir o crear obras derivadas de la Plataforma.</li>
      <li>Realizar ingeniería inversa, descompilar o extraer su código fuente.</li>
      <li>Utilizar marcas, logotipos o contenidos con fines distintos al trámite.</li>
      <li>Emplear robots, scraping u otros medios automatizados no autorizados.</li>
    </ul>

    <h2>5. Reporte de infracciones</h2>
    <p>
      Si considera que algún contenido vulnera derechos de propiedad intelectual,
      escriba a <a href={`mailto:${contacto}`}>{contacto}</a>.
    </p>
  </>
);

export const DOCS: Record<string, DocLegal> = {
  terminos: {
    slug: "terminos",
    titulo: "Términos y Condiciones",
    intro:
      "Reglas para el acceso y uso de la plataforma del Sello de Turismo de Salud.",
    cuerpo: terminos,
  },
  privacidad: {
    slug: "privacidad",
    titulo: "Aviso de Privacidad",
    intro:
      "Cómo tratamos y protegemos tus datos personales conforme a la LFPDPPP.",
    cuerpo: privacidad,
  },
  "propiedad-intelectual": {
    slug: "propiedad-intelectual",
    titulo: "Propiedad Intelectual",
    intro:
      "Derechos sobre la plataforma, las marcas oficiales y tu contenido.",
    cuerpo: propiedad,
  },
};
