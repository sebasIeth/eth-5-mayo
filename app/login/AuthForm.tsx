"use client";

import { useState, type FormEvent } from "react";

type Mode = "login" | "signup";
type Errors = Record<string, string>;

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setServerError(null);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const local: Errors = {};
    if (mode === "signup" && !nombre.trim()) local.nombre = "Escribe tu nombre.";
    if (!email.trim()) local.email = "Escribe tu correo.";
    if (!password) local.password = "Escribe tu contraseña.";
    else if (mode === "signup" && password.length < 6)
      local.password = "Mínimo 6 caracteres.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setLoading(true);
    try {
      const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "signup" ? { nombre, email, password } : { email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={`auth-tab ${mode === "login" ? "is-active" : ""}`}
          onClick={() => switchMode("login")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-tab ${mode === "signup" ? "is-active" : ""}`}
          onClick={() => switchMode("signup")}
        >
          Crear cuenta
        </button>
      </div>

      <h1 className="auth-title">
        {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
      </h1>
      <p className="auth-lead">
        {mode === "login"
          ? "Entra para seguir tu proceso del Sello."
          : "Regístrate para iniciar y dar seguimiento a tu certificación."}
      </p>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {mode === "signup" && (
          <div className="rg-field">
            <label htmlFor="au-nombre">Nombre</label>
            <input
              id="au-nombre"
              type="text"
              autoComplete="name"
              value={nombre}
              aria-invalid={!!errors.nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errors.nombre && <span className="rg-err">{errors.nombre}</span>}
          </div>
        )}

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
          <label htmlFor="au-password">Contraseña</label>
          <input
            id="au-password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          {loading
            ? "Un momento…"
            : mode === "login"
              ? "Iniciar sesión"
              : "Crear cuenta"}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <button type="button" onClick={() => switchMode("signup")}>
              Crea una
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button type="button" onClick={() => switchMode("login")}>
              Inicia sesión
            </button>
          </>
        )}
      </p>
    </div>
  );
}
