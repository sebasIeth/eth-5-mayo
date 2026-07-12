// Aplicabilidad de cada indicador de la Lista de Verificación (MSE-FO-55)
// según el GIRO del establecimiento. Reglas dadas por la consultora (Cynthia).
//
// "todos" = aplica a cualquier giro.
// Un arreglo = solo aplica a esos giros (nombres exactos de GIROS en
// app/registro/data.ts: Hospital, Clínica, Consultorio, Spa, Centro de
// relajación, Club de golf, Hotel, Restaurante, Agencia de viajes).
//
// Reglas dadas: 1.1–1.7 todos; 2.1 Hotel/Hospital/Clínica; 2.2 Hotel/Hospital;
// 2.3 Hotel; 2.4–2.7 todos menos Restaurante; 3.2 Hospital/Clínica/Spa;
// 3.3 Hospital/Clínica/Spa/Consultorio/Centro de relajación;
// 3.4 Hospital/Clínica; 4.5 y 4.7 todos menos Restaurante; 4.2 y 4.9 solo si el giro es
// Restaurante o si el establecimiento cuenta con restaurante. El resto "todos".

import {
  FAMILIAS,
  TODAS_PREGUNTAS,
  type Familia,
  type Pregunta,
  type RespuestasVerif,
} from "./data";

// "todos" | lista de giros que aplican | { excepto: giros que NO aplican }
//   | { soloSiRestaurante: true } = aplica si el giro es Restaurante O si el
//     establecimiento cuenta con restaurante (se pregunta al inicio del MSE-FO-55).
export type ReglaAplic =
  | "todos"
  | readonly string[]
  | { excepto: readonly string[] }
  | { soloSiRestaurante: true };

// Datos extra (además del giro) que condicionan la aplicabilidad.
export type OpcionesAplic = { tieneRestaurante?: boolean };

export const APLICABILIDAD: Record<string, ReglaAplic> = {
  // F1 · Comunicación — aplican a todos
  "1.1": "todos",
  "1.2": "todos",
  "1.3": "todos",
  "1.4": "todos",
  "1.5": "todos",
  "1.6": "todos",
  "1.7": "todos",

  // F2 · Instalaciones
  "2.1": ["Hotel", "Hospital", "Clínica"],
  "2.2": ["Hotel", "Hospital"],
  "2.3": ["Hotel"],
  "2.4": { excepto: ["Restaurante"] },
  "2.5": { excepto: ["Restaurante"] },
  "2.6": { excepto: ["Restaurante"] },
  "2.7": { excepto: ["Restaurante"] },
  "2.8": "todos",
  "2.9": "todos",

  // F3 · Transparencia
  "3.1": "todos",
  "3.2": ["Hospital", "Clínica", "Spa"],
  "3.3": ["Hospital", "Clínica", "Spa", "Consultorio", "Centro de relajación"],
  "3.4": ["Hospital", "Clínica"],
  "3.5": "todos", // pendiente de regla
  "3.6": "todos", // pendiente de regla
  "3.7": "todos", // pendiente de regla
  "3.8": "todos", // pendiente de regla

  // F4 · Servicio — pendientes de regla
  "4.1": "todos",
  "4.2": { soloSiRestaurante: true },
  "4.3": "todos",
  "4.4": "todos",
  "4.5": { excepto: ["Restaurante"] },
  "4.6": "todos",
  "4.7": { excepto: ["Restaurante"] },
  "4.8": "todos",
  "4.9": { soloSiRestaurante: true },
  "4.10": "todos",
  "4.11": "todos",

  // F5 · Educación — pendientes de regla
  "5.1": "todos",
  "5.2": "todos",
  "5.3": "todos",
  "5.4": "todos",
};

// ¿El indicador `codigo` aplica al `giro` dado?
export function aplicaAlGiro(
  codigo: string,
  giro: string | null | undefined,
  opts?: OpcionesAplic,
): boolean {
  const regla = APLICABILIDAD[codigo] ?? "todos";
  if (regla === "todos") return true;
  if (!giro) return true; // sin giro definido, no filtramos
  if ("excepto" in regla) return !regla.excepto.includes(giro); // todos menos estos
  if ("soloSiRestaurante" in regla)
    return giro === "Restaurante" || opts?.tieneRestaurante === true;
  return regla.includes(giro); // solo estos giros
}

// Indicadores que aplican al giro dado (fuente de verdad para score/validación).
export function preguntasAplicables(
  giro: string | null | undefined,
  opts?: OpcionesAplic,
): Pregunta[] {
  return TODAS_PREGUNTAS.filter((p) => aplicaAlGiro(p.codigo, giro, opts));
}

// Razón (en texto) de por qué un indicador NO aplica al giro dado. Cadena vacía
// si sí aplica. Se usa para marcar "No aplica" con observación automática en el
// documento (PDF) del MSE-FO-55.
export function motivoNoAplica(
  codigo: string,
  giro: string | null | undefined,
  opts?: OpcionesAplic,
): string {
  if (aplicaAlGiro(codigo, giro, opts)) return "";
  const regla = APLICABILIDAD[codigo] ?? "todos";
  if (typeof regla === "object" && "soloSiRestaurante" in regla) {
    return "No aplica porque el establecimiento no cuenta con restaurante / servicio de alimentos.";
  }
  return `No aplica para el giro «${giro ?? "—"}».`;
}

// Familias que requieren un Plan 3W: tienen ≥1 indicador APLICABLE marcado como
// "No cumple". Devuelve {id, nombre} de cada una (1 Plan 3W por familia).
export function familiasConPlan(
  respuestas: RespuestasVerif,
  giro: string | null | undefined,
  opts?: OpcionesAplic,
): { id: string; nombre: string }[] {
  return FAMILIAS.filter((f) =>
    f.preguntas.some(
      (p) => aplicaAlGiro(p.codigo, giro, opts) && respuestas[p.codigo]?.r === "no",
    ),
  ).map((f) => ({ id: f.id, nombre: f.nombre }));
}

// Familias con solo sus preguntas aplicables; se omiten las familias vacías.
export function familiasAplicables(
  giro: string | null | undefined,
  opts?: OpcionesAplic,
): Familia[] {
  return FAMILIAS.map((f) => ({
    ...f,
    preguntas: f.preguntas.filter((p) => aplicaAlGiro(p.codigo, giro, opts)),
  })).filter((f) => f.preguntas.length > 0);
}
