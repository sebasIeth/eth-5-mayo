import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "./AuthForm";

export const metadata: Metadata = {
  title: "Acceso · Sello de Turismo de Salud",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="auth-page">
      <Link href="/" className="auth-logo" aria-label="Inicio">
        <img src="/brand/turismo-salud.jpeg" alt="Turismo de Salud México" />
      </Link>
      <AuthForm />
      <Link href="/" className="auth-back">
        ← Volver al inicio
      </Link>
    </div>
  );
}
