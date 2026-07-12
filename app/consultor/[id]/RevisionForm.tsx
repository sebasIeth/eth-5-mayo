"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, XMark } from "../../icons";
import {
  CAMPOS_REVISABLES,
  type Revisiones,
  type RevisionEstado,
} from "../../registro/revision";

type Props = {
  registroId: string;
  valores: Record<string, string>;
  initial: Revisiones;
};

export default function RevisionForm({ registroId, valores, initial }: Props) {
  const router = useRouter();
  const [rev, setRev] = useState<Revisiones>(() => ({ ...initial }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function setEstado(key: string, estado: RevisionEstado) {
    setDone(false);
    setError(null);
    setRev((s) => ({
      ...s,
      [key]: { estado, comentario: s[key]?.comentario ?? "" },
    }));
  }

  function setComentario(key: string, comentario: string) {
    setDone(false);
    setRev((s) => ({
      ...s,
      [key]: { estado: s[key]?.estado ?? "correccion", comentario },
    }));
  }

  function aprobarTodo() {
    setDone(false);
    setError(null);
    const next: Revisiones = {};
    for (const c of CAMPOS_REVISABLES) {
      next[c.key] = { estado: "aprobado", comentario: "" };
    }
    setRev(next);
  }

  async function enviar() {
    setError(null);

    // Validación: todos los campos deben tener decisión y las correcciones
    // requieren comentario.
    for (const c of CAMPOS_REVISABLES) {
      const r = rev[c.key];
      if (!r || (r.estado !== "aprobado" && r.estado !== "correccion")) {
        setError(`Falta revisar el campo “${c.label}”.`);
        return;
      }
      if (r.estado === "correccion" && !r.comentario.trim()) {
        setError(`Escribe el motivo de la corrección en “${c.label}”.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/consultor/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registroId, revisiones: rev }),
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
          <h2>Revisión por campo</h2>
          <p>
            Marca cada dato como aprobado o solicita una corrección con el motivo.
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

      <ul className="rev-fields">
        {CAMPOS_REVISABLES.map((c) => {
          const r = rev[c.key];
          const estado = r?.estado;
          const valor = valores[c.key] || "—";
          return (
            <li key={c.key} className="rev-field">
              <div className="rev-field__info">
                <span className="rev-field__label">{c.label}</span>
                <span className="rev-field__value">{valor}</span>
              </div>
              <div className="rev-field__actions">
                <button
                  type="button"
                  className={`rev-toggle rev-toggle--ok ${
                    estado === "aprobado" ? "is-active" : ""
                  }`}
                  aria-pressed={estado === "aprobado"}
                  onClick={() => setEstado(c.key, "aprobado")}
                >
                  <Check width={15} height={15} /> Aprobar
                </button>
                <button
                  type="button"
                  className={`rev-toggle rev-toggle--no ${
                    estado === "correccion" ? "is-active" : ""
                  }`}
                  aria-pressed={estado === "correccion"}
                  onClick={() => setEstado(c.key, "correccion")}
                >
                  <XMark width={15} height={15} /> Corregir
                </button>
              </div>
              {estado === "correccion" && (
                <textarea
                  className="rev-field__comment"
                  placeholder="¿Qué debe corregir el establecimiento? (obligatorio)"
                  value={r?.comentario ?? ""}
                  onChange={(e) => setComentario(c.key, e.target.value)}
                  rows={2}
                />
              )}
            </li>
          );
        })}
      </ul>

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
