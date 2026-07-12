import path from "node:path";
import ExcelJS from "exceljs";
import { DOCUMENTOS, docKey } from "@/app/registro/data";

const TEMPLATE = path.join(process.cwd(), "templates", "formato-registro.xlsx");

type Reg = {
  registro?: { tipoTramite?: string; giro?: string; consultor?: string };
  empresa?: Record<string, string | null | undefined>;
  documentos?: Record<string, string>;
};

function fmtDate(v?: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

// Celda "Entrega" (esquina superior-izquierda del merge) por documento,
// mismo orden que DOCUMENTOS. Filas 34-41; columna E (izquierda) o I (derecha).
const ENTREGA_CELLS: Array<string | null> = [
  "E34", // 0  MSE-FO-28  (izq)
  "I34", // 1  MSE-FO-29  (der)
  "E35", // 2  MSE-FO-55 inicial (izq)
  "I35", // 3  MSE-FO-32  (der)
  "E36", // 4  MSE-FO-55 final (izq)
  "I36", // 5  MSE-FO-41  (der)
  "E37", // 6  MSE-FO-55B (izq)
  "I37", // 7  Carpeta    (der)
  "E38", // 8  MSE-FO-31  (izq)
  "I38", // 9  RNT        (der)
  "E39", // 10 MSE-FO-59  (izq)
  "E40", // 11 MSE-FO-57  (izq)
  "E41", // 12 MSE-FO-09  (izq)
];

export async function buildRegistroXlsx(reg: Reg): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE);
  const ws = wb.getWorksheet("Fo Reg");
  if (!ws) {
    throw new Error('Hoja "Fo Reg" no encontrada en la plantilla.');
  }

  const set = (coord: string, value?: string | null) => {
    const t = (value ?? "").toString().trim();
    if (!t) return;
    // exceljs exige escribir en la esquina superior-izquierda de un merge.
    ws.getCell(coord).value = t;
  };

  const r = reg.registro ?? {};
  const e = reg.empresa ?? {};

  // Tipo de trámite: "X" en la celda vacía junto a la opción elegida.
  if (r.tipoTramite === "Nuevo") set("F9", "X");
  else if (r.tipoTramite === "Renovado") set("I9", "X");

  // Giro del servicio a certificar (label C11) -> C12:H12
  set("C12", r.giro);
  // Nombre y correo del consultor (label C13) -> C14:H14
  set("C14", r.consultor);

  // Nombre Comercial y/o Razón Social (label C18:D18) -> E18:I18
  set("E18", e.razonSocial);
  // Nombre del Sello (RNT): la descripción está en E19:I19; el valor va en C19 (vacía).
  set("C19", e.nombreSello);
  // Nombre del Representante / Encargado (label C20) -> C21:H21
  set("C21", e.representante);
  // Av. / Calle y Código Postal (label C22) -> D22:I22
  set("D22", e.calleCP);
  // Municipio / Alcaldía (label C24) -> D24:I24
  set("D24", e.municipio);
  // Estado (label C26:D26) -> E26:I26
  set("E26", e.estado);
  // Lada (label C28) -> D28 (vacía a la derecha del label)
  set("D28", e.lada);
  // Teléfonos (label G28:I28, sin celda libre en la fila) -> C29:H29
  set("C29", e.telefonos);
  // E-mail (label C30) -> D30:I30
  set("D30", e.email);

  // Fechas de entrega de documentos
  const docs = reg.documentos ?? {};
  DOCUMENTOS.forEach((d, i) => {
    const cell = ENTREGA_CELLS[i];
    const v = docs[docKey(d)];
    if (cell && v) set(cell, fmtDate(v));
  });

  const out = await wb.xlsx.writeBuffer();
  return out as unknown as Buffer;
}
