import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { parseRevisiones, recomputeEstatus } from "@/app/registro/revision";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (user.rol !== "consultor") {
    return Response.json(
      { ok: false, error: "Solo un consultor puede enviar revisiones." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const registroId = typeof body.registroId === "string" ? body.registroId : "";
  let _id: ObjectId;
  try {
    _id = new ObjectId(registroId);
  } catch {
    return Response.json(
      { ok: false, error: "Registro no válido." },
      { status: 400 },
    );
  }

  const revisiones = parseRevisiones(body.revisiones);
  if (!revisiones) {
    return Response.json(
      {
        ok: false,
        error: "Revisión inválida. Las correcciones requieren comentario.",
      },
      { status: 422 },
    );
  }

  try {
    const db = await getDb();
    const doc = await db.collection("registros").findOne({ _id });
    if (!doc) {
      return Response.json(
        { ok: false, error: "No existe el registro." },
        { status: 404 },
      );
    }

    const estatus = recomputeEstatus(revisiones, doc.estatus ?? "enviado");

    await db.collection("registros").updateOne(
      { _id },
      {
        $set: {
          revisiones,
          revisadoPor: user.nombre,
          revisadoEn: new Date(),
          estatus,
          actualizadoEn: new Date(),
        },
      },
    );

    return Response.json({ ok: true, estatus }, { status: 200 });
  } catch (err) {
    console.error("[revision] error:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar la revisión." },
      { status: 500 },
    );
  }
}
