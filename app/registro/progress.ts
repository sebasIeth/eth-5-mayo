// Avance del Formato de Registro: cuenta los campos OBLIGATORIOS + la firma.
// (Los documentos son opcionales, no cuentan para el % ni para poder enviar.)

type Shape = {
  registro?: { tipoTramite?: string | null; giro?: string | null };
  empresa?: {
    razonSocial?: string | null;
    nombreSello?: string | null;
    representante?: string | null;
    calleCP?: string | null;
    municipio?: string | null;
    estado?: string | null;
    lada?: string | null;
    telefonos?: string | null;
    email?: string | null;
  };
  firma?: string | null;
};

export function computeProgress(d: Shape) {
  const items = [
    d.registro?.tipoTramite,
    d.registro?.giro,
    d.empresa?.razonSocial,
    d.empresa?.nombreSello,
    d.empresa?.representante,
    d.empresa?.calleCP,
    d.empresa?.municipio,
    d.empresa?.estado,
    d.empresa?.lada,
    d.empresa?.telefonos,
    d.empresa?.email,
    d.firma,
  ];
  const total = items.length;
  const filled = items.filter((v) =>
    typeof v === "string" ? v.trim().length > 0 : !!v,
  ).length;
  return {
    filled,
    total,
    pct: total ? Math.round((filled / total) * 100) : 0,
    complete: filled === total,
  };
}
