"use client";

import { useState } from "react";
import { Menu, CloseIcon } from "../icons";

const LINKS = [
  { href: "#como-funciona", label: "¿Cómo funciona?" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#contacto", label: "Contacto" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="container nav__inner">
        <a className="brand" href="#top" aria-label="DIRECTIVA — inicio">
          {/* Logo DIRECTIVA (empresa del proyecto) */}
          <img
            className="brand__logo"
            src="/brand/directiva.png"
            alt="DIRECTIVA · Desarrollo de negocios"
            width={905}
            height={1059}
          />
        </a>

        <nav className="nav__links" aria-label="Principal">
          {LINKS.map((l) => (
            <a key={l.href} className="nav__link" href={l.href}>
              {l.label}
            </a>
          ))}
          <a className="btn btn--rojo nav__cta" href="#contacto">
            Quiero mi Sello
          </a>
        </nav>

        <button
          className="nav__toggle"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <Menu />}
        </button>
      </div>

      <div className={`nav__mobile ${open ? "open" : ""}`} id="mobile-menu">
        <div className="nav__mobile-inner">
          {LINKS.map((l) => (
            <a
              key={l.href}
              className="nav__link"
              href={l.href}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            className="btn btn--rojo"
            href="#contacto"
            onClick={() => setOpen(false)}
          >
            Quiero mi Sello
          </a>
        </div>
      </div>
    </header>
  );
}
