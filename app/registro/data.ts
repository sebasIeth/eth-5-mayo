// Estructura del "Formato de Registro" (MSE-FO-28) — Segmentos Especializados

export const GIROS = [
  "Hospital",
  "Clínica",
  "Consultorio",
  "Spa",
  "Centro de relajación",
  "Club de golf",
  "Hotel",
  "Restaurante",
  "Agencia de viajes / Operadora",
] as const;

export const ESTADOS_MX = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

// Documentos solicitados para elaborar el Sello (entregados en electrónico)
export const DOCUMENTOS = [
  { codigo: "MSE-FO-28", nombre: "Formato de registro de Segmentos Especializados" },
  { codigo: "MSE-FO-29", nombre: "Carta Intención" },
  { codigo: "MSE-FO-55", nombre: "Lista de Verificación inicial" },
  { codigo: "MSE-FO-32", nombre: "Carta Adhesión de Empresas" },
  { codigo: "MSE-FO-55", nombre: "Lista de Verificación final" },
  { codigo: "MSE-FO-41", nombre: "Caso de Éxito (proceso de renovación)" },
  { codigo: "MSE-FO-55B", nombre: "Lista de Verificación del Consultor" },
  { codigo: "Carpeta", nombre: "Evidencia Fotográfica" },
  { codigo: "MSE-FO-31", nombre: "Formato Base Matriz" },
  { codigo: "RNT", nombre: "Registro Nacional de Turismo (obligatorio y actualizado)" },
  { codigo: "MSE-FO-59", nombre: "Calculadora de Sello" },
  { codigo: "MSE-FO-57", nombre: "Plan 3W" },
  { codigo: "MSE-FO-09", nombre: "Encuesta de Satisfacción" },
] as const;

// Clave única por documento (código + nombre, porque algunos códigos se repiten)
export const docKey = (d: { codigo: string; nombre: string }) =>
  `${d.codigo}::${d.nombre}`;
