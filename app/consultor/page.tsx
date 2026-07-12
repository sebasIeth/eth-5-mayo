import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { computeProgress } from "../registro/progress";
import { calcVerificacion, type RespuestasVerif } from "../verificacion/data";
import { preguntasAplicables } from "../verificacion/aplicabilidad";
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

      // ===== Estatus COMBINADO (registro + revisión de la verificación) =====
      // "Pendiente de revisión" mientras el consultor NO termine de revisar: la
      // verificación sólo cuenta como revisada cuando TODAS sus preguntas
      // contestadas aplicables tienen veredicto. Ya con la revisión completa:
      // alguna corrección → "En espera de documentos"; todo aprobado → listo.
      const regEstatus = r.estatus as string;
      const verifEstatus = r.verificacion?.estatus as string | undefined;
      const verifRevs = (r.verificacion?.revisiones ?? {}) as Record<
        string,
        { estado?: string }
      >;
      const giro = r.registro?.giro ?? null;
      const aplicables = preguntasAplicables(giro, {
        tieneRestaurante: r.verificacion?.tieneRestaurante === true,
      });
      const contestadasAplic = aplicables.filter((p) => {
        const rr = verifResp[p.codigo]?.r;
        return rr === "si" || rr === "no";
      });
      const revisionCompleta =
        contestadasAplic.length > 0 &&
        contestadasAplic.every((p) => verifRevs[p.codigo]);
      const hayCorreccionVerif = Object.values(verifRevs).some(
        (v) => v.estado === "correccion",
      );

      const fase = (e: string | undefined): "pend" | "espera" | "ok" =>
        e === "completado"
          ? "ok"
          : e === "en_espera_documentos"
            ? "espera"
            : "pend";
      const fases: ("pend" | "espera" | "ok")[] = [fase(regEstatus)];
      if (verifEstatus && verifEstatus !== "borrador") {
        fases.push(
          !revisionCompleta ? "pend" : hayCorreccionVerif ? "espera" : "ok",
        );
      }
      const estatus = fases.includes("pend")
        ? "enviado"
        : fases.includes("espera")
          ? "en_espera_documentos"
          : "completado";

      return {
        id: r._id.toString(),
        razonSocial: r.empresa?.razonSocial || "Registro sin nombre",
        usuarioNombre: r.usuarioNombre || r.usuarioEmail || "Establecimiento",
        giro,
        pct: computeProgress(r as Parameters<typeof computeProgress>[0]).pct,
        verifPct: verifCalc.pct,
        verifIniciada: verifCalc.contestadas > 0,
        estatus,
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
