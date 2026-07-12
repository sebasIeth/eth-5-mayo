import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { buildRegistroPdf } from "@/lib/registroPdf";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const db = await getDb();

  // Un consultor puede descargar el PDF de cualquier registro pasando ?id=.
  // Cualquier otro usuario obtiene su propio registro (comportamiento previo).
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

  const pdf = await buildRegistroPdf({
    registro: doc.registro,
    empresa: doc.empresa,
    documentos: doc.documentos,
    firma: doc.firma,
    usuarioNombre: doc.usuarioNombre,
    usuarioEmail: doc.usuarioEmail,
    estatus: doc.estatus,
    creadoEn: doc.creadoEn,
  });

  const nombre = (doc.empresa?.razonSocial || "registro")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Formato-de-Registro-${nombre}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
