import { ObjectId } from "mongodb";
import { getCurrentUser, CONSULTOR_HARDCODE } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { buildVerificacionDocx } from "@/lib/verificacionDocx";
import { DOCUMENTOS, docKey } from "@/app/registro/data";
import {
  REGISTRO_CONSULTOR,
  type RespuestasVerif,
  type TipoEvaluacion,
} from "@/app/verificacion/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const db = await getDb();

  // Un consultor puede descargar el DOCX de cualquier registro pasando ?id=.
  // Cualquier otro usuario obtiene su propio registro.
  const id = new URL(request.url).searchParams.get("id");
  let doc = null;
  if (id && user.rol === "consultor") {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      return Response.json(
        { ok: false, error: "Registro no válido." },
        { status: 400 },
      );
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
    tipoEvaluacion?: TipoEvaluacion;
    tieneRestaurante?: boolean;
    porcentajeObtenido?: number;
    estatus?: string;
  };

  const documentos = (doc.documentos ?? {}) as Record<string, string>;
  const docVerifInicial = DOCUMENTOS.find(
    (d) => d.codigo === "MSE-FO-55" && /inicial/i.test(d.nombre),
  );
  const fecha = docVerifInicial ? (documentos[docKey(docVerifInicial)] ?? "") : "";

  const buffer = await buildVerificacionDocx({
    giro: (doc.registro?.giro as string | undefined) ?? null,
    tieneRestaurante: verif.tieneRestaurante === true,
    respuestas: verif.respuestas ?? {},
    tipoEvaluacion: verif.tipoEvaluacion ?? "diagnostica",
    porcentajeObtenido: verif.porcentajeObtenido ?? null,
    aprobada: verif.estatus === "completado",
    encabezado: {
      empresa: (doc.empresa?.razonSocial as string | undefined) ?? "",
      ejecutivo: (doc.empresa?.representante as string | undefined) ?? "",
      evaluador: CONSULTOR_HARDCODE.nombre,
      registroConsultor: REGISTRO_CONSULTOR,
      fecha,
      firmaEmpresa: (doc.firma as string | undefined) ?? "",
    },
  });

  const nombre = (doc.empresa?.razonSocial || "verificacion")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return new Response(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Lista-Verificacion-${nombre}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
