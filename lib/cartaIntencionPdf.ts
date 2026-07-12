import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { partesFecha, type CartaIntencion } from "@/app/cartas/data";

const NAVY = rgb(0.098, 0.102, 0.18);
const PAGE_H = 792;
const Y = (yTop: number) => PAGE_H - yTop;
const TEMPLATE = path.join(process.cwd(), "templates", "carta-intencion.pdf");

type Datos = {
  carta?: Partial<CartaIntencion>;
  firma?: string;
};

export async function buildCartaIntencionPdf(d: Datos): Promise<Uint8Array> {
  const bytes = fs.readFileSync(TEMPLATE);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
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
  // Igual que put, pero reduce el tamaño si el texto no cabe en maxW (evita
  // que un nombre largo invada el texto impreso de la plantilla).
  const putFit = (
    text: string | null | undefined,
    x: number,
    yTop: number,
    maxW: number,
    size = 9,
  ) => {
    const t = (text ?? "").toString().trim();
    if (!t) return;
    let s = size;
    while (s > 6 && font.widthOfTextAtSize(t, s) > maxW) s -= 0.5;
    put(t, x, yTop, s);
  };

  const c = d.carta ?? {};
  const { dia, mes, anio2 } = partesFecha(c.fecha);

  // Encabezado de fecha: "____ a ___ de ____ de 20__"
  put(c.lugar, 278, 167);
  put(dia, 385, 167);
  put(mes, 456, 167);
  put(anio2, 517, 167);

  // "La empresa ____ con RFC: ____" (empresa = razón social)
  putFit(c.empresa, 148, 192, 82);
  putFit(c.rfc, 284, 192, 95);

  // "a través de (nombre del participante) ____ que ocupa el puesto de ____"
  put(c.participante, 158, 204);
  put(c.puesto, 340, 204);

  // Datos del ejecutivo de mayor rango
  put(c.ejecutivoNombre, 128, 467);
  put(c.ejecutivoCargo, 120, 491);
  put(c.ejecutivoEmpresa, 130, 516);
  put(c.ejecutivoTelefono, 130, 540);
  put(c.ejecutivoEmail, 264, 540);

  // Firma (reutiliza la firma del registro) — bajo "Atentamente"
  if (d.firma && d.firma.startsWith("data:image/")) {
    try {
      const b64 = d.firma.split(",")[1] ?? "";
      const imgBytes = Uint8Array.from(Buffer.from(b64, "base64"));
      const img = d.firma.includes("image/png")
        ? await pdf.embedPng(imgBytes)
        : await pdf.embedJpg(imgBytes);
      const s = Math.min(150 / img.width, 34 / img.height, 1);
      const iw = img.width * s;
      const ih = img.height * s;
      page.drawImage(img, {
        x: 306 - iw / 2,
        y: Y(428),
        width: iw,
        height: ih,
      });
    } catch {
      /* si no se puede incrustar, se omite */
    }
  }

  return pdf.save();
}
