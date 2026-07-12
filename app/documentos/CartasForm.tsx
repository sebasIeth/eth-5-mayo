"use client";

import { useState } from "react";
import { tamanoPorEmpleados } from "./data";

type Prefill = {
  empresa: string;
  representante: string;
  telefono: string;
  email: string;
  estado: string;
  municipio: string;
  consultorNombre: string;
  consultorRegistro: string;
  hayFirma: boolean;
};
type Guardadas = {
  intencion: Record<string, string>;
  adhesion: Record<string, string>;
};

const hoy = () => new Date().toISOString().slice(0, 10);

export default function CartasForm({
  prefill,
  guardadas,
}: {
  prefill: Prefill;
  guardadas: Guardadas;
}) {
  const gi = guardadas.intencion;
  const ga = guardadas.adhesion;

  const [intencion, setIntencion] = useState({
    lugar: gi.lugar ?? prefill.municipio,
    fecha: gi.fecha || hoy(),
    empresa: gi.empresa ?? prefill.empresa,
    rfc: gi.rfc ?? "",
    participante: gi.participante ?? prefill.representante,
    puesto: gi.puesto ?? "",
    ejecutivoNombre: gi.ejecutivoNombre ?? prefill.representante,
    ejecutivoCargo: gi.ejecutivoCargo ?? "",
    ejecutivoEmpresa: gi.ejecutivoEmpresa ?? prefill.empresa,
    ejecutivoTelefono: gi.ejecutivoTelefono ?? prefill.telefono,
    ejecutivoEmail: gi.ejecutivoEmail ?? prefill.email,
  });

  const [adhesion, setAdhesion] = useState({
    lugar: ga.lugar ?? prefill.municipio,
    estado: ga.estado ?? prefill.estado,
    fecha: ga.fecha || hoy(),
    empresa: ga.empresa ?? prefill.empresa,
    rfc: ga.rfc ?? gi.rfc ?? "",
    monto: ga.monto ?? "",
    consultorNombre: ga.consultorNombre ?? prefill.consultorNombre,
    consultorRegistro: ga.consultorRegistro ?? prefill.consultorRegistro,
    numEmpleados: ga.numEmpleados ?? "",
    tamano: (ga.tamano as string) ?? "",
    firmanteNombre: ga.firmanteNombre ?? prefill.representante,
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  async function guardar(tipo: "intencion" | "adhesion"): Promise<boolean> {
    setBusy(tipo);
    setMsg((m) => ({ ...m, [tipo]: "" }));
    try {
      const datos = tipo === "intencion" ? intencion : adhesion;
      const res = await fetch("/api/cartas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, datos }),
      });
      if (res.ok) {
        setMsg((m) => ({ ...m, [tipo]: "Guardado ✓" }));
        return true;
      }
      const d = await res.json().catch(() => null);
      setMsg((m) => ({ ...m, [tipo]: d?.error || "No se pudo guardar." }));
      return false;
    } catch {
      setMsg((m) => ({ ...m, [tipo]: "Sin conexión." }));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function descargar(tipo: "intencion" | "adhesion") {
    const ok = await guardar(tipo);
    if (!ok) return;
    const url =
      tipo === "intencion" ? "/api/carta-intencion/pdf" : "/api/carta-adhesion/pdf";
    window.location.href = url;
  }

  const setI = (k: string, v: string) => setIntencion((s) => ({ ...s, [k]: v }));
  const setA = (k: string, v: string) => setAdhesion((s) => ({ ...s, [k]: v }));

  return (
    <div className="cartas">
      {!prefill.hayFirma && (
        <p className="cartas-warn">
          ⚠️ Aún no tienes una firma guardada. Súbela en tu{" "}
          <a href="/registro">registro</a> para que aparezca en las cartas.
        </p>
      )}

      {/* ====== CARTA DE INTENCIÓN (MSE-FO-29) ====== */}
      <section className="rg-card">
        <h2 className="rev-data__title">Carta de Intención · MSE-FO-29</h2>
        <div className="cartas-grid">
          <div className="rg-field">
            <label>Lugar (ciudad)</label>
            <input value={intencion.lugar} onChange={(e) => setI("lugar", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Fecha</label>
            <input type="date" value={intencion.fecha} onChange={(e) => setI("fecha", e.target.value)} />
          </div>
          <div className="rg-field cartas-col2">
            <label>Empresa (razón social)</label>
            <input value={intencion.empresa} onChange={(e) => setI("empresa", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>RFC</label>
            <input value={intencion.rfc} onChange={(e) => setI("rfc", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Participante (nombre)</label>
            <input value={intencion.participante} onChange={(e) => setI("participante", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Puesto del participante</label>
            <input value={intencion.puesto} onChange={(e) => setI("puesto", e.target.value)} />
          </div>
        </div>

        <h3 className="cartas-sub">Datos del ejecutivo de mayor rango</h3>
        <div className="cartas-grid">
          <div className="rg-field cartas-col2">
            <label>Nombre</label>
            <input value={intencion.ejecutivoNombre} onChange={(e) => setI("ejecutivoNombre", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Cargo</label>
            <input value={intencion.ejecutivoCargo} onChange={(e) => setI("ejecutivoCargo", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Empresa</label>
            <input value={intencion.ejecutivoEmpresa} onChange={(e) => setI("ejecutivoEmpresa", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Teléfono</label>
            <input value={intencion.ejecutivoTelefono} onChange={(e) => setI("ejecutivoTelefono", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>E-mail</label>
            <input value={intencion.ejecutivoEmail} onChange={(e) => setI("ejecutivoEmail", e.target.value)} />
          </div>
        </div>

        <div className="cartas-acciones">
          <button type="button" className="dash-btn" disabled={busy === "intencion"} onClick={() => guardar("intencion")}>
            {busy === "intencion" ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" className="dash-btn dash-btn--rojo" disabled={busy === "intencion"} onClick={() => descargar("intencion")}>
            Descargar PDF
          </button>
          {msg.intencion && <span className="cartas-msg">{msg.intencion}</span>}
        </div>
      </section>

      {/* ====== CARTA DE ADHESIÓN (MSE-FO-32) ====== */}
      <section className="rg-card">
        <h2 className="rev-data__title">Carta de Adhesión · MSE-FO-32</h2>
        <div className="cartas-grid">
          <div className="rg-field">
            <label>Lugar (ciudad)</label>
            <input value={adhesion.lugar} onChange={(e) => setA("lugar", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Estado</label>
            <input value={adhesion.estado} onChange={(e) => setA("estado", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Fecha</label>
            <input type="date" value={adhesion.fecha} onChange={(e) => setA("fecha", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Empresa (razón social)</label>
            <input value={adhesion.empresa} onChange={(e) => setA("empresa", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>RFC</label>
            <input value={adhesion.rfc} onChange={(e) => setA("rfc", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>Monto a cubrir (sin IVA)</label>
            <input value={adhesion.monto} onChange={(e) => setA("monto", e.target.value)} placeholder="Ej. 15,000" />
          </div>
          <div className="rg-field cartas-col2">
            <label>Consultor</label>
            <input value={adhesion.consultorNombre} onChange={(e) => setA("consultorNombre", e.target.value)} />
          </div>
          <div className="rg-field cartas-col2">
            <label>No. de registro del consultor (SECTUR)</label>
            <input value={adhesion.consultorRegistro} onChange={(e) => setA("consultorRegistro", e.target.value)} />
          </div>
          <div className="rg-field">
            <label>No. de empleados</label>
            <input
              inputMode="numeric"
              value={adhesion.numEmpleados}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setAdhesion((s) => ({
                  ...s,
                  numEmpleados: v,
                  tamano: v ? tamanoPorEmpleados(Number(v)) : s.tamano,
                }));
              }}
            />
          </div>
          <div className="rg-field">
            <label>Tamaño de empresa</label>
            <select value={adhesion.tamano} onChange={(e) => setA("tamano", e.target.value)}>
              <option value="">—</option>
              <option value="micro">Micro (1-10)</option>
              <option value="pequena">Pequeña (11-50)</option>
              <option value="mediana">Mediana (51-100)</option>
            </select>
          </div>
          <div className="rg-field cartas-col2">
            <label>Nombre de quien firma (por la empresa)</label>
            <input value={adhesion.firmanteNombre} onChange={(e) => setA("firmanteNombre", e.target.value)} />
          </div>
        </div>

        <div className="cartas-acciones">
          <button type="button" className="dash-btn" disabled={busy === "adhesion"} onClick={() => guardar("adhesion")}>
            {busy === "adhesion" ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" className="dash-btn dash-btn--rojo" disabled={busy === "adhesion"} onClick={() => descargar("adhesion")}>
            Descargar PDF
          </button>
          {msg.adhesion && <span className="cartas-msg">{msg.adhesion}</span>}
        </div>
      </section>
    </div>
  );
}
