import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { buildCalculadoraXlsx } from "@/lib/calculadoraXlsx";

// MSE-FO-59 Calculadora de Sello: solo el consultor la descarga.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "consultor") {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  let _id: ObjectId;
  try {
    _id = new ObjectId(id ?? "");
  } catch {
    return Response.json({ ok: false, error: "Registro no válido." }, { status: 400 });
  }

  const db = await getDb();
  const doc = await db.collection("registros").findOne({ _id });
  if (!doc) {
    return Response.json({ ok: false, error: "No existe el registro." }, { status: 404 });
  }

  const verif = (doc.verificacion ?? {}) as Record<string, unknown>;
  const xlsx = await buildCalculadoraXlsx({
    respuestas: verif.respuestas as never,
    giro: doc.registro?.giro ?? null,
    tieneRestaurante: verif.tieneRestaurante === true,
    empresa: doc.empresa?.razonSocial ?? "",
    consultor:
      (verif.revisadoPor as string) ||
      (doc.registro?.consultor as string) ||
      "Cynthia Ericka García Díaz",
    fecha: (verif.revisadoEn as Date) || (verif.enviadoEn as Date) || doc.actualizadoEn,
  });

  const nombre = (doc.empresa?.razonSocial || "empresa")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(xlsx as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="MSE-FO-59-Calculadora-${nombre}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
