import path from "node:path";
import ExcelJS from "exceljs";
import type { Plan3wData } from "@/lib/plan3wPdf";

const TEMPLATE = path.join(process.cwd(), "templates", "plan-3w.xlsx");

// Rellena la plantilla oficial "T1-01 Plan 3W" conservando su formato (logos,
// tabla, pie). Solo escribimos valores en las celdas superior-izquierda de cada
// rango combinado. Ver mapa de celdas en el commit / route.
export async function buildPlan3wXlsx(data: Plan3wData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE);
  const ws = wb.getWorksheet("T1-01 Plan 3W");
  if (!ws) throw new Error("Hoja 'T1-01 Plan 3W' no encontrada en la plantilla.");

  // Encabezado
  ws.getCell("B11").value = data.empresa; // Empresa: (B11:D12)
  ws.getCell("F11").value = data.fechaElaboracion; // Fecha de elaboración: (F11:G11)
  ws.getCell("F12").value = data.fechaRendicion; // Fecha rendición de cuentas: (F12:G12)
  ws.getCell("B13").value = data.objetivo; // Objetivo: (B13:G13)
  ws.getCell("B14").value = data.meta; // Meta: (B14:G14)

  // Tabla de acciones: filas 17..26 = acciones 1..10.
  // ¿Qué? = B{16+i} (B17:E17...), ¿Quién? = F, ¿Cuándo? = G.
  data.items.slice(0, 10).forEach((it, i) => {
    const row = 17 + i;
    const que = it.actividades ? `${it.punto} / ${it.actividades}` : it.punto;
    ws.getCell(`B${row}`).value = que;
    ws.getCell(`F${row}`).value = it.responsable;
    ws.getCell(`G${row}`).value = it.fecha;
  });

  // Pie
  ws.getCell("B28").value = data.ugb; // UGB: (B28:D28)
  ws.getCell("B29").value = data.lider; // Líder: (B29:D29)
  ws.getCell("B30").value = data.miembros; // Miembros: (B30:D30)
  ws.getCell("E30").value = data.director; // Director: (etiqueta E28:G28 -> valor E30:G30)
  // "Firma de Aprobación" (imagen): se omite por ahora.

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
