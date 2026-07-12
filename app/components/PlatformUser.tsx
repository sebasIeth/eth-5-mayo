"use client";

import { useState } from "react";

export default function PlatformUser({ nombre }: { nombre: string }) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* noop */
    }
    window.location.href = "/login";
  }

  const initial = nombre.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="pu">
      <span className="pu__avatar" aria-hidden="true">
        {initial}
      </span>
      <span className="pu__name">{nombre}</span>
      <button
        type="button"
        className="pu__logout"
        onClick={logout}
        disabled={loading}
      >
        {loading ? "Saliendo…" : "Salir"}
      </button>
    </div>
  );
}
