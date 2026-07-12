import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DOCUMENTOS } from "../registro/data";
import { computeProgress } from "../registro/progress";
import { calcVerificacion, type RespuestasVerif } from "../verificacion/data";
import { preguntasAplicables } from "../verificacion/aplicabilidad";
import PlatformUser from "../components/PlatformUser";

export const metadata: Metadata = {
  title: "Mi panel · Sello de Turismo de Salud",
};

const ESTATUS: Record<string, { label: string; cls: string }> = {
  borrador: { label: "Borrador", cls: "is-draft" },
  enviado: { label: "Pendiente de revisión", cls: "is-pending" },
  pendiente_revision: { label: "Pendiente de revisión", cls: "is-pending" },
  en_espera_documentos: { label: "En espera de documentos", cls: "is-wait" },
  completado: { label: "Completado", cls: "is-done" },
};

type VerifData = {
  pct: number;
  contestadas: number;
  total: number;
  estatus: string;
  iniciada: boolean;
  revEstado: "aprobado" | "correccion" | null;
  revCorrecciones: number;
};

type RegistroItem = {
  id: string;
  razonSocial: string;
  giro: string | null;
  estatus: string;
  docsEntregados: number;
  pct: number;
  firma: string;
  creadoEn: string;
  tieneRevision: boolean;
  correcciones: number;
  verif: VerifData;
};

const VERIF_ESTATUS: Record<string, { label: string; cls: string }> = {
  borrador: { label: "Borrador", cls: "is-draft" },
  enviado: { label: "Pendiente de revisión", cls: "is-pending" },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Un consultor no usa el panel de empresa: va a su panel.
  if (user.rol === "consultor") redirect("/consultor");

  const db = await getDb();
  const raw = await db
    .collection("registros")
    .find({ usuarioId: user.id })
    .sort({ creadoEn: -1 })
    .toArray();

  const registros: RegistroItem[] = raw.map((r) => {
    const revisiones = (r.revisiones ?? {}) as Record<string, { estado?: string }>;
    const revKeys = Object.keys(revisiones);
    const verifDoc = (r.verificacion ?? {}) as {
      respuestas?: RespuestasVerif;
      estatus?: string;
      revisiones?: Record<string, { estado?: string; comentario?: string }>;
      tieneRestaurante?: boolean;
    };
    const vc = calcVerificacion(
      verifDoc.respuestas ?? {},
      preguntasAplicables(r.registro?.giro ?? null, {
        tieneRestaurante: verifDoc.tieneRestaurante === true,
      }),
    );
    const verifRevs = verifDoc.revisiones ?? {};
    const verifRevVals = Object.values(verifRevs);
    const numCorrecciones = verifRevVals.filter(
      (v) => v.estado === "correccion",
    ).length;
    // Per-pregunta: corrección si hay alguna; aprobada si hay revisiones y
    // ninguna es corrección.
    const revEstado: "aprobado" | "correccion" | null =
      numCorrecciones > 0
        ? "correccion"
        : verifRevVals.length > 0
          ? "aprobado"
          : null;
    const verif: VerifData = {
      pct: vc.pct,
      contestadas: vc.contestadas,
      total: vc.total,
      estatus: verifDoc.estatus ?? "borrador",
      iniciada: vc.contestadas > 0 || !!verifDoc.estatus,
      revEstado,
      revCorrecciones: numCorrecciones,
    };
    return {
      id: r._id.toString(),
      razonSocial: r.empresa?.razonSocial || "Registro sin nombre",
      giro: r.registro?.giro ?? null,
      estatus: r.estatus ?? "borrador",
      docsEntregados: Object.values(r.documentos ?? {}).filter((d) => d).length,
      pct: computeProgress(r as Parameters<typeof computeProgress>[0]).pct,
      firma: typeof r.firma === "string" ? r.firma : "",
      creadoEn: r.creadoEn ? new Date(r.creadoEn).toLocaleDateString("es-MX") : "",
      tieneRevision: revKeys.length > 0,
      correcciones: Object.values(revisiones).filter(
        (rev) => rev.estado === "correccion",
      ).length,
      verif,
    };
  });

  return (
    <div className="rg-page">
      <header className="rg-top">
        <div className="rg-top__inner">
          <Link href="/dashboard" className="rg-back" aria-label="Panel">
            <img src="/brand/turismo-salud.jpeg" alt="Turismo de Salud México" />
          </Link>
          <PlatformUser nombre={user.nombre} />
        </div>
      </header>

      <main className="rg-main">
        <div className="dash-head">
          <div>
            <span className="rg-eyebrow">Mi panel</span>
            <h1 className="dash-title">
              Hola, {user.nombre.split(" ")[0]}
            </h1>
            <p className="dash-sub">
              Aquí puedes iniciar y dar seguimiento a tus registros del Sello.
            </p>
          </div>
          <Link href="/registro" className="btn btn--rojo btn--lg">
            {registros.length ? "Continuar registro" : "+ Nuevo registro"}
          </Link>
        </div>

        {registros.length === 0 ? (
          <div className="dash-empty">
            <h2>Aún no tienes registros</h2>
            <p>
              Crea tu primer Formato de Registro para comenzar el proceso de
              certificación.
            </p>
            <Link href="/registro" className="btn btn--rojo btn--lg">
              Comenzar mi registro
            </Link>
          </div>
        ) : (
          <ul className="dash-list">
            {registros.map((r) => {
              const est = ESTATUS[r.estatus] ?? ESTATUS.pendiente_revision;
              const vest =
                VERIF_ESTATUS[r.verif.estatus] ?? VERIF_ESTATUS.borrador;
              return (
                <li key={r.id} className="dash-group">
                <div className="dash-item">
                  {r.firma && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="dash-item__firma" src={r.firma} alt="Firma" />
                  )}
                  <div className="dash-item__body">
                    <h3>{r.razonSocial}</h3>
                    {r.tieneRevision && r.estatus === "en_espera_documentos" && (
                      <Link href="/registro" className="dash-notice dash-notice--fix">
                        Tu consultor pidió correcciones en {r.correcciones} campo(s).
                        Toca para corregir →
                      </Link>
                    )}
                    {r.tieneRevision && r.estatus === "completado" && (
                      <span className="dash-notice dash-notice--ok">
                        ¡Tu registro fue aprobado por el consultor! 🎉
                      </span>
                    )}
                    <span className="dash-item__doc">
                      Formato de Registro · MSE-FO-28
                    </span>
                    <div className="dash-item__meta">
                      {r.giro && <span>{r.giro}</span>}
                      <span>
                        Documentos: {r.docsEntregados}/{DOCUMENTOS.length}
                      </span>
                      {r.creadoEn && <span>{r.creadoEn}</span>}
                    </div>
                    <div className="dash-item__progress">
                      <div className="dash-item__bar">
                        <span style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="dash-item__pct">{r.pct}%</span>
                    </div>
                  </div>
                  <div className="dash-item__side">
                    <span className={`dash-badge ${est.cls}`}>{est.label}</span>
                    <div className="dash-item__actions">
                      <Link href="/registro" className="dash-btn">
                        Editar
                      </Link>
                      {r.pct === 100 && (
                        <a
                          href="/api/registro/pdf"
                          className="dash-btn dash-btn--rojo"
                        >
                          Descargar PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* ===== Lista de Verificación Inicial (MSE-FO-55) ===== */}
                <div className="dash-item">
                  <div className="dash-item__body">
                    <h3>Lista de Verificación Inicial</h3>
                    {r.verif.revEstado === "correccion" && (
                      <Link
                        href="/verificacion"
                        className="dash-notice dash-notice--fix"
                      >
                        El consultor pidió correcciones en {r.verif.revCorrecciones}{" "}
                        pregunta(s) de tu verificación. Toca para corregir →
                      </Link>
                    )}
                    {r.verif.revEstado === "aprobado" && (
                      <span className="dash-notice dash-notice--ok">
                        ¡Tu verificación fue aprobada por el consultor! 🎉
                      </span>
                    )}
                    <span className="dash-item__doc">
                      Diagnóstico · MSE-FO-55
                    </span>
                    <div className="dash-item__meta">
                      <span>
                        {r.verif.contestadas}/{r.verif.total} preguntas
                      </span>
                      <span>Cumplimiento {r.verif.pct}%</span>
                    </div>
                    <div className="dash-item__progress">
                      <div className="dash-item__bar">
                        <span style={{ width: `${r.verif.pct}%` }} />
                      </div>
                      <span className="dash-item__pct">{r.verif.pct}%</span>
                    </div>
                  </div>
                  <div className="dash-item__side">
                    {r.verif.iniciada ? (
                      <span className={`dash-badge ${vest.cls}`}>
                        {vest.label}
                      </span>
                    ) : (
                      <span className="dash-badge is-draft">Sin iniciar</span>
                    )}
                    <div className="dash-item__actions">
                      <Link href="/verificacion" className="dash-btn dash-btn--rojo">
                        {r.verif.iniciada
                          ? "Continuar verificación"
                          : "Abrir verificación"}
                      </Link>
                    </div>
                  </div>
                </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <footer className="rg-foot">
        <Link href="/">← Ir al sitio</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
