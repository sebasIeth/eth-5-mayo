"use client";

import { useState } from "react";

// Franja "Avalado por" con el logo de SECTUR. Si el archivo aún no existe
// (public/brand/sectur.png), se oculta sola en vez de mostrar imagen rota.
export default function AvalLogo() {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <section className="aval">
      <div className="container aval__inner">
        <span className="aval__label">Avalado por</span>
        <img
          className="aval__logo"
          src="/brand/sectur.png"
          alt="Secretaría de Turismo · Gobierno de México"
          onError={() => setOk(false)}
        />
      </div>
    </section>
  );
}
