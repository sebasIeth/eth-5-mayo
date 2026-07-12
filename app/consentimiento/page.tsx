import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LEGAL_FECHA } from "@/lib/legal";
import ConsentForm from "./ConsentForm";

export const metadata: Metadata = {
  title: "Aceptación de términos · Sello de Turismo de Salud",
};

export default async function ConsentimientoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // El consultor (operador) no requiere aceptar como usuario final.
  if (user.rol === "consultor") redirect("/consultor");
  // Ya aceptó la versión vigente → al panel.
  if (user.aceptoLegal) redirect("/dashboard");

  return (
    <div className="consent-page">
      <div className="consent-card">
        <img
          className="consent-logo"
          src="/brand/directiva.png"
          alt="Directiva"
        />
        <span className="rg-eyebrow">Antes de continuar</span>
        <h1 className="consent-title">Términos de uso y privacidad</h1>
        <p className="consent-lead">
          Para usar la plataforma del Sello de Turismo de Salud necesitamos tu
          aceptación de los siguientes documentos. Puedes abrirlos y leerlos; se
          abren en una pestaña nueva.
        </p>
        <p className="consent-meta">Versión vigente: {LEGAL_FECHA}</p>

        <ConsentForm nombre={user.nombre} />
      </div>
    </div>
  );
}
