import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";
import type { PortafolioData, ImagenEvid } from "./portafolioPdf";

const ROJO = "C8102E";
const NAVY = "191A2E";
const GRIS = "5A6472";

const BRAND = (f: string) => path.join(process.cwd(), "public", "brand", f);

function brandData(file: string): string | null {
  try {
    const p = BRAND(file);
    if (!fs.existsSync(p)) return null;
    const b64 = fs.readFileSync(p).toString("base64");
    const mime = file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

function imgData(img: ImagenEvid): string {
  const mime = img.isPng ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${Buffer.from(img.bytes).toString("base64")}`;
}

// Columnas según cantidad de imágenes (grid adaptable).
function columnas(n: number): number {
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}

export async function buildPortafolioPptx(data: PortafolioData): Promise<Uint8Array> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W", width: 13.333, height: 7.5 });
  pptx.layout = "W";
  const W = 13.333;
  const H = 7.5;

  // ---------- Portada ----------
  const cover = pptx.addSlide();
  cover.background = { color: "FFFFFF" };
  const turismo = brandData("turismo-salud.jpeg");
  if (turismo) {
    cover.addImage({ data: turismo, x: (W - 4) / 2, y: 0.7, w: 4, h: 2.55, sizing: { type: "contain", w: 4, h: 2.55 } });
  }
  cover.addText("PORTAFOLIO DE EVIDENCIAS", {
    x: 0.5, y: 3.5, w: W - 1, h: 0.8, align: "center",
    fontSize: 34, bold: true, color: ROJO,
  });
  cover.addText(data.empresa || "Establecimiento", {
    x: 0.5, y: 4.4, w: W - 1, h: 0.7, align: "center",
    fontSize: 26, bold: true, color: NAVY,
  });
  const sub = [data.giro, data.lugar, data.fecha].filter(Boolean).join("  ·  ");
  if (sub) {
    cover.addText(sub, {
      x: 0.5, y: 5.15, w: W - 1, h: 0.4, align: "center",
      fontSize: 14, color: GRIS,
    });
  }
  const directiva = brandData("directiva.png");
  if (directiva) {
    cover.addImage({ data: directiva, x: (W - 1) / 2, y: 6.1, w: 1, h: 1, sizing: { type: "contain", w: 1, h: 1 } });
  }
  cover.addText("Sello de Turismo de Salud · Secretaría de Turismo de México", {
    x: 0.5, y: 7.05, w: W - 1, h: 0.3, align: "center", fontSize: 9, color: GRIS,
  });

  // ---------- Por indicador: 1 slide para la descripción y slide(s) para anexos ----------
  for (const s of data.secciones) {
    const titulo = `${s.codigo} ${s.tipo}  ·  ${s.texto}`;

    // --- Slide de descripción (texto solo, sin imágenes que lo tapen) ---
    if (s.descripcion) {
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };
      slide.addText(titulo, {
        x: 0.5, y: 0.35, w: W - 1, h: 0.9, align: "left",
        fontSize: 18, bold: true, color: ROJO, valign: "top", fit: "shrink",
      });
      slide.addText(s.descripcion, {
        x: 0.6, y: 1.5, w: W - 1.2, h: H - 2, align: "left", valign: "top",
        fontSize: 16, color: NAVY, fit: "shrink", lineSpacingMultiple: 1.1,
      });
    }

    // --- Slide(s) de anexos: grid adaptable, máx 2 filas por slide ---
    if (s.imagenes.length > 0) {
      const cols = columnas(s.imagenes.length);
      const perSlide = cols * 2; // hasta 2 filas por slide
      for (let start = 0; start < s.imagenes.length; start += perSlide) {
        const grupo = s.imagenes.slice(start, start + perSlide);
        const rows = Math.ceil(grupo.length / cols);
        const slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };
        slide.addText(titulo + " · anexos", {
          x: 0.5, y: 0.3, w: W - 1, h: 0.7, align: "left",
          fontSize: 14, bold: true, color: ROJO, valign: "top", fit: "shrink",
        });
        const areaX = 0.5;
        const areaY = 1.15;
        const areaW = W - 1;
        const areaH = H - areaY - 0.3;
        const gap = 0.2;
        const cellW = (areaW - gap * (cols - 1)) / cols;
        const cellH = (areaH - gap * (rows - 1)) / rows;
        grupo.forEach((img, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const x = areaX + c * (cellW + gap);
          const y = areaY + r * (cellH + gap);
          try {
            slide.addImage({
              data: imgData(img),
              x, y, w: cellW, h: cellH,
              sizing: { type: "contain", w: cellW, h: cellH },
            });
          } catch {
            /* imagen inválida: se omite */
          }
        });
      }
    }
  }

  const buf = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return new Uint8Array(buf);
}
