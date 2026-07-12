// Datos de las cartas MSE-FO-29 (Intención) y MSE-FO-32 (Adhesión).

export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export type CartaIntencion = {
  lugar: string;
  fecha: string; // ISO yyyy-mm-dd
  empresa: string; // razón social ("La empresa ___")
  rfc: string;
  participante: string;
  puesto: string;
  ejecutivoNombre: string;
  ejecutivoCargo: string;
  ejecutivoEmpresa: string;
  ejecutivoTelefono: string;
  ejecutivoEmail: string;
};

export type TamanoEmpresa = "micro" | "pequena" | "mediana" | "";

export type CartaAdhesion = {
  lugar: string;
  estado: string;
  fecha: string; // ISO yyyy-mm-dd
  empresa: string; // razón social ("La empresa ___")
  rfc: string;
  monto: string;
  consultorNombre: string;
  consultorRegistro: string;
  numEmpleados: string;
  tamano: TamanoEmpresa;
  firmanteNombre: string;
};

export type Cartas = {
  intencion?: Partial<CartaIntencion>;
  adhesion?: Partial<CartaAdhesion>;
};

// Descompone una fecha ISO en día, nombre de mes y año de 2 dígitos.
export function partesFecha(iso?: string): { dia: string; mes: string; anio2: string } {
  if (!iso) return { dia: "", mes: "", anio2: "" };
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return { dia: "", mes: "", anio2: "" };
  return {
    dia: String(d.getDate()),
    mes: MESES[d.getMonth()] ?? "",
    anio2: String(d.getFullYear()).slice(-2),
  };
}

// Deduce el tamaño de empresa a partir del número de empleados.
export function tamanoPorEmpleados(n: number): TamanoEmpresa {
  if (!n || n < 1) return "";
  if (n <= 10) return "micro";
  if (n <= 50) return "pequena";
  return "mediana";
}
