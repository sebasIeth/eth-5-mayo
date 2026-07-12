import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { buildRegistroXlsx } from "@/lib/registroXlsx";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const db = await getDb();

  // Un consultor puede descargar el XLSX de cualquier registro pasando ?id=.
  // Cualquier otro usuario obtiene su propio registro.
  const id = new URL(request.url).searchParams.get("id");
  let doc = null;
  if (id && user.rol === "consultor") {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      return Response.json(
        { ok: false, error: "Registro no válido." },
        { status: 400 },
      );
    }
    doc = await db.collection("registros").findOne({ _id });
  } else {
    doc = await db.collection("registros").findOne({ usuarioId: user.id });
  }

  if (!doc) {
    return Response.json({ ok: false, error: "No hay registro." }, { status: 404 });
  }

  const buf = await buildRegistroXlsx({
    registro: doc.registro,
    empresa: doc.empresa,
    documentos: doc.documentos,
  });

  const nombre = (doc.empresa?.razonSocial || "registro")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(buf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Formato-de-Registro-${nombre}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
