import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

/* Caduceo — brand mark */
export function Caduceo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} {...base(props)}>
      <path d="M12 2v20" />
      <circle cx="12" cy="4" r="1.6" />
      <path d="M8 5c0 3 8 3 8 6s-8 3-8 6" />
      <path d="M16 5c0 3-8 3-8 6s8 3 8 6" />
      <path d="M7 20h10" />
    </svg>
  );
}

export function XMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} {...base(props)}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} {...base(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Menu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* Step icons */
export function ClipboardEdit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} {...base(props)}>
      <path d="M9 4h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" />
      <path d="M15 5h2a2 2 0 0 1 2 2v6" />
      <path d="M9 5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6" />
      <path d="M18 14.5 21 17.5 17 21.5l-3 .5.5-3 3.5-4.5Z" />
    </svg>
  );
}

export function ReviewCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="m8.5 11 1.8 1.8 3.2-3.4" />
    </svg>
  );
}

export function SealCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} {...base(props)}>
      <path d="M12 2.5 14.4 5l3.4-.3.6 3.3 2.9 1.8-1.5 3.1 1.5 3.1-2.9 1.8-.6 3.3-3.4-.3L12 21.5 9.6 19l-3.4.3-.6-3.3-2.9-1.8L4.2 11 2.7 7.9l2.9-1.8.6-3.3L9.6 5 12 2.5Z" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

/* Family icons */
export function Megaphone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8a4 4 0 0 1 0 8" />
      <path d="M17 5a8 8 0 0 1 0 14" />
    </svg>
  );
}

export function Building(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
      <path d="M10 21v-3h4v3" />
    </svg>
  );
}

export function Transparency(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Service(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function Education(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="m22 9-10-5L2 9l10 5 10-5Z" />
      <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M22 9v5" />
    </svg>
  );
}

/* Benefit icons */
export function Globe(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  );
}

export function Star(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

export function Route(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H14a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h5.5" />
    </svg>
  );
}

export function HealthPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} {...base(props)}>
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" />
    </svg>
  );
}

/* Bandera de México para el input de teléfono */
export function FlagMX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 21 15" width={22} height={16} aria-hidden="true" {...props}>
      <rect width="21" height="15" rx="2" fill="#fff" />
      <rect width="7" height="15" fill="#006847" />
      <rect x="14" width="7" height="15" fill="#CE1126" />
      <circle cx="10.5" cy="7.5" r="2" fill="#9b6a34" />
    </svg>
  );
}

export function Shield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} {...base(props)}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </svg>
  );
}
