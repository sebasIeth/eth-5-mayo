import path from "node:path";
import ExcelJS from "exceljs";
import type { RespuestasVerif } from "@/app/verificacion/data";
import { aplicaAlGiro, motivoNoAplica } from "@/app/verificacion/aplicabilidad";

const TEMPLATE = path.join(process.cwd(), "templates", "calculadora-sello.xlsx");

const MESES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

function fechaLarga(v?: Date | string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} DE ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

type Datos = {
  respuestas?: RespuestasVerif;
  giro?: string | null;
  tieneRestaurante?: boolean;
  empresa?: string;
  consultor?: string;
  fecha?: Date | string;
};

// Llena la hoja "Lista de Verificación" con las respuestas del establecimiento;
// el REPORTE (fórmulas) recalcula solo al abrir en Excel.
export async function buildCalculadoraXlsx(d: Datos): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE);

  const resp = d.respuestas ?? {};
  const giro = d.giro ?? null;
  const opts = { tieneRestaurante: d.tieneRestaurante === true };

  const lista = wb.getWorksheet("Lista de Verificación");
  if (lista) {
    // Filas 2..40 = 39 indicadores. Cada fila tiene A=familia, B=indicador.
    for (let row = 2; row <= 40; row++) {
      const a = lista.getCell(`A${row}`).value;
      const b = lista.getCell(`B${row}`).value;
      if (a == null || b == null) continue;
      const codigo = `${a}.${b}`;

      // Limpia las columnas de captura (la plantilla trae el ejemplo lleno).
      lista.getCell(`F${row}`).value = null; // Aplica
      lista.getCell(`G${row}`).value = null; // NO cumple
      lista.getCell(`H${row}`).value = null; // SI cumple
      lista.getCell(`I${row}`).value = null; // ¿por qué no aplica?
      lista.getCell(`J${row}`).value = null; // Evidencias

      const aplica = aplicaAlGiro(codigo, giro, opts);
      lista.getCell(`F${row}`).value = aplica ? "SI" : "NO";

      if (!aplica) {
        lista.getCell(`I${row}`).value = motivoNoAplica(codigo, giro, opts) || "No aplica";
        continue;
      }
      const v = resp[codigo];
      if (v?.r === "si") {
        lista.getCell(`H${row}`).value = "X";
        if (v.obs) lista.getCell(`J${row}`).value = v.obs;
      } else if (v?.r === "no") {
        lista.getCell(`G${row}`).value = "X";
      }
    }
  }

  // Encabezado del REPORTE.
  const rep = wb.getWorksheet("REPORTE DE EVALUACIÓN");
  if (rep) {
    if (d.empresa) rep.getCell("B5").value = `Empresa:  ${d.empresa}`;
    if (d.consultor) rep.getCell("D5").value = d.consultor;
    const f = fechaLarga(d.fecha);
    if (f) rep.getCell("C6").value = f;
  }

  // Forzar recálculo de todas las fórmulas al abrir en Excel.
  wb.calcProperties.fullCalcOnLoad = true;

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}
