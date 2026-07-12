import { getCurrentUser } from "@/lib/auth";
import { urlFirmadaGet, r2Configurado } from "@/lib/r2";

// GET /api/evidencia?key=<key> -> redirige a una URL firmada temporal para ver
// la imagen. La empresa solo puede ver sus propias evidencias; el consultor,
// cualquiera.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key.startsWith("evidencias/")) {
    return Response.json({ ok: false, error: "Clave inválida." }, { status: 400 });
  }
  if (user.rol !== "consultor" && !key.startsWith(`evidencias/${user.id}/`)) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (!r2Configurado()) {
    return Response.json(
      { ok: false, error: "Almacenamiento no configurado." },
      { status: 503 },
    );
  }
  try {
    const url = await urlFirmadaGet(key, 3600);
    return Response.redirect(url, 302);
  } catch (err) {
    console.error("[evidencia] error al firmar:", err);
    return Response.json({ ok: false, error: "No disponible." }, { status: 500 });
  }
}
