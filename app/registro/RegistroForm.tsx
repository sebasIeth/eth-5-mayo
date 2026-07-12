"use client";

import { useState } from "react";
import { Check, XMark } from "../icons";
import { GIROS, ESTADOS_MX, DOCUMENTOS, docKey } from "./data";
import CustomSelect from "./CustomSelect";
import { computeProgress } from "./progress";
import type { Revisiones } from "./revision";

// Consultor asignado (fijo, no editable)
const CONSULTOR = "Cynthia Ericka García Díaz — cg.directiva@hotmail.com";

type Registro = {
  tipoTramite: string;
  giro: string;
  consultor: string;
};
type Empresa = {
  razonSocial: string;
  nombreSello: string;
  representante: string;
  calleCP: string;
  municipio: string;
  estado: string;
  lada: string;
  telefonos: string;
  email: string;
};
type Errors = Record<string, string>;

export type InitialData = {
  registro: { tipoTramite: string; giro: string };
  empresa: Empresa;
  documentos: Record<string, string>;
  firma: string;
  estatus: string;
  revisiones?: Revisiones;
};

export default function RegistroForm({ initial }: { initial?: InitialData }) {
  const revisiones = initial?.revisiones;
  const revValores = revisiones ? Object.values(revisiones) : [];
  const hayRevision = revValores.length > 0;
  const hayCorreccion = revValores.some((r) => r.estado === "correccion");
  const todoAprobado = hayRevision && !hayCorreccion;

  // Un campo aprobado por el consultor queda BLOQUEADO (no editable).
  const bloqueado = (campo: string) =>
    revisiones?.[campo]?.estado === "aprobado";
  // Si el consultor aprobó todo, se bloquean también los campos no revisables
  // (tipo de trámite, firma) porque el registro quedó cerrado.
  const bloqueoTotal = todoAprobado;

  // Indicador inline por campo revisado (verde aprobado / rojo corrige).
  const revField = (key: string) => {
    const r = revisiones?.[key];
    if (!r) return null;
    if (r.estado === "aprobado") {
      return (
        <span className="rg-rev rg-rev--ok">
          <Check width={14} height={14} /> Aprobado
        </span>
      );
    }
    return (
      <span className="rg-rev rg-rev--fix">
        <XMark width={14} height={14} /> Corrige: {r.comentario}
      </span>
    );
  };

  const [registro, setRegistro] = useState<Registro>({
    tipoTramite: initial?.registro.tipoTramite ?? "",
    giro: initial?.registro.giro ?? "",
    consultor: CONSULTOR,
  });
  const [empresa, setEmpresa] = useState<Empresa>({
    razonSocial: initial?.empresa.razonSocial ?? "",
    nombreSello: initial?.empresa.nombreSello ?? "",
    representante: initial?.empresa.representante ?? "",
    calleCP: initial?.empresa.calleCP ?? "",
    municipio: initial?.empresa.municipio ?? "",
    estado: initial?.empresa.estado ?? "",
    lada: initial?.empresa.lada ?? "",
    telefonos: initial?.empresa.telefonos ?? "",
    email: initial?.empresa.email ?? "",
  });
  const [documentos, setDocumentos] = useState<Record<string, string>>(
    initial?.documentos ?? {},
  );
  const [firma, setFirma] = useState<string>(initial?.firma ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<null | "guardar" | "enviar">(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [estatus, setEstatus] = useState<string>(initial?.estatus ?? "borrador");
  const [done, setDone] = useState<{ id: string } | null>(null);

  const progress = computeProgress({ registro, empresa, firma });

  const setReg = (k: keyof Registro, v: string) => {
    if (k === "giro" ? bloqueado("giro") : k === "tipoTramite" && bloqueoTotal)
      return;
    setRegistro((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [`registro.${k}`]: "" }));
    setSaved(false);
  };
  const setEmp = (k: keyof Empresa, v: string) => {
    if (bloqueado(k)) return;
    setEmpresa((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [`empresa.${k}`]: "" }));
    setSaved(false);
  };
  const setDoc = (key: string, v: string) => {
    setDocumentos((s) => ({ ...s, [key]: v }));
    setSaved(false);
  };

  const docsEntregados = Object.values(documentos).filter((d) => d).length;

  function handleFirma(file: File | null) {
    if (bloqueoTotal) return; // firma bloqueada tras aprobación total
    setErrors((e) => ({ ...e, firma: "" }));
    setSaved(false);
    if (!file) {
      setFirma("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, firma: "Debe ser una imagen (JPG o PNG)." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((e) => ({ ...e, firma: "La imagen no debe pasar de 2 MB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFirma(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  function scrollToFirstError() {
    setTimeout(() => {
      const first = document.querySelector<HTMLElement>("[data-invalid='true']");
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.focus?.();
    }, 60);
  }

  async function submit(accion: "guardar" | "enviar") {
    setServerError(null);

    // Solo al ENVIAR validamos todos los obligatorios en el cliente.
    if (accion === "enviar") {
      const next: Errors = {};
      if (!registro.tipoTramite)
        next["registro.tipoTramite"] = "Selecciona el tipo de trámite.";
      if (!registro.giro) next["registro.giro"] = "Selecciona un giro.";
      if (!empresa.razonSocial.trim()) next["empresa.razonSocial"] = "Requerido.";
      if (!empresa.nombreSello.trim()) next["empresa.nombreSello"] = "Requerido.";
      if (!empresa.representante.trim())
        next["empresa.representante"] = "Requerido.";
      if (!empresa.calleCP.trim()) next["empresa.calleCP"] = "Requerido.";
      if (!empresa.municipio.trim()) next["empresa.municipio"] = "Requerido.";
      if (!empresa.estado) next["empresa.estado"] = "Requerido.";
      if (!empresa.lada.trim()) next["empresa.lada"] = "Requerido.";
      if (!empresa.telefonos.trim()) next["empresa.telefonos"] = "Requerido.";
      if (!empresa.email.trim()) next["empresa.email"] = "Requerido.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.email.trim()))
        next["empresa.email"] = "Correo no válido.";
      if (!firma) next["firma"] = "Sube una foto de tu firma.";
      setErrors(next);
      if (Object.keys(next).length) {
        scrollToFirstError();
        return;
      }
    }

    setSubmitting(accion);
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, registro, empresa, documentos, firma }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (accion === "enviar") {
          setDone({ id: data?.id ?? "" });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setSaved(true);
          if (data?.estatus) setEstatus(data.estatus);
        }
        return;
      }
      if (res.status === 422 && data?.errors) {
        setErrors(data.errors);
        scrollToFirstError();
      } else {
        setServerError(data?.error || "No se pudo guardar. Intenta de nuevo.");
      }
    } catch {
      setServerError("Sin conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSubmitting(null);
    }
  }

  if (done) {
    return (
      <div className="rg-done" role="status">
        <span className="rg-done__check">
          <Check width={34} height={34} />
        </span>
        <h2>Registro enviado</h2>
        <p>
          Tu <strong>Formato de Registro</strong> quedó guardado. El consultor lo
          revisará y te contactará para continuar con el proceso del Sello.
        </p>
        {done.id && <p className="rg-done__id">Folio: {done.id}</p>}
        <a href="/dashboard" className="btn btn--rojo btn--lg rg-done__cta">
          Ir a mi panel
        </a>
      </div>
    );
  }

  const err = (key: string) => errors[key];

  return (
    <form
      className="rg-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit("enviar");
      }}
      noValidate
    >
      {/* ===== Feedback del consultor ===== */}
      {todoAprobado && (
        <div className="rg-rev-banner rg-rev-banner--ok" role="status">
          <Check width={18} height={18} />
          <span>
            ¡Tu consultor aprobó todos los campos! Tu registro quedó completo.
          </span>
        </div>
      )}
      {hayCorreccion && (
        <div className="rg-rev-banner rg-rev-banner--fix" role="alert">
          <XMark width={18} height={18} />
          <span>
            Tu consultor pidió correcciones. Revisa los campos marcados en rojo
            más abajo.
          </span>
        </div>
      )}

      {/* ===== Barra de avance ===== */}
      <div className="rg-progress">
        <div className="rg-progress__top">
          <span className="rg-progress__label">
            {estatus === "enviado" ? "Enviado · editando" : "Tu avance"}
          </span>
          <span className="rg-progress__pct">{progress.pct}%</span>
        </div>
        <div
          className="rg-progress__bar"
          role="progressbar"
          aria-valuenow={progress.pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress.pct}%` }} />
        </div>
        <span className="rg-progress__hint">
          {progress.complete
            ? "¡Listo para enviar! Puedes seguir editando y guardar cuando quieras."
            : `${progress.filled} de ${progress.total} campos obligatorios. Guarda tu avance y complétalo poco a poco.`}
        </span>
      </div>

      {/* ===== Datos de registro ===== */}
      <section className="rg-card">
        <header className="rg-card__head">
          <span className="rg-card__step">1</span>
          <div>
            <h2>Datos de registro</h2>
            <p>Información del trámite y del consultor asignado.</p>
          </div>
        </header>

        <div className="rg-grid">
          <div className="rg-field rg-field--full">
            <span className="rg-label">
              Tipo de trámite <span className="rg-req">*</span>
            </span>
            <div className="rg-radios">
              {["Nuevo", "Renovado"].map((t, i) => (
                <label
                  key={t}
                  className={`rg-radio ${bloqueoTotal ? "is-locked" : ""}`}
                >
                  <input
                    type="radio"
                    name="tipoTramite"
                    value={t}
                    disabled={bloqueoTotal}
                    data-invalid={i === 0 && !!err("registro.tipoTramite")}
                    checked={registro.tipoTramite === t}
                    onChange={(e) => setReg("tipoTramite", e.target.value)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            {err("registro.tipoTramite") && (
              <span className="rg-err">{err("registro.tipoTramite")}</span>
            )}
          </div>

          <div className="rg-field">
            <label htmlFor="giro">
              Giro del servicio a certificar <span className="rg-req">*</span>
            </label>
            <CustomSelect
              id="giro"
              value={registro.giro}
              options={GIROS}
              invalid={!!err("registro.giro")}
              disabled={bloqueado("giro")}
              onChange={(v) => setReg("giro", v)}
            />
            {err("registro.giro") && (
              <span className="rg-err">{err("registro.giro")}</span>
            )}
            {revField("giro")}
          </div>

          <div className="rg-field">
            <label htmlFor="consultor">Nombre y correo del consultor</label>
            <div className="rg-locked">
              <input
                id="consultor"
                type="text"
                value={registro.consultor}
                readOnly
                aria-readonly="true"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Datos generales de la empresa ===== */}
      <section className="rg-card">
        <header className="rg-card__head">
          <span className="rg-card__step">2</span>
          <div>
            <h2>Datos generales de la empresa</h2>
            <p>Datos del establecimiento que se va a certificar.</p>
          </div>
        </header>

        <div className="rg-grid">
          <div className="rg-field rg-field--full">
            <label htmlFor="razonSocial">
              Nombre comercial y/o razón social <span className="rg-req">*</span>
            </label>
            <input
              id="razonSocial"
              type="text"
              value={empresa.razonSocial}
              readOnly={bloqueado("razonSocial")}
              data-invalid={!!err("empresa.razonSocial")}
              aria-invalid={!!err("empresa.razonSocial")}
              onChange={(e) => setEmp("razonSocial", e.target.value)}
            />
            {err("empresa.razonSocial") && (
              <span className="rg-err">{err("empresa.razonSocial")}</span>
            )}
            {revField("razonSocial")}
          </div>

          <div className="rg-field rg-field--full">
            <label htmlFor="nombreSello">
              Nombre con el que aparecerá el Sello (según RNT){" "}
              <span className="rg-req">*</span>
            </label>
            <input
              id="nombreSello"
              type="text"
              value={empresa.nombreSello}
              readOnly={bloqueado("nombreSello")}
              data-invalid={!!err("empresa.nombreSello")}
              aria-invalid={!!err("empresa.nombreSello")}
              onChange={(e) => setEmp("nombreSello", e.target.value)}
            />
            {err("empresa.nombreSello") && (
              <span className="rg-err">{err("empresa.nombreSello")}</span>
            )}
            {revField("nombreSello")}
          </div>

          <div className="rg-field rg-field--full">
            <label htmlFor="representante">
              Nombre del representante / encargado{" "}
              <span className="rg-req">*</span>
            </label>
            <input
              id="representante"
              type="text"
              value={empresa.representante}
              readOnly={bloqueado("representante")}
              data-invalid={!!err("empresa.representante")}
              aria-invalid={!!err("empresa.representante")}
              onChange={(e) => setEmp("representante", e.target.value)}
            />
            {err("empresa.representante") && (
              <span className="rg-err">{err("empresa.representante")}</span>
            )}
            {revField("representante")}
          </div>

          <div className="rg-field rg-field--full">
            <label htmlFor="calleCP">
              Av. / Calle y código postal <span className="rg-req">*</span>
            </label>
            <input
              id="calleCP"
              type="text"
              placeholder="Av. Reforma 123, Col. Centro, 06000"
              value={empresa.calleCP}
              readOnly={bloqueado("calleCP")}
              data-invalid={!!err("empresa.calleCP")}
              aria-invalid={!!err("empresa.calleCP")}
              onChange={(e) => setEmp("calleCP", e.target.value)}
            />
            {err("empresa.calleCP") && (
              <span className="rg-err">{err("empresa.calleCP")}</span>
            )}
            {revField("calleCP")}
          </div>

          <div className="rg-field">
            <label htmlFor="municipio">
              Municipio / Alcaldía <span className="rg-req">*</span>
            </label>
            <input
              id="municipio"
              type="text"
              value={empresa.municipio}
              readOnly={bloqueado("municipio")}
              data-invalid={!!err("empresa.municipio")}
              aria-invalid={!!err("empresa.municipio")}
              onChange={(e) => setEmp("municipio", e.target.value)}
            />
            {err("empresa.municipio") && (
              <span className="rg-err">{err("empresa.municipio")}</span>
            )}
            {revField("municipio")}
          </div>
          <div className="rg-field">
            <label htmlFor="estado">
              Estado <span className="rg-req">*</span>
            </label>
            <CustomSelect
              id="estado"
              value={empresa.estado}
              options={ESTADOS_MX}
              invalid={!!err("empresa.estado")}
              disabled={bloqueado("estado")}
              onChange={(v) => setEmp("estado", v)}
            />
            {err("empresa.estado") && (
              <span className="rg-err">{err("empresa.estado")}</span>
            )}
            {revField("estado")}
          </div>

          <div className="rg-field rg-field--third">
            <label htmlFor="lada">
              Lada <span className="rg-req">*</span>
            </label>
            <input
              id="lada"
              type="text"
              inputMode="numeric"
              placeholder="55"
              value={empresa.lada}
              readOnly={bloqueado("lada")}
              data-invalid={!!err("empresa.lada")}
              aria-invalid={!!err("empresa.lada")}
              onChange={(e) => setEmp("lada", e.target.value)}
            />
            {err("empresa.lada") && (
              <span className="rg-err">{err("empresa.lada")}</span>
            )}
            {revField("lada")}
          </div>
          <div className="rg-field rg-field--twothirds">
            <label htmlFor="telefonos">
              Teléfono(s) <span className="rg-req">*</span>
            </label>
            <input
              id="telefonos"
              type="text"
              inputMode="tel"
              placeholder="1234 5678"
              value={empresa.telefonos}
              readOnly={bloqueado("telefonos")}
              data-invalid={!!err("empresa.telefonos")}
              aria-invalid={!!err("empresa.telefonos")}
              onChange={(e) => setEmp("telefonos", e.target.value)}
            />
            {err("empresa.telefonos") && (
              <span className="rg-err">{err("empresa.telefonos")}</span>
            )}
            {revField("telefonos")}
          </div>

          <div className="rg-field rg-field--full">
            <label htmlFor="email">
              E-mail <span className="rg-req">*</span>
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              value={empresa.email}
              readOnly={bloqueado("email")}
              data-invalid={!!err("empresa.email")}
              aria-invalid={!!err("empresa.email")}
              onChange={(e) => setEmp("email", e.target.value)}
            />
            {err("empresa.email") && (
              <span className="rg-err">{err("empresa.email")}</span>
            )}
            {revField("email")}
          </div>
        </div>
      </section>

      {/* ===== Documentos solicitados ===== */}
      <section className="rg-card">
        <header className="rg-card__head">
          <span className="rg-card__step">3</span>
          <div>
            <h2>
              Documentos solicitados{" "}
              <span className="rg-optional">Opcional</span>
            </h2>
            <p>
              Registra la fecha de entrega de cada documento. Puedes completarlo
              poco a poco. <strong>{docsEntregados}/{DOCUMENTOS.length}</strong>
            </p>
          </div>
        </header>

        <ul className="rg-docs">
          {DOCUMENTOS.map((d) => {
            const key = docKey(d);
            const entrega = documentos[key] || "";
            return (
              <li key={key}>
                <div className={`rg-doc ${entrega ? "is-checked" : ""}`}>
                  <span className="rg-doc__text">
                    <span className="rg-doc__code">{d.codigo}</span>
                    {d.nombre}
                  </span>
                  <label className="rg-doc__entrega">
                    <span className="rg-doc__entrega-label">Entrega</span>
                    <input
                      type="date"
                      value={entrega}
                      onChange={(e) => setDoc(key, e.target.value)}
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="rg-note">
          Nota: para emitir el Sello, los documentos deberán entregarse en su
          totalidad. Aquí solo registras la fecha de entrega de cada uno; la
          carga de archivos se habilitará en el siguiente paso.
        </p>
      </section>

      {/* ===== Firma ===== */}
      <section className="rg-card">
        <header className="rg-card__head">
          <span className="rg-card__step">4</span>
          <div>
            <h2>
              Firma <span className="rg-req">*</span>
            </h2>
            <p>
              Sube una foto o imagen de la firma del responsable del
              establecimiento.
            </p>
          </div>
        </header>

        <div className="rg-firma">
          {firma ? (
            <div className="rg-firma__preview">
              <img src={firma} alt="Vista previa de la firma" />
              <label className="rg-firma__replace">
                Cambiar imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFirma(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : (
            <label
              className={`rg-firma__drop ${err("firma") ? "is-error" : ""}`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFirma(e.target.files?.[0] ?? null)}
              />
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M17 8l-5-5-5 5" />
                <path d="M12 3v13" />
              </svg>
              <span>Toca para subir tu firma</span>
              <small>JPG o PNG · máx 2 MB</small>
            </label>
          )}
          {err("firma") && <span className="rg-err">{err("firma")}</span>}
        </div>
      </section>

      {serverError && (
        <p className="rg-server-error" role="alert">
          {serverError}
        </p>
      )}

      <div className="rg-actions">
        <button
          type="button"
          className="btn btn--azul-outline btn--lg"
          onClick={() => submit("guardar")}
          disabled={submitting !== null}
          aria-busy={submitting === "guardar"}
        >
          {submitting === "guardar" ? "Guardando…" : "Guardar avance"}
        </button>
        <button
          type="button"
          className="btn btn--rojo btn--lg"
          onClick={() => submit("enviar")}
          disabled={submitting !== null || !progress.complete}
          aria-busy={submitting === "enviar"}
          title={
            progress.complete
              ? undefined
              : "Completa los campos obligatorios para enviar"
          }
        >
          {submitting === "enviar" ? "Enviando…" : "Enviar registro"}
        </button>
        {saved ? (
          <span className="rg-saved">
            <Check width={16} height={16} /> Avance guardado
          </span>
        ) : (
          !progress.complete && (
            <span className="rg-actions__hint">
              “Enviar” se activa al 100% ({progress.pct}%).
            </span>
          )
        )}
      </div>
    </form>
  );
}
