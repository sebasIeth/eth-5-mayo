"use client";

import { useState } from "react";

type Usuario = { id: string; email: string; nombre: string; creadoEn: string };
type Resultado = { email: string; nombre: string; codigo: string };

export default function UsuariosManager({ initial }: { initial: Usuario[] }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initial);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function enviar(accion: "crear" | "regenerar", correo: string, nom?: string) {
    setBusy(true);
    setError(null);
    setCopiado(false);
    try {
      const res = await fetch("/api/consultor/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, email: correo, nombre: nom ?? "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudo completar.");
        return;
      }
      setResultado({ email: data.email, nombre: data.nombre, codigo: data.codigo });
      if (accion === "crear" && data.id) {
        setUsuarios((u) => [
          { id: data.id, email: data.email, nombre: data.nombre, creadoEn: "hoy" },
          ...u,
        ]);
        setEmail("");
        setNombre("");
      }
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="usr">
      {/* Crear acceso */}
      <section className="rg-card">
        <h2 className="rev-data__title">Crear acceso</h2>
        <p className="dash-sub">
          Da de alta un establecimiento con su correo. Se genera un código de
          acceso que le compartes; con eso inicia sesión (no se registra solo).
        </p>
        <form
          className="usr-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) enviar("crear", email.trim().toLowerCase(), nombre.trim());
          }}
        >
          <div className="rg-field">
            <label htmlFor="usr-email">Correo del establecimiento *</label>
            <input
              id="usr-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="rg-field">
            <label htmlFor="usr-nombre">Nombre (opcional)</label>
            <input
              id="usr-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="dash-btn dash-btn--rojo"
            disabled={busy || !email.trim()}
          >
            {busy ? "Generando…" : "Generar acceso"}
          </button>
        </form>

        {error && (
          <p className="rg-server-error" role="alert">
            {error}
          </p>
        )}

        {resultado && (
          <div className="usr-result" role="status">
            <p className="usr-result__title">Comparte estos datos:</p>
            <div className="usr-result__row">
              <span>Correo</span>
              <code>{resultado.email}</code>
            </div>
            <div className="usr-result__row">
              <span>Código de acceso</span>
              <code className="usr-code">{resultado.codigo}</code>
            </div>
            <button
              type="button"
              className="dash-btn"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(
                    `Correo: ${resultado.email}\nCódigo de acceso: ${resultado.codigo}`,
                  )
                  .then(() => setCopiado(true))
                  .catch(() => {});
              }}
            >
              {copiado ? "¡Copiado!" : "Copiar"}
            </button>
            <p className="usr-result__note">
              El código solo se muestra ahora. Si se pierde, regeneras uno nuevo.
            </p>
          </div>
        )}
      </section>

      {/* Lista de accesos */}
      <section className="rg-card">
        <h2 className="rev-data__title">
          Accesos ({usuarios.length})
        </h2>
        {usuarios.length === 0 ? (
          <p className="dash-sub">Aún no hay accesos creados.</p>
        ) : (
          <ul className="usr-list">
            {usuarios.map((u) => (
              <li key={u.id} className="usr-item">
                <div>
                  <strong>{u.nombre || u.email}</strong>
                  <span className="usr-item__email">{u.email}</span>
                </div>
                <button
                  type="button"
                  className="dash-btn"
                  disabled={busy}
                  onClick={() => enviar("regenerar", u.email)}
                >
                  Regenerar código
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
