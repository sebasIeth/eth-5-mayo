"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  pdfUrl: string;
  altUrl: string;
  altLabel: string; // "Excel" | "Word" | "PDF"
  primaryLabel?: string; // etiqueta de la primera opción (default "PDF")
};

// Botón "Descargar ▾" con menú: PDF o el formato editable (Excel/Word).
export default function DescargarDoc({
  pdfUrl,
  altUrl,
  altLabel,
  primaryLabel = "PDF",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`ddoc ${open ? "is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="dash-btn dash-btn--rojo ddoc__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Descargar
        <svg
          className="ddoc__chev"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="ddoc__menu" role="menu">
          <a
            href={pdfUrl}
            className="ddoc__opt"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {primaryLabel}
          </a>
          <a
            href={altUrl}
            className="ddoc__opt"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {altLabel}
          </a>
        </div>
      )}
    </div>
  );
}
