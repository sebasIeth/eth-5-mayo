// Definición de la revisión del consultor sobre un registro.
// Reutilizado por el panel del consultor, la API de revisión y el formulario
// de la empresa para mostrar el feedback por campo.

export type RevisionEstado = "aprobado" | "correccion";

export type RevisionCampo = {
  estado: RevisionEstado;
  comentario: string;
};

// { [fieldKey]: { estado, comentario } }
export type Revisiones = Record<string, RevisionCampo>;

// Los 10 campos revisables, con su etiqueta y de dónde sale el valor.
export const CAMPOS_REVISABLES = [
  { key: "giro", label: "Giro del servicio", grupo: "registro" },
  { key: "razonSocial", label: "Nombre comercial / razón social", grupo: "empresa" },
  { key: "nombreSello", label: "Nombre del Sello (RNT)", grupo: "empresa" },
  { key: "representante", label: "Representante / encargado", grupo: "empresa" },
  { key: "calleCP", label: "Av. / Calle y código postal", grupo: "empresa" },
  { key: "municipio", label: "Municipio / Alcaldía", grupo: "empresa" },
  { key: "estado", label: "Estado", grupo: "empresa" },
  { key: "lada", label: "Lada", grupo: "empresa" },
  { key: "telefonos", label: "Teléfono(s)", grupo: "empresa" },
  { key: "email", label: "E-mail", grupo: "empresa" },
] as const;

export const REVISABLE_KEYS = CAMPOS_REVISABLES.map((c) => c.key);

// Extrae el valor de un campo revisable desde el doc del registro.
export function valorCampo(
  doc: {
    registro?: Record<string, unknown> | null;
    empresa?: Record<string, unknown> | null;
  },
  key: string,
): string {
  const campo = CAMPOS_REVISABLES.find((c) => c.key === key);
  if (!campo) return "";
  const grupo = campo.grupo === "registro" ? doc.registro : doc.empresa;
  const v = grupo?.[key];
  return typeof v === "string" ? v : "";
}

// Recalcula el estatus tras guardar una revisión:
//  - algún campo en "correccion"        -> "en_espera_documentos"
//  - los 10 revisados y todos aprobados -> "completado"
//  - en otro caso                        -> se conserva el estatus actual
export function recomputeEstatus(
  revisiones: Revisiones,
  estatusActual: string,
): string {
  const valores = Object.values(revisiones);
  const hayCorreccion = valores.some((r) => r.estado === "correccion");
  if (hayCorreccion) return "en_espera_documentos";

  const todosRevisados = REVISABLE_KEYS.every(
    (k) => revisiones[k]?.estado === "aprobado",
  );
  if (todosRevisados) return "completado";

  return estatusActual;
}

// Normaliza y valida un objeto de revisiones que llega del cliente.
export function parseRevisiones(raw: unknown): Revisiones | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Revisiones = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!REVISABLE_KEYS.includes(key as (typeof REVISABLE_KEYS)[number])) continue;
    if (!val || typeof val !== "object") continue;
    const estado = (val as Record<string, unknown>).estado;
    const comentario = (val as Record<string, unknown>).comentario;
    if (estado !== "aprobado" && estado !== "correccion") return null;
    const comentarioStr = typeof comentario === "string" ? comentario.trim() : "";
    // Una corrección exige comentario.
    if (estado === "correccion" && !comentarioStr) return null;
    out[key] = { estado, comentario: comentarioStr };
  }
  return out;
}
