"use client";

import { useState, type FormEvent } from "react";

type Errors = Record<string, string>;

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const local: Errors = {};
    if (!email.trim()) local.email = "Escribe tu correo.";
    if (!password) local.password = "Escribe tu código de acceso.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        window.location.href = "/dashboard";
        return;
      }
      if (data?.errors) setErrors(data.errors);
      else setServerError(data?.error || "Algo salió mal. Intenta de nuevo.");
    } catch {
      setServerError("Sin conexión. Revisa tu internet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Iniciar sesión</h1>
      <p className="auth-lead">
        Entra con el correo y el código de acceso que te compartió tu consultor.
      </p>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <div className="rg-field">
          <label htmlFor="au-email">Correo</label>
          <input
            id="au-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            aria-invalid={!!errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <span className="rg-err">{errors.email}</span>}
        </div>

        <div className="rg-field">
          <label htmlFor="au-password">Código de acceso</label>
          <input
            id="au-password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={!!errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <span className="rg-err">{errors.password}</span>}
        </div>

        {serverError && (
          <p className="rg-server-error" role="alert">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--rojo btn--lg auth-submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Un momento…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="auth-switch">
        ¿No tienes acceso? Pídeselo a tu consultor.
      </p>
    </div>
  );
}
