"use client";

import { useState, type ReactNode } from "react";

type Props = {
  code: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function DocBlock({
  code,
  title,
  actions,
  children,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`rev-doc ${open ? "is-open" : "is-closed"}`}>
      <header className="rev-doc__head">
        <button
          type="button"
          className="rev-doc__toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <svg
            className="rev-doc__chev"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="rev-doc__code">{code}</span>
          <span className="rev-doc__title">{title}</span>
        </button>
        {actions && <div className="rev-doc__actions">{actions}</div>}
      </header>
      {open && <div className="rev-doc__body">{children}</div>}
    </section>
  );
}
