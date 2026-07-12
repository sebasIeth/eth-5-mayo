import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// Campos permitidos por cada carta (whitelist para no guardar basura).
const CAMPOS_INTENCION = [
  "lugar",
  "fecha",
  "empresa",
  "rfc",
  "participante",
  "puesto",
  "ejecutivoNombre",
  "ejecutivoCargo",
  "ejecutivoEmpresa",
  "ejecutivoTelefono",
  "ejecutivoEmail",
];
const CAMPOS_ADHESION = [
  "lugar",
  "estado",
  "fecha",
  "empresa",
  "rfc",
  "monto",
  "consultorNombre",
  "consultorRegistro",
  "numEmpleados",
  "tamano",
  "firmanteNombre",
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Debes iniciar sesión." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const tipo = body.tipo === "adhesion" ? "adhesion" : body.tipo === "intencion" ? "intencion" : null;
  if (!tipo) {
    return Response.json({ ok: false, error: "Tipo de carta inválido." }, { status: 400 });
  }
  const campos = tipo === "intencion" ? CAMPOS_INTENCION : CAMPOS_ADHESION;
  const entrada = (body.datos ?? {}) as Record<string, unknown>;
  const datos: Record<string, string> = {};
  for (const k of campos) datos[k] = str(entrada[k]);

  try {
    const db = await getDb();
    await db.collection("registros").updateOne(
      { usuarioId: user.id },
      {
        $set: {
          [`cartas.${tipo}`]: datos,
          [`cartas.${tipo}ActualizadoEn`]: new Date(),
          usuarioNombre: user.nombre,
          usuarioEmail: user.email,
          actualizadoEn: new Date(),
        },
        $setOnInsert: { usuarioId: user.id, creadoEn: new Date() },
      },
      { upsert: true },
    );
    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[cartas] error al guardar:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
