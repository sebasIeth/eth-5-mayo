"use client";

import { useState } from "react";

const DOCS = [
  { slug: "terminos", titulo: "Términos y Condiciones" },
  { slug: "privacidad", titulo: "Aviso de Privacidad" },
  { slug: "propiedad-intelectual", titulo: "Propiedad Intelectual" },
];

export default function ConsentForm({ nombre }: { nombre: string }) {
  const [acepto, setAcepto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function salir() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  async function aceptar() {
    if (!acepto) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/legal/aceptar", { method: "POST" });
      if (res.ok) {
        window.location.href = "/dashboard";
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error || "No se pudo registrar la aceptación.");
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="consent-form">
      <ul className="consent-docs">
        {DOCS.map((d) => (
          <li key={d.slug}>
            <a href={`/legal/${d.slug}`} target="_blank" rel="noopener noreferrer">
              {d.titulo}
              <span aria-hidden="true"> ↗</span>
            </a>
          </li>
        ))}
      </ul>

      <label className="consent-check">
        <input
          type="checkbox"
          checked={acepto}
          onChange={(e) => setAcepto(e.target.checked)}
        />
        <span>
          He leído y acepto los <strong>Términos y Condiciones</strong>, el{" "}
          <strong>Aviso de Privacidad</strong> y las condiciones de{" "}
          <strong>Propiedad Intelectual</strong>.
        </span>
      </label>

      {error && (
        <p className="rg-server-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn--rojo btn--lg consent-submit"
        disabled={!acepto || busy}
        aria-busy={busy}
        onClick={aceptar}
      >
        {busy ? "Un momento…" : "Aceptar y continuar"}
      </button>

      <button type="button" className="consent-cancel" onClick={salir}>
        Cancelar y salir
      </button>
    </div>
  );
}
