import Nav from "./components/Nav";
import Reveal from "./components/Reveal";
import ProgressRing from "./components/ProgressRing";
import PreRegisterForm from "./components/PreRegisterForm";
import {
  XMark,
  Check,
  ClipboardEdit,
  ReviewCheck,
  SealCheck,
  Megaphone,
  Building,
  Transparency,
  Service,
  Education,
  Globe,
  Star,
  Route,
  Shield,
} from "./icons";

const PAINS = [
  "Visitas físicas costosas para cada verificación",
  "Formularios en papel y correos interminables",
  "Sin trazabilidad ni historial del proceso",
];

const STEPS = [
  {
    num: "1",
    title: "La empresa registra",
    icon: <ClipboardEdit />,
    desc: "La empresa llena los 5 formularios de verificación y sube sus evidencias directamente en la plataforma.",
  },
  {
    num: "2",
    title: "El consultor revisa",
    icon: <ReviewCheck />,
    desc: "El consultor recibe la solicitud, revisa cada indicador y aprueba o solicita correcciones con observaciones claras.",
  },
  {
    num: "3",
    title: "El Sello se emite",
    icon: <SealCheck />,
    desc: "Con el 80% de cumplimiento alcanzado, el Sello de Turismo de Salud se genera de forma oficial y trazable.",
  },
];

const FAMILIES = [
  {
    tag: "F1",
    name: "Comunicación",
    icon: <Megaphone />,
    desc: "Presencia digital, redes sociales y sinergias con el ecosistema de salud.",
  },
  {
    tag: "F2",
    name: "Instalaciones",
    icon: <Building />,
    desc: "Habitaciones de recuperación, spa, gimnasio y señalética en inglés.",
  },
  {
    tag: "F3",
    name: "Transparencia",
    icon: <Transparency />,
    desc: "Catálogos de precios, certificaciones y políticas en inglés y español.",
  },
  {
    tag: "F4",
    name: "Servicio",
    icon: <Service />,
    desc: "Personal bilingüe, convenios con ambulancias, menú saludable.",
  },
  {
    tag: "F5",
    name: "Educación",
    icon: <Education />,
    desc: "Capacitación del personal en turismo de salud.",
  },
];

const BENEFITS = [
  {
    icon: <Globe />,
    title: "Visibilidad oficial",
    desc: "Presencia en Visit México y en los canales oficiales de promoción turística.",
  },
  {
    icon: <Star />,
    title: "Diferenciación",
    desc: "Destaca frente a los turistas de salud internacionales que buscan calidad.",
  },
  {
    icon: <Route />,
    title: "100% digital y trazable",
    desc: "Un proceso completo en línea, con historial y evidencia de cada paso.",
  },
  {
    icon: <Shield />,
    title: "Validación oficial",
    desc: "Respaldo directo de la Secretaría de Turismo de México.",
  },
];

export default function Home() {
  return (
    <div id="top">
      <Nav />

      <main>
        {/* ============ HERO ============ */}
        <section className="hero">
          <div className="container hero__grid">
            <Reveal className="hero__col">
              <span className="eyebrow">
                Secretaría de Turismo · Segmentos Especializados
              </span>
              <h1 className="hero__title">
                Certifica tu establecimiento.
                <br />
                <span className="accent">Sin papeleo. Sin burocracia.</span>
              </h1>
              <p className="hero__lead">
                Digitaliza tu proceso de Sello de Turismo de Salud. La empresa
                llena los formularios, el consultor valida en línea. Rápido,
                trazable y oficial.
              </p>
              <div className="hero__ctas">
                <a className="btn btn--rojo btn--lg" href="#contacto">
                  Quiero mi Sello
                </a>
              </div>
              <div className="hero__badges">
                <span className="hero__badge">
                  <Check /> Hoteles y resorts
                </span>
                <span className="hero__badge">
                  <Check /> Clínicas y spas
                </span>
                <span className="hero__badge">
                  <Check /> Restaurantes
                </span>
              </div>
            </Reveal>

            <Reveal className="hero__logo-wrap" delay={120}>
              {/* Logo oficial Turismo de Salud México */}
              <img
                className="hero__logo"
                src="/brand/turismo-salud.jpeg"
                alt="Sello de Turismo de Salud · México"
                width={1603}
                height={1020}
              />
            </Reveal>
          </div>
        </section>

        {/* ============ PROBLEMA ============ */}
        <section className="section section--hielo">
          <div className="container problema__grid">
            <Reveal className="problema__aside">
              <span className="eyebrow eyebrow--rojo">El problema</span>
              <h2 className="section-title">
                Así se hace hoy.
                <br />
                Así no debería ser.
              </h2>
              <p>
                El proceso tradicional depende de visitas presenciales, papel y
                correos. Es lento, <span className="mark">costoso</span> y deja a
                todos sin un registro claro de lo que se revisó.
              </p>
              <span className="problema__stamp">
                <XMark width={16} height={16} /> Proceso manual
              </span>
            </Reveal>

            <ul className="pain-list">
              {PAINS.map((p, i) => (
                <Reveal as="li" key={p} className="pain" delay={i * 90}>
                  <span className="pain__icon">
                    <XMark />
                  </span>
                  <span className="pain__text">{p}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ SOLUCIÓN ============ */}
        <section className="section" id="como-funciona">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">¿Cómo funciona?</span>
              <h2 className="section-title">Tres pasos para obtener tu Sello</h2>
              <p className="section-lead">
                Un flujo claro entre la empresa y el consultor, de principio a
                fin, dentro de una sola plataforma.
              </p>
            </div>

            <div className="steps">
              {STEPS.map((s, i) => (
                <Reveal as="article" key={s.num} className="step" delay={i * 110}>
                  <span className="step__num" aria-hidden="true">
                    {s.num}
                  </span>
                  <span className="step__icon">{s.icon}</span>
                  <div className="step__label">Paso {s.num}</div>
                  <h3 className="step__title">{s.title}</h3>
                  <p className="step__desc">{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FAMILIAS + RING ============ */}
        <section className="section section--hielo">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow eyebrow--rojo">
                Los 5 criterios de evaluación
              </span>
              <h2 className="section-title">
                Tu establecimiento evaluado en lo que importa
              </h2>
            </div>

            <div className="familias__grid">
              {FAMILIES.map((f, i) => (
                <Reveal as="article" key={f.tag} className="family" delay={i * 80}>
                  <span className="family__tag">{f.tag}</span>
                  <span className="family__icon">{f.icon}</span>
                  <h3 className="family__title">{f.name}</h3>
                  <p className="family__desc">{f.desc}</p>
                </Reveal>
              ))}
            </div>

            <Reveal className="ring-block">
              <ProgressRing />
              <h3 className="ring-block__title">
                80% mínimo para obtener el Sello
              </h3>
              <p className="ring-block__lead">
                Tu establecimiento debe cumplir al menos el 80% de los
                indicadores de las cinco familias para recibir la certificación
                oficial.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============ BENEFICIOS ============ */}
        <section className="section" id="beneficios">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Beneficios</span>
              <h2 className="section-title">¿Por qué certificarte?</h2>
            </div>

            <div className="benefits__grid">
              {BENEFITS.map((b, i) => (
                <Reveal as="article" key={b.title} className="benefit" delay={i * 90}>
                  <span className="benefit__icon">{b.icon}</span>
                  <div className="benefit__body">
                    <h3>{b.title}</h3>
                    <p>{b.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section className="section cta" id="contacto">
          <div className="container cta__inner">
            <Reveal>
              <h2 className="cta__title">¿Listo para obtener tu Sello?</h2>
              <p className="cta__lead">
                Deja tus datos y te avisaremos en cuanto abramos el registro del
                Sello de Turismo de Salud. Toma menos de un minuto.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <PreRegisterForm />
            </Reveal>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__brand">
              <img
                className="footer__logo"
                src="/brand/turismo-salud.jpeg"
                alt="Turismo de Salud México"
                width={1603}
                height={1020}
              />
              <p className="footer__tagline">
                Digitalización del Sello de Turismo de Salud · México
              </p>
              <div className="footer__project">
                <span>Un proyecto de</span>
                <img
                  className="footer__directiva"
                  src="/brand/directiva.png"
                  alt="DIRECTIVA · Desarrollo de negocios"
                  width={1240}
                  height={1600}
                />
              </div>
            </div>
            <nav className="footer__links" aria-label="Enlaces del pie">
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
              <a href="#contacto">Contacto</a>
            </nav>
          </div>
          <div className="footer__bottom">
            © 2026 Segmentos Especializados · Secretaría de Turismo de México
          </div>
        </div>
      </footer>
    </div>
  );
}
