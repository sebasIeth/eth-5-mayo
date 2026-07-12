import { getDb } from "@/lib/mongodb";
import { hashPassword, setSession } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const nombre = str(body.nombre);
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  const errors: Record<string, string> = {};
  if (!nombre) errors.nombre = "Escribe tu nombre.";
  if (!email) errors.email = "Escribe tu correo.";
  else if (!EMAIL_RE.test(email)) errors.email = "El correo no es válido.";
  if (!password) errors.password = "Crea una contraseña.";
  else if (password.length < 6)
    errors.password = "Mínimo 6 caracteres.";
  if (Object.keys(errors).length)
    return Response.json({ ok: false, errors }, { status: 422 });

  try {
    const db = await getDb();
    const users = db.collection("usuarios");
    const exists = await users.findOne({ email });
    if (exists)
      return Response.json(
        { ok: false, errors: { email: "Ya existe una cuenta con este correo." } },
        { status: 409 },
      );

    const result = await users.insertOne({
      nombre,
      email,
      passwordHash: hashPassword(password),
      creadoEn: new Date(),
    });
    await setSession(result.insertedId.toString());
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[signup] error:", err);
    return Response.json(
      { ok: false, error: "No se pudo crear la cuenta. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
