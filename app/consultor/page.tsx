import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { computeProgress } from "../registro/progress";
import { calcVerificacion, type RespuestasVerif } from "../verificacion/data";
import PlatformUser from "../components/PlatformUser";
import ConsultorTabs from "./ConsultorTabs";

export const metadata: Metadata = {
  title: "Panel del consultor · Sello de Turismo de Salud",
};

export default async function ConsultorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "consultor") redirect("/dashboard");

  const db = await getDb();
  const raw = await db
    .collection("registros")
    .find({})
    .sort({ actualizadoEn: -1, creadoEn: -1 })
    .toArray();

  // Solo mostramos registros ya enviados (no borradores).
  const items = raw
    .filter((r) => r.estatus && r.estatus !== "borrador")
    .map((r) => {
      const revisiones = (r.revisiones ?? {}) as Record<
        string,
        { estado?: string }
      >;
      const correcciones = Object.values(revisiones).filter(
        (rev) => rev.estado === "correccion",
      ).length;
      const verifResp = (r.verificacion?.respuestas ?? {}) as RespuestasVerif;
      const verifCalc = calcVerificacion(verifResp);
      return {
        id: r._id.toString(),
        razonSocial: r.empresa?.razonSocial || "Registro sin nombre",
        usuarioNombre: r.usuarioNombre || r.usuarioEmail || "Establecimiento",
        giro: r.registro?.giro ?? null,
        pct: computeProgress(r as Parameters<typeof computeProgress>[0]).pct,
        verifPct: verifCalc.pct,
        verifIniciada: verifCalc.contestadas > 0,
        estatus: r.estatus as string,
        correcciones,
        actualizadoEn: r.actualizadoEn
          ? new Date(r.actualizadoEn).toLocaleDateString("es-MX")
          : r.creadoEn
            ? new Date(r.creadoEn).toLocaleDateString("es-MX")
            : "",
      };
    });

  return (
    <div className="rg-page">
      <header className="rg-top">
        <div className="rg-top__inner">
          <Link href="/consultor" className="rg-back" aria-label="Panel del consultor">
            <img src="/brand/turismo-salud.jpeg" alt="Turismo de Salud México" />
          </Link>
          <div className="cons-top-right">
            <span className="cons-tag">Consultor</span>
            <PlatformUser nombre={user.nombre} />
          </div>
        </div>
      </header>

      <main className="rg-main">
        <div className="dash-head">
          <div>
            <span className="rg-eyebrow">Panel del consultor</span>
            <h1 className="dash-title">Establecimientos en proceso</h1>
            <p className="dash-sub">
              Revisa cada registro, aprueba o solicita correcciones por campo y
              descarga el formato oficial.
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="dash-empty">
            <h2>Aún no hay registros enviados</h2>
            <p>Cuando un establecimiento envíe su registro aparecerá aquí.</p>
          </div>
        ) : (
          <ConsultorTabs items={items} />
        )}
      </main>

      <footer className="rg-foot">
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
