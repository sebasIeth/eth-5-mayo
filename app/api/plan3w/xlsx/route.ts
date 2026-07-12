import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { type Plan3wItem } from "@/lib/plan3wPdf";
import { buildPlan3wXlsx } from "@/lib/plan3wXlsx";
import { FAMILIAS, type RespuestasVerif } from "@/app/verificacion/data";
import { aplicaAlGiro } from "@/app/verificacion/aplicabilidad";

function fmtDate(v?: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const familiaId = url.searchParams.get("familia");

  const familia = FAMILIAS.find((f) => f.id === familiaId);
  if (!familia) {
    return Response.json({ ok: false, error: "Familia no válida." }, { status: 400 });
  }

  const db = await getDb();
  let doc = null;
  if (id && user.rol === "consultor") {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      return Response.json({ ok: false, error: "Registro no válido." }, { status: 400 });
    }
    doc = await db.collection("registros").findOne({ _id });
  } else {
    doc = await db.collection("registros").findOne({ usuarioId: user.id });
  }
  if (!doc) {
    return Response.json({ ok: false, error: "No hay registro." }, { status: 404 });
  }

  const verif = (doc.verificacion ?? {}) as {
    respuestas?: RespuestasVerif;
    tieneRestaurante?: boolean;
    planFamilia?: Record<
      string,
      { ugb?: string; lider?: string; miembros?: string; director?: string }
    >;
  };
  const pf = verif.planFamilia?.[familia.id] ?? {};
  const respuestas = verif.respuestas ?? {};
  const giro = (doc.registro?.giro as string | undefined) ?? null;
  const opts = { tieneRestaurante: verif.tieneRestaurante === true };

  // Un renglón por indicador APLICABLE de la familia marcado "No cumple".
  const noCumple = familia.preguntas.filter(
    (p) => aplicaAlGiro(p.codigo, giro, opts) && respuestas[p.codigo]?.r === "no",
  );
  const items: Plan3wItem[] = noCumple.map((p) => {
    const plan = respuestas[p.codigo]?.plan;
    return {
      punto: `${p.codigo} ${p.texto}`,
      actividades: plan?.actividades ?? "",
      responsable: plan?.responsable ?? "",
      fecha: fmtDate(plan?.fecha),
    };
  });

  if (items.length === 0) {
    return Response.json(
      { ok: false, error: "Esta familia no tiene indicadores en 'No cumple'." },
      { status: 404 },
    );
  }

  // Fecha rendición de cuentas = la última fecha de cumplimiento (las fechas
  // vienen como yyyy-mm-dd, que ordenan cronológicamente en texto).
  const maxFecha = familia.preguntas
    .map((p) => respuestas[p.codigo]?.plan?.fecha)
    .filter((f): f is string => !!f)
    .sort()
    .at(-1);

  // Objetivo y Meta dinámicos según la familia y sus puntos "No cumple".
  const codigos = noCumple.map((p) => p.codigo);
  const listaCodigos =
    codigos.length <= 1
      ? codigos.join("")
      : `${codigos.slice(0, -1).join(", ")} y ${codigos[codigos.length - 1]}`;
  const objetivo = `Conocer los requisitos establecidos en el sello de salud y bienestar en la familia de ${familia.nombre}`;
  const meta = `Implementar al 100% los puntos ${listaCodigos}`;

  const now = new Date();
  const xlsx = await buildPlan3wXlsx({
    empresa: (doc.empresa?.razonSocial as string | undefined) ?? "",
    objetivo,
    meta,
    fechaElaboracion: fmtDate(now.toISOString()),
    fechaRendicion: fmtDate(maxFecha),
    ugb: pf.ugb ?? "",
    lider: pf.lider ?? "",
    miembros: pf.miembros ?? "",
    director: pf.director ?? "",
    firmaEmpresa: (doc.firma as string | undefined) ?? "",
    items,
  });

  const nombre = (doc.empresa?.razonSocial || "plan3w")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(xlsx as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Plan-3W-${familia.id}-${nombre}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
