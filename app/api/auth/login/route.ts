import { getDb } from "@/lib/mongodb";
import {
  verifyPassword,
  setSession,
  hashPassword,
  CONSULTOR_HARDCODE,
} from "@/lib/auth";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const email = str(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password)
    return Response.json(
      { ok: false, error: "Escribe tu correo y contraseña." },
      { status: 422 },
    );

  try {
    const db = await getDb();
    const users = db.collection("usuarios");

    // Acceso de consultor hardcodeado: si coincide, crea la cuenta si no existe.
    if (
      email === CONSULTOR_HARDCODE.email &&
      password === CONSULTOR_HARDCODE.password
    ) {
      let consultor = await users.findOne({ email });
      if (!consultor) {
        const r = await users.insertOne({
          nombre: CONSULTOR_HARDCODE.nombre,
          email,
          passwordHash: hashPassword(password),
          creadoEn: new Date(),
        });
        await setSession(r.insertedId.toString());
      } else {
        // Mantener el nombre canónico del consultor.
        if (consultor.nombre !== CONSULTOR_HARDCODE.nombre) {
          await users.updateOne(
            { _id: consultor._id },
            { $set: { nombre: CONSULTOR_HARDCODE.nombre } },
          );
        }
        await setSession(consultor._id.toString());
      }
      return Response.json({ ok: true });
    }

    const user = await users.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json(
        { ok: false, error: "Correo o contraseña incorrectos." },
        { status: 401 },
      );
    }
    await setSession(user._id.toString());
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[login] error:", err);
    return Response.json(
      { ok: false, error: "No se pudo iniciar sesión. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
