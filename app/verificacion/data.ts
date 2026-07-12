// MSE-FO-55 — Lista de Verificación Inicial (Diagnóstico)
// 5 familias, 37 indicadores. Cada indicador es P (prioritario, 2 pts) o
// C (complementario, 1 pt). Se responde: "na" (no aplica), "no" (aplica y no
// cumple) o "si" (aplica y sí cumple). El % de cumplimiento se calcula sobre
// los indicadores APLICABLES; el mínimo para el Sello es 80%.

export type Tipo = "P" | "C";
export type Respuesta = "na" | "no" | "si";

export type Pregunta = {
  codigo: string;
  tipo: Tipo;
  texto: string;
};

export type Familia = {
  id: string; // "F1"..."F5"
  nombre: string;
  preguntas: Pregunta[];
};

export const PUNTOS: Record<Tipo, number> = { P: 2, C: 1 };

export const FAMILIAS: Familia[] = [
  {
    id: "F1",
    nombre: "Comunicación",
    preguntas: [
      { codigo: "1.1", tipo: "P", texto: "¿El establecimiento cuenta con elementos promocionales de turismo de salud en inglés en su página de internet?" },
      { codigo: "1.2", tipo: "P", texto: "¿El establecimiento cuenta con presencia en redes sociales con información de turismo de salud?" },
      { codigo: "1.3", tipo: "P", texto: "¿El establecimiento cuenta con sinergias comerciales con hospitales, clínicas, spas, centros de relajación, centros de retiro, etc., relacionadas con el turismo de salud?" },
      { codigo: "1.4", tipo: "P", texto: "¿El establecimiento conoce a detalle la lista de empresas publicadas en “Visit Mexico” y los servicios de turismo de salud que ofrecen?" },
      { codigo: "1.5", tipo: "C", texto: "¿El establecimiento cuenta con información de sitios turísticos de bienestar y relajación?" },
      { codigo: "1.6", tipo: "C", texto: "¿El establecimiento participa en sitios de referencia turística?" },
      { codigo: "1.7", tipo: "P", texto: "¿El establecimiento cuenta con alguna sinergia comprobable en el extranjero para captación de pacientes?" },
    ],
  },
  {
    id: "F2",
    nombre: "Instalaciones",
    preguntas: [
      { codigo: "2.1", tipo: "P", texto: "¿El establecimiento cuenta con habitaciones especiales para recuperación del paciente?" },
      { codigo: "2.2", tipo: "C", texto: "¿El establecimiento cuenta con paquetes especiales en habitaciones para familiares de pacientes?" },
      { codigo: "2.3", tipo: "C", texto: "¿El establecimiento cuenta con habitaciones comunicadas para paciente y familiares?" },
      { codigo: "2.4", tipo: "C", texto: "¿El establecimiento cuenta con instalaciones y servicios de spa?" },
      { codigo: "2.5", tipo: "C", texto: "¿El establecimiento cuenta con tina de hidromasaje?" },
      { codigo: "2.6", tipo: "C", texto: "¿El establecimiento cuenta con instalaciones de sauna y/o vapor?" },
      { codigo: "2.7", tipo: "C", texto: "¿El establecimiento cuenta con gimnasio?" },
      { codigo: "2.8", tipo: "C", texto: "¿El establecimiento cuenta con vistas escénicas y/o lugares de relajación?" },
      { codigo: "2.9", tipo: "P", texto: "¿El establecimiento cuenta con señalética básica en inglés?" },
    ],
  },
  {
    id: "F3",
    nombre: "Transparencia",
    preguntas: [
      { codigo: "3.1", tipo: "P", texto: "¿El establecimiento cuenta con un catálogo de precios de servicios de salud actualizado (médicos y de bienestar)?" },
      { codigo: "3.2", tipo: "P", texto: "¿El establecimiento cuenta con un catálogo de servicios de salud certificados (médicos y de bienestar)?" },
      { codigo: "3.3", tipo: "P", texto: "¿El establecimiento cuenta con certificaciones y/o acreditaciones médicas nacionales?" },
      { codigo: "3.4", tipo: "C", texto: "¿El establecimiento cuenta con certificaciones y/o acreditaciones médicas internacionales?" },
      { codigo: "3.5", tipo: "P", texto: "¿El catálogo de servicios está impreso en inglés y describe los costos de los servicios con cargo extra explícitamente señalados, así como indicando definición del servicio, horario de las prestaciones y en el caso que éstos sean proporcionados por terceros, lugar o teléfono donde se pueden contratar?" },
      { codigo: "3.6", tipo: "P", texto: "¿Los artículos y precios de los productos o servicios se presentan en dólares y/o pesos?" },
      { codigo: "3.7", tipo: "P", texto: "¿Se hace del conocimiento del turista de salud el tipo de cambio a la fecha pesos-dólares?" },
      { codigo: "3.8", tipo: "P", texto: "¿Se le informa al turista de salud, en inglés, las políticas de servicio y de cobro antes de prestar el servicio?" },
    ],
  },
  {
    id: "F4",
    nombre: "Servicio",
    preguntas: [
      { codigo: "4.1", tipo: "C", texto: "¿El establecimiento cuenta con distintivos H y/o Punto Limpio?" },
      { codigo: "4.2", tipo: "C", texto: "¿El establecimiento cuenta con menú de alimentación saludable, diseñado por expertos?" },
      { codigo: "4.3", tipo: "P", texto: "¿El personal está capacitado en la terminología médica utilizada en turismo de salud, tanto en inglés como en español?" },
      { codigo: "4.4", tipo: "P", texto: "¿El establecimiento cuenta con convenios con empresas de servicio de ambulancia?" },
      { codigo: "4.5", tipo: "C", texto: "¿El establecimiento cuenta con personal capacitado para dar atención al paciente en recuperación?" },
      { codigo: "4.6", tipo: "C", texto: "¿El establecimiento pertenece o está vinculado a alguna asociación o clúster de turismo de salud?" },
      { codigo: "4.7", tipo: "P", texto: "¿El personal médico que atiende al turista de salud domina el idioma inglés?" },
      { codigo: "4.8", tipo: "P", texto: "¿Se cuenta con personal de atención que hable inglés, ya sea interno o externo, para prestar asistencia y asesoría al turista de salud durante su estancia?" },
      { codigo: "4.9", tipo: "P", texto: "¿El menú cuenta con la traducción de los platillos en inglés para facilitar la experiencia de ordenar?" },
      { codigo: "4.10", tipo: "C", texto: "¿El establecimiento cuenta con sinergias empresariales que le permitan ofrecer servicios adicionales con personal capacitado para atender al turista de salud como: taxi, ambulancia, mapas, etc.?" },
      { codigo: "4.11", tipo: "P", texto: "¿Los formatos básicos del establecimiento: consentimientos, registros, recepción, encuestas de satisfacción y permisos así como la información clínica se encuentran traducidos al inglés?" },
    ],
  },
  {
    id: "F5",
    nombre: "Educación",
    preguntas: [
      { codigo: "5.1", tipo: "P", texto: "¿El personal está capacitado en los temas de turismo de salud?" },
      { codigo: "5.2", tipo: "P", texto: "¿El establecimiento cuenta con personal técnico y profesional certificado?" },
      { codigo: "5.3", tipo: "P", texto: "¿El personal está capacitado en la atención y servicio que se debe ofrecer en el turismo de salud?" },
      { codigo: "5.4", tipo: "C", texto: "¿Los empleados de contacto con el cliente toman cursos de inglés y de atención al cliente al menos 2 veces al año?" },
    ],
  },
];

export const TODAS_PREGUNTAS: Pregunta[] = FAMILIAS.flatMap((f) => f.preguntas);
export const UMBRAL_APROBACION = 80; // % mínimo para el Sello

// Encabezado del documento (MSE-FO-55). El tipo lo elige la empresa; el resto
// se llena automáticamente desde el Formato de Registro (MSE-FO-28).
export type TipoEvaluacion = "diagnostica" | "final" | "renovacion";
export const TIPOS_EVALUACION: { v: TipoEvaluacion; label: string }[] = [
  { v: "diagnostica", label: "Diagnóstica" },
  { v: "final", label: "Final" },
  { v: "renovacion", label: "Renovación" },
];
// Registro del consultor — constante en todos los diagnósticos.
export const REGISTRO_CONSULTOR = "SECTUR-RCSF-004-2024";

export type Evidencia = { key: string; nombre: string };
// Plan de acción (solo cuando "No cumple") — alimenta el Plan 3W (qué/quién/cuándo).
export type PlanMejora = {
  actividades: string;
  responsable: string;
  fecha: string;
};
export type RespValor = {
  r: Respuesta;
  obs?: string; // descripción de evidencia (Sí cumple)
  evidencias?: Evidencia[]; // fotos (Sí cumple)
  plan?: PlanMejora; // acciones (No cumple)
};
// Datos del pie del Plan 3W, por familia (cuando tiene ≥1 "No cumple").
export type PlanFamilia = {
  ugb: string;
  lider: string;
  miembros: string;
  director: string;
};
export type PlanesFamilia = Record<string, PlanFamilia>; // familiaId -> datos
export type RespuestasVerif = Record<string, RespValor>; // codigo -> respuesta

// Puntaje sobre TODOS los indicadores aplicables (no solo los contestados):
// - "na" (no aplica) se excluye del denominador.
// - toda pregunta aplicable —contestada o aún pendiente— cuenta en el
//   denominador; así el % NO salta al 100% por contestar una sola.
// - "si" suma sus puntos; "no" y las pendientes suman 0.
export function calcVerificacion(
  resp: RespuestasVerif,
  preguntas: readonly Pregunta[] = TODAS_PREGUNTAS,
) {
  let posibles = 0;
  let obtenidos = 0;
  let contestadas = 0;
  for (const p of preguntas) {
    const v = resp[p.codigo]?.r;
    if (v) contestadas++;
    if (v === "na") continue; // no aplica: fuera del denominador
    posibles += PUNTOS[p.tipo];
    if (v === "si") obtenidos += PUNTOS[p.tipo];
  }
  const pct = posibles > 0 ? Math.round((obtenidos / posibles) * 100) : 0;
  return {
    posibles,
    obtenidos,
    pct,
    contestadas,
    total: preguntas.length,
    aprobado: contestadas === preguntas.length && pct >= UMBRAL_APROBACION,
  };
}
