"use client";

import { useState } from "react";

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  codigo: string;
  creadoEn: string;
};
type Resultado = {
  email: string;
  nombre: string;
  codigo: string;
  correoEnviado?: boolean;
};

export default function UsuariosManager({ initial }: { initial: Usuario[] }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initial);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [revelar, setRevelar] = useState<Record<string, boolean>>({});

  async function eliminar(u: Usuario) {
    setBusy(true);
    setError(null);
    setResultado(null);
    try {
      const res = await fetch(
        `/api/consultor/usuarios?id=${encodeURIComponent(u.id)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudo eliminar.");
        return;
      }
      setUsuarios((list) => list.filter((x) => x.id !== u.id));
      setConfirmar(null);
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function enviar(
    accion: "crear" | "regenerar" | "enviar",
    correo: string,
    nom?: string,
  ) {
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
      setResultado({
        email: data.email,
        nombre: data.nombre,
        codigo: data.codigo,
        correoEnviado: data.correoEnviado,
      });
      if (accion === "crear" && data.id) {
        setUsuarios((u) => [
          {
            id: data.id,
            email: data.email,
            nombre: data.nombre,
            codigo: data.codigo,
            creadoEn: "hoy",
          },
          ...u,
        ]);
        setEmail("");
        setNombre("");
      } else if (accion === "regenerar") {
        setUsuarios((u) =>
          u.map((x) => (x.email === data.email ? { ...x, codigo: data.codigo } : x)),
        );
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
            <div className="usr-result__acciones">
              <button
                type="button"
                className="dash-btn dash-btn--rojo"
                disabled={busy}
                onClick={() => enviar("enviar", resultado.email)}
              >
                {busy ? "Enviando…" : "Enviar al correo"}
              </button>
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
            </div>
            <p className="usr-result__note">
              {resultado.correoEnviado
                ? "✓ Se envió el código por correo."
                : "Copia los datos o presiona “Enviar al correo” para mandárselos."}{" "}
              También puedes verlo después con el botón “Ver”.
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
                  <span className="usr-item__codigo">
                    Código:{" "}
                    {u.codigo ? (
                      <>
                        <code>{revelar[u.id] ? u.codigo : "••••••••"}</code>
                        <button
                          type="button"
                          className="usr-link"
                          onClick={() =>
                            setRevelar((r) => ({ ...r, [u.id]: !r[u.id] }))
                          }
                        >
                          {revelar[u.id] ? "Ocultar" : "Ver"}
                        </button>
                        {revelar[u.id] && (
                          <button
                            type="button"
                            className="usr-link"
                            onClick={() =>
                              navigator.clipboard?.writeText(u.codigo).catch(() => {})
                            }
                          >
                            Copiar
                          </button>
                        )}
                      </>
                    ) : (
                      <em className="usr-item__sincodigo">
                        creado antes — regenera para verlo
                      </em>
                    )}
                  </span>
                </div>
                {confirmar === u.id ? (
                  <div className="usr-item__acciones">
                    <span className="usr-item__warn">¿Eliminar acceso?</span>
                    <button
                      type="button"
                      className="dash-btn dash-btn--rojo"
                      disabled={busy}
                      onClick={() => eliminar(u)}
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      className="dash-btn"
                      disabled={busy}
                      onClick={() => setConfirmar(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="usr-item__acciones">
                    {u.codigo && (
                      <button
                        type="button"
                        className="dash-btn"
                        disabled={busy}
                        onClick={() => enviar("enviar", u.email)}
                      >
                        Enviar correo
                      </button>
                    )}
                    <button
                      type="button"
                      className="dash-btn"
                      disabled={busy}
                      onClick={() => enviar("regenerar", u.email)}
                    >
                      Regenerar código
                    </button>
                    <button
                      type="button"
                      className="usr-del"
                      disabled={busy}
                      onClick={() => {
                        setConfirmar(u.id);
                        setError(null);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
