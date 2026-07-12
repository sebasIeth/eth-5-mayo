import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DOCUMENTOS, docKey } from "../../registro/data";
import { computeProgress } from "../../registro/progress";
import {
  CAMPOS_REVISABLES,
  valorCampo,
  type Revisiones,
} from "../../registro/revision";
import {
  UMBRAL_APROBACION,
  calcVerificacion,
  type RespuestasVerif,
} from "../../verificacion/data";
import {
  familiasAplicables,
  preguntasAplicables,
} from "../../verificacion/aplicabilidad";
import { type VerifRevisiones } from "../../verificacion/revision";
import PlatformUser from "../../components/PlatformUser";
import RevisionForm from "./RevisionForm";
import VerificacionRevisionForm from "./VerificacionRevisionForm";
import DocBlock from "./DocBlock";

export const metadata: Metadata = {
  title: "Revisar registro · Sello de Turismo de Salud",
};

const ESTATUS_LABEL: Record<string, { label: string; cls: string }> = {
  enviado: { label: "Pendiente de revisión", cls: "is-pending" },
  en_espera_documentos: { label: "En espera de documentos", cls: "is-wait" },
  completado: { label: "Completado", cls: "is-done" },
  borrador: { label: "Borrador", cls: "is-draft" },
};

export default async function RevisarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "consultor") redirect("/dashboard");

  const { id } = await params;
  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    notFound();
  }

  const db = await getDb();
  const doc = await db.collection("registros").findOne({ _id });
  if (!doc) notFound();

  const revisiones = (doc.revisiones ?? {}) as Revisiones;
  const valores: Record<string, string> = {};
  for (const c of CAMPOS_REVISABLES) {
    valores[c.key] = valorCampo(doc as Parameters<typeof valorCampo>[0], c.key);
  }

  const est = ESTATUS_LABEL[doc.estatus ?? "enviado"] ?? ESTATUS_LABEL.enviado;
  const pct = computeProgress(doc as Parameters<typeof computeProgress>[0]).pct;

  const docsEntregados = Object.entries(
    (doc.documentos ?? {}) as Record<string, string>,
  ).filter(([, v]) => v);

  // ===== Verificación (MSE-FO-55) =====
  const verifDoc = (doc.verificacion ?? {}) as {
    respuestas?: RespuestasVerif;
    estatus?: string;
    revisiones?: VerifRevisiones;
    tieneRestaurante?: boolean;
  };
  const respuestas: RespuestasVerif = verifDoc.respuestas ?? {};
  const verifGiro = (doc.registro?.giro as string | undefined) ?? null;
  const verifOpts = { tieneRestaurante: verifDoc.tieneRestaurante === true };
  const verifAplicables = preguntasAplicables(verifGiro, verifOpts);
  const verifFamilias = familiasAplicables(verifGiro, verifOpts);
  const verifCalc = calcVerificacion(respuestas, verifAplicables);
  const verifRevisiones = verifDoc.revisiones ?? {};
  const verifCumple = verifCalc.pct >= UMBRAL_APROBACION;

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
        <div className="rev-back">
          <Link href="/consultor">← Volver a la lista</Link>
        </div>

        <div className="rev-header">
          <div>
            <span className="rg-eyebrow">Establecimiento</span>
            <h1 className="dash-title">
              {doc.empresa?.razonSocial || "Registro sin nombre"}
            </h1>
            <p className="dash-sub">
              {doc.usuarioNombre || doc.usuarioEmail} ·{" "}
              {doc.registro?.giro || "Sin giro"}
            </p>
          </div>
        </div>

        {/* ================= DOCUMENTO 1: Formato de Registro ================= */}
        <DocBlock
          code="MSE-FO-28"
          title="Formato de Registro"
          actions={
            <>
              <span className={`dash-badge ${est.cls}`}>{est.label}</span>
              <a
                href={`/api/registro/pdf?id=${id}`}
                className="dash-btn dash-btn--rojo"
              >
                Descargar PDF
              </a>
            </>
          }
        >

        {/* ===== Datos del registro (solo lectura) ===== */}
        <section className="rev-data">
          <h2 className="rev-data__title">Datos del establecimiento</h2>
          <dl className="rev-data__grid">
            <div>
              <dt>Tipo de trámite</dt>
              <dd>{doc.registro?.tipoTramite || "—"}</dd>
            </div>
            {CAMPOS_REVISABLES.map((c) => (
              <div key={c.key}>
                <dt>{c.label}</dt>
                <dd>{valores[c.key] || "—"}</dd>
              </div>
            ))}
            <div>
              <dt>Avance</dt>
              <dd>{pct}%</dd>
            </div>
          </dl>
          {doc.firma && (
            <div className="rev-data__firma">
              <dt>Firma</dt>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.firma} alt="Firma del responsable" />
            </div>
          )}
        </section>

        {/* ===== Documentos entregados ===== */}
        <section className="rev-data">
          <h2 className="rev-data__title">
            Documentos entregados {docsEntregados.length}/{DOCUMENTOS.length}
          </h2>
          {docsEntregados.length === 0 ? (
            <p className="dash-sub">Aún no se registran fechas de entrega.</p>
          ) : (
            <ul className="rev-docs">
              {DOCUMENTOS.map((d) => {
                const key = docKey(d);
                const fecha = (doc.documentos ?? {})[key];
                if (!fecha) return null;
                return (
                  <li key={key}>
                    <span className="rev-docs__code">{d.codigo}</span>
                    <span className="rev-docs__name">{d.nombre}</span>
                    <span className="rev-docs__date">{fecha}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ===== Revisión por campo ===== */}
        <RevisionForm
          registroId={id}
          valores={valores}
          initial={revisiones}
        />
        </DocBlock>

        {/* ================= DOCUMENTO 2: Lista de Verificación ================= */}
        <DocBlock
          code="MSE-FO-55"
          title="Lista de Verificación Inicial"
          actions={
            <>
              <span className={`vf-umbral ${verifCumple ? "is-ok" : "is-low"}`}>
                {verifCalc.contestadas === 0
                  ? "Sin iniciar"
                  : verifCumple
                    ? `Cumple ${UMBRAL_APROBACION}%`
                    : `${verifCalc.pct}%`}
              </span>
              <a
                href={`/api/verificacion/pdf?id=${id}`}
                className="dash-btn dash-btn--rojo"
              >
                Descargar PDF
              </a>
            </>
          }
        >

          {verifCalc.contestadas === 0 ? (
            <p className="dash-sub">
              El establecimiento aún no inicia la verificación.
            </p>
          ) : (
            <>
              <p className="dash-sub">
                {verifCalc.contestadas}/{verifCalc.total} preguntas contestadas ·
                Estatus:{" "}
                {verifDoc.estatus === "enviado"
                  ? "Enviada"
                  : verifDoc.estatus === "en_espera_documentos"
                    ? "En espera de correcciones"
                    : verifDoc.estatus === "completado"
                      ? "Completada"
                      : "Borrador"}
              </p>

              <VerificacionRevisionForm
                registroId={id}
                respuestas={respuestas}
                initial={verifRevisiones}
                familias={verifFamilias}
              />
            </>
          )}
        </DocBlock>
      </main>

      <footer className="rg-foot">
        <Link href="/consultor">← Volver a la lista</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
