import { getDb } from "@/lib/mongodb";
import { getCurrentUser, CONSULTOR_EMAILS } from "@/lib/auth";
import {
  enviarCorreo,
  correoEnvioParaRevision,
  correoConfirmacionEnvio,
} from "@/lib/email";
import {
  FAMILIAS,
  TODAS_PREGUNTAS,
  calcVerificacion,
  type Respuesta,
  type RespuestasVerif,
  type RespValor,
  type Evidencia,
  type PlanFamilia,
  type PlanesFamilia,
} from "@/app/verificacion/data";
import {
  aplicaAlGiro,
  preguntasAplicables,
} from "@/app/verificacion/aplicabilidad";

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
    // Plan de acción (solo "No cumple"): actividades / responsable / fecha.
    const planRaw = (val as Record<string, unknown>).plan;
    if (planRaw && typeof planRaw === "object") {
      const g = (k: string) => {
        const v = (planRaw as Record<string, unknown>)[k];
        return typeof v === "string" ? v.trim() : "";
      };
      const actividades = g("actividades");
      const responsable = g("responsable");
      const fecha = g("fecha");
      if (actividades || responsable || fecha) {
        entry.plan = { actividades, responsable, fecha };
      }
    }
    out[codigo] = entry;
  }
  return out;
}

// Datos del pie del Plan 3W por familia (solo ids de familias conocidas).
function parsePlanFamilia(raw: unknown): PlanesFamilia {
  const out: PlanesFamilia = {};
  if (!raw || typeof raw !== "object") return out;
  const famIds = new Set(FAMILIAS.map((f) => f.id));
  for (const [fid, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!famIds.has(fid) || !val || typeof val !== "object") continue;
    const g = (k: string) => {
      const v = (val as Record<string, unknown>)[k];
      return typeof v === "string" ? v.trim() : "";
    };
    const pf: PlanFamilia = {
      ugb: g("ugb"),
      lider: g("lider"),
      miembros: g("miembros"),
      director: g("director"),
    };
    if (pf.ugb || pf.lider || pf.miembros || pf.director) out[fid] = pf;
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
  const planFamilia = parsePlanFamilia(body.planFamilia);
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

  // Al ENVIAR se exige, SOLO en las preguntas aplicables al giro:
  //  - "Sí cumple" → descripción + al menos una foto.
  //  - "No cumple" → plan de acción (actividades, responsable y fecha).
  if (accion === "enviar") {
    const faltResp: string[] = [];
    const faltNota: string[] = [];
    const faltFoto: string[] = [];
    const faltPlan: string[] = [];
    for (const p of aplicables) {
      const v = respuestas[p.codigo];
      const r = v?.r;
      if (r !== "no" && r !== "si") {
        faltResp.push(p.codigo);
        continue;
      }
      if (r === "si") {
        if (!v?.obs?.trim()) faltNota.push(p.codigo);
        if (!(v?.evidencias && v.evidencias.length > 0)) faltFoto.push(p.codigo);
      } else {
        const pl = v?.plan;
        if (!pl?.actividades?.trim() || !pl?.responsable?.trim() || !pl?.fecha)
          faltPlan.push(p.codigo);
      }
    }
    // Cada familia con "No cumple" necesita los datos del 3W.
    const famsSinDatos: string[] = [];
    for (const fam of FAMILIAS) {
      const tieneNo = fam.preguntas.some(
        (p) =>
          aplicaAlGiro(p.codigo, giro, { tieneRestaurante }) &&
          respuestas[p.codigo]?.r === "no",
      );
      if (!tieneNo) continue;
      const pf = planFamilia[fam.id];
      if (!pf?.ugb || !pf?.lider || !pf?.miembros || !pf?.director)
        famsSinDatos.push(fam.id);
    }
    if (
      faltResp.length ||
      faltNota.length ||
      faltFoto.length ||
      faltPlan.length ||
      famsSinDatos.length
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Sí cumple necesita descripción y foto; No cumple necesita plan de acción; y cada familia con 'No cumple' necesita los datos del Plan 3W.",
          faltResp,
          faltNota,
          faltFoto,
          faltPlan,
          famsSinDatos,
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
      "verificacion.planFamilia": planFamilia,
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

    // ——— Notificaciones por correo (best-effort) al enviar a revisión ———
    if (accion === "enviar") {
      const estName =
        (existente?.empresa?.razonSocial as string | undefined) || user.nombre;
      const c1 = correoEnvioParaRevision(estName, "verificación");
      await enviarCorreo({
        to: CONSULTOR_EMAILS[0],
        subject: c1.subject,
        html: c1.html,
      });
      const dest =
        (existente?.empresa?.email as string | undefined) || user.email;
      const c2 = correoConfirmacionEnvio(user.nombre, "verificación");
      await enviarCorreo({ to: dest, subject: c2.subject, html: c2.html });
    }

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
