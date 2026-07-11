"use client";

import { useState, type FormEvent } from "react";
import { FlagMX, Check } from "../icons";

type Fields = {
  empresa: string;
  nombre: string;
  correo: string;
  telefono: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formatea 10 dígitos al estilo MX: "55 1234 5678" */
function formatMxPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  const parts = [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10)];
  return parts.filter(Boolean).join(" ");
}

export default function PreRegisterForm() {
  const [values, setValues] = useState<Fields>({
    empresa: "",
    nombre: "",
    correo: "",
    telefono: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setField = (key: keyof Fields, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!values.empresa.trim())
      next.empresa = "Escribe el nombre de tu empresa u hotel.";
    if (!values.nombre.trim()) next.nombre = "Escribe tu nombre.";
    if (!values.correo.trim()) next.correo = "Escribe tu correo.";
    else if (!EMAIL_RE.test(values.correo.trim()))
      next.correo = "Ese correo no parece válido.";
    // Teléfono es opcional; si se llena, deben ser 10 dígitos.
    const telDigits = values.telefono.replace(/\D/g, "");
    if (telDigits.length > 0 && telDigits.length !== 10)
      next.telefono = "El teléfono debe tener 10 dígitos.";
    return next;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Enfoca el primer campo con error
      const first = Object.keys(next)[0];
      document.getElementById(`pr-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/preregistro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        setDone(true);
        return;
      }

      // Errores de validación del servidor (422) → los mapeamos a los campos
      const data = await res.json().catch(() => null);
      if (res.status === 422 && data?.errors) {
        setErrors(data.errors as Errors);
        const first = Object.keys(data.errors)[0];
        document.getElementById(`pr-${first}`)?.focus();
      } else {
        setServerError(
          data?.error || "No se pudo enviar. Intenta de nuevo en un momento.",
        );
      }
    } catch {
      setServerError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="prform prform--done" role="status" aria-live="polite">
        <span className="prform__check">
          <Check width={30} height={30} />
        </span>
        <h3 className="prform__done-title">¡Pre-registro recibido!</h3>
        <p className="prform__done-text">
          Gracias, <strong>{values.nombre.split(" ")[0] || "equipo"}</strong>. Te
          avisaremos a <strong>{values.correo}</strong> en cuanto abramos el
          registro del Sello de Turismo de Salud.
        </p>
      </div>
    );
  }

  return (
    <form className="prform" onSubmit={handleSubmit} noValidate>
      <div className="prform__grid">
        <div className="field field--full">
          <label htmlFor="pr-empresa">
            Nombre de la empresa u hotel <span aria-hidden="true">*</span>
          </label>
          <input
            id="pr-empresa"
            name="organization"
            type="text"
            autoComplete="organization"
            placeholder="Hotel Vista Mar"
            value={values.empresa}
            onChange={(e) => setField("empresa", e.target.value)}
            aria-invalid={!!errors.empresa}
            aria-describedby={errors.empresa ? "err-empresa" : undefined}
            required
          />
          {errors.empresa && (
            <span className="field__error" id="err-empresa">
              {errors.empresa}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="pr-nombre">
            Tu nombre <span aria-hidden="true">*</span>
          </label>
          <input
            id="pr-nombre"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="María González"
            value={values.nombre}
            onChange={(e) => setField("nombre", e.target.value)}
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? "err-nombre" : undefined}
            required
          />
          {errors.nombre && (
            <span className="field__error" id="err-nombre">
              {errors.nombre}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="pr-correo">
            Correo <span aria-hidden="true">*</span>
          </label>
          <input
            id="pr-correo"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="maria@hotelvistamar.mx"
            value={values.correo}
            onChange={(e) => setField("correo", e.target.value)}
            aria-invalid={!!errors.correo}
            aria-describedby={errors.correo ? "err-correo" : undefined}
            required
          />
          {errors.correo && (
            <span className="field__error" id="err-correo">
              {errors.correo}
            </span>
          )}
        </div>

        <div className="field field--full">
          <label htmlFor="pr-telefono">
            Teléfono <span className="field__optional">(opcional)</span>
          </label>
          <div className={`phone ${errors.telefono ? "phone--error" : ""}`}>
            <span className="phone__prefix">
              <FlagMX />
              <span>+52</span>
            </span>
            <input
              id="pr-telefono"
              name="tel"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="55 1234 5678"
              value={values.telefono}
              onChange={(e) => setField("telefono", formatMxPhone(e.target.value))}
              aria-invalid={!!errors.telefono}
              aria-describedby={errors.telefono ? "err-telefono" : undefined}
            />
          </div>
          {errors.telefono && (
            <span className="field__error" id="err-telefono">
              {errors.telefono}
            </span>
          )}
        </div>
      </div>

      {serverError && (
        <p className="prform__server-error" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        className="btn btn--rojo btn--lg prform__submit"
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? "Enviando…" : "Quiero mi Sello"}
      </button>
      <p className="prform__note">
        Es un pre-registro. No compartimos tus datos; solo te avisaremos cuando el
        MVP esté disponible.
      </p>
    </form>
  );
}
