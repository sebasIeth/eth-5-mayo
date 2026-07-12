import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  getCurrentUser,
  hashPassword,
  generateAccessCode,
  CONSULTOR_EMAILS,
} from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// Lista los accesos de establecimientos (excluye consultores).
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.rol !== "consultor") {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  const db = await getDb();
  const docs = await db
    .collection("usuarios")
    .find({ email: { $nin: CONSULTOR_EMAILS } })
    .sort({ creadoEn: -1 })
    .toArray();
  const usuarios = docs.map((u) => ({
    id: u._id.toString(),
    email: u.email as string,
    nombre: (u.nombre as string) ?? "",
    creadoEn: u.creadoEn ? new Date(u.creadoEn).toISOString() : "",
  }));
  return Response.json({ ok: true, usuarios }, { status: 200 });
}

// Crea un acceso nuevo o regenera el código de uno existente.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "consultor") {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const accion = body.accion === "regenerar" ? "regenerar" : "crear";
  const email = str(body.email).toLowerCase();
  const nombre = str(body.nombre);

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json(
      { ok: false, error: "Escribe un correo válido." },
      { status: 422 },
    );
  }
  if (CONSULTOR_EMAILS.includes(email)) {
    return Response.json(
      { ok: false, error: "Ese correo es de consultor." },
      { status: 422 },
    );
  }

  const db = await getDb();
  const users = db.collection("usuarios");
  const existente = await users.findOne({ email });
  const codigo = generateAccessCode();

  try {
    if (accion === "regenerar") {
      if (!existente) {
        return Response.json(
          { ok: false, error: "No existe un acceso con ese correo." },
          { status: 404 },
        );
      }
      await users.updateOne(
        { _id: existente._id },
        { $set: { passwordHash: hashPassword(codigo), codigoActualizadoEn: new Date() } },
      );
      return Response.json(
        { ok: true, email, nombre: existente.nombre ?? "", codigo },
        { status: 200 },
      );
    }

    // crear
    if (existente) {
      return Response.json(
        { ok: false, error: "Ya existe un acceso con ese correo." },
        { status: 409 },
      );
    }
    const r = await users.insertOne({
      nombre: nombre || email,
      email,
      passwordHash: hashPassword(codigo),
      creadoEn: new Date(),
      creadoPor: new ObjectId(user.id),
    });
    return Response.json(
      { ok: true, id: r.insertedId.toString(), email, nombre: nombre || email, codigo },
      { status: 201 },
    );
  } catch (err) {
    console.error("[usuarios] error:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
