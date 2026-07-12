import { getCurrentUser } from "@/lib/auth";
import { subirObjeto, r2Configurado } from "@/lib/r2";

const MAX = 6 * 1024 * 1024; // 6 MB por foto

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!r2Configurado()) {
    return Response.json(
      { ok: false, error: "El almacenamiento de evidencias no está configurado." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const codigo = (form.get("codigo") as string | null)?.trim() || "gen";
  const codigoSafe = codigo.replace(/[^0-9.]/g, "") || "gen";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return Response.json({ ok: false, error: "No se recibió archivo." }, { status: 400 });
  }

  const subidas: { key: string; nombre: string }[] = [];
  try {
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return Response.json(
          { ok: false, error: "Solo se permiten imágenes." },
          { status: 422 },
        );
      }
      if (file.size > MAX) {
        return Response.json(
          { ok: false, error: `“${file.name}” pesa más de 6 MB.` },
          { status: 422 },
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const stamp = `${Date.now()}-${Math.floor(performance.now() % 100000)}`;
      const key = `evidencias/${user.id}/${codigoSafe}/${stamp}-${slug(file.name)}`;
      await subirObjeto(key, bytes, file.type || "image/jpeg");
      subidas.push({ key, nombre: file.name });
    }
    return Response.json({ ok: true, evidencias: subidas }, { status: 201 });
  } catch (err) {
    console.error("[evidencia] error al subir:", err);
    return Response.json(
      { ok: false, error: "No se pudo subir la evidencia. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
