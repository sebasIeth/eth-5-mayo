import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { urlFirmadaGet } from "@/lib/r2";
import {
  TODAS_PREGUNTAS,
  type RespuestasVerif,
} from "@/app/verificacion/data";
import { aplicaAlGiro } from "@/app/verificacion/aplicabilidad";
import {
  buildPortafolioPdf,
  type SeccionEvid,
  type ImagenEvid,
} from "@/lib/portafolioPdf";

// Descarga los bytes de una evidencia de R2 (URL firmada). null si falla.
async function bajarImagen(key: string, nombre: string): Promise<ImagenEvid | null> {
  try {
    const url = await urlFirmadaGet(key);
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    const buf = new Uint8Array(await res.arrayBuffer());
    const isPng = ct.includes("png") || key.toLowerCase().endsWith(".png");
    return { bytes: buf, isPng, nombre };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "consultor") {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  let _id: ObjectId;
  try {
    _id = new ObjectId(id ?? "");
  } catch {
    return Response.json({ ok: false, error: "Registro no válido." }, { status: 400 });
  }

  const db = await getDb();
  const doc = await db.collection("registros").findOne({ _id });
  if (!doc) {
    return Response.json({ ok: false, error: "No existe el registro." }, { status: 404 });
  }

  const verif = (doc.verificacion ?? {}) as {
    respuestas?: RespuestasVerif;
    tieneRestaurante?: boolean;
  };
  const respuestas = verif.respuestas ?? {};
  const giro = (doc.registro?.giro as string) ?? null;
  const opts = { tieneRestaurante: verif.tieneRestaurante === true };

  // Indicadores aplicables "Sí cumple" con descripción y/o anexos.
  const secciones: SeccionEvid[] = [];
  for (const p of TODAS_PREGUNTAS) {
    if (!aplicaAlGiro(p.codigo, giro, opts)) continue;
    const v = respuestas[p.codigo];
    if (!v || v.r !== "si") continue;
    const descripcion = (v.obs ?? "").trim();
    const evid = v.evidencias ?? [];
    if (!descripcion && evid.length === 0) continue;

    const imagenes: ImagenEvid[] = [];
    for (const e of evid) {
      const img = await bajarImagen(e.key, e.nombre ?? "");
      if (img) imagenes.push(img);
    }
    secciones.push({
      codigo: p.codigo,
      tipo: p.tipo,
      texto: p.texto,
      descripcion,
      imagenes,
    });
  }

  const pdf = await buildPortafolioPdf({
    empresa: (doc.empresa?.razonSocial as string) || "Establecimiento",
    giro: giro || "",
    lugar:
      [doc.empresa?.municipio, doc.empresa?.estado].filter(Boolean).join(", ") || "",
    fecha: new Date(
      (verif as { revisadoEn?: Date }).revisadoEn ||
        doc.actualizadoEn ||
        doc.creadoEn ||
        Date.now(),
    ).toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
    secciones,
  });

  const nombre = ((doc.empresa?.razonSocial as string) || "portafolio")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Portafolio-de-Evidencias-${nombre}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
