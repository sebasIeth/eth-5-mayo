import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { LEGAL_VERSION } from "@/lib/legal";

// Registra que el usuario aceptó la versión vigente de los documentos legales.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const db = await getDb();
  await db.collection("usuarios").updateOne(
    { _id: new ObjectId(user.id) },
    {
      $set: {
        aceptoLegalVersion: LEGAL_VERSION,
        aceptoLegalEn: new Date(),
      },
    },
  );
  return Response.json({ ok: true }, { status: 200 });
}
