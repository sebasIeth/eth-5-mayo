import crypto from "node:crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { LEGAL_VERSION } from "./legal";

const SECRET = process.env.AUTH_SECRET;
if (!SECRET) throw new Error("Falta AUTH_SECRET en .env.local");

export const SESSION_COOKIE = "sello_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

// Correos con rol de consultor (revisan los registros de los establecimientos).
// Se define aquí (no en env) para no requerir reinicio del servidor.
export const CONSULTOR_EMAILS = ["cg.directiva@hotmail.com"];

// Acceso de consultor hardcodeado (por ahora). Al iniciar sesión con estas
// credenciales, la cuenta se crea automáticamente si no existe.
export const CONSULTOR_HARDCODE = {
  email: "cg.directiva@hotmail.com",
  password: "45359800",
  nombre: "Cynthia Ericka García Díaz",
};

/* ---------- Contraseñas (scrypt) ---------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Código de acceso aleatorio (sin caracteres ambiguos) que el consultor comparte.
export function generateAccessCode(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0/I/1/l
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- Token de sesión firmado (HMAC) ---------- */

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET!).update(data).digest("base64url");
}

export function createSessionToken(uid: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  )
    return null;
  try {
    const { uid, exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    if (!uid || !exp || Date.now() > exp) return null;
    return uid as string;
  } catch {
    return null;
  }
}

/* ---------- Cookies de sesión ---------- */

export async function setSession(uid: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUid(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/* ---------- Usuario actual ---------- */

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  rol: "consultor" | "empresa";
  // true si el usuario ya aceptó la versión vigente de los documentos legales.
  aceptoLegal: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const uid = await getSessionUid();
  if (!uid) return null;
  let _id: ObjectId;
  try {
    _id = new ObjectId(uid);
  } catch {
    return null;
  }
  const db = await getDb();
  const user = await db.collection("usuarios").findOne({ _id });
  if (!user) return null;
  const email: string = user.email;
  const rol = CONSULTOR_EMAILS.includes(email) ? "consultor" : "empresa";
  const aceptoLegal = user.aceptoLegalVersion === LEGAL_VERSION;
  return { id: user._id.toString(), nombre: user.nombre, email, rol, aceptoLegal };
}
