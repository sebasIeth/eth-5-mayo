// Versión vigente de los documentos legales. Si cambian los términos, sube
// esta versión y todos los usuarios deberán volver a aceptar en su siguiente
// inicio de sesión.
export const LEGAL_VERSION = "2026-07-12";
export const LEGAL_FECHA = "12 de julio de 2026";

// Datos del responsable / operador de la plataforma. Ajusta con los datos
// legales reales (razón social, RFC, domicilio) antes de operar en producción.
export const OPERADOR = {
  nombreComercial: "Directiva · Segmentos Especializados",
  razonSocial: "Segmentos Especializados (Directiva Desarrollo de Negocios)",
  contacto: "contacto@directivanegocios.com",
  sitio: "directivanegocios.com",
};

export const DOCS_LEGALES = [
  { slug: "terminos", titulo: "Términos y Condiciones" },
  { slug: "privacidad", titulo: "Aviso de Privacidad" },
  { slug: "propiedad-intelectual", titulo: "Propiedad Intelectual" },
] as const;
