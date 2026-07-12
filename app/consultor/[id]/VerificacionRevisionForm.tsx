"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, XMark } from "../../icons";
import {
  calcVerificacion,
  type Familia,
  type Respuesta,
  type RespuestasVerif,
} from "../../verificacion/data";
import type {
  VerifRevisiones,
  VerifRevisionEstado,
} from "../../verificacion/revision";

const RESP_LABEL: Record<Respuesta, { label: string; cls: string }> = {
  na: { label: "No aplica", cls: "is-na" },
  no: { label: "No cumple", cls: "is-no" },
  si: { label: "Sí cumple", cls: "is-si" },
};

type Props = {
  registroId: string;
  respuestas: RespuestasVerif;
  initial: VerifRevisiones;
  familias: Familia[];
};

export default function VerificacionRevisionForm({
  registroId,
  respuestas,
  initial,
  familias,
}: Props) {
  const router = useRouter();
  const [rev, setRev] = useState<VerifRevisiones>(() => ({ ...initial }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Solo se revisan las preguntas aplicables que el establecimiento contestó.
  const contestadas = familias
    .flatMap((f) => f.preguntas)
    .filter((p) => respuestas[p.codigo]?.r);

  function setEstado(codigo: string, estado: VerifRevisionEstado) {
    setDone(false);
    setError(null);
    setRev((s) => ({
      ...s,
      [codigo]: { estado, comentario: s[codigo]?.comentario ?? "" },
    }));
  }

  function setComentario(codigo: string, comentario: string) {
    setDone(false);
    setRev((s) => ({
      ...s,
      [codigo]: { estado: s[codigo]?.estado ?? "correccion", comentario },
    }));
  }

  function aprobarTodo() {
    setDone(false);
    setError(null);
    const next: VerifRevisiones = {};
    for (const p of contestadas) {
      next[p.codigo] = { estado: "aprobado", comentario: "" };
    }
    setRev(next);
  }

  async function enviar() {
    setError(null);

    // No es obligatorio revisar todas: se envían solo las que el consultor ya
    // marcó (las correcciones requieren motivo). Basta con al menos una.
    const payload: VerifRevisiones = {};
    for (const p of contestadas) {
      const r = rev[p.codigo];
      if (!r) continue; // sin revisar aún → se omite; se puede revisar después
      if (r.estado === "correccion" && !r.comentario.trim()) {
        setError(`Escribe el motivo de la corrección en la pregunta ${p.codigo}.`);
        return;
      }
      payload[p.codigo] = r;
    }
    if (Object.keys(payload).length === 0) {
      setError("Marca al menos una pregunta como aprobada o con corrección.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/consultor/verificacion-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registroId, revisiones: payload }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        router.refresh();
      } else {
        setError(data?.error || "No se pudo enviar la revisión.");
      }
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rev-card">
      <header className="rev-card__head">
        <div>
          <h2>Revisión por pregunta</h2>
          <p>
            Marca cada indicador contestado como aprobado o solicita una
            corrección con el motivo.
          </p>
        </div>
        <button type="button" className="rev-approve-all" onClick={aprobarTodo}>
          <Check width={15} height={15} /> Aprobar todo
        </button>
      </header>

      {done && (
        <div className="rev-banner rev-banner--ok" role="status">
          <Check width={18} height={18} /> Revisión enviada al establecimiento.
        </div>
      )}
      {error && (
        <div className="rev-banner rev-banner--err" role="alert">
          {error}
        </div>
      )}

      {familias.map((fam) => {
        const preguntasFam = fam.preguntas.filter(
          (p) => respuestas[p.codigo]?.r,
        );
        if (preguntasFam.length === 0) return null;
        return (
          <div className="vf-cons-fam" key={fam.id}>
            <h3 className="vf-cons-fam__name">
              {fam.id} · {fam.nombre}
              <span className="vf-cons-fam__pct">
                {
                  calcVerificacion(
                    Object.fromEntries(
                      fam.preguntas
                        .filter((p) => respuestas[p.codigo])
                        .map((p) => [p.codigo, respuestas[p.codigo]]),
                    ),
                  ).pct
                }
                %
              </span>
            </h3>
            <ul className="vf-rev-list">
              {preguntasFam.map((p) => {
                const v = respuestas[p.codigo];
                const meta = v ? RESP_LABEL[v.r] : null;
                const r = rev[p.codigo];
                const estado = r?.estado;
                return (
                  <li className="vf-rev-item" key={p.codigo}>
                    <div className="vf-cons-item__q">
                      <span className="vf-code">{p.codigo}</span>
                      <span
                        className={`vf-tag ${p.tipo === "P" ? "is-p" : "is-c"}`}
                      >
                        {p.tipo}
                      </span>
                      <span className="vf-text">{p.texto}</span>
                    </div>

                    <div className="vf-rev-item__ans">
                      {meta && (
                        <span className={`vf-ans ${meta.cls}`}>
                          {meta.label}
                        </span>
                      )}
                      {v?.obs && <span className="vf-cons-obs">{v.obs}</span>}
                      {v?.evidencias && v.evidencias.length > 0 && (
                        <div className="vf-cons-evid">
                          {v.evidencias.map((ev) => (
                            <a
                              key={ev.key}
                              href={`/api/evidencia?key=${encodeURIComponent(ev.key)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vf-cons-evid__item"
                              title={ev.nombre}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/evidencia?key=${encodeURIComponent(ev.key)}`}
                                alt={ev.nombre}
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="vf-rev-item__controls">
                      <button
                        type="button"
                        className={`rev-toggle rev-toggle--ok ${
                          estado === "aprobado" ? "is-active" : ""
                        }`}
                        aria-pressed={estado === "aprobado"}
                        onClick={() => setEstado(p.codigo, "aprobado")}
                      >
                        <Check width={15} height={15} /> Aprobar
                      </button>
                      <button
                        type="button"
                        className={`rev-toggle rev-toggle--no ${
                          estado === "correccion" ? "is-active" : ""
                        }`}
                        aria-pressed={estado === "correccion"}
                        onClick={() => setEstado(p.codigo, "correccion")}
                      >
                        <XMark width={15} height={15} /> Corregir
                      </button>
                    </div>
                    {estado === "correccion" && (
                      <textarea
                        className="rev-field__comment"
                        placeholder="¿Qué debe corregir el establecimiento? (obligatorio)"
                        value={r?.comentario ?? ""}
                        onChange={(e) => setComentario(p.codigo, e.target.value)}
                        rows={2}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="rev-actions">
        <button
          type="button"
          className="btn btn--rojo btn--lg"
          onClick={enviar}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Enviando…" : "Enviar revisión al establecimiento"}
        </button>
      </div>
    </section>
  );
}
