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
    "Ayudas a los establecimientos a redactar la 'Evidencia de Cumplimiento' de cada indicador " +
    "de la Lista de Verificación (MSE-FO-55). Da un ejemplo breve y concreto, en español, de qué " +
    "debe escribir el establecimiento para describir cómo cumple ese punto y qué evidencias adjunta. " +
    "Máximo 2 o 3 oraciones, en primera persona del establecimiento, sin markdown ni listas.";
  const userMsg =
    `Indicador ${pregunta.codigo}: ${pregunta.texto}\n\n` +
    (criterios ? `Evidencias que debo presentar:\n${criterios}\n\n` : "") +
    "¿Qué debo escribir en la descripción de cumplimiento de este punto?";

  try {
    const res = await fetch(
      `https://api.usepod.ai/proxy/${token}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          temperature: 0.4,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ],
        }),
      },
    );
    const data = await res.json().catch(() => null);
    const texto: string =
      data?.choices?.[0]?.message?.content?.trim?.() ?? "";
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
