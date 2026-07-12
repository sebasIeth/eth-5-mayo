import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import {
  FAMILIAS,
  calcVerificacion,
  type RespuestasVerif,
  type TipoEvaluacion,
} from "@/app/verificacion/data";
import {
  aplicaAlGiro,
  motivoNoAplica,
  preguntasAplicables,
} from "@/app/verificacion/aplicabilidad";

const TEMPLATE = path.join(process.cwd(), "templates", "verificacion.docx");

// clave plana docxtemplater para un código "1.1" -> "1_1"
const flat = (codigo: string) => codigo.replace(/\./g, "_");

function fmtDate(v?: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

// Puntaje oficial de una lista de preguntas (P=2, C=1) sobre las aplicables.
// Espejo exacto de scoreOf() en lib/verificacionPdf.ts.
function scoreOf(
  preguntas: { codigo: string; tipo: string }[],
  giro: string | null,
  opts: { tieneRestaurante: boolean },
  respuestas: RespuestasVerif,
) {
  const ap = preguntas.filter((q) => aplicaAlGiro(q.codigo, giro, opts));
  const A = ap.filter((q) => q.tipo === "P").length;
  const B = ap.filter((q) => q.tipo === "C").length;
  const Aob =
    ap.filter((q) => q.tipo === "P" && respuestas[q.codigo]?.r === "si").length * 2;
  const Bob = ap.filter((q) => q.tipo === "C" && respuestas[q.codigo]?.r === "si").length;
  const C = A * 2 + B;
  const D = Aob + Bob;
  return { A, Ap: A * 2, Aob, B, Bp: B, Bob, C, D, pct: C > 0 ? Math.round((D / C) * 100) : 0 };
}

type Data = {
  giro: string | null;
  tieneRestaurante: boolean;
  respuestas: RespuestasVerif;
  tipoEvaluacion: TipoEvaluacion;
  porcentajeObtenido: number | null;
  encabezado: {
    empresa: string;
    ejecutivo: string;
    evaluador: string;
    registroConsultor: string;
    fecha: string;
    firmaEmpresa: string;
  };
};

export async function buildVerificacionDocx(data: Data): Promise<Buffer> {
  const content = fs.readFileSync(TEMPLATE, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  const opts = { tieneRestaurante: data.tieneRestaurante };
  const { giro, respuestas } = data;
  const enc = data.encabezado;

  const values: Record<string, string> = {};

  // ---- Encabezado ----
  values.empresa = enc.empresa ?? "";
  values.ejecutivo = enc.ejecutivo ?? "";
  values.evaluador = enc.evaluador ?? "";
  values.regcons = enc.registroConsultor ?? "";
  values.fecha = fmtDate(enc.fecha);

  // Tipo de evaluación: X en la seleccionada.
  values.t_diag = data.tipoEvaluacion === "diagnostica" ? "X" : "";
  values.t_final = data.tipoEvaluacion === "final" ? "X" : "";
  values.t_renov = data.tipoEvaluacion === "renovacion" ? "X" : "";

  // Porcentajes: obtenido (congelado o "-") y final (global en vivo).
  const globalPct = calcVerificacion(respuestas, preguntasAplicables(giro, opts)).pct;
  values.pct_obt = data.porcentajeObtenido != null ? `${data.porcentajeObtenido}%` : "-";
  values.pct_fin = `${globalPct}%`;

  // ---- Preguntas ----
  for (const fam of FAMILIAS) {
    for (const q of fam.preguntas) {
      const c = flat(q.codigo);
      const aplica = aplicaAlGiro(q.codigo, giro, opts);
      const v = respuestas[q.codigo];

      if (!aplica) {
        values[`na_${c}`] = "X";
        values[`no_${c}`] = "";
        values[`si_${c}`] = "";
        // El motivo va en Observaciones (¿por qué no aplica?).
        values[`obs_${c}`] = motivoNoAplica(q.codigo, giro, opts);
        values[`ev_${c}`] = "";
        continue;
      }

      values[`na_${c}`] = "";
      values[`no_${c}`] = v?.r === "no" ? "X" : "";
      // "Sí Cumple": los puntos que vale (P=2, C=1) en vez de X.
      values[`si_${c}`] = v?.r === "si" ? (q.tipo === "P" ? "2" : "1") : "";
      // Cuando aplica, Observaciones queda vacío.
      values[`obs_${c}`] = "";
      // La descripción del usuario va en Evidencias SOLO si "Sí cumple".
      values[`ev_${c}`] = v?.r === "si" && v?.obs ? v.obs : "";
    }
  }

  // ---- Puntajes por familia + global ----
  const putScore = (suffix: string, s: ReturnType<typeof scoreOf>) => {
    values[`A_${suffix}`] = String(s.A);
    values[`Ap_${suffix}`] = String(s.Ap);
    values[`Aob_${suffix}`] = String(s.Aob);
    values[`B_${suffix}`] = String(s.B);
    values[`Bp_${suffix}`] = String(s.Bp);
    values[`Bob_${suffix}`] = String(s.Bob);
    values[`C_${suffix}`] = String(s.C);
    values[`D_${suffix}`] = String(s.D);
    values[`pct_${suffix}`] = `${s.pct}%`;
  };

  for (const fam of FAMILIAS) {
    putScore(fam.id, scoreOf(fam.preguntas, giro, opts, respuestas));
  }
  putScore(
    "G",
    scoreOf(
      FAMILIAS.flatMap((f) => f.preguntas),
      giro,
      opts,
      respuestas,
    ),
  );

  doc.render(values);

  return doc.getZip().generate({ type: "nodebuffer" });
}
