import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_FECHA } from "@/lib/legal";
import { DOCS } from "../contenido";

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const d = DOCS[doc];
  return { title: d ? `${d.titulo} · Sello de Turismo de Salud` : "Legal" };
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();

  return (
    <div className="rg-page">
      <header className="rg-top">
        <div className="rg-top__inner">
          <Link href="/" className="rg-back" aria-label="Inicio">
            <img src="/brand/directiva.png" alt="Directiva" />
          </Link>
        </div>
      </header>

      <main className="rg-main">
        <article className="legal">
          <span className="rg-eyebrow">Documentos legales</span>
          <h1 className="legal__title">{d.titulo}</h1>
          <p className="legal__meta">Última actualización: {LEGAL_FECHA}</p>
          <p className="legal__intro">{d.intro}</p>

          <nav className="legal__nav" aria-label="Otros documentos">
            {Object.values(DOCS).map((o) => (
              <Link
                key={o.slug}
                href={`/legal/${o.slug}`}
                className={o.slug === d.slug ? "legal__navlink is-active" : "legal__navlink"}
              >
                {o.titulo}
              </Link>
            ))}
          </nav>

          <div className="legal__body">{d.cuerpo}</div>
        </article>
      </main>

      <footer className="rg-foot">
        <Link href="/">← Volver al inicio</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
