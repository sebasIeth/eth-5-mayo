import { getCurrentUser } from "@/lib/auth";
import { TODAS_PREGUNTAS } from "@/app/verificacion/data";
import { CRITERIOS } from "@/app/verificacion/criterios";

// "Pregúntale a Cynthia": sugiere qué escribir en la descripción de cumplimiento
// de un indicador, usando UsePod (proxy compatible con OpenAI).
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const token = process.env.POD_API_KEY;
  const model = process.env.POD_MODEL || "gpt-4o-mini";
  if (!token) {
    return Response.json(
      { ok: false, error: "La asistente no está configurada." },
      { status: 503 },
    );
  }

  let body: { codigo?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const codigo = typeof body.codigo === "string" ? body.codigo : "";
  const pregunta = TODAS_PREGUNTAS.find((p) => p.codigo === codigo);
  if (!pregunta) {
    return Response.json({ ok: false, error: "Indicador no válido." }, { status: 400 });
  }
  const criterios = (CRITERIOS[codigo] ?? []).map((c, i) => `${i + 1}. ${c}`).join("\n");

  const system =
    "Eres Cynthia, consultora del Sello de Turismo de Salud de la SECTUR de México. " +
    "Redactas por el establecimiento un BORRADOR COMPLETO y LISTO PARA EDITAR de la " +
    "'Evidencia de Cumplimiento' de un indicador de la Lista de Verificación (MSE-FO-55). " +
    "\n\nReglas:\n" +
    "- Escribe en primera persona del establecimiento (nosotros/nuestro), en español.\n" +
    "- Sé MUY DETALLADO y CONCRETO, no genérico. Nada de 'adjuntamos los links correspondientes'. " +
    "Describe exactamente qué se hace, dónde y qué muestra cada evidencia.\n" +
    "- Da un EJEMPLO REALISTA y verosímil, como quedaría ya lleno, para que la persona solo ajuste los datos.\n" +
    "- Cuando se pidan enlaces (página web, redes, portales), ESCRIBE ejemplos de URL reales y plausibles, " +
    "p.ej. https://www.tuestablecimiento.com/turismo-de-salud , https://www.instagram.com/tuestablecimiento , " +
    "https://www.facebook.com/tuestablecimiento . Usa el formato correcto de URL.\n" +
    "- Marca entre corchetes lo que la persona debe reemplazar, p.ej. [nombre del establecimiento], " +
    "[tu ciudad], [tu URL]. Así sabe qué personalizar.\n" +
    "- Menciona expresamente cada evidencia requerida (capturas, fotos, enlaces) y qué debe verse en ella.\n" +
    "- Extensión: entre 4 y 7 oraciones, en 1 o 2 párrafos. Sin markdown, sin viñetas, sin títulos. Solo el texto redactado.";
  const userMsg =
    `Indicador ${pregunta.codigo}: ${pregunta.texto}\n\n` +
    (criterios ? `Evidencias que se deben presentar para este punto:\n${criterios}\n\n` : "") +
    "Redacta el borrador completo, detallado y con ejemplos concretos (incluyendo URLs de ejemplo " +
    "cuando aplique) de la evidencia de cumplimiento de este punto, listo para que yo lo edite.";

  try {
    const res = await fetch(
      `https://api.usepod.ai/proxy/${token}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: 600,
          temperature: 0.5,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ],
        }),
      },
    );
    const data = await res.json().catch(() => null);
    const raw: string = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
    // Limpia markdown que a veces cuela el modelo: enlaces [txt](url), negritas
    // y viñetas, para dejar texto plano listo para el cuadro.
    const texto = raw
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, a: string, b: string) =>
        a.trim() === b.trim() ? b.trim() : `${a.trim()} (${b.trim()})`,
      )
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "")
      .trim();
    if (!res.ok || !texto) {
      console.error("[cynthia] respuesta inválida:", res.status, data?.error);
      return Response.json(
        { ok: false, error: "Cynthia no pudo responder ahora. Intenta de nuevo." },
        { status: 502 },
      );
    }
    return Response.json({ ok: true, sugerencia: texto }, { status: 200 });
  } catch (err) {
    console.error("[cynthia] error:", err);
    return Response.json(
      { ok: false, error: "No se pudo contactar a la asistente." },
      { status: 500 },
    );
  }
}
