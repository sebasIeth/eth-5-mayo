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
  familiasConPlan,
  preguntasAplicables,
} from "../../verificacion/aplicabilidad";
import { type VerifRevisiones } from "../../verificacion/revision";
import PlatformUser from "../../components/PlatformUser";
import DescargarDoc from "../../components/DescargarDoc";
import RevisionForm from "./RevisionForm";
import VerificacionRevisionForm from "./VerificacionRevisionForm";
import DocBlock from "./DocBlock";
import FinalizarServicio from "./FinalizarServicio";

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
  const verifPlanes = familiasConPlan(respuestas, verifGiro, verifOpts);

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

        <FinalizarServicio
          registroId={id}
          finalizado={doc.servicioFinalizado === true}
          finalizadoEn={
            doc.servicioFinalizadoEn
              ? new Date(doc.servicioFinalizadoEn).toLocaleDateString("es-MX")
              : undefined
          }
          blockchain={
            doc.blockchain?.txHash
              ? {
                  txHash: doc.blockchain.txHash as string,
                  url: doc.blockchain.url as string,
                  contrato: doc.blockchain.contrato as string,
                }
              : null
          }
        />

        {/* ================= DOCUMENTO 1: Formato de Registro ================= */}
        <DocBlock
          code="MSE-FO-28"
          title="Formato de Registro"
          actions={
            <>
              <span className={`dash-badge ${est.cls}`}>{est.label}</span>
              <DescargarDoc
                pdfUrl={`/api/registro/pdf?id=${id}`}
                altUrl={`/api/registro/xlsx?id=${id}`}
                altLabel="Excel"
              />
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
              <DescargarDoc
                pdfUrl={`/api/verificacion/pdf?id=${id}`}
                altUrl={`/api/verificacion/docx?id=${id}`}
                altLabel="Word"
              />
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

        {/* ================= Planes 3W (por familia con "No cumple") ============ */}
        {verifPlanes.length > 0 && (
          <DocBlock
            code="MSE-FO-57"
            title="Planes 3W"
            actions={
              <span className="dash-badge is-wait">
                {verifPlanes.length} familia(s)
              </span>
            }
          >
            <p className="dash-sub">
              Un Plan 3W por cada familia con indicadores en “No cumple”.
            </p>
            <ul className="dash-3w__list">
              {verifPlanes.map((f) => (
                <li key={f.id} className="dash-3w__item">
                  <span className="dash-3w__fam">
                    <strong>{f.id}</strong> · {f.nombre}
                  </span>
                  <DescargarDoc
                    pdfUrl={`/api/plan3w/pdf?id=${id}&familia=${f.id}`}
                    altUrl={`/api/plan3w/xlsx?id=${id}&familia=${f.id}`}
                    altLabel="Excel"
                  />
                </li>
              ))}
            </ul>
          </DocBlock>
        )}

        {/* ================= Cartas (MSE-FO-29 / MSE-FO-32) ================= */}
        <DocBlock code="MSE-FO-29" title="Carta de Intención">
          {doc.cartas?.intencion ? (
            <a
              className="dash-btn dash-btn--rojo"
              href={`/api/carta-intencion/pdf?id=${id}`}
            >
              Descargar PDF
            </a>
          ) : (
            <p className="dash-sub">El establecimiento aún no llena esta carta.</p>
          )}
        </DocBlock>

        <DocBlock code="MSE-FO-32" title="Carta de Adhesión">
          {doc.cartas?.adhesion ? (
            <a
              className="dash-btn dash-btn--rojo"
              href={`/api/carta-adhesion/pdf?id=${id}`}
            >
              Descargar PDF
            </a>
          ) : (
            <p className="dash-sub">El establecimiento aún no llena esta carta.</p>
          )}
        </DocBlock>

        {/* ============ Reporte general / Portafolio de Evidencias ========== */}
        <DocBlock code="Reporte" title="Portafolio de Evidencias">
          <p className="dash-sub">
            Presentación con la descripción y los anexos (fotos) que subió el
            establecimiento por cada indicador que cumple.
          </p>
          <DescargarDoc
            pdfUrl={`/api/portafolio/pptx?id=${id}`}
            altUrl={`/api/portafolio/pdf?id=${id}`}
            altLabel="PDF"
            primaryLabel="PowerPoint"
          />
        </DocBlock>

        {/* ============ Calculadora de Sello (MSE-FO-59) — solo consultor ===== */}
        <DocBlock code="MSE-FO-59" title="Calculadora de Sello">
          <p className="dash-sub">
            Reporte de evaluación con las respuestas de la verificación. Al abrir
            el Excel, la hoja “Reporte de Evaluación” recalcula sola (porcentaje,
            acreditación y desglose por familia).
          </p>
          <a
            className="dash-btn dash-btn--rojo"
            href={`/api/calculadora/xlsx?id=${id}`}
          >
            Descargar Excel
          </a>
        </DocBlock>
      </main>

      <footer className="rg-foot">
        <Link href="/consultor">← Volver a la lista</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
