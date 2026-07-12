import { getCurrentUser } from "@/lib/auth";
import { borrarObjeto, r2Configurado } from "@/lib/r2";

// Borra una o varias evidencias de R2. Solo el dueño (la empresa) puede borrar
// sus propias claves (evidencias/<userId>/...).
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!r2Configurado()) {
    return Response.json({ ok: true, borradas: 0 }, { status: 200 });
  }

  let body: { keys?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const keys = Array.isArray(body.keys)
    ? body.keys.filter(
        (k): k is string =>
          typeof k === "string" && k.startsWith(`evidencias/${user.id}/`),
      )
    : [];

  let borradas = 0;
  for (const key of keys) {
    try {
      await borrarObjeto(key);
      borradas++;
    } catch (err) {
      console.error("[evidencia] error al borrar:", key, err);
    }
  }
  return Response.json({ ok: true, borradas }, { status: 200 });
}
