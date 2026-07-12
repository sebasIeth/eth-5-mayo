"use client";

import { useMemo, useState } from "react";
import { Check, XMark } from "../icons";
import {
  TIPOS_EVALUACION,
  UMBRAL_APROBACION,
  calcVerificacion,
  type Familia,
  type Respuesta,
  type RespuestasVerif,
  type TipoEvaluacion,
} from "./data";
import { preguntasAplicables, familiasAplicables } from "./aplicabilidad";
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
}: Props) {
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

  function setResp(codigo: string, r: Respuesta) {
    if (bloqueado(codigo)) return;
    setSaved(false);
    setServerError(null);
    setRespuestas((s) => ({
      ...s,
      [codigo]: { r, obs: s[codigo]?.obs, evidencias: s[codigo]?.evidencias },
    }));
  }

  function setObs(codigo: string, obs: string) {
    if (bloqueado(codigo)) return;
    setSaved(false);
    setRespuestas((s) => {
      const prev = s[codigo];
      return {
        ...s,
        [codigo]: { r: prev?.r ?? "na", obs, evidencias: prev?.evidencias },
      };
    });
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
      // Cada pregunta aplicable: respuesta (no/sí), nota y al menos una foto.
      const faltResp: string[] = [];
      const faltNota: string[] = [];
      const faltFoto: string[] = [];
      for (const p of aplicables) {
        const v = respuestas[p.codigo];
        const r = v?.r;
        if (r !== "no" && r !== "si") faltResp.push(p.codigo);
        if (!v?.obs?.trim()) faltNota.push(p.codigo);
        if (!(v?.evidencias && v.evidencias.length > 0)) faltFoto.push(p.codigo);
      }
      if (faltResp.length || faltNota.length || faltFoto.length) {
        const partes: string[] = [];
        if (faltResp.length)
          partes.push(
            `respuesta en ${faltResp.length} (${faltResp.slice(0, 6).join(", ")}${faltResp.length > 6 ? "…" : ""})`,
          );
        if (faltNota.length)
          partes.push(
            `nota en ${faltNota.length} (${faltNota.slice(0, 6).join(", ")}${faltNota.length > 6 ? "…" : ""})`,
          );
        if (faltFoto.length)
          partes.push(
            `al menos una foto en ${faltFoto.length} (${faltFoto.slice(0, 6).join(", ")}${faltFoto.length > 6 ? "…" : ""})`,
          );
        setServerError(`Falta ${partes.join(" y ")}.`);
        // ir a la primera pregunta incompleta
        const primero = faltResp[0] || faltNota[0] || faltFoto[0];
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

                    <textarea
                      className="vf-obs"
                      placeholder="Nota / observación (obligatoria) — ¿por qué aplica o no, y qué muestra la evidencia?"
                      value={val?.obs ?? ""}
                      readOnly={locked}
                      onChange={(e) => setObs(p.codigo, e.target.value)}
                      rows={2}
                    />

                    {/* Evidencias: siempre visibles (toda pregunta aplicable requiere foto). */}
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
                  </li>
                );
              })}
            </ul>
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
