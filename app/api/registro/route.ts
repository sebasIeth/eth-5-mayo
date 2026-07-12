import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
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
  const registro = (body.registro ?? {}) as Record<string, unknown>;
  const empresa = (body.empresa ?? {}) as Record<string, unknown>;
  const documentos = (body.documentos ?? {}) as Record<string, string>;
  const firma = typeof body.firma === "string" ? body.firma : "";

  // Al ENVIAR se exige todo. Al GUARDAR (borrador) se acepta parcial.
  if (accion === "enviar") {
    const errors: Record<string, string> = {};
    if (!str(registro.tipoTramite))
      errors["registro.tipoTramite"] = "Selecciona el tipo de trámite.";
    if (!str(registro.giro))
      errors["registro.giro"] = "Selecciona el giro a certificar.";
    if (!str(empresa.razonSocial))
      errors["empresa.razonSocial"] = "Falta el nombre comercial / razón social.";
    if (!str(empresa.nombreSello))
      errors["empresa.nombreSello"] = "Falta el nombre del Sello (RNT).";
    if (!str(empresa.representante))
      errors["empresa.representante"] = "Falta el representante / encargado.";
    if (!str(empresa.calleCP)) errors["empresa.calleCP"] = "Falta la dirección.";
    if (!str(empresa.municipio))
      errors["empresa.municipio"] = "Falta el municipio / alcaldía.";
    if (!str(empresa.estado)) errors["empresa.estado"] = "Falta el estado.";
    if (!str(empresa.lada)) errors["empresa.lada"] = "Falta la lada.";
    if (!str(empresa.telefonos)) errors["empresa.telefonos"] = "Falta el teléfono.";
    const email = str(empresa.email);
    if (!email) errors["empresa.email"] = "Falta el correo.";
    else if (!EMAIL_RE.test(email)) errors["empresa.email"] = "El correo no es válido.";
    if (!firma.startsWith("data:image/"))
      errors["firma"] = "Sube una foto de tu firma.";
    if (Object.keys(errors).length > 0)
      return Response.json({ ok: false, errors }, { status: 422 });
  }

  if (firma && (!firma.startsWith("data:image/") || firma.length > 3_000_000)) {
    return Response.json(
      { ok: false, errors: { firma: "Imagen de firma inválida o muy grande." } },
      { status: 422 },
    );
  }

  try {
    const db = await getDb();

    const setData: Record<string, unknown> = {
      registro: {
        tipoTramite: str(registro.tipoTramite) || null,
        giro: str(registro.giro) || null,
        consultor: str(registro.consultor) || null,
      },
      empresa: {
        razonSocial: str(empresa.razonSocial) || null,
        nombreSello: str(empresa.nombreSello) || null,
        representante: str(empresa.representante) || null,
        calleCP: str(empresa.calleCP) || null,
        municipio: str(empresa.municipio) || null,
        estado: str(empresa.estado) || null,
        lada: str(empresa.lada) || null,
        telefonos: str(empresa.telefonos) || null,
        email: str(empresa.email).toLowerCase() || null,
      },
      documentos,
      firma,
      usuarioNombre: user.nombre,
      usuarioEmail: user.email,
      actualizadoEn: new Date(),
    };

    const setOnInsert: Record<string, unknown> = {
      usuarioId: user.id,
      creadoEn: new Date(),
    };
    if (accion === "enviar") {
      setData.estatus = "enviado";
      setData.enviadoEn = new Date();
    } else {
      // Solo al crear el borrador; no degrada uno ya enviado.
      setOnInsert.estatus = "borrador";
    }

    await db
      .collection("registros")
      .updateOne(
        { usuarioId: user.id },
        { $set: setData, $setOnInsert: setOnInsert },
        { upsert: true },
      );

    const saved = await db
      .collection("registros")
      .findOne({ usuarioId: user.id }, { projection: { _id: 1, estatus: 1 } });

    return Response.json(
      { ok: true, id: saved?._id?.toString(), estatus: saved?.estatus, accion },
      { status: 200 },
    );
  } catch (err) {
    console.error("[registro] error al guardar:", err);
    return Response.json(
      { ok: false, error: "No se pudo guardar. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
