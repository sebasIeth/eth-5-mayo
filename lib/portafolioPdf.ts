import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib";

const NAVY = rgb(0.098, 0.102, 0.18);
const ROJO = rgb(0.784, 0.063, 0.18);
const GRIS = rgb(0.35, 0.38, 0.44);
const W = 612;
const H = 792;
const MARGIN = 54;
const CONTENT_W = W - MARGIN * 2;

export type ImagenEvid = { bytes: Uint8Array; isPng: boolean; nombre: string };
export type SeccionEvid = {
  codigo: string;
  tipo: string;
  texto: string;
  descripcion: string;
  imagenes: ImagenEvid[];
};
export type PortafolioData = {
  empresa: string;
  giro: string;
  lugar: string;
  fecha: string;
  secciones: SeccionEvid[];
};

const BRAND = (f: string) => path.join(process.cwd(), "public", "brand", f);

// Envuelve texto en líneas que caben en maxW.
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

async function embedBrand(pdf: PDFDocument, file: string): Promise<PDFImage | null> {
  try {
    const p = BRAND(file);
    if (!fs.existsSync(p)) return null;
    const bytes = fs.readFileSync(p);
    return file.toLowerCase().endsWith(".png")
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function buildPortafolioPdf(data: PortafolioData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // ---------- Portada ----------
  const cover = pdf.addPage([W, H]);
  const turismo = await embedBrand(pdf, "turismo-salud.jpeg");
  const directiva = await embedBrand(pdf, "directiva.png");

  if (turismo) {
    const w = 220;
    const h = (turismo.height / turismo.width) * w;
    cover.drawImage(turismo, { x: (W - w) / 2, y: H - 90 - h, width: w, height: h });
  }
  const title = "PORTAFOLIO DE EVIDENCIAS";
  const tSize = 26;
  cover.drawText(title, {
    x: (W - bold.widthOfTextAtSize(title, tSize)) / 2,
    y: 400,
    size: tSize,
    font: bold,
    color: ROJO,
  });
  const emp = data.empresa || "Establecimiento";
  const eSize = 20;
  for (const [i, ln] of wrap(emp, bold, eSize, CONTENT_W).entries()) {
    cover.drawText(ln, {
      x: (W - bold.widthOfTextAtSize(ln, eSize)) / 2,
      y: 360 - i * 26,
      size: eSize,
      font: bold,
      color: NAVY,
    });
  }
  const sub = [data.giro, data.lugar, data.fecha].filter(Boolean).join(" · ");
  if (sub) {
    const sSize = 12;
    cover.drawText(sub, {
      x: (W - font.widthOfTextAtSize(sub, sSize)) / 2,
      y: 300,
      size: sSize,
      font,
      color: GRIS,
    });
  }
  if (directiva) {
    const w = 70;
    const h = (directiva.height / directiva.width) * w;
    cover.drawImage(directiva, { x: (W - w) / 2, y: 70, width: w, height: h });
  }
  cover.drawText("Sello de Turismo de Salud · Secretaría de Turismo de México", {
    x: (W - font.widthOfTextAtSize("Sello de Turismo de Salud · Secretaría de Turismo de México", 9)) / 2,
    y: 48,
    size: 9,
    font,
    color: GRIS,
  });

  // ---------- Secciones por indicador ----------
  let page = pdf.addPage([W, H]);
  let y = H - MARGIN;

  const nueva = () => {
    page = pdf.addPage([W, H]);
    y = H - MARGIN;
  };
  const espacio = (need: number) => {
    if (y - need < MARGIN) nueva();
  };

  for (const s of data.secciones) {
    // Título del indicador
    const titulo = `${s.codigo} ${s.tipo} · ${s.texto}`;
    const tl = wrap(titulo, bold, 12, CONTENT_W);
    espacio(tl.length * 16 + 20);
    if (y < H - MARGIN) y -= 14; // separación entre indicadores
    for (const ln of tl) {
      page.drawText(ln, { x: MARGIN, y, size: 12, font: bold, color: ROJO });
      y -= 16;
    }
    y -= 6;

    // Descripción
    if (s.descripcion) {
      const dl = wrap(s.descripcion, font, 10.5, CONTENT_W);
      for (const ln of dl) {
        espacio(15);
        page.drawText(ln, { x: MARGIN, y, size: 10.5, font, color: NAVY });
        y -= 15;
      }
      y -= 6;
    }

    // Imágenes (anexos)
    for (const img of s.imagenes) {
      let emb: PDFImage | null = null;
      try {
        emb = img.isPng ? await pdf.embedPng(img.bytes) : await pdf.embedJpg(img.bytes);
      } catch {
        emb = null;
      }
      if (!emb) continue;
      const maxW = CONTENT_W;
      const maxH = 360;
      const scale = Math.min(maxW / emb.width, maxH / emb.height, 1);
      const iw = emb.width * scale;
      const ih = emb.height * scale;
      espacio(ih + 12);
      page.drawImage(emb, { x: MARGIN + (CONTENT_W - iw) / 2, y: y - ih, width: iw, height: ih });
      y -= ih + 12;
    }
    y -= 8;
  }

  return pdf.save();
}
