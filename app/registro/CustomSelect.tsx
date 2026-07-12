"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "../icons";

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
};

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  invalid = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`csel ${open ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`} ref={ref}>
      <button
        type="button"
        id={id}
        className="csel__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-invalid={invalid || undefined}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "" : "csel__ph"}>{value || placeholder}</span>
        <svg
          className="csel__chev"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="csel__menu" role="listbox">
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`csel__opt ${selected ? "is-sel" : ""}`}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <span>{opt}</span>
                  {selected && <Check width={16} height={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
