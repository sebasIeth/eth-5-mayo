"use client";

import { useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  razonSocial: string;
  usuarioNombre: string;
  giro: string | null;
  pct: number;
  verifPct: number;
  verifIniciada: boolean;
  estatus: string;
  correcciones: number;
  actualizadoEn: string;
};

type Tab = {
  key: string;
  label: string;
  estatus: string;
  badgeCls: string;
};

const TABS: Tab[] = [
  {
    key: "enviado",
    label: "Pendiente de revisión",
    estatus: "enviado",
    badgeCls: "is-pending",
  },
  {
    key: "en_espera_documentos",
    label: "En espera de documentos",
    estatus: "en_espera_documentos",
    badgeCls: "is-wait",
  },
  {
    key: "completado",
    label: "Completados",
    estatus: "completado",
    badgeCls: "is-done",
  },
];

export default function ConsultorTabs({ items }: { items: Item[] }) {
  const counts: Record<string, number> = {};
  for (const t of TABS) {
    counts[t.key] = items.filter((i) => i.estatus === t.estatus).length;
  }

  // Abre por defecto la primera pestaña con elementos, o "Pendiente".
  const first = TABS.find((t) => counts[t.key] > 0)?.key ?? TABS[0].key;
  const [active, setActive] = useState(first);

  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];
  const visibles = items.filter((i) => i.estatus === activeTab.estatus);

  return (
    <div className="cons-panel">
      <div className="cons-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            className={`cons-tab ${active === t.key ? "is-active" : ""}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
            <span className="cons-tab__count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="cons-empty">
          <p>No hay establecimientos en “{activeTab.label}”.</p>
        </div>
      ) : (
        <ul className="cons-list">
          {visibles.map((i) => (
            <li key={i.id} className="cons-item">
              <div className="cons-item__body">
                <h3>{i.razonSocial}</h3>
                <div className="cons-item__meta">
                  <span>{i.usuarioNombre}</span>
                  {i.giro && <span>{i.giro}</span>}
                  {i.verifIniciada && <span>Verif: {i.verifPct}%</span>}
                  {i.actualizadoEn && <span>{i.actualizadoEn}</span>}
                </div>
                {i.estatus === "en_espera_documentos" && i.correcciones > 0 && (
                  <span className="cons-item__flag">
                    {i.correcciones} campo(s) por corregir
                  </span>
                )}
                <div className="cons-item__progress">
                  <div className="cons-item__bar">
                    <span style={{ width: `${i.pct}%` }} />
                  </div>
                  <span className="cons-item__pct">{i.pct}%</span>
                </div>
              </div>
              <div className="cons-item__side">
                <span className={`dash-badge ${activeTab.badgeCls}`}>
                  {activeTab.label}
                </span>
                <Link
                  href={`/consultor/${i.id}`}
                  className="dash-btn dash-btn--rojo"
                >
                  Revisar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
