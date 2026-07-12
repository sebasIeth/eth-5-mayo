import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import {
  TODAS_PREGUNTAS,
  calcVerificacion,
  type Respuesta,
  type RespuestasVerif,
  type RespValor,
  type Evidencia,
} from "@/app/verificacion/data";
import { preguntasAplicables } from "@/app/verificacion/aplicabilidad";

const RESPUESTAS_VALIDAS: Respuesta[] = ["na", "no", "si"];

function parseEvidencias(raw: unknown): Evidencia[] {
  if (!Array.isArray(raw)) return [];
  const out: Evidencia[] = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const key = (e as Record<string, unknown>).key;
    const nombre = (e as Record<string, unknown>).nombre;
    if (typeof key === "string" && key.startsWith("evidencias/")) {
      out.push({ key, nombre: typeof nombre === "string" ? nombre : "" });
    }
    if (out.length >= 20) break;
  }
  return out;
}

// Normaliza y valida el objeto de respuestas que llega del cliente.
// Acepta códigos conocidos, valores "na" | "no" | "si", observaciones y
// referencias de evidencias (claves de R2).
function parseRespuestas(raw: unknown): RespuestasVerif | null {
  if (!raw || typeof raw !== "object") return null;
  const codigos = new Set(TODAS_PREGUNTAS.map((p) => p.codigo));
  const out: RespuestasVerif = {};
  for (const [codigo, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!codigos.has(codigo)) continue;
    if (!val || typeof val !== "object") continue;
    const r = (val as Record<string, unknown>).r;
    const obs = (val as Record<string, unknown>).obs;
    if (typeof r !== "string" || !RESPUESTAS_VALIDAS.includes(r as Respuesta))
      return null;
    const entry: RespValor = { r: r as Respuesta };
    const obsStr = typeof obs === "string" ? obs.trim() : "";
    if (obsStr) entry.obs = obsStr;
    const evid = parseEvidencias((val as Record<string, unknown>).evidencias);
    if (evid.length) entry.evidencias = evid;
    out[codigo] = entry;
  }
  return out;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { ok: false, error: "Debes iniciar sesión." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const accion = body.accion === "enviar" ? "enviar" : "guardar";
  const TIPOS_VALIDOS = ["diagnostica", "final", "renovacion"];
  const tipoEvaluacion =
    typeof body.tipoEvaluacion === "string" &&
    TIPOS_VALIDOS.includes(body.tipoEvaluacion)
      ? body.tipoEvaluacion
      : "diagnostica";
  const tieneRestaurante = body.tieneRestaurante === true;
  const respuestas = parseRespuestas(body.respuestas);
  if (!respuestas) {
    return Response.json(
      { ok: false, error: "Respuestas inválidas." },
      { status: 422 },
    );
  }

  let db;
  try {
    db = await getDb();
  } catch (err) {
    console.error("[verificacion] error de conexión:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar. Intenta de nuevo." },
      { status: 500 },
    );
  }

  // Giro del establecimiento → indicadores aplicables (fuente de verdad).
  const existente = await db
    .collection("registros")
    .findOne({ usuarioId: user.id });
  const giro = (existente?.registro?.giro as string | undefined) ?? null;
  const aplicables = preguntasAplicables(giro, { tieneRestaurante });

  const calc = calcVerificacion(respuestas, aplicables);

  // Al ENVIAR se exige, SOLO en las preguntas aplicables al giro: respuesta
  // (no/sí), nota y al menos una foto. Las no aplicables no se exigen.
  if (accion === "enviar") {
    const faltResp: string[] = [];
    const faltNota: string[] = [];
    const faltFoto: string[] = [];
    for (const p of aplicables) {
      const v = respuestas[p.codigo];
      const r = v?.r;
      if (r !== "no" && r !== "si") faltResp.push(p.codigo);
      if (!v?.obs?.trim()) faltNota.push(p.codigo);
      if (!(v?.evidencias && v.evidencias.length > 0)) faltFoto.push(p.codigo);
    }
    if (faltResp.length || faltNota.length || faltFoto.length) {
      return Response.json(
        {
          ok: false,
          error:
            "Cada pregunta aplicable necesita respuesta, una nota y al menos una foto de evidencia.",
          faltResp,
          faltNota,
          faltFoto,
        },
        { status: 422 },
      );
    }
  }

  try {
    const now = new Date();

    const setData: Record<string, unknown> = {
      "verificacion.respuestas": respuestas,
      "verificacion.tipoEvaluacion": tipoEvaluacion,
      "verificacion.tieneRestaurante": tieneRestaurante,
      "verificacion.actualizadoEn": now,
      // Mantenemos estos datos por si el doc se crea desde la verificación.
      usuarioNombre: user.nombre,
      usuarioEmail: user.email,
      actualizadoEn: now,
    };

    const setOnInsert: Record<string, unknown> = {
      usuarioId: user.id,
      creadoEn: now,
    };

    if (accion === "enviar") {
      setData["verificacion.estatus"] = "enviado";
      setData["verificacion.enviadoEn"] = now;
      // "Porcentaje obtenido" = cálculo global CONGELADO en el primer envío.
      // El "porcentaje final" (en vivo) se calcula al vuelo y no se guarda.
      const yaCongelado =
        (existente?.verificacion as { porcentajeObtenido?: number } | undefined)
          ?.porcentajeObtenido != null;
      if (!yaCongelado) {
        setData["verificacion.porcentajeObtenido"] = calc.pct;
      }
    } else {
      // Solo al crear; no degrada una verificación ya enviada.
      setOnInsert["verificacion.estatus"] = "borrador";
    }

    await db
      .collection("registros")
      .updateOne(
        { usuarioId: user.id },
        { $set: setData, $setOnInsert: setOnInsert },
        { upsert: true },
      );

    return Response.json(
      { ok: true, accion, pct: calc.pct, aprobado: calc.aprobado },
      { status: 200 },
    );
  } catch (err) {
    console.error("[verificacion] error al guardar:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
