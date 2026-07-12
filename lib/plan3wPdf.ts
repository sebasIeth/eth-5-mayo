import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

const NAVY = rgb(0.098, 0.102, 0.18);
const WHITE = rgb(1, 1, 1);
const BORDER = rgb(0.1, 0.1, 0.1);
const PAGE_H = 612; // plantilla horizontal (792 x 612)
const TEMPLATE = path.join(process.cwd(), "templates", "plan-3w.pdf");
const Y = (yTop: number) => PAGE_H - yTop;

// Tabla: región de datos (bajo el encabezado de columnas) y bordes de columna
// (fitz). Las filas se dibujan a medida para que ¿Qué? CREZCA con el texto.
const TABLE_TOP = 301;
const TABLE_BOTTOM = 472;
const COL_X = [42, 114, 540, 612, 737]; // Acción | ¿Qué? | ¿Quién? | ¿Cuándo?

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

export type Plan3wItem = {
  punto: string; // "código texto" del indicador que falta
  actividades: string;
  responsable: string;
  fecha: string;
};

export type Plan3wData = {
  empresa: string;
  objetivo: string;
  meta: string;
  fechaElaboracion: string;
  fechaRendicion: string; // fecha de la última acción a cumplir
  ugb: string;
  lider: string;
  miembros: string;
  director: string;
  firmaEmpresa: string; // firma del empresario (data URL) para "Firma de Aprobación"
  items: Plan3wItem[];
};

export async function buildPlan3wPdf(data: Plan3wData): Promise<Uint8Array> {
  const bytes = fs.readFileSync(TEMPLATE);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page: PDFPage = pdf.getPage(0);

  const put = (text: string, x: number, yTop: number, size = 9) => {
    const t = sanitize(text).trim();
    if (!t) return;
    page.drawText(t, { x, y: Y(yTop), size, font, color: NAVY });
  };

  // ===== Encabezado ===== (celda de valores empieza en x114; fecha en x540)
  put(data.empresa, 122, 195, 9);
  put(data.fechaElaboracion, 545, 189, 9);
  put(data.fechaRendicion, 545, 206, 9);
  wrap(data.objetivo, font, 8, 600).forEach((ln, i) =>
    put(ln, 122, 224 + i * 9, 8),
  );
  wrap(data.meta, font, 8, 600).forEach((ln, i) => put(ln, 122, 250 + i * 9, 8));

  // ===== Tabla dinámica: las filas crecen según el texto de ¿Qué? =====
  // Tapamos la rejilla fija de la plantilla y redibujamos las filas a medida.
  page.drawRectangle({
    x: COL_X[0],
    y: Y(TABLE_BOTTOM),
    width: COL_X[4] - COL_X[0],
    height: TABLE_BOTTOM - TABLE_TOP,
    color: WHITE,
  });

  const QUE_W = COL_X[2] - COL_X[1] - 8;
  const QUIEN_W = COL_X[3] - COL_X[2] - 6;
  const LH = 8.5;

  type Row = { num: number; lines: string[]; item: Plan3wItem | null; h: number };
  const rows: Row[] = data.items.slice(0, 10).map((it, i) => {
    const que = it.actividades ? `${it.punto} / ${it.actividades}` : it.punto;
    const lines = wrap(que, font, 7, QUE_W);
    return { num: i + 1, lines, item: it, h: Math.max(16, lines.length * LH + 6) };
  });
  // Rellena con filas vacías (numeradas) mientras quepan, para el look oficial.
  let used = rows.reduce((a, r) => a + r.h, 0);
  let n = rows.length + 1;
  while (used + 16 <= TABLE_BOTTOM - TABLE_TOP && n <= 10) {
    rows.push({ num: n, lines: [], item: null, h: 16 });
    used += 16;
    n++;
  }

  let y = TABLE_TOP;
  const yTops: number[] = [];
  for (const row of rows) {
    yTops.push(y);
    const numStr = String(row.num);
    put(
      numStr,
      (COL_X[0] + COL_X[1]) / 2 - font.widthOfTextAtSize(numStr, 9) / 2,
      y + row.h / 2 + 3,
      9,
    );
    row.lines.forEach((ln, j) => put(ln, COL_X[1] + 4, y + 9 + j * LH, 7));
    if (row.item) {
      wrap(row.item.responsable, font, 7, QUIEN_W).forEach((ln, j) =>
        put(ln, COL_X[2] + 4, y + 9 + j * 8, 7),
      );
      put(row.item.fecha, COL_X[3] + 4, y + row.h / 2 + 3, 8);
    }
    y += row.h;
  }
  const bottom = y;
  // Bordes: horizontales por fila + verticales de columna.
  for (const yy of [...yTops, bottom]) {
    page.drawLine({
      start: { x: COL_X[0], y: Y(yy) },
      end: { x: COL_X[4], y: Y(yy) },
      thickness: 0.7,
      color: BORDER,
    });
  }
  for (const x of COL_X) {
    page.drawLine({
      start: { x, y: Y(TABLE_TOP) },
      end: { x, y: Y(bottom) },
      thickness: 0.7,
      color: BORDER,
    });
  }

  // ===== Pie: UGB / Líder / Miembros (izq) y Director (der) =====
  put(data.ugb, 74, 482, 9);
  put(data.lider, 75, 496, 9);
  put(data.miembros, 97, 511, 9);
  put(data.director, 449, 481, 9);

  // "Firma de Aprobación" = firma del empresario (debajo de la etiqueta).
  if (data.firmaEmpresa && data.firmaEmpresa.startsWith("data:image/")) {
    try {
      const b64 = data.firmaEmpresa.split(",")[1] ?? "";
      const imgBytes = Uint8Array.from(Buffer.from(b64, "base64"));
      const img = data.firmaEmpresa.includes("image/png")
        ? await pdf.embedPng(imgBytes)
        : await pdf.embedJpg(imgBytes);
      const s = Math.min(150 / img.width, 28 / img.height, 1);
      page.drawImage(img, {
        x: 512,
        y: Y(524),
        width: img.width * s,
        height: img.height * s,
      });
    } catch {
      /* si no se puede incrustar, se omite */
    }
  }

  return pdf.save();
}
