"use client";

import { useState } from "react";

type Blockchain = { txHash: string; url: string; contrato: string } | null;

export default function FinalizarServicio({
  registroId,
  finalizado: inicial,
  finalizadoEn,
  blockchain: bcInicial,
}: {
  registroId: string;
  finalizado: boolean;
  finalizadoEn?: string;
  blockchain?: Blockchain;
}) {
  const [finalizado, setFinalizado] = useState(inicial);
  const [blockchain, setBlockchain] = useState<Blockchain>(bcInicial ?? null);
  const [confirmar, setConfirmar] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(finalizar: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/consultor/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registroId, finalizar }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setFinalizado(finalizar);
        setBlockchain(finalizar ? (data.blockchain ?? blockchain) : blockchain);
        setConfirmar(false);
      } else {
        setError(data?.error || "No se pudo completar.");
      }
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (finalizado) {
    return (
      <div className="fin fin--done">
        <div className="fin__body">
          <span className="fin__badge">✓ Servicio finalizado</span>
          {finalizadoEn && (
            <span className="fin__meta">Finalizado el {finalizadoEn}</span>
          )}
          {blockchain?.url ? (
            <a
              className="fin__chain"
              href={blockchain.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              ⛓️ Sello registrado en blockchain (Sepolia) · ver en Etherscan ↗
            </a>
          ) : (
            <span className="fin__meta">
              Blockchain no configurada (registro on-chain omitido).
            </span>
          )}
        </div>
        <button
          type="button"
          className="dash-btn"
          disabled={busy}
          onClick={() => enviar(false)}
        >
          {busy ? "…" : "Reabrir servicio"}
        </button>
        {error && <span className="fin__err">{error}</span>}
      </div>
    );
  }

  return (
    <div className="fin">
      <div className="fin__body">
        <strong>¿Concluiste con este establecimiento?</strong>
        <span className="fin__meta">
          Al finalizar, se le notifica por correo que su servicio concluyó.
        </span>
      </div>
      {confirmar ? (
        <div className="fin__acciones">
          <button
            type="button"
            className="dash-btn dash-btn--rojo"
            disabled={busy}
            onClick={() => enviar(true)}
          >
            {busy ? "Finalizando…" : "Sí, finalizar servicio"}
          </button>
          <button
            type="button"
            className="dash-btn"
            disabled={busy}
            onClick={() => setConfirmar(false)}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="dash-btn dash-btn--rojo"
          onClick={() => setConfirmar(true)}
        >
          Finalizar servicio
        </button>
      )}
      {error && <span className="fin__err">{error}</span>}
    </div>
  );
}
