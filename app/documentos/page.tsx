import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { REGISTRO_CONSULTOR } from "../verificacion/data";
import PlatformUser from "../components/PlatformUser";
import CartasForm from "./CartasForm";

export const metadata: Metadata = {
  title: "Documentos · Sello de Turismo de Salud",
};

export default async function CartasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol === "consultor") redirect("/consultor");
  if (!user.aceptoLegal) redirect("/consentimiento");

  const db = await getDb();
  const doc = await db.collection("registros").findOne({ usuarioId: user.id });
  const e = (doc?.empresa ?? {}) as Record<string, string | null>;

  const prefill = {
    empresa: e.razonSocial ?? "",
    representante: e.representante ?? "",
    telefono: [e.lada, e.telefonos].filter(Boolean).join(" ") || (e.telefonos ?? ""),
    email: e.email ?? "",
    estado: e.estado ?? "",
    municipio: e.municipio ?? "",
    consultorNombre: (doc?.registro?.consultor as string) || "Cynthia Ericka García Díaz",
    consultorRegistro: REGISTRO_CONSULTOR,
    hayFirma: !!doc?.firma,
  };

  const guardadas = {
    intencion: (doc?.cartas?.intencion ?? {}) as Record<string, string>,
    adhesion: (doc?.cartas?.adhesion ?? {}) as Record<string, string>,
  };

  return (
    <div className="rg-page">
      <header className="rg-top">
        <div className="rg-top__inner">
          <Link href="/dashboard" className="rg-back" aria-label="Mi panel">
            <img src="/brand/directiva.png" alt="Directiva" />
          </Link>
          <PlatformUser nombre={user.nombre} />
        </div>
      </header>

      <main className="rg-main">
        <div className="rev-back">
          <Link href="/dashboard">← Volver a mi panel</Link>
        </div>
        <div className="dash-head">
          <div>
            <span className="rg-eyebrow">Documentos</span>
            <h1 className="dash-title">Documentos del Sello</h1>
            <p className="dash-sub">
              Llena la Carta de Intención (MSE-FO-29) y la Carta de Adhesión
              (MSE-FO-32). Se descargan en el formato oficial. Usan la firma de
              tu registro.
            </p>
          </div>
        </div>

        <CartasForm prefill={prefill} guardadas={guardadas} />
      </main>

      <footer className="rg-foot">
        <Link href="/dashboard">← Volver a mi panel</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
