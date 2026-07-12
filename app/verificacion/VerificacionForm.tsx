"use client";

import { useMemo, useState } from "react";
import { Check, XMark } from "../icons";
import {
  TIPOS_EVALUACION,
  UMBRAL_APROBACION,
  calcVerificacion,
  type Familia,
  type PlanMejora,
  type PlanFamilia,
  type PlanesFamilia,
  type Respuesta,
  type RespuestasVerif,
  type TipoEvaluacion,
} from "./data";
import {
  aplicaAlGiro,
  preguntasAplicables,
  familiasAplicables,
} from "./aplicabilidad";
import { CRITERIOS } from "./criterios";
import type { VerifRevisiones } from "./revision";

const OPCIONES: { r: Respuesta; label: string; cls: string }[] = [
  { r: "no", label: "No cumple", cls: "is-no" },
  { r: "si", label: "Sí cumple", cls: "is-si" },
];

// % de una sola familia — usa la misma lógica corregida (denominador = todos
// los indicadores aplicables de la familia, contestados o pendientes).
function calcFamilia(fam: Familia, resp: RespuestasVerif) {
  const c = calcVerificacion(resp, fam.preguntas);
  return { pct: c.pct, contestadas: c.contestadas, total: c.total };
}

export type Encabezado = {
  empresa: string;
  ejecutivo: string;
  evaluador: string;
  registroConsultor: string;
  fecha: string;
  firmaEmpresa: string;
};

type Props = {
  initial: RespuestasVerif;
  estatus: string;
  revisiones?: VerifRevisiones;
  giro?: string | null;
  encabezado: Encabezado;
  tipoInicial: TipoEvaluacion;
  tieneRestauranteInicial: boolean;
  // % global congelado al enviar por primera vez (null si aún no se envía).
  porcentajeObtenidoInicial: number | null;
  planFamiliaInicial: PlanesFamilia;
};

const PLAN_FAM_VACIO: PlanFamilia = {
  ugb: "",
  lider: "",
  miembros: "",
  director: "",
};

export default function VerificacionForm({
  initial,
  estatus,
  revisiones,
  giro,
  encabezado,
  tipoInicial,
  tieneRestauranteInicial,
  porcentajeObtenidoInicial,
  planFamiliaInicial,
}: Props) {
  const [planFamilia, setPlanFamilia] =
    useState<PlanesFamilia>(planFamiliaInicial);
  const [tipo, setTipo] = useState<TipoEvaluacion>(tipoInicial);
  // Solo se pregunta cuando el giro NO es Restaurante (un restaurante siempre
  // cuenta con restaurante). Condiciona los indicadores 4.2 y 4.9.
  const esRestaurante = giro === "Restaurante";
  const [tieneRestaurante, setTieneRestaurante] = useState<boolean>(
    tieneRestauranteInicial,
  );
  // Familias colapsables (abiertas por defecto).
  const [cerradas, setCerradas] = useState<Record<string, boolean>>({});
  const estaAbierta = (id: string) => !cerradas[id];
  const toggleFamilia = (id: string) =>
    setCerradas((s) => ({ ...s, [id]: !s[id] }));
  const [respuestas, setRespuestas] = useState<RespuestasVerif>(() => ({
    ...initial,
  }));
  const [submitting, setSubmitting] = useState<null | "guardar" | "enviar">(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState(false);

  const opts = useMemo(() => ({ tieneRestaurante }), [tieneRestaurante]);
  const aplicables = useMemo(
    () => preguntasAplicables(giro, opts),
    [giro, opts],
  );
  const familias = useMemo(
    () => familiasAplicables(giro, opts),
    [giro, opts],
  );

  const calc = useMemo(
    () => calcVerificacion(respuestas, aplicables),
    [respuestas, aplicables],
  );
  // Completitud por respuestas reales (no por "na"): r ∈ {"no","si"}.
  const respondidas = useMemo(
    () =>
      aplicables.filter((p) => {
        const r = respuestas[p.codigo]?.r;
        return r === "no" || r === "si";
      }).length,
    [aplicables, respuestas],
  );
  const completo = respondidas === aplicables.length;
  const cumpleUmbral = calc.pct >= UMBRAL_APROBACION;

  // Feedback del consultor por pregunta.
  const revValores = revisiones ? Object.values(revisiones) : [];
  const hayRevision = revValores.length > 0;
  const numCorrecciones = revValores.filter(
    (r) => r.estado === "correccion",
  ).length;
  const hayCorreccion = numCorrecciones > 0;
  // "Aprobada" = hay al menos una revisión y ninguna es corrección.
  const aprobada = hayRevision && !hayCorreccion;

  // Una pregunta aprobada por el consultor queda BLOQUEADA (no editable).
  const bloqueado = (codigo: string) =>
    revisiones?.[codigo]?.estado === "aprobado";

  // Indicador inline por pregunta revisada (verde aprobado / rojo corrige).
  const revField = (codigo: string) => {
    const r = revisiones?.[codigo];
    if (!r) return null;
    if (r.estado === "aprobado") {
      return (
        <span className="rg-rev rg-rev--ok">
          <Check width={14} height={14} /> Aprobado
        </span>
      );
    }
    return (
      <span className="rg-rev rg-rev--fix">
        <XMark width={14} height={14} /> Corrige: {r.comentario}
      </span>
    );
  };

  const [subiendo, setSubiendo] = useState<Record<string, boolean>>({});
  // "Pregúntale a Cynthia": sugerencia de IA por pregunta.
  const [sugerencia, setSugerencia] = useState<Record<string, string>>({});
  const [cynthiaLoad, setCynthiaLoad] = useState<Record<string, boolean>>({});

  async function preguntarCynthia(codigo: string) {
    if (cynthiaLoad[codigo]) return;
    setCynthiaLoad((s) => ({ ...s, [codigo]: true }));
    setServerError(null);
    try {
      const res = await fetch("/api/cynthia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.sugerencia) {
        setSugerencia((s) => ({ ...s, [codigo]: data.sugerencia }));
      } else {
        setServerError(data?.error || "Cynthia no pudo responder ahora.");
      }
    } catch {
      setServerError("No se pudo contactar a la asistente.");
    } finally {
      setCynthiaLoad((s) => ({ ...s, [codigo]: false }));
    }
  }

  async function borrarEvidenciasR2(keys: string[]) {
    if (!keys.length) return;
    try {
      await fetch("/api/evidencia/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      });
    } catch {
      /* borrado silencioso */
    }
  }

  function setResp(codigo: string, r: Respuesta) {
    if (bloqueado(codigo)) return;
    setSaved(false);
    setServerError(null);
    const prev = respuestas[codigo];
    // Al pasar a "No cumple" se borran las fotos de R2 (y se limpia la descripción).
    if (r === "no" && prev?.evidencias?.length) {
      void borrarEvidenciasR2(prev.evidencias.map((e) => e.key));
    }
    setRespuestas((s) => {
      const p = s[codigo];
      if (r === "no") {
        // No cumple: limpia descripción y fotos; conserva el plan.
        return { ...s, [codigo]: { r, plan: p?.plan } };
      }
      if (r === "si") {
        // Sí cumple: limpia el plan; conserva descripción y fotos.
        return { ...s, [codigo]: { r, obs: p?.obs, evidencias: p?.evidencias } };
      }
      return {
        ...s,
        [codigo]: { r, obs: p?.obs, evidencias: p?.evidencias, plan: p?.plan },
      };
    });
  }

  function setObs(codigo: string, obs: string) {
    if (bloqueado(codigo)) return;
    setSaved(false);
    setRespuestas((s) => {
      const prev = s[codigo];
      return { ...s, [codigo]: { ...(prev ?? { r: "si" }), obs } };
    });
  }

  function setPlan(codigo: string, campo: keyof PlanMejora, valor: string) {
    if (bloqueado(codigo)) return;
    setSaved(false);
    setRespuestas((s) => {
      const prev = s[codigo];
      const plan: PlanMejora = {
        actividades: "",
        responsable: "",
        fecha: "",
        ...(prev?.plan ?? {}),
        [campo]: valor,
      };
      return { ...s, [codigo]: { ...(prev ?? { r: "no" }), plan } };
    });
  }

  // ¿La familia tiene ≥1 indicador aplicable en "No cumple"? (necesita 3W)
  const familiaTieneNoCumple = (fam: Familia) =>
    fam.preguntas.some(
      (p) => aplicaAlGiro(p.codigo, giro, opts) && respuestas[p.codigo]?.r === "no",
    );

  function setPlanFam(famId: string, campo: keyof PlanFamilia, valor: string) {
    setSaved(false);
    setPlanFamilia((s) => ({
      ...s,
      [famId]: { ...PLAN_FAM_VACIO, ...(s[famId] ?? {}), [campo]: valor },
    }));
  }

  async function subirEvidencias(codigo: string, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setSubiendo((s) => ({ ...s, [codigo]: true }));
    setServerError(null);
    try {
      const fd = new FormData();
      fd.append("codigo", codigo);
      Array.from(fileList).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/evidencia/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.evidencias) {
        setSaved(false);
        setRespuestas((s) => {
          const prev = s[codigo] ?? { r: "si" as Respuesta };
          return {
            ...s,
            [codigo]: {
              ...prev,
              evidencias: [...(prev.evidencias ?? []), ...data.evidencias],
            },
          };
        });
      } else {
        setServerError(data?.error || "No se pudo subir la evidencia.");
      }
    } catch {
      setServerError("No se pudo subir la evidencia. Revisa tu conexión.");
    } finally {
      setSubiendo((s) => ({ ...s, [codigo]: false }));
    }
  }

  function quitarEvidencia(codigo: string, key: string) {
    setSaved(false);
    void borrarEvidenciasR2([key]); // borra la foto de R2 al quitarla
    setRespuestas((s) => {
      const prev = s[codigo];
      if (!prev) return s;
      return {
        ...s,
        [codigo]: {
          ...prev,
          evidencias: (prev.evidencias ?? []).filter((e) => e.key !== key),
        },
      };
    });
  }

  async function submit(accion: "guardar" | "enviar") {
    setServerError(null);
    if (accion === "enviar") {
      if (!completo) {
        setServerError(
          `Contesta las ${aplicables.length} preguntas antes de enviar la verificación.`,
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // Sí cumple → descripción + foto. No cumple → plan (actividades/responsable/fecha).
      const faltResp: string[] = [];
      const faltNota: string[] = [];
      const faltFoto: string[] = [];
      const faltPlan: string[] = [];
      for (const p of aplicables) {
        const v = respuestas[p.codigo];
        const r = v?.r;
        if (r !== "no" && r !== "si") {
          faltResp.push(p.codigo);
          continue;
        }
        if (r === "si") {
          if (!v?.obs?.trim()) faltNota.push(p.codigo);
          if (!(v?.evidencias && v.evidencias.length > 0)) faltFoto.push(p.codigo);
        } else {
          const pl = v?.plan;
          if (!pl?.actividades?.trim() || !pl?.responsable?.trim() || !pl?.fecha)
            faltPlan.push(p.codigo);
        }
      }
      // Cada familia con "No cumple" necesita los datos del 3W.
      const famsSinDatos: string[] = [];
      for (const fam of familias) {
        if (!familiaTieneNoCumple(fam)) continue;
        const pf = planFamilia[fam.id];
        if (
          !pf?.ugb?.trim() ||
          !pf?.lider?.trim() ||
          !pf?.miembros?.trim() ||
          !pf?.director?.trim()
        )
          famsSinDatos.push(fam.id);
      }
      if (
        faltResp.length ||
        faltNota.length ||
        faltFoto.length ||
        faltPlan.length ||
        famsSinDatos.length
      ) {
        const partes: string[] = [];
        if (faltResp.length)
          partes.push(
            `respuesta en ${faltResp.length} (${faltResp.slice(0, 6).join(", ")}${faltResp.length > 6 ? "…" : ""})`,
          );
        if (faltNota.length)
          partes.push(
            `descripción en ${faltNota.length} (${faltNota.slice(0, 6).join(", ")}${faltNota.length > 6 ? "…" : ""})`,
          );
        if (faltFoto.length)
          partes.push(
            `al menos una foto en ${faltFoto.length} (${faltFoto.slice(0, 6).join(", ")}${faltFoto.length > 6 ? "…" : ""})`,
          );
        if (faltPlan.length)
          partes.push(
            `plan de acción (actividades, responsable y fecha) en ${faltPlan.length} (${faltPlan.slice(0, 6).join(", ")}${faltPlan.length > 6 ? "…" : ""})`,
          );
        if (famsSinDatos.length)
          partes.push(
            `datos del Plan 3W (UGB, Líder, Miembros y Director) en ${famsSinDatos.join(", ")}`,
          );
        setServerError(`Falta ${partes.join(" y ")}.`);
        // ir a la primera pregunta incompleta
        const primero =
          faltResp[0] || faltNota[0] || faltFoto[0] || faltPlan[0];
        document
          .querySelector(`[data-codigo="${primero}"]`)
          ?.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
    }
    setSubmitting(accion);
    try {
      const res = await fetch("/api/verificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion,
          respuestas,
          tipoEvaluacion: tipo,
          tieneRestaurante,
          planFamilia,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (accion === "enviar") {
          setDone(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setSaved(true);
        }
        return;
      }
      setServerError(data?.error || "No se pudo guardar. Intenta de nuevo.");
    } catch {
      setServerError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSubmitting(null);
    }
  }

  if (done) {
    return (
      <div className="rg-done" role="status">
        <span className="rg-done__check">
          <Check width={34} height={34} />
        </span>
        <h2>Verificación enviada</h2>
        <p>
          Tu <strong>Lista de Verificación Inicial</strong> quedó guardada con un{" "}
          cumplimiento del <strong>{calc.pct}%</strong>. El consultor la revisará
          y te contactará para los siguientes pasos.
        </p>
        <a href="/dashboard" className="btn btn--rojo btn--lg rg-done__cta">
          Ir a mi panel
        </a>
      </div>
    );
  }

  return (
    <form
      className="rg-form"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      {/* ===== Instrucciones de llenado ===== */}
      <section className="rg-card vf-instr">
        <h2 className="vf-instr__title">1. Instrucciones de llenado</h2>
        <ol className="vf-instr__list">
          <li>
            Lee el <strong>criterio de evaluación</strong> de cada pregunta (el
            desplegable “Criterio de evaluación”) para saber qué evidencias debes
            presentar en ese punto.
          </li>
          <li>
            Si el indicador <strong>Sí cumple</strong>: escribe la descripción de
            cómo cumple y sube las <strong>fotos</strong> requeridas.
          </li>
          <li>
            Si <strong>No cumple</strong>: llena el <strong>Plan de acción</strong>{" "}
            (actividades a realizar, responsable y fecha de cumplimiento) y, al
            final de esa familia, los <strong>Datos del Plan 3W</strong> (UGB,
            Líder, Miembros y Director). Con eso se genera su Plan 3W.
          </li>
          <li>
            Solo se muestran las preguntas que <strong>aplican a tu giro</strong>;
            las que no aplican se manejan automáticamente.
          </li>
        </ol>
      </section>

      {/* ===== Encabezado del documento ===== */}
      <section className="rg-card vf-head">
        <div className="vf-head__tipo">
          <span className="vf-head__tipo-label">Tipo de evaluación</span>
          <div className="vf-head__tipos" role="group" aria-label="Tipo de evaluación">
            {TIPOS_EVALUACION.map((t) => (
              <button
                type="button"
                key={t.v}
                className={`vf-head__tipo-opt ${tipo === t.v ? "is-sel" : ""}`}
                aria-pressed={tipo === t.v}
                onClick={() => {
                  setTipo(t.v);
                  setSaved(false);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {!esRestaurante && (
          <div className="vf-head__tipo">
            <span className="vf-head__tipo-label">
              ¿Cuenta con restaurante / servicio de alimentos?
            </span>
            <div className="vf-head__tipos" role="group" aria-label="¿Cuenta con restaurante?">
              <button
                type="button"
                className={`vf-head__tipo-opt ${tieneRestaurante ? "is-sel" : ""}`}
                aria-pressed={tieneRestaurante}
                onClick={() => {
                  setTieneRestaurante(true);
                  setSaved(false);
                }}
              >
                Sí
              </button>
              <button
                type="button"
                className={`vf-head__tipo-opt ${!tieneRestaurante ? "is-sel" : ""}`}
                aria-pressed={!tieneRestaurante}
                onClick={() => {
                  setTieneRestaurante(false);
                  setSaved(false);
                }}
              >
                No
              </button>
            </div>
          </div>
        )}
        <dl className="vf-head__grid">
          <div>
            <dt>Empresa</dt>
            <dd>{encabezado.empresa || "—"}</dd>
          </div>
          <div>
            <dt>Ejecutivo que recibe la evaluación</dt>
            <dd>{encabezado.ejecutivo || "—"}</dd>
          </div>
          <div>
            <dt>Evaluador</dt>
            <dd>{encabezado.evaluador || "—"}</dd>
          </div>
          <div>
            <dt>Registro consultor</dt>
            <dd>{encabezado.registroConsultor}</dd>
          </div>
          <div>
            <dt>Fecha de evaluación</dt>
            <dd>{encabezado.fecha || "—"}</dd>
          </div>
        </dl>

        <div className="vf-head__pcts">
          <div className="vf-pct">
            <span className="vf-pct__label">
              Porcentaje obtenido en la evaluación
            </span>
            <span className="vf-pct__box">
              {porcentajeObtenidoInicial != null
                ? `${porcentajeObtenidoInicial}%`
                : "—"}
            </span>
          </div>
          <div className="vf-pct">
            <span className="vf-pct__label">Porcentaje final</span>
            <span className="vf-pct__box">{calc.pct}%</span>
          </div>
        </div>

        <div className="vf-head__firmas">
          <div className="vf-firma">
            <div className="vf-firma__box">
              {encabezado.firmaEmpresa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="vf-firma__img"
                  src={encabezado.firmaEmpresa}
                  alt="Firma del ejecutivo de la empresa"
                />
              ) : (
                <span className="vf-firma__ph">Sin firma registrada</span>
              )}
            </div>
            <span className="vf-firma__label">
              Firma Ejecutivo de la empresa
            </span>
          </div>
          <div className="vf-firma">
            <div className="vf-firma__box">
              <span className="vf-firma__cursiva">{encabezado.evaluador}</span>
            </div>
            <span className="vf-firma__label">Firma Consultor</span>
          </div>
        </div>
      </section>

      {/* ===== Feedback del consultor ===== */}
      {aprobada && (
        <div className="rg-rev-banner rg-rev-banner--ok" role="status">
          <Check width={18} height={18} />
          <span>¡Tu verificación fue aprobada!</span>
        </div>
      )}
      {hayCorreccion && (
        <div className="rg-rev-banner rg-rev-banner--fix" role="alert">
          <XMark width={18} height={18} />
          <span>
            Tu consultor pidió correcciones en {numCorrecciones} pregunta(s).
            Revísalas abajo.
          </span>
        </div>
      )}

      {/* ===== Barra de avance (sticky) ===== */}
      <div className="rg-progress">
        <div className="rg-progress__top">
          <span className="rg-progress__label">
            {estatus === "enviado" ? "Enviada · editando" : "Cumplimiento"}
          </span>
          <span className="rg-progress__pct">{calc.pct}%</span>
        </div>
        <div
          className="rg-progress__bar"
          role="progressbar"
          aria-valuenow={calc.pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${calc.pct}%` }} />
        </div>
        <div className="vf-progress__foot">
          <span className="rg-progress__hint">
            {respondidas} de {aplicables.length} preguntas contestadas
          </span>
          <span
            className={`vf-umbral ${cumpleUmbral ? "is-ok" : "is-low"}`}
            aria-live="polite"
          >
            {cumpleUmbral
              ? `Cumple el ${UMBRAL_APROBACION}%`
              : `Aún no alcanza el ${UMBRAL_APROBACION}%`}
          </span>
        </div>
      </div>

      {/* ===== Familias ===== */}
      {familias.map((fam, i) => {
        const fc = calcFamilia(fam, respuestas);
        return (
          <section
            className={`rg-card vf-fam ${estaAbierta(fam.id) ? "is-open" : "is-closed"}`}
            key={fam.id}
          >
            <button
              type="button"
              className="rg-card__head vf-fam-btn"
              onClick={() => toggleFamilia(fam.id)}
              aria-expanded={estaAbierta(fam.id)}
            >
              <span className="rg-card__step">{i + 1}</span>
              <div className="vf-fam-head">
                <div>
                  <h2>{fam.nombre}</h2>
                  <p>
                    {fc.contestadas}/{fc.total} contestadas · {fam.id}
                  </p>
                </div>
                <span className="vf-fam-pct">{fc.pct}%</span>
              </div>
              <svg
                className="vf-fam-chev"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            {estaAbierta(fam.id) && (
            <>
            <ul className="vf-list">
              {fam.preguntas.map((p) => {
                const val = respuestas[p.codigo];
                const locked = bloqueado(p.codigo);
                return (
                  <li className="vf-item" key={p.codigo} data-codigo={p.codigo}>
                    <div className="vf-item__q">
                      <span className="vf-code">{p.codigo}</span>
                      <span
                        className={`vf-tag ${p.tipo === "P" ? "is-p" : "is-c"}`}
                        title={
                          p.tipo === "P"
                            ? "Prioritario (2 pts)"
                            : "Complementario (1 pt)"
                        }
                      >
                        {p.tipo}
                      </span>
                      <span className="vf-text">{p.texto}</span>
                    </div>

                    {CRITERIOS[p.codigo] && (
                      <details className="vf-crit">
                        <summary>Criterio de evaluación · evidencias que debes presentar</summary>
                        <ul>
                          {CRITERIOS[p.codigo].map((c, ci) => (
                            <li key={ci}>{c}</li>
                          ))}
                        </ul>
                      </details>
                    )}

                    <div
                      className="vf-seg"
                      role="radiogroup"
                      aria-label={`Respuesta ${p.codigo}`}
                    >
                      {OPCIONES.map((o) => {
                        const active = val?.r === o.r;
                        return (
                          <button
                            type="button"
                            key={o.r}
                            role="radio"
                            aria-checked={active}
                            disabled={locked}
                            className={`vf-seg__btn ${o.cls} ${
                              active ? "is-active" : ""
                            }`}
                            onClick={() => setResp(p.codigo, o.r)}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>

                    {revField(p.codigo)}

                    {/* Sí cumple → descripción de evidencia + fotos */}
                    {val?.r === "si" && (
                      <>
                        {!locked && (
                          <button
                            type="button"
                            className="vf-cynthia"
                            onClick={() => preguntarCynthia(p.codigo)}
                            disabled={!!cynthiaLoad[p.codigo]}
                          >
                            {cynthiaLoad[p.codigo]
                              ? "Cynthia está pensando…"
                              : "✨ Pregúntale a Cynthia"}
                          </button>
                        )}
                        <textarea
                          className="vf-obs"
                          placeholder={
                            sugerencia[p.codigo] ||
                            "Evidencias de cumplimiento — describe cómo cumple y qué muestran las fotos (obligatorio)"
                          }
                          value={val?.obs ?? ""}
                          readOnly={locked}
                          onChange={(e) => setObs(p.codigo, e.target.value)}
                          rows={
                            sugerencia[p.codigo]
                              ? Math.min(
                                  9,
                                  Math.max(3, Math.ceil(sugerencia[p.codigo].length / 60)),
                                )
                              : 2
                          }
                        />

                        <div className="vf-evid">
                        <div className="vf-evid__head">
                          <span className="vf-evid__label">
                            Evidencias (al menos 1)
                            {val?.evidencias?.length
                              ? ` · ${val.evidencias.length}`
                              : ""}
                          </span>
                          <label className="vf-evid__add">
                            {subiendo[p.codigo] ? "Subiendo…" : "+ Subir foto(s)"}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={!!subiendo[p.codigo]}
                              onChange={(e) => {
                                subirEvidencias(p.codigo, e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                        {val?.evidencias && val.evidencias.length > 0 && (
                          <div className="vf-evid__grid">
                            {val.evidencias.map((ev) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <div className="vf-evid__item" key={ev.key}>
                                <img
                                  src={`/api/evidencia?key=${encodeURIComponent(ev.key)}`}
                                  alt={ev.nombre}
                                />
                                <button
                                  type="button"
                                  className="vf-evid__del"
                                  onClick={() =>
                                    quitarEvidencia(p.codigo, ev.key)
                                  }
                                  aria-label="Quitar evidencia"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        </div>
                      </>
                    )}

                    {/* No cumple → plan de acción (alimenta el Plan 3W) */}
                    {val?.r === "no" && (
                      <div className="vf-plan">
                        <p className="vf-plan__title">
                          Plan de acción para cumplir
                        </p>
                        <textarea
                          className="vf-obs"
                          placeholder="Actividades a realizar para cumplir (obligatorio)"
                          value={val?.plan?.actividades ?? ""}
                          readOnly={locked}
                          onChange={(e) =>
                            setPlan(p.codigo, "actividades", e.target.value)
                          }
                          rows={2}
                        />
                        <div className="vf-plan__row">
                          <label className="vf-plan__field">
                            <span>Responsable</span>
                            <input
                              type="text"
                              value={val?.plan?.responsable ?? ""}
                              readOnly={locked}
                              placeholder="Nombre del responsable"
                              onChange={(e) =>
                                setPlan(p.codigo, "responsable", e.target.value)
                              }
                            />
                          </label>
                          <label className="vf-plan__field">
                            <span>¿Cuándo piensa cumplir?</span>
                            <input
                              type="date"
                              value={val?.plan?.fecha ?? ""}
                              readOnly={locked}
                              onChange={(e) =>
                                setPlan(p.codigo, "fecha", e.target.value)
                              }
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Familia con "No cumple" → datos del Plan 3W (obligatorios) */}
            {familiaTieneNoCumple(fam) && (
              <div className="vf-planfam">
                <p className="vf-planfam__title">
                  Datos del Plan 3W de {fam.nombre} (obligatorios)
                </p>
                <div className="vf-planfam__grid">
                  <label className="vf-plan__field">
                    <span>UGB</span>
                    <input
                      type="text"
                      value={planFamilia[fam.id]?.ugb ?? ""}
                      onChange={(e) => setPlanFam(fam.id, "ugb", e.target.value)}
                    />
                  </label>
                  <label className="vf-plan__field">
                    <span>Líder</span>
                    <input
                      type="text"
                      value={planFamilia[fam.id]?.lider ?? ""}
                      onChange={(e) => setPlanFam(fam.id, "lider", e.target.value)}
                    />
                  </label>
                  <label className="vf-plan__field">
                    <span>Miembros</span>
                    <input
                      type="text"
                      value={planFamilia[fam.id]?.miembros ?? ""}
                      onChange={(e) =>
                        setPlanFam(fam.id, "miembros", e.target.value)
                      }
                    />
                  </label>
                  <label className="vf-plan__field">
                    <span>Director</span>
                    <input
                      type="text"
                      value={planFamilia[fam.id]?.director ?? ""}
                      onChange={(e) =>
                        setPlanFam(fam.id, "director", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            )}
            </>
            )}
          </section>
        );
      })}

      {serverError && (
        <p className="rg-server-error" role="alert">
          {serverError}
        </p>
      )}

      <div className="rg-actions">
        <button
          type="button"
          className="btn btn--azul-outline btn--lg"
          onClick={() => submit("guardar")}
          disabled={submitting !== null}
          aria-busy={submitting === "guardar"}
        >
          {submitting === "guardar" ? "Guardando…" : "Guardar avance"}
        </button>
        <button
          type="button"
          className="btn btn--rojo btn--lg"
          onClick={() => submit("enviar")}
          disabled={submitting !== null || !completo}
          aria-busy={submitting === "enviar"}
          title={
            completo
              ? undefined
              : `Contesta las ${aplicables.length} preguntas para enviar la verificación`
          }
        >
          {submitting === "enviar" ? "Enviando…" : "Enviar verificación"}
        </button>
        {saved ? (
          <span className="rg-saved">
            <Check width={16} height={16} /> Avance guardado
          </span>
        ) : (
          !completo && (
            <span className="rg-actions__hint">
              “Enviar” se activa al contestar las {aplicables.length} (
              {respondidas}/{aplicables.length}).
            </span>
          )
        )}
      </div>
    </form>
  );
}
