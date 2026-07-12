import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
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

const NAVY = rgb(0.098, 0.102, 0.18);
const PAGE_H = 792;
const TEMPLATE = path.join(process.cwd(), "templates", "lista-verificacion.pdf");
// Firma escaneada de la consultora (se coloca cuando la verificación se aprueba).
const FIRMA_CONSULTOR = path.join(process.cwd(), "templates", "firma-consultor.png");

// Coordenadas medidas con PyMuPDF (origen arriba-izquierda). Y() convierte al
// sistema de pdf-lib (origen abajo-izquierda).
const Y = (yTop: number) => PAGE_H - yTop;

// Familia -> índice de página con sus preguntas.
const FAM_PAGE: Record<string, number> = { F1: 1, F2: 3, F3: 4, F4: 6, F5: 8 };

// Código -> y (fitz, arriba de la fila) de cada pregunta en la plantilla.
const ROW_Y: Record<string, number> = {
  "1.1": 253, "1.2": 299, "1.3": 349, "1.4": 421, "1.5": 484, "1.6": 538, "1.7": 575,
  "2.1": 245, "2.2": 270, "2.3": 307, "2.4": 333, "2.5": 358, "2.6": 384, "2.7": 409, "2.8": 421, "2.9": 446,
  "3.1": 266, "3.2": 303, "3.3": 340, "3.4": 378, "3.5": 415, "3.6": 501, "3.7": 526, "3.8": 563,
  "4.1": 245, "4.2": 270, "4.3": 307, "4.4": 344, "4.5": 381, "4.6": 418, "4.7": 456, "4.8": 481, "4.9": 542, "4.10": 579, "4.11": 641,
  "5.1": 251, "5.2": 277, "5.3": 302, "5.4": 339,
};

// Columnas de marca (centro X): Aplica/NA, No Cumple, Sí Cumple.
const COL = { na: 271, no: 301, si: 322 };

// Celdas de puntaje del pie: [pageIdx, x, yTop]. A=# prioritarios aplicables,
// Ap=A*2, Aob=obtenidos P; B=# complementarios, Bp=B*1, Bob=obtenidos C;
// C=suma posibles, D=suma obtenidos, pct=% de la familia.
type Cell = [number, number, number];
type FamScore = Record<"A" | "Ap" | "Aob" | "B" | "Bp" | "Bob" | "C" | "D" | "pct", Cell>;
const FOOTER: Record<string, FamScore> = {
  F1: { A: [1, 245, 650], Ap: [1, 412, 647], Aob: [1, 548, 647], B: [2, 245, 158], Bp: [2, 412, 144], Bob: [2, 548, 144], C: [2, 412, 202], D: [2, 548, 202], pct: [2, 430, 261] },
  F2: { A: [3, 245, 482], Ap: [3, 412, 479], Aob: [3, 548, 479], B: [3, 245, 504], Bp: [3, 412, 501], Bob: [3, 548, 501], C: [3, 412, 550], D: [3, 548, 550], pct: [3, 430, 588] },
  F3: { A: [4, 245, 611], Ap: [4, 412, 608], Aob: [4, 548, 608], B: [4, 245, 655], Bp: [4, 412, 641], Bob: [4, 548, 641], C: [5, 412, 144], D: [5, 548, 144], pct: [5, 430, 203] },
  F4: { A: [7, 245, 136], Ap: [7, 412, 166], Aob: [7, 548, 166], B: [7, 245, 180], Bp: [7, 412, 208], Bob: [7, 548, 208], C: [7, 412, 225], D: [7, 548, 225], pct: [7, 430, 284] },
  F5: { A: [8, 245, 405], Ap: [8, 412, 402], Aob: [8, 548, 402], B: [8, 245, 449], Bp: [8, 412, 435], Bob: [8, 548, 435], C: [8, 412, 493], D: [8, 548, 493], pct: [8, 430, 552] },
};
// Bloque "EVALUACIÓN GLOBAL" (idx9).
const GLOBAL: FamScore = {
  A: [9, 245, 178], Ap: [9, 412, 175], Aob: [9, 548, 175], B: [9, 245, 222], Bp: [9, 412, 208], Bob: [9, 548, 208], C: [9, 412, 266], D: [9, 548, 266], pct: [9, 430, 325],
};
const OBS_X = 336;
const OBS_W = 102;
const EVID_X = 445;
const EVID_W = 112;

// Reemplaza caracteres fuera de WinAnsi (Helvetica no los codifica).
function sanitize(s: string): string {
  return (s ?? "")
    .replace(/[—–]/g, "-")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xff]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const lines: string[] = [];
  let cur = "";
  const push = () => {
    if (cur) lines.push(cur);
    cur = "";
  };
  for (let word of sanitize(text).split(/\s+/).filter(Boolean)) {
    // Corta por caracteres tokens que no caben (p. ej. URLs largas).
    while (font.widthOfTextAtSize(word, size) > maxW) {
      let i = 1;
      while (i < word.length && font.widthOfTextAtSize(word.slice(0, i + 1), size) <= maxW) i++;
      push();
      lines.push(word.slice(0, i));
      word = word.slice(i);
    }
    const test = cur ? `${cur} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxW && cur) {
      push();
      cur = word;
    } else {
      cur = test;
    }
  }
  push();
  return lines;
}

function fmtDate(v?: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

// Puntaje oficial de una lista de preguntas (P=2, C=1) sobre las aplicables.
function scoreOf(
  preguntas: { codigo: string; tipo: string }[],
  giro: string | null,
  opts: { tieneRestaurante: boolean },
  respuestas: RespuestasVerif,
) {
  const ap = preguntas.filter((q) => aplicaAlGiro(q.codigo, giro, opts));
  const A = ap.filter((q) => q.tipo === "P").length;
  const B = ap.filter((q) => q.tipo === "C").length;
  const Aob = ap.filter((q) => q.tipo === "P" && respuestas[q.codigo]?.r === "si").length * 2;
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
  aprobada: boolean; // verificación aprobada por el consultor → va su firma
  encabezado: {
    empresa: string;
    ejecutivo: string;
    evaluador: string;
    registroConsultor: string;
    fecha: string;
    firmaEmpresa: string;
  };
};

export async function buildVerificacionPdf(data: Data): Promise<Uint8Array> {
  const bytes = fs.readFileSync(TEMPLATE);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const opts = { tieneRestaurante: data.tieneRestaurante };
  const { giro, respuestas } = data;
  const enc = data.encabezado;

  const put = (
    page: PDFPage,
    text: string | null | undefined,
    x: number,
    yTop: number,
    size = 9,
    f: PDFFont = font,
  ) => {
    const t = sanitize((text ?? "").toString()).trim();
    if (!t) return;
    page.drawText(t, { x, y: Y(yTop), size, font: f, color: NAVY });
  };

  // ===== Página 0: encabezado =====
  // Nota: esta plantilla es la versión DIAGNÓSTICO y ya trae "Diagnóstica __X__"
  // impreso, por eso no marcamos el tipo aquí.
  const p0 = pdf.getPage(0);

  put(p0, enc.empresa, 110, 465);
  put(p0, enc.ejecutivo, 195, 487);
  put(p0, enc.evaluador, 110, 509);
  put(p0, enc.registroConsultor, 150, 531);
  put(p0, fmtDate(enc.fecha), 150, 553);

  // Firma del ejecutivo (imagen capturada) o su nombre.
  if (enc.firmaEmpresa && enc.firmaEmpresa.startsWith("data:image/")) {
    try {
      const b64 = enc.firmaEmpresa.split(",")[1] ?? "";
      const imgBytes = Uint8Array.from(Buffer.from(b64, "base64"));
      const img = enc.firmaEmpresa.includes("image/png")
        ? await pdf.embedPng(imgBytes)
        : await pdf.embedJpg(imgBytes);
      // Blanco disponible: x~170 a ~265 (antes de "Firma Consultor" en x269).
      const s = Math.min(85 / img.width, 24 / img.height, 1);
      p0.drawImage(img, {
        x: 173,
        y: Y(586),
        width: img.width * s,
        height: img.height * s,
      });
    } catch {
      put(p0, enc.ejecutivo, 175, 585, 8);
    }
  } else {
    put(p0, enc.ejecutivo, 175, 585, 8);
  }
  // Firma Consultor: si la verificación está aprobada, va su firma escaneada;
  // si no, su nombre.
  if (data.aprobada && fs.existsSync(FIRMA_CONSULTOR)) {
    try {
      const img = await pdf.embedPng(fs.readFileSync(FIRMA_CONSULTOR));
      const s = Math.min(120 / img.width, 38 / img.height, 1);
      p0.drawImage(img, {
        x: 400,
        y: Y(596),
        width: img.width * s,
        height: img.height * s,
      });
    } catch {
      put(p0, enc.evaluador, 405, 585, 8);
    }
  } else {
    put(p0, enc.evaluador, 405, 585, 8);
  }

  // Cajas de porcentaje (centradas en su recuadro).
  const globalPct = calcVerificacion(respuestas, preguntasAplicables(giro, opts)).pct;
  const obtStr = data.porcentajeObtenido != null ? `${data.porcentajeObtenido}%` : "-";
  const finStr = `${globalPct}%`;
  put(p0, obtStr, 247 - font.widthOfTextAtSize(obtStr, 10) / 2, 620, 10, bold);
  put(p0, finStr, 476 - font.widthOfTextAtSize(finStr, 10) / 2, 620, 10, bold);

  // Dibuja las 9 celdas de puntaje de un pie (familia o global).
  const drawScore = (fs: FamScore, s: ReturnType<typeof scoreOf>) => {
    const cell = (c: Cell, txt: string) =>
      put(pdf.getPage(c[0]), txt, c[1], c[2], 9, bold);
    cell(fs.A, String(s.A));
    cell(fs.Ap, String(s.Ap));
    cell(fs.Aob, String(s.Aob));
    cell(fs.B, String(s.B));
    cell(fs.Bp, String(s.Bp));
    cell(fs.Bob, String(s.Bob));
    cell(fs.C, String(s.C));
    cell(fs.D, String(s.D));
    cell(fs.pct, `${s.pct}%`);
  };

  // ===== Páginas de familias: marcas + observaciones + evidencias =====
  for (const fam of FAMILIAS) {
    const pageIdx = FAM_PAGE[fam.id];
    if (pageIdx == null) continue;
    const page = pdf.getPage(pageIdx);

    for (const q of fam.preguntas) {
      const y = ROW_Y[q.codigo];
      if (y == null) continue;
      const aplica = aplicaAlGiro(q.codigo, giro, opts);
      const v = respuestas[q.codigo];

      if (!aplica) {
        put(page, "X", COL.na - 3, y + 11, 10, bold);
        wrap(motivoNoAplica(q.codigo, giro, opts), font, 6, OBS_W).forEach((ln, i) =>
          put(page, ln, OBS_X, y + 8 + i * 7, 6),
        );
        continue;
      }

      // "Sí Cumple": los puntos que vale el indicador (P=2, C=1) en vez de X.
      if (v?.r === "si")
        put(page, q.tipo === "P" ? "2" : "1", COL.si - 3, y + 11, 10, bold);
      else if (v?.r === "no") put(page, "X", COL.no - 3, y + 11, 10, bold);

      // La descripción del usuario va en "Evidencias de Cumplimiento" SOLO si la
      // respuesta es "Sí cumple" (si cambió a "No cumple", esa nota queda obsoleta).
      // Las fotos NO se ponen en el PDF; las revisa el consultor en la plataforma.
      if (v?.r === "si" && v?.obs) {
        const len = v.obs.length;
        const sz = len > 320 ? 5 : len > 200 ? 5.5 : len > 110 ? 6.5 : 7.5;
        wrap(v.obs, font, sz, EVID_W).forEach((ln, i) =>
          put(page, ln, EVID_X, y + 9 + i * (sz + 1.5), sz),
        );
      }
    }

    // Puntaje de la familia.
    const fs = FOOTER[fam.id];
    if (fs) drawScore(fs, scoreOf(fam.preguntas, giro, opts, respuestas));
  }

  // Evaluación global (todas las preguntas aplicables).
  drawScore(
    GLOBAL,
    scoreOf(
      FAMILIAS.flatMap((f) => f.preguntas),
      giro,
      opts,
      respuestas,
    ),
  );

  return pdf.save();
}
