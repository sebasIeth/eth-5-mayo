import { Resend } from "resend";

// Configuración por variables de entorno. Si falta la API key el envío
// simplemente se omite (la app sigue funcionando), y quien crea el acceso
// verá igualmente el código en pantalla para compartirlo a mano.
const API_KEY = process.env.RESEND_API_KEY || "";
const FROM =
  process.env.EMAIL_FROM || "Sello de Turismo de Salud <onboarding@resend.dev>";

export const emailConfigurado = () => API_KEY.length > 0;

type EnviarArgs = {
  to: string;
  subject: string;
  html: string;
};

// Envía un correo. Devuelve true si se envió, false si no está configurado
// o si falló (nunca lanza: el flujo de negocio no debe romperse por el correo).
export async function enviarCorreo({ to, subject, html }: EnviarArgs): Promise<boolean> {
  if (!emailConfigurado()) return false;
  try {
    const resend = new Resend(API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] error de Resend:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] excepción:", err);
    return false;
  }
}

const ROJO = "#C8102E";
const AZUL = "#003DA5";

// URL pública de la plataforma (para los botones de los correos). Configúrala
// en Vercel con el dominio del deploy, ej. https://sello.vercel.app
// Prioridad: APP_URL explícita → dominio de producción de Vercel → URL del
// deploy de Vercel. Así en producción el botón apunta al sitio real aunque no
// se configure APP_URL manualmente.
function resolverAppUrl(): string {
  const explicit = (process.env.APP_URL || "").trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "";
}
const APP_URL = resolverAppUrl();
const link = (path: string) => (APP_URL ? APP_URL + path : "");

// Plantilla base reutilizable para los correos de notificación.
function layout(opts: {
  titulo: string;
  saludo?: string;
  parrafos: string[];
  cta?: { label: string; href: string };
}) {
  const { titulo, saludo, parrafos, cta } = opts;
  const cuerpo = parrafos
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:1.55;margin:0 0 14px">${p}</p>`,
    )
    .join("");
  const boton =
    cta && cta.href
      ? `<a href="${cta.href}" style="display:inline-block;background:${ROJO};color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:10px;margin:6px 0 4px">${cta.label}</a>`
      : "";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a2233">
    <div style="border-top:4px solid ${ROJO};border-radius:2px"></div>
    <h1 style="color:${AZUL};font-size:20px;margin:22px 0 12px">${titulo}</h1>
    ${saludo ? `<p style="font-size:15px;line-height:1.55;margin:0 0 14px">${saludo}</p>` : ""}
    ${cuerpo}
    ${boton}
    <p style="font-size:12px;color:#8a93a3;margin:24px 0 0">Sello de Turismo de Salud · Segmentos Especializados · Secretaría de Turismo de México</p>
  </div>`;
}

// —— Al consultor: un establecimiento inició su solicitud ——
export function correoSolicitudIniciada(establecimiento: string) {
  return {
    subject: `Nueva solicitud iniciada · ${establecimiento}`,
    html: layout({
      titulo: "Nueva solicitud iniciada",
      parrafos: [
        `El establecimiento <strong>${establecimiento}</strong> comenzó su solicitud del Sello de Turismo de Salud.`,
        "Aún no la envía a revisión; te avisaremos cuando esté lista.",
      ],
      cta: { label: "Ir al panel", href: link("/consultor") },
    }),
  };
}

// —— Al consultor: un establecimiento envió algo para revisión ——
export function correoEnvioParaRevision(
  establecimiento: string,
  tipo: "registro" | "verificación",
) {
  return {
    subject: `Pendiente de revisión: ${tipo} · ${establecimiento}`,
    html: layout({
      titulo: "Tienes algo por revisar",
      parrafos: [
        `El establecimiento <strong>${establecimiento}</strong> envió su <strong>${tipo}</strong> para revisión.`,
        "Ingresa al panel para revisarlo, aprobarlo o solicitar correcciones.",
      ],
      cta: { label: "Revisar ahora", href: link("/consultor") },
    }),
  };
}

// —— Al establecimiento: confirmación de que recibimos su envío ——
export function correoConfirmacionEnvio(
  nombre: string,
  tipo: "registro" | "verificación",
) {
  return {
    subject: `Recibimos tu ${tipo} · Sello de Turismo de Salud`,
    html: layout({
      titulo: `Recibimos tu ${tipo}`,
      saludo: nombre ? `Hola ${nombre},` : "Hola,",
      parrafos: [
        `Tu <strong>${tipo}</strong> se envió correctamente y está <strong>pendiente de revisión</strong> por el consultor.`,
        "Te avisaremos por este medio cuando haya novedades.",
      ],
      cta: { label: "Ver mi panel", href: link("/dashboard") },
    }),
  };
}

// —— Al establecimiento: el consultor finalizó el servicio ——
export function correoServicioFinalizado(nombre: string) {
  return {
    subject: "Servicio finalizado · Sello de Turismo de Salud",
    html: layout({
      titulo: "Tu servicio ha finalizado",
      saludo: nombre ? `Hola ${nombre},` : "Hola,",
      parrafos: [
        "Tu consultor marcó como <strong>finalizado</strong> el servicio del Sello de Turismo de Salud. ¡Gracias por tu participación!",
        "Puedes seguir descargando tus documentos desde la plataforma cuando lo necesites.",
      ],
      cta: { label: "Ver mi panel", href: link("/dashboard") },
    }),
  };
}

// —— Al establecimiento: el consultor terminó una revisión ——
export function correoResultadoRevision(
  nombre: string,
  tipo: "registro" | "verificación",
  aprobado: boolean,
) {
  if (aprobado) {
    return {
      subject: `Tu ${tipo} fue aprobado · Sello de Turismo de Salud`,
      html: layout({
        titulo: `¡Tu ${tipo} fue aprobado!`,
        saludo: nombre ? `Hola ${nombre},` : "Hola,",
        parrafos: [
          `El consultor revisó y <strong>aprobó</strong> tu ${tipo}. ¡Buen trabajo!`,
          "Ingresa a tu panel para ver el detalle y los siguientes pasos.",
        ],
        cta: { label: "Ver mi panel", href: link("/dashboard") },
      }),
    };
  }
  return {
    subject: `Revisión de tu ${tipo}: hay correcciones · Sello de Turismo de Salud`,
    html: layout({
      titulo: `Revisamos tu ${tipo}`,
      saludo: nombre ? `Hola ${nombre},` : "Hola,",
      parrafos: [
        `El consultor revisó tu ${tipo} y dejó <strong>observaciones o correcciones</strong> en algunos puntos.`,
        "Entra a tu panel, revisa los comentarios, corrige lo indicado y vuelve a enviar.",
      ],
      cta: { label: "Ver correcciones", href: link("/dashboard") },
    }),
  };
}

// Plantilla del correo con el código de acceso.
export function correoAcceso(nombre: string, email: string, codigo: string, regenerado = false) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const intro = regenerado
    ? "Se generó un nuevo código de acceso para tu cuenta en la plataforma del Sello de Turismo de Salud. El código anterior ya no funciona."
    : "Se creó tu acceso a la plataforma del Sello de Turismo de Salud. Con estos datos puedes iniciar sesión.";
  const loginHref = link("/login");
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a2233">
    <div style="border-top:4px solid ${ROJO};border-radius:2px"></div>
    <h1 style="color:${AZUL};font-size:20px;margin:22px 0 6px">Tu acceso al Sello de Turismo de Salud</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 14px">${saludo}</p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 18px">${intro}</p>
    <div style="background:#f4f6fb;border:1px solid #e2e7f0;border-radius:10px;padding:16px 18px;margin:0 0 18px">
      <p style="margin:0 0 6px;font-size:13px;color:#5a6472">Correo</p>
      <p style="margin:0 0 14px;font-size:15px;font-weight:bold">${email}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#5a6472">Código de acceso</p>
      <p style="margin:0;font-size:22px;font-weight:bold;letter-spacing:2px;color:${ROJO}">${codigo}</p>
    </div>
    <p style="font-size:14px;line-height:1.5;margin:0 0 14px">Inicia sesión en la plataforma con tu correo y este código.</p>
    ${
      loginHref
        ? `<a href="${loginHref}" style="display:inline-block;background:${ROJO};color:#fff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:10px;margin:0 0 6px">Iniciar sesión</a>
    <p style="font-size:12px;color:#8a93a3;margin:8px 0 0;word-break:break-all">${loginHref}</p>`
        : ""
    }
    <p style="font-size:12px;color:#8a93a3;margin:22px 0 0">Segmentos Especializados · Secretaría de Turismo de México</p>
  </div>`;
  const subject = regenerado
    ? "Tu nuevo código de acceso · Sello de Turismo de Salud"
    : "Tu acceso · Sello de Turismo de Salud";
  return { subject, html };
}
