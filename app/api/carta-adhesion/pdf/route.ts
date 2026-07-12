import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { buildCartaAdhesionPdf } from "@/lib/cartaAdhesionPdf";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const db = await getDb();
  const id = new URL(request.url).searchParams.get("id");
  let doc = null;
  if (id && user.rol === "consultor") {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      return Response.json({ ok: false, error: "No válido." }, { status: 400 });
    }
    doc = await db.collection("registros").findOne({ _id });
  } else {
    doc = await db.collection("registros").findOne({ usuarioId: user.id });
  }
  if (!doc) {
    return Response.json({ ok: false, error: "No hay datos." }, { status: 404 });
  }

  const pdf = await buildCartaAdhesionPdf({
    carta: doc.cartas?.adhesion,
    firma: doc.firma,
  });

  const nombre = (doc.empresa?.razonSocial || "carta")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="MSE-FO-32-Carta-Adhesion-${nombre}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
