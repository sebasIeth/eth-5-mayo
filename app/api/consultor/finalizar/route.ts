import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { enviarCorreo, correoServicioFinalizado } from "@/lib/email";
import { registrarSelloEnBlockchain } from "@/lib/blockchain";

// El consultor marca (o reabre) el servicio de un establecimiento como finalizado.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "consultor") {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const registroId = typeof body.registroId === "string" ? body.registroId : "";
  const finalizar = body.finalizar !== false; // por defecto finaliza
  let _id: ObjectId;
  try {
    _id = new ObjectId(registroId);
  } catch {
    return Response.json({ ok: false, error: "Registro no válido." }, { status: 400 });
  }

  const db = await getDb();
  const doc = await db.collection("registros").findOne({ _id });
  if (!doc) {
    return Response.json({ ok: false, error: "No existe el registro." }, { status: 404 });
  }

  await db.collection("registros").updateOne(
    { _id },
    {
      $set: {
        servicioFinalizado: finalizar,
        servicioFinalizadoEn: finalizar ? new Date() : null,
        servicioFinalizadoPor: finalizar ? user.nombre : null,
        actualizadoEn: new Date(),
      },
    },
  );

  let blockchain: unknown = null;
  // Avisa al establecimiento y registra el Sello on-chain al finalizar.
  if (finalizar) {
    const nombre =
      (doc.usuarioNombre as string | undefined) ||
      (doc.empresa?.razonSocial as string | undefined) ||
      "";
    const dest =
      (doc.empresa?.email as string | undefined) ||
      (doc.usuarioEmail as string | undefined);
    if (dest) {
      const c = correoServicioFinalizado(nombre);
      await enviarCorreo({ to: dest, subject: c.subject, html: c.html });
    }

    // Registro en blockchain (Sepolia). Solo si aún no está registrado.
    if (!doc.blockchain?.txHash) {
      const res = await registrarSelloEnBlockchain({
        registroId: registroId,
        empresa: (doc.empresa?.razonSocial as string) || nombre || "",
        giro: (doc.registro?.giro as string) || "",
        consultor: user.nombre,
      });
      if (res) {
        blockchain = { ...res, registradoEn: new Date() };
        await db
          .collection("registros")
          .updateOne({ _id }, { $set: { blockchain } });
      }
    } else {
      blockchain = doc.blockchain;
    }
  }

  return Response.json(
    { ok: true, finalizado: finalizar, blockchain },
    { status: 200 },
  );
}
