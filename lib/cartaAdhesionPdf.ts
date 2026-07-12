import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { partesFecha, type CartaAdhesion } from "@/app/cartas/data";

const NAVY = rgb(0.098, 0.102, 0.18);
const PAGE_H = 792;
const Y = (yTop: number) => PAGE_H - yTop;
const TEMPLATE = path.join(process.cwd(), "templates", "carta-adhesion.pdf");

type Datos = {
  carta?: Partial<CartaAdhesion>;
  firma?: string;
};

export async function buildCartaAdhesionPdf(d: Datos): Promise<Uint8Array> {
  const bytes = fs.readFileSync(TEMPLATE);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.getPage(0);

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
  const putCenter = (text: string, cx: number, yTop: number, size = 9) => {
    const t = (text ?? "").toString().trim();
    if (!t) return;
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: cx - w / 2, y: Y(yTop), size, font, color: NAVY });
  };

  const c = d.carta ?? {};
  const { dia, mes, anio2 } = partesFecha(c.fecha);

  // "Lugar: ____, ____ a ___ de ____ de 20__."
  put(c.lugar, 240, 183);
  put(c.estado, 309, 183);
  put(dia, 386, 183, 8);
  put(mes, 418, 183);
  put(anio2, 508, 183);

  // "La empresa ____ con RFC ____"
  put(c.empresa, 183, 207);
  put(c.rfc, 88, 219);

  // "$ ____ más IVA"
  put(c.monto, 172, 342);

  // "impartido por: ____ , Consultor ... registrado ... No. ____"
  put(c.consultorNombre, 232, 378, 8.5);
  put(c.consultorRegistro, 88, 403, 8.5);

  // "mi empresa tiene ____ empleados"
  put(c.numEmpleados, 236, 439);

  // Tamaño: X en Micro / Pequeña / Mediana
  if (c.tamano === "micro") put("X", 146, 452, 10, bold);
  else if (c.tamano === "pequena") put("X", 250, 452, 10, bold);
  else if (c.tamano === "mediana") put("X", 356, 452, 10, bold);

  // Nombre del firmante: justo encima de la línea de firma.
  putCenter(c.firmanteNombre ?? "", 306, 536, 9);

  // Firma (reutiliza la firma del registro) — encima del nombre, en el hueco
  // entre "Para respaldar su compromiso..." y la línea.
  if (d.firma && d.firma.startsWith("data:image/")) {
    try {
      const b64 = d.firma.split(",")[1] ?? "";
      const imgBytes = Uint8Array.from(Buffer.from(b64, "base64"));
      const img = d.firma.includes("image/png")
        ? await pdf.embedPng(imgBytes)
        : await pdf.embedJpg(imgBytes);
      const s = Math.min(140 / img.width, 22 / img.height, 1);
      const iw = img.width * s;
      const ih = img.height * s;
      page.drawImage(img, {
        x: 306 - iw / 2,
        y: Y(527),
        width: iw,
        height: ih,
      });
    } catch {
      /* si no se puede incrustar, se omite */
    }
  }

  return pdf.save();
}
