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

// Plantilla del correo con el código de acceso.
export function correoAcceso(nombre: string, email: string, codigo: string, regenerado = false) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const intro = regenerado
    ? "Se generó un nuevo código de acceso para tu cuenta en la plataforma del Sello de Turismo de Salud. El código anterior ya no funciona."
    : "Se creó tu acceso a la plataforma del Sello de Turismo de Salud. Con estos datos puedes iniciar sesión.";
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
    <p style="font-size:14px;line-height:1.5;margin:0 0 6px">Inicia sesión en la plataforma con tu correo y este código.</p>
    <p style="font-size:12px;color:#8a93a3;margin:22px 0 0">Segmentos Especializados · Secretaría de Turismo de México</p>
  </div>`;
  const subject = regenerado
    ? "Tu nuevo código de acceso · Sello de Turismo de Salud"
    : "Tu acceso · Sello de Turismo de Salud";
  return { subject, html };
}
