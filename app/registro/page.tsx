import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import RegistroForm, { type InitialData } from "./RegistroForm";
import PlatformUser from "../components/PlatformUser";

export const metadata: Metadata = {
  title: "Formato de Registro · Sello de Turismo de Salud",
  description:
    "Formato de registro (MSE-FO-28) para iniciar el proceso del Sello de Turismo de Salud — Segmentos Especializados.",
};

export default async function RegistroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await getDb();
  const doc = await db.collection("registros").findOne({ usuarioId: user.id });
  const initial: InitialData | undefined = doc
    ? {
        registro: {
          tipoTramite: doc.registro?.tipoTramite ?? "",
          giro: doc.registro?.giro ?? "",
        },
        empresa: {
          razonSocial: doc.empresa?.razonSocial ?? "",
          nombreSello: doc.empresa?.nombreSello ?? "",
          representante: doc.empresa?.representante ?? "",
          calleCP: doc.empresa?.calleCP ?? "",
          municipio: doc.empresa?.municipio ?? "",
          estado: doc.empresa?.estado ?? "",
          lada: doc.empresa?.lada ?? "",
          telefonos: doc.empresa?.telefonos ?? "",
          email: doc.empresa?.email ?? "",
        },
        documentos: (doc.documentos ?? {}) as Record<string, string>,
        firma: typeof doc.firma === "string" ? doc.firma : "",
        estatus: doc.estatus ?? "borrador",
        revisiones: (doc.revisiones ?? undefined) as InitialData["revisiones"],
      }
    : undefined;

  return (
    <div className="rg-page">
      <header className="rg-top">
        <div className="rg-top__inner">
          <Link href="/dashboard" className="rg-back" aria-label="Ir al panel">
            <img src="/brand/directiva.png" alt="Directiva" />
          </Link>
          <PlatformUser nombre={user.nombre} />
        </div>
      </header>

      <main className="rg-main">
        <div className="rg-hero">
          <span className="rg-eyebrow">Formato de Registro · MSE-FO-28</span>
          <h1>
            {initial ? "Continúa tu registro" : "Comienza tu proceso de certificación"}
          </h1>
          <p>
            Puedes guardar tu avance y completarlo poco a poco. Cuando los campos
            obligatorios estén listos, podrás enviarlo para que un consultor tome
            tu caso.
          </p>
        </div>

        <RegistroForm initial={initial} />
      </main>

      <footer className="rg-foot">
        <Link href="/dashboard">← Ir a mi panel</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
