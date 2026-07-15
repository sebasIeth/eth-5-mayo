import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { DOCUMENTOS, docKey } from "@/app/registro/data";

const NAVY = rgb(0.098, 0.102, 0.18);
const PAGE_H = 792;

const TEMPLATE = path.join(process.cwd(), "templates", "formato-registro.pdf");

// Coordenadas medidas desde el PDF original (origen arriba-izquierda, y hacia abajo).
// Y() las convierte al sistema de pdf-lib (origen abajo-izquierda).
const Y = (yTop: number) => PAGE_H - yTop;

type Reg = {
  registro?: { tipoTramite?: string; giro?: string; consultor?: string };
  empresa?: Record<string, string | null | undefined>;
  documentos?: Record<string, string>;
  firma?: string;
  // Campos extra que la ruta puede pasar (se ignoran al dibujar).
  usuarioNombre?: string;
  usuarioEmail?: string;
  estatus?: string;
  creadoEn?: Date | string;
};

function fmtDate(v?: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

// Posición de la casilla "Entrega" por documento (mismo orden que DOCUMENTOS).
// x = inicio del texto; yTop = línea base (borde inferior de la fila).
const ENTREGA_CELLS: Array<{ x: number; y: number } | null> = [
  { x: 252, y: 462 }, // 0  MSE-FO-28  (izq)
  { x: 512, y: 462 }, // 1  MSE-FO-29  (der)
  { x: 252, y: 480 }, // 2  MSE-FO-55 inicial (izq)
  { x: 512, y: 480 }, // 3  MSE-FO-32  (der)
  { x: 252, y: 507 }, // 4  MSE-FO-55 final (izq)
  { x: 512, y: 507 }, // 5  MSE-FO-41  (der)
  { x: 252, y: 534 }, // 6  MSE-FO-55B (izq)
  { x: 512, y: 534 }, // 7  Carpeta    (der)
  { x: 252, y: 554 }, // 8  MSE-FO-31  (izq)
  { x: 531, y: 554 }, // 9  RNT (der, fila de 3 renglones -> centrado en columna Entrega)
  { x: 252, y: 574 }, // 10 MSE-FO-59  (izq)
  { x: 252, y: 589 }, // 11 MSE-FO-57  (izq)
  { x: 252, y: 604 }, // 12 MSE-FO-09  (izq)
];

export async function buildRegistroPdf(reg: Reg): Promise<Uint8Array> {
  const bytes = fs.readFileSync(TEMPLATE);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page: PDFPage = pdf.getPage(0);

  const put = (
    text: string | null | undefined,
    x: number,
    yTop: number,
    size = 9,
    f: PDFFont = font,
  ) => {
    const t = (text ?? "").toString().trim();
    if (!t) return;
    page.drawText(t, { x, y: Y(yTop), size, font: f, color: NAVY });
  };
  // Igual que put, pero reduce el tamaño si el texto no cabe en maxW, para que
  // un nombre largo no invada el campo de al lado.
  const putFit = (
    text: string | null | undefined,
    x: number,
    yTop: number,
    maxW: number,
    size = 9,
    f: PDFFont = font,
  ) => {
    const t = (text ?? "").toString().trim();
    if (!t) return;
    let s = size;
    while (s > 6 && f.widthOfTextAtSize(t, s) > maxW) s -= 0.5;
    put(t, x, yTop, s, f);
  };

  const r = reg.registro ?? {};
  const e = reg.empresa ?? {};

  // Tipo de trámite: marca la casilla elegida.
  // Casillas: "Nuevo" (borde izq x≈241.6, palabra 242-261, divisor x≈327) y
  // "Renovado :" (borde izq x≈342, palabra 344-378, borde der x≈516).
  // Fila entre y≈126.6 y y≈141.8 -> centro vertical ≈134.2; "X" 11pt centrada
  // se coloca en el espacio libre justo después de la palabra de cada opción.
  if (r.tipoTramite === "Nuevo") put("X", 288, 138.5, 11, bold);
  else if (r.tipoTramite === "Renovado") put("X", 445, 138.5, 11, bold);

  // x alineado al inicio de cada subrayado real de la plantilla
  put(r.giro, 143, 164);
  put(r.consultor, 195, 186, 8.5);

  // Razón social: en negrita, tamaño normal (flota junto a su etiqueta).
  put(e.razonSocial, 160, 240, 9, bold);
  // "Nombre del Sello (RNT)" corrido a la derecha para no chocar con la razón
  // social; va sobre la línea (que abarca hasta el margen derecho).
  putFit(e.nombreSello, 355, 240, 200, 8.5);
  put(e.representante, 164, 269);
  put(e.calleCP, 143, 292);
  put(e.municipio, 143, 322);
  put(e.estado, 67, 344);
  put(e.lada, 62, 367);
  put(e.telefonos, 384, 367);
  put(e.email, 69, 389);

  // Fechas de entrega de documentos
  const docs = reg.documentos ?? {};
  DOCUMENTOS.forEach((d, i) => {
    const cell = ENTREGA_CELLS[i];
    const v = docs[docKey(d)];
    if (cell && v) put(fmtDate(v), cell.x, cell.y, 7.5);
  });

  // Firma: centrada sobre "Nombre y Firma de conformidad"
  if (reg.firma && reg.firma.startsWith("data:image/")) {
    try {
      const b64 = reg.firma.split(",")[1] ?? "";
      const imgBytes = Uint8Array.from(Buffer.from(b64, "base64"));
      const img = reg.firma.includes("image/png")
        ? await pdf.embedPng(imgBytes)
        : await pdf.embedJpg(imgBytes);
      // Hueco disponible entre el párrafo "Nota" y el texto "Nombre y Firma"
      // (fitz y ~648 a ~698). La firma se centra ahí, sin encimarse.
      const maxW = 150;
      const maxH = 46;
      const s = Math.min(maxW / img.width, maxH / img.height, 1);
      const iw = img.width * s;
      const ih = img.height * s;
      const cx = 306; // centro de la página
      const bottomTop = 697; // borde inferior (fitz), justo arriba del texto de firma
      page.drawImage(img, {
        x: cx - iw / 2,
        y: Y(bottomTop),
        width: iw,
        height: ih,
      });
    } catch {
      /* si la firma no se puede incrustar, se omite */
    }
  }

  return pdf.save();
}
