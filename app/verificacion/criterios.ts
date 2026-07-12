// Criterio de evaluación por indicador (MSE-FO-55): las evidencias que debe
// presentar el establecimiento para que el punto se considere cumplido.
// Fuente: documento oficial de criterios de la SECTUR.

const SINERGIA_ALT =
  "Si no cuenta con la instalación propia, deberá presentar de una sinergia: convenio escaneado al 100%, foto del lugar, página web/red social, licencia de funcionamiento y catálogo de servicios y precios.";

export const CRITERIOS: Record<string, string[]> = {
  // F1 · Comunicación
  "1.1": [
    "Captura de pantalla de la página web del establecimiento.",
    "Captura de la sección donde se muestran los servicios de salud y bienestar.",
    "Captura del botón de traducción de idioma.",
    "Link de la página web.",
  ],
  "1.2": [
    "Links de las redes sociales del establecimiento.",
    "Capturas de pantalla de publicaciones relacionadas con turismo de salud y bienestar.",
    "Links directos a dichas publicaciones.",
  ],
  "1.3": [
    "Convenio escaneado al 100% de cada sinergia.",
    "Foto del lugar de cada sinergia comercial.",
    "Página web/red social de cada sinergia.",
    "Licencia de funcionamiento de cada sinergia.",
  ],
  "1.4": [
    "Captura de la página del portal turístico oficial “Visit Mexico”.",
    "Captura de la interacción con la asistencia virtual/chat.",
    "Captura del registro de la empresa en el portal de “Visit Mexico”.",
  ],
  "1.5": [
    "Fotografías/imágenes de los folletos y tarjetas de los lugares de salud y bienestar que se promocionan en el establecimiento.",
    "Fotografía panorámica de cómo se exhiben estos promocionales en el establecimiento (ej. acrílico en recepción).",
  ],
  "1.6": [
    "Captura de pantalla de cada portal de reservación en el que participa (Trivago, Booking, etc.).",
    "Link de enlace de cada portal.",
    "Captura de otros enlaces de buscadores como Google Maps.",
  ],
  "1.7": [
    "Convenio escaneado al 100% de cada sinergia.",
    "Foto del lugar de cada sinergia comercial.",
    "Página web/red social de cada sinergia.",
  ],

  // F2 · Instalaciones
  "2.1": [
    "Evidencias fotográficas de las habitaciones adaptadas, mostrando cada característica de accesibilidad (ubicación, baño, mobiliario, apoyos).",
  ],
  "2.2": [
    "Evidencia escaneada o fotográfica del paquete especial impreso, tal como se exhibe al público (tarifas, beneficios, condiciones).",
  ],
  "2.3": [
    "Evidencia fotográfica de las habitaciones comunicadas y su distribución.",
  ],
  "2.4": [
    "Evidencia fotográfica del área/servicio de spa.",
    "Catálogo de servicios y precios.",
    SINERGIA_ALT,
  ],
  "2.5": [
    "Evidencia fotográfica de la tina de hidromasaje.",
    "Catálogo de servicios y precios.",
    SINERGIA_ALT,
  ],
  "2.6": [
    "Evidencia fotográfica del área/servicio de sauna y/o vapor.",
    "Catálogo de servicios y precios.",
    SINERGIA_ALT,
  ],
  "2.7": [
    "Evidencia fotográfica del área/servicio del gimnasio.",
    "Catálogo de servicios y precios.",
    SINERGIA_ALT,
  ],
  "2.8": [
    "Evidencia fotográfica de las vistas escénicas o lugares de relajación, desde distintos puntos del establecimiento.",
  ],
  "2.9": [
    "Evidencia fotográfica de la señalética en inglés ubicada en distintos puntos del establecimiento.",
  ],

  // F3 · Transparencia
  "3.1": [
    "Evidencia fotográfica del catálogo de precios de servicios de salud ofrecidos directamente en el sitio del establecimiento.",
    "Catálogos de servicios/precios de las sinergias cuando existan.",
    "Evidencia de promociones especiales propias cuando aplique.",
  ],
  "3.2": [
    "Catálogo de servicios de salud escaneado al 100% donde se muestren las certificaciones.",
  ],
  "3.3": ["Certificados escaneados con vigencia."],
  "3.4": ["Certificados escaneados con vigencia."],
  "3.5": [
    "Evidencia fotográfica del catálogo en inglés propio.",
    "Evidencia fotográfica de catálogos en inglés de las sinergias cuando aplique.",
  ],
  "3.6": [
    "Captura de pantalla del promocional propio con precios en dólares y/o pesos.",
    "Captura de precios en dólares de la(s) sinergia(s) cuando aplique.",
  ],
  "3.7": [
    "Evidencia fotográfica del medio donde se informa el tipo de cambio (físico o digital).",
    "Captura de la fuente oficial consultada para el tipo de cambio al día.",
  ],
  "3.8": [
    "Capturas del formato/sistema/registro mostrando las políticas en inglés y español.",
    "Documentos escaneados de las sinergias con sus políticas en inglés cuando aplique.",
  ],

  // F4 · Servicio
  "4.1": ["Documento escaneado/fotográfico del distintivo obtenido y vigente."],
  "4.2": [
    "Evidencia fotográfica del menú saludable.",
    "Documentación que acredite al experto responsable (cédula profesional del chef o nutriólogo).",
  ],
  "4.3": [
    "Captura de la convocatoria a cada capacitación.",
    "Evidencia fotográfica de los cursos impartidos.",
    "Lista de asistencia.",
    "Diplomas o constancias del personal.",
  ],
  "4.4": [
    "Convenio escaneado al 100% con alguna sinergia.",
    "Foto del lugar de cada sinergia comercial.",
    "Página web/red social de cada sinergia.",
    "Licencia de funcionamiento de cada sinergia.",
    "Catálogo de servicios y precios.",
  ],
  "4.5": [
    "Documentos/certificaciones del personal capacitado para brindar la atención (ej. cédula profesional del médico/enfermera/técnico interno y/o de las sinergias).",
  ],
  "4.6": [
    "Constancia(s) de afiliación vigente.",
    "Captura del pago/factura realizado a la(s) asociación(es).",
  ],
  "4.7": [
    "Fotografías o documentos escaneados de los certificados de dominio del inglés del personal médico/técnico, interno y/o de las sinergias.",
  ],
  "4.8": [
    "Fotografías o documentos escaneados de los certificados de dominio del inglés del personal de servicio y atención, interno o externo.",
  ],
  "4.9": [
    "Evidencia fotográfica o escaneada del menú traducido al inglés.",
    "Evidencia fotográfica del menú en español.",
  ],
  "4.10": [
    "Convenio escaneado al 100% de cada sinergia.",
    "Catálogos de servicios y precios de ambulancia y taxis.",
    "Folleto/mapa escaneado para difusión y promoción de los lugares o servicios turísticos.",
  ],
  "4.11": [
    "Evidencia fotográfica de los formatos institucionales traducidos al inglés (registros, tarifarios, avisos, encuestas de satisfacción, reglamentos, consentimientos, etc.).",
  ],

  // F5 · Educación
  "5.1": [
    "Evidencia fotográfica de las sesiones de capacitación en temas de turismo de salud.",
    "Diplomas/constancias escaneadas de participación.",
  ],
  "5.2": [
    "Documentos/certificaciones y currículos del personal capacitado para brindar la atención (ej. cédula profesional del médico/enfermera/técnico interno y/o de las sinergias).",
  ],
  "5.3": [
    "Evidencia fotográfica de la capacitación/plática impartida al personal de las distintas áreas del establecimiento.",
    "Diplomas/constancias escaneadas de participación.",
  ],
  "5.4": [
    "Programa de capacitación anual donde se refleje la programación de los cursos.",
    "Evidencia fotográfica de las capacitaciones impartidas al personal, vigentes.",
  ],
};
