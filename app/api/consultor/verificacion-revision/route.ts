import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import {
  parseVerifRevisiones,
  recomputeVerifEstatus,
} from "@/app/verificacion/revision";
import type { RespuestasVerif } from "@/app/verificacion/data";
import { enviarCorreo, correoResultadoRevision } from "@/lib/email";

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

  const revisiones = parseVerifRevisiones(body.revisiones);
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

    const verifDoc = (doc.verificacion ?? {}) as {
      respuestas?: RespuestasVerif;
      estatus?: string;
    };
    const respuestas: RespuestasVerif = verifDoc.respuestas ?? {};
    const estatus = recomputeVerifEstatus(
      revisiones,
      respuestas,
      verifDoc.estatus ?? "enviado",
    );

    await db.collection("registros").updateOne(
      { _id },
      {
        $set: {
          "verificacion.revisiones": revisiones,
          "verificacion.revisadoPor": user.nombre,
          "verificacion.revisadoEn": new Date(),
          "verificacion.estatus": estatus,
          actualizadoEn: new Date(),
        },
      },
    );

    // ——— Avisar al establecimiento del resultado (aprobado / correcciones) ———
    if (estatus === "completado" || estatus === "en_espera_documentos") {
      const dest =
        (doc.empresa?.email as string | undefined) ||
        (doc.usuarioEmail as string | undefined);
      if (dest) {
        const nombre =
          (doc.usuarioNombre as string | undefined) ||
          (doc.empresa?.razonSocial as string | undefined) ||
          "";
        const c = correoResultadoRevision(
          nombre,
          "verificación",
          estatus === "completado",
        );
        await enviarCorreo({ to: dest, subject: c.subject, html: c.html });
      }
    }

    return Response.json({ ok: true, estatus }, { status: 200 });
  } catch (err) {
    console.error("[verificacion-revision] error:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar la revisión." },
      { status: 500 },
    );
  }
}
