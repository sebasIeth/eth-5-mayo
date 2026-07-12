import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, CONSULTOR_EMAILS } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import PlatformUser from "../../components/PlatformUser";
import UsuariosManager from "./UsuariosManager";

export const metadata: Metadata = {
  title: "Gestión de usuarios · Sello de Turismo de Salud",
};

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "consultor") redirect("/dashboard");

  const db = await getDb();
  const docs = await db
    .collection("usuarios")
    .find({ email: { $nin: CONSULTOR_EMAILS } })
    .sort({ creadoEn: -1 })
    .toArray();
  const usuarios = docs.map((u) => ({
    id: u._id.toString(),
    email: u.email as string,
    nombre: (u.nombre as string) ?? "",
    codigo: (u.codigoAcceso as string) ?? "",
    creadoEn: u.creadoEn
      ? new Date(u.creadoEn).toLocaleDateString("es-MX")
      : "",
  }));

  return (
    <div className="rg-page">
      <header className="rg-top">
        <div className="rg-top__inner">
          <Link href="/consultor" className="rg-back" aria-label="Panel del consultor">
            <img src="/brand/directiva.png" alt="Directiva" />
          </Link>
          <div className="cons-top-right">
            <span className="cons-tag">Consultor</span>
            <PlatformUser nombre={user.nombre} />
          </div>
        </div>
      </header>

      <main className="rg-main">
        <div className="rev-back">
          <Link href="/consultor">← Volver a la lista</Link>
        </div>
        <div className="dash-head">
          <div>
            <span className="rg-eyebrow">Panel del consultor</span>
            <h1 className="dash-title">Gestión de usuarios</h1>
            <p className="dash-sub">
              Crea el acceso de cada establecimiento y comparte su correo y
              código. Ellos solo inician sesión.
            </p>
          </div>
        </div>

        <UsuariosManager initial={usuarios} />
      </main>

      <footer className="rg-foot">
        <Link href="/consultor">← Volver a la lista</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
