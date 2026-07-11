import { getDb } from "@/lib/mongodb";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  empresa?: unknown;
  nombre?: unknown;
  correo?: unknown;
  telefono?: unknown;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Cuerpo inválido." },
      { status: 400 },
    );
  }

  const empresa = str(body.empresa);
  const nombre = str(body.nombre);
  const correo = str(body.correo);
  const telefono = str(body.telefono);

  // Validación en servidor (no confiamos solo en el cliente)
  const errors: Record<string, string> = {};
  if (!empresa) errors.empresa = "Falta el nombre de la empresa u hotel.";
  if (!nombre) errors.nombre = "Falta tu nombre.";
  if (!correo) errors.correo = "Falta el correo.";
  else if (!EMAIL_RE.test(correo)) errors.correo = "El correo no es válido.";
  const telDigits = telefono.replace(/\D/g, "");
  if (telDigits.length > 0 && telDigits.length !== 10)
    errors.telefono = "El teléfono debe tener 10 dígitos.";

  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  try {
    const db = await getDb();
    const doc = {
      empresa,
      nombre,
      correo: correo.toLowerCase(),
      telefono: telDigits ? `+52${telDigits}` : null,
      creadoEn: new Date(),
      origen: "landing-preregistro",
    };
    const result = await db.collection("preregistros").insertOne(doc);
    return Response.json(
      { ok: true, id: result.insertedId },
      { status: 201 },
    );
  } catch (err) {
    console.error("[preregistro] error al guardar:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
