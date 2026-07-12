// Revisión del consultor sobre la Lista de Verificación Inicial (MSE-FO-55).
// Al igual que la revisión del registro (por campo), aquí es PER-PREGUNTA:
// cada pregunta contestada se aprueba o se solicita una corrección con su
// comentario. Se conserva compatibilidad con el antiguo campo global
// `verificacion.revision`, que queda sin uso.

import { TODAS_PREGUNTAS, type RespuestasVerif } from "./data";

export type VerifRevisionEstado = "aprobado" | "correccion";

// ===== Compatibilidad hacia atrás: revisión GLOBAL (ya no se usa) =====
export type VerifRevision = {
  estado: VerifRevisionEstado;
  comentario: string;
  revisadoPor?: string;
  revisadoEn?: string | Date;
};

// Normaliza/valida la revisión global antigua (se conserva por compatibilidad).
export function parseVerifRevision(raw: unknown): VerifRevision | null {
  if (!raw || typeof raw !== "object") return null;
  const estado = (raw as Record<string, unknown>).estado;
  const comentario = (raw as Record<string, unknown>).comentario;
  if (estado !== "aprobado" && estado !== "correccion") return null;
  const comentarioStr = typeof comentario === "string" ? comentario.trim() : "";
  if (estado === "correccion" && !comentarioStr) return null;
  return { estado, comentario: comentarioStr };
}

// ===== Revisión PER-PREGUNTA =====
export type VerifRevisionPregunta = {
  estado: VerifRevisionEstado;
  comentario: string;
};

// { [codigo]: { estado, comentario } }
export type VerifRevisiones = Record<string, VerifRevisionPregunta>;

const CODIGOS_VALIDOS = new Set(TODAS_PREGUNTAS.map((p) => p.codigo));

// Normaliza y valida un objeto de revisiones por pregunta que llega del
// cliente. Solo se aceptan códigos conocidos; una corrección exige comentario.
export function parseVerifRevisiones(raw: unknown): VerifRevisiones | null {
  if (!raw || typeof raw !== "object") return null;
  const out: VerifRevisiones = {};
  for (const [codigo, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!CODIGOS_VALIDOS.has(codigo)) continue;
    if (!val || typeof val !== "object") continue;
    const estado = (val as Record<string, unknown>).estado;
    const comentario = (val as Record<string, unknown>).comentario;
    if (estado !== "aprobado" && estado !== "correccion") return null;
    const comentarioStr = typeof comentario === "string" ? comentario.trim() : "";
    // Una corrección exige comentario.
    if (estado === "correccion" && !comentarioStr) return null;
    out[codigo] = { estado, comentario: comentarioStr };
  }
  return out;
}

// Recalcula el estatus de la verificación tras guardar la revisión:
//  - alguna pregunta revisada en "correccion"                 -> "en_espera_documentos"
//  - hay al menos una revisión y TODA pregunta contestada
//    (respuestas[codigo]?.r) quedó "aprobado"                 -> "completado"
//  - en otro caso                                              -> se conserva el estatus actual
export function recomputeVerifEstatus(
  revisiones: VerifRevisiones,
  respuestas: RespuestasVerif,
  estatusActual: string,
): string {
  const valores = Object.values(revisiones);
  if (valores.length === 0) return estatusActual;

  const hayCorreccion = valores.some((r) => r.estado === "correccion");
  if (hayCorreccion) return "en_espera_documentos";

  const contestadas = TODAS_PREGUNTAS.filter((p) => respuestas[p.codigo]?.r);
  const todasAprobadas =
    contestadas.length > 0 &&
    contestadas.every((p) => revisiones[p.codigo]?.estado === "aprobado");
  if (todasAprobadas) return "completado";

  return estatusActual;
}
